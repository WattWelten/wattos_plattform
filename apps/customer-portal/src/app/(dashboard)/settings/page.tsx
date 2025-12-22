'use client';

import { useEffect, useState } from 'react';
import { AppleCard } from '@wattweiser/ui';
import { FormBuilder } from '@/components/settings/form-builder';
import {
  getTenantConfig,
  updateTenantConfig,
  type TenantConfig,
} from '@/lib/api';
import { useAuthContext } from '@/contexts/auth-context';

export default function SettingsPage() {
  const { tenantId } = useAuthContext();
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    
    setIsLoading(true);
    setError(null);
    getTenantConfig(tenantId)
      .then(setConfig)
      .catch((err) => {
        console.error('Failed to load config:', err);
        setError(err.message || 'Fehler beim Laden der Konfiguration');
      })
      .finally(() => setIsLoading(false));
  }, [tenantId]);

  const handleSave = async (newConfig: TenantConfig) => {
    if (!tenantId) return;
    
    setSaveError(null);
    try {
      await updateTenantConfig(tenantId, newConfig);
      setConfig(newConfig);
      // Show success message (could use toast)
      alert('Konfiguration gespeichert!');
    } catch (err: any) {
      console.error('Failed to save config:', err);
      setSaveError(err.message || 'Fehler beim Speichern der Konfiguration');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">No-Code Konfiguration</p>
        </div>
        <AppleCard padding="lg">
          <div className="text-gray-400 text-center py-12">Lädt...</div>
        </AppleCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">No-Code Konfiguration</p>
      </div>

      {(error || saveError) && (
        <div className="mb-4 p-4 bg-error-50 border border-error-200 rounded-lg text-error-700" role="alert">
          {error || saveError}
        </div>
      )}

      <AppleCard padding="lg">
        <h2 className="text-xl font-semibold mb-6">Tenant-Konfiguration</h2>
        {tenantId && (
          <FormBuilder
            tenantId={tenantId}
            initialConfig={config || undefined}
            onSave={handleSave}
          />
        )}
      </AppleCard>
    </div>
  );
}

