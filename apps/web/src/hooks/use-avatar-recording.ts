'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseAvatarRecordingReturn {
  isRecording: boolean;
  videoBlob: Blob | null;
  duration: number;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  uploadVideo: (tenantId: string, avatarId: string, title: string, metadata?: Record<string, unknown>) => Promise<Response>;
  reset: () => void;
}

/**
 * Hook für Avatar-Screen-Recording
 * 
 * Erfasst Canvas-Stream und Audio für Video-Generierung
 * P1-4: Memory-Leak-Fixes - Cleanup bei Unmount
 */
export function useAvatarRecording(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  audioElementRef?: React.RefObject<HTMLAudioElement>,
): UseAvatarRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // P1-4: Cleanup bei Unmount
  useEffect(() => {
    return () => {
      // Cleanup bei Component-Unmount
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch (error) {
          console.warn('Error stopping MediaRecorder on unmount:', error);
        }
      }
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!canvasRef.current) {
      throw new Error('Canvas ref not available');
    }

    try {
      // Canvas-Stream erfassen (60 FPS)
      const canvasStream = canvasRef.current.captureStream(60);
      
      // Audio-Stream hinzufügen (falls vorhanden)
      let audioStream: MediaStreamAudioSourceNode | null = null;
      let audioContext: AudioContext | null = null;
      let audioDestination: MediaStreamAudioDestinationNode | null = null;

      if (audioElementRef?.current) {
        try {
          audioContext = new AudioContext();
          audioContextRef.current = audioContext; // Speichere für Cleanup
          audioStream = audioContext.createMediaStreamSource(
            audioElementRef.current.captureStream() || new MediaStream(),
          );
          audioDestination = audioContext.createMediaStreamDestination();
          audioStream.connect(audioDestination);
        } catch (error) {
          console.warn('Failed to capture audio stream:', error);
        }
      }

      // Streams kombinieren
      const combinedStream = new MediaStream();
      
      // Video-Tracks hinzufügen
      canvasStream.getVideoTracks().forEach((track) => {
        combinedStream.addTrack(track);
      });

      // Audio-Tracks hinzufügen (falls vorhanden)
      if (audioDestination) {
        audioDestination.stream.getAudioTracks().forEach((track) => {
          combinedStream.addTrack(track);
        });
      }

      // MediaRecorder initialisieren
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
        ? 'video/webm'
        : 'video/mp4';

      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 5000000, // 5 Mbps für gute Qualität
      });

      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setVideoBlob(blob);
        
        // P1-4: Cleanup
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        if (audioContext) {
          audioContext.close().catch(() => {});
          if (audioContextRef.current === audioContext) {
            audioContextRef.current = null;
          }
        }
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setIsRecording(false);
      };

      mediaRecorder.start(100); // Alle 100ms ein Chunk
      mediaRecorderRef.current = mediaRecorder;
      streamRef.current = combinedStream;
      
      setIsRecording(true);
      startTimeRef.current = Date.now();
      setDuration(0);

      // Duration-Timer
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } catch (error) {
      console.error('Recording failed:', error);
      setIsRecording(false);
      throw error;
    }
  }, [canvasRef, audioElementRef]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  const uploadVideo = useCallback(async (
    tenantId: string,
    avatarId: string,
    title: string,
    metadata?: Record<string, unknown>,
  ): Promise<Response> => {
    if (!videoBlob) {
      throw new Error('No video blob available');
    }

    const formData = new FormData();
    formData.append('video', videoBlob, `avatar-video-${Date.now()}.webm`);
    formData.append('tenantId', tenantId);
    formData.append('avatarId', avatarId);
    formData.append('title', title);
    if (metadata) {
      formData.append('metadata', JSON.stringify(metadata));
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/api/v1/videos/upload`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }

    return response;
  }, [videoBlob]);

  const reset = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    setVideoBlob(null);
    setIsRecording(false);
    setDuration(0);
    chunksRef.current = [];
  }, [isRecording]);

  return {
    isRecording,
    videoBlob,
    duration,
    startRecording,
    stopRecording,
    uploadVideo,
    reset,
  };
}
