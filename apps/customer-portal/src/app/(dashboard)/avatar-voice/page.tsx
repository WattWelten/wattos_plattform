'use client';

import { useEffect, useState } from 'react';
import { AppleCard } from '@wattweiser/ui';
import { getVisemeEvents, type VisemeEvent } from '@/lib/api';
import { VisemeHeatmap } from '@/components/viseme-heatmap';
import { TTSProbe } from '@/components/tts-probe';
import { useAuthContext } from '@/contexts/auth-context';

export default function AvatarVoicePage() {
  const { tenantId } = useAuthContext();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [voice, _setVoice] = useState('de-DE-neutral');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [rate, _setRate] = useState(1.0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [pitch, _setPitch] = useState(0);
  const [visemeEvents, setVisemeEvents] = useState<VisemeEvent[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    
    setIsLoading(true);
    setError(null);
    getVisemeEvents(tenantId)
      .then(setVisemeEvents)
      .catch((err) => {
        console.error('Failed to load viseme events:', err);
        setError(err.message || 'Fehler beim Laden der Viseme-Events');
      })
      .finally(() => setIsLoading(false));
  }, [tenantId]);


  // Calculate Lipsync Jitter (µ/σ)
  const calculateJitter = () => {
    if (visemeEvents.length < 2) return { mean: 0, stdDev: 0 };

    const intervals: number[] = [];
    for (let i = 1; i < visemeEvents.length; i++) {
      const prev = visemeEvents[i - 1];
      const curr = visemeEvents[i];
      if (prev && curr) {
        intervals.push(curr.timestamp - prev.timestamp);
      }
    }

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);

    return { mean, stdDev };
  };

  const jitter = calculateJitter();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Avatar & Voice</h1>
        <p className="text-gray-600 mt-2">TTS-Einstellungen und Viseme-Heatmap</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700" role="alert">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TTSProbe
          text="Hallo, dies ist eine Testnachricht für die Sprachsynthese."
          voice={voice}
          rate={rate}
          pitch={pitch}
        />

        <AppleCard padding="lg">
          <h2 className="text-xl font-semibold mb-4">Viseme-Heatmap</h2>
          <VisemeHeatmap events={visemeEvents} />
        </AppleCard>
      </div>

      <AppleCard padding="lg">
        <h2 className="text-xl font-semibold mb-4">Lipsync-Jitter</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Mittelwert (µ)</p>
            <p className="text-2xl font-bold">{jitter.mean.toFixed(2)}ms</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Standardabweichung (σ)</p>
            <p className="text-2xl font-bold">{jitter.stdDev.toFixed(2)}ms</p>
          </div>
        </div>
      </AppleCard>
    </div>
  );
}

