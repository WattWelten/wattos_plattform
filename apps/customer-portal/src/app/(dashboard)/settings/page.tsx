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
import { Settings, Check } from 'lucide-react';

export default function SettingsPage() {
  const { tenantId } = useAuthContext();
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
    setSaveSuccess(false);
    try {
      await updateTenantConfig(tenantId, newConfig);
      setConfig(newConfig);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error('Failed to save config:', err);
      setSaveError(err.message || 'Fehler beim Speichern der Konfiguration');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-lg text-gray-600">No-Code Konfiguration</p>
        </div>
        <AppleCard padding="lg">
          <div className="text-gray-400 text-center py-12">Lädt...</div>
        </AppleCard>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Settings</h1>
            <p className="text-lg text-gray-600">
              Konfigurieren Sie Ihre Tenant-Einstellungen ohne Code
            </p>
          </div>
          {saveSuccess && (
            <div className="flex items-center gap-2 px-4 py-2 bg-success-50 border border-success-200 rounded-xl text-success-700 animate-in fade-in zoom-in-95 duration-300">
              <Check className="w-5 h-5" />
              <span className="font-medium">Gespeichert!</span>
            </div>
          )}
        </div>
      </div>

      {/* Error Messages */}
      {(error || saveError) && (
        <div
          className="p-4 bg-error-50 border border-error-200 rounded-xl text-error-700 animate-in fade-in slide-in-from-left-4 duration-300"
          role="alert"
        >
          {error || saveError}
        </div>
      )}

      {/* Configuration Card */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300" style={{ animationDelay: '100ms' }}>
        <AppleCard variant="elevated" padding="lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-primary-50 rounded-lg">
              <Settings className="w-5 h-5 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold">Tenant-Konfiguration</h2>
          </div>
          {tenantId && config && (
            <FormBuilder
              tenantId={tenantId}
              initialConfig={config as any}
              onSave={handleSave as any}
            />
          )}
        </AppleCard>
      </div>
    </div>
  );
}

