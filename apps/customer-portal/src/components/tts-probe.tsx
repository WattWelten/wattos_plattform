'use client';

import { useState, useRef } from 'react';
import { AppleButton, AppleCard } from '@wattweiser/ui';
import { Play, Pause, Volume2 } from 'lucide-react';

interface TTSProbeProps {
  text?: string;
  voice?: string;
  rate?: number;
  pitch?: number;
  onProbe?: (audioUrl: string) => void;
}

export function TTSProbe({
  text = 'Hallo, dies ist eine Testnachricht für die Sprachsynthese.',
  voice = 'de-DE-neutral',
  rate = 1.0,
  pitch = 0,
  onProbe,
}: TTSProbeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleProbe = async () => {
    setIsLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/voice/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: voice,
          rate,
          pitch,
        }),
      });

      if (!response.ok) {
        throw new Error('TTS-Anfrage fehlgeschlagen');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
      onProbe?.(url);

      // Auto-Play
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('TTS-Probe Fehler:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  return (
    <AppleCard padding="md">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-gray-600" aria-hidden="true" />
          <h3 className="text-lg font-semibold">TTS-Probe</h3>
        </div>

        <div className="space-y-2">
          <label htmlFor="tts-text" className="block text-sm font-medium text-gray-700">
            Text
          </label>
          <textarea
            id="tts-text"
            value={text}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            rows={3}
            aria-label="Text für TTS-Probe"
          />
        </div>

        <div className="flex items-center gap-4">
          <AppleButton
            onClick={handleProbe}
            disabled={isLoading}
            aria-label="TTS-Probe starten"
            aria-busy={isLoading}
          >
            {isLoading ? 'Wird generiert...' : 'Probe abspielen'}
          </AppleButton>

          {audioUrl && (
            <>
              <AppleButton
                variant="outline"
                onClick={handlePlayPause}
                aria-label={isPlaying ? 'Pausieren' : 'Abspielen'}
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 mr-2" aria-hidden="true" />
                    Pausieren
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" aria-hidden="true" />
                    Abspielen
                  </>
                )}
              </AppleButton>

              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={handleEnded}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                aria-label="TTS-Audio-Wiedergabe"
              />
            </>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p>
            <strong>Stimme:</strong> {voice}
          </p>
          <p>
            <strong>Rate:</strong> {rate}x
          </p>
          <p>
            <strong>Pitch:</strong> {pitch}
          </p>
        </div>
      </div>
    </AppleCard>
  );
}


