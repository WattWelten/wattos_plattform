'use client';

import { useRef, useState, useEffect } from 'react';
import { useAvatarRecording } from '@/hooks/use-avatar-recording';
import { Play, Square, Upload, Loader2 } from 'lucide-react';
import { useAuthContext } from '@/contexts/auth-context';
import { uploadVideo } from '@/lib/api';

// Dynamischer Import von AvatarV2Container (wenn verfügbar)
// Fallback zu Placeholder, wenn nicht verfügbar
let AvatarV2Container: any = null;
try {
  // Versuche AvatarV2Container zu importieren (wenn als Shared Component verfügbar)
  // @ts-ignore - Dynamic import
  AvatarV2Container = require('@wattweiser/ui')?.AvatarV2Container;
} catch {
  // Fallback
}

function AvatarPreview({ 
  agentId, 
  text, 
  voiceId,
  onCanvasReady,
  onAudioReady,
}: { 
  agentId: string; 
  text: string; 
  voiceId?: string;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
  onAudioReady?: (audio: HTMLAudioElement) => void;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (onAudioReady && audioRef.current) {
      onAudioReady(audioRef.current);
    }
  }, [onAudioReady]);

  if (AvatarV2Container) {
    return (
      <AvatarV2Container
        agentId={agentId}
        text={text}
        voiceId={voiceId}
        className="w-full h-full"
        enableControls={false}
        onCanvasReady={onCanvasReady}
      />
    );
  }

  // Fallback Placeholder
  return (
    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 relative">
      <div className="text-center">
        <p className="text-sm">Avatar Preview</p>
        <p className="text-xs mt-1">Agent: {agentId}</p>
        {text && <p className="text-xs mt-1">Text: {text.substring(0, 50)}...</p>}
      </div>
      {/* Hidden audio element für Recording */}
      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  );
}

interface VideoRecorderProps {
  agentId: string;
  text: string;
  voiceId?: string;
  avatarId: string | null;
  onVideoCreated?: (videoId: string) => void;
}

export function VideoRecorder({
  agentId,
  text,
  voiceId,
  avatarId,
  onVideoCreated,
}: VideoRecorderProps) {
  const { tenantId } = useAuthContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [title, setTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const {
    isRecording,
    videoBlob,
    duration,
    startRecording,
    stopRecording,
    uploadVideo: uploadVideoBlob,
    reset,
  } = useAvatarRecording(canvasRef, audioRef);

  const handleCanvasReady = (canvas: HTMLCanvasElement) => {
    canvasRef.current = canvas;
  };

  const handleAudioReady = (audio: HTMLAudioElement) => {
    audioRef.current = audio;
  };

  const handleStartRecording = async () => {
    if (!text || !avatarId) {
      setUploadError('Bitte wählen Sie einen Avatar und geben Sie Text ein');
      return;
    }

    try {
      await startRecording();
      setUploadError(null);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Fehler beim Starten der Aufnahme');
    }
  };

  const handleStopRecording = () => {
    stopRecording();
  };

  const handleUpload = async () => {
    if (!videoBlob || !title.trim() || !tenantId || !avatarId) {
      setUploadError('Bitte geben Sie einen Titel ein');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const video = await uploadVideo(tenantId, avatarId, videoBlob, title, {
        text,
        voiceId,
        agentId,
      });

      setUploadSuccess(true);
      if (onVideoCreated) {
        onVideoCreated(video.id);
      }

      // Reset nach erfolgreichem Upload
      setTimeout(() => {
        reset();
        setTitle('');
        setUploadSuccess(false);
      }, 2000);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Fehler beim Hochladen des Videos');
    } finally {
      setIsUploading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Avatar Preview */}
      <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
        <AvatarPreview 
          agentId={agentId} 
          text={text} 
          voiceId={voiceId}
          onCanvasReady={handleCanvasReady}
          onAudioReady={handleAudioReady}
        />
        {isRecording && (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-red-500 text-white rounded-md text-sm font-medium z-10">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>Recording: {formatDuration(duration)}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isRecording && !videoBlob && (
          <button
            onClick={handleStartRecording}
            disabled={!text || !avatarId}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Play className="h-4 w-4" />
            <span>Aufnahme starten</span>
          </button>
        )}

        {isRecording && (
          <button
            onClick={handleStopRecording}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            <Square className="h-4 w-4" />
            <span>Aufnahme stoppen</span>
          </button>
        )}

        {videoBlob && !isRecording && (
          <>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Video-Titel eingeben..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <button
              onClick={handleUpload}
              disabled={!title.trim() || isUploading}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Wird hochgeladen...</span>
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  <span>Hochladen</span>
                </>
              )}
            </button>
            <button
              onClick={() => {
                reset();
                setTitle('');
              }}
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Zurücksetzen
            </button>
          </>
        )}
      </div>

      {/* Messages */}
      {uploadError && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {uploadError}
        </div>
      )}

      {uploadSuccess && (
        <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
          Video erfolgreich hochgeladen!
        </div>
      )}

      {/* Video Preview */}
      {videoBlob && !isRecording && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Vorschau:</p>
          <video
            src={URL.createObjectURL(videoBlob)}
            controls
            className="w-full rounded-lg"
          />
        </div>
      )}
    </div>
  );
}
