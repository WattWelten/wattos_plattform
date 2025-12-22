'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { tenantConfigSchema, type TenantConfig } from '@wattweiser/config';
import { AppleButton, AppleCard } from '@wattweiser/ui';
import { useState } from 'react';

interface FormBuilderProps {
  tenantId: string;
  initialConfig?: TenantConfig;
  onSave?: (config: TenantConfig) => Promise<void>;
}

export function FormBuilder({
  tenantId,
  initialConfig,
  onSave,
}: FormBuilderProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [isDryRun, setIsDryRun] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<TenantConfig>({
    resolver: zodResolver(tenantConfigSchema),
    defaultValues: initialConfig || {
      tenant_id: tenantId,
      character: 'kaya',
      locales: ['de-DE'],
      sources: {
        allow_domains: [],
        patterns: [],
      },
      crawler: {
        schedule_cron: '0 5 * * *',
        delta_etag: true,
        max_pages: 1500,
      },
      retrieval: {
        two_stage: false,
        top_k: 6,
        filters: {},
      },
      skills: [],
      answer_policy: {
        style: 'kurz+schritt',
        show_sources: true,
        show_date: true,
        max_tokens: 450,
      },
      tts: {
        voice: 'de-DE-neutral',
        visemes: true,
        rate: 1.0,
        pitch: 0,
      },
      escalation: {},
    },
  });

  const formData = watch();

  const onSubmit = async (data: TenantConfig) => {
    if (onSave) {
      await onSave(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Character */}
      <div>
        <label htmlFor="character" className="block text-sm font-medium text-gray-700 mb-2">
          Character
        </label>
        <input
          id="character"
          {...register('character')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          aria-invalid={!!errors.character}
          aria-describedby={errors.character ? 'character-error' : undefined}
        />
        {errors.character && (
          <p id="character-error" className="text-sm text-error-500 mt-1" role="alert">
            {errors.character.message}
          </p>
        )}
      </div>

      {/* Skills */}
      <div>
        <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
          Skills (kommagetrennt)
        </label>
        <input
          id="skills"
          {...register('skills')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="buergerdienste, schule_jugend_soziales"
          aria-describedby="skills-help"
        />
        <p id="skills-help" className="text-xs text-gray-500 mt-1">
          Trennen Sie mehrere Skills mit Kommas
        </p>
      </div>

      {/* Crawl Schedule */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Crawl-Zeit (Cron)
        </label>
        <input
          {...register('crawler.schedule_cron')}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          placeholder="0 5 * * *"
        />
      </div>

      {/* Retrieval Config */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Top-K
          </label>
          <input
            type="number"
            {...register('retrieval.top_k', { valueAsNumber: true })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="flex items-center pt-8">
          <input
            type="checkbox"
            {...register('retrieval.two_stage')}
            className="mr-2"
          />
          <label className="text-sm font-medium text-gray-700">
            Two-Stage Retrieval
          </label>
        </div>
      </div>

      {/* TTS Config */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            TTS-Stimme
          </label>
          <select
            {...register('tts.voice')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          >
            <option value="de-DE-neutral">de-DE-neutral</option>
            <option value="de-DE-male">de-DE-male</option>
            <option value="de-DE-female">de-DE-female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rate
          </label>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            {...register('tts.rate', { valueAsNumber: true })}
            className="w-full"
          />
          <span className="text-sm text-gray-600">{formData.tts?.rate || 1.0}</span>
        </div>
      </div>

      {/* Escalation */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Eskalation E-Mail
          </label>
          <input
            type="email"
            {...register('escalation.email')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Eskalation Telefon
          </label>
          <input
            type="tel"
            {...register('escalation.phone')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4" role="group" aria-label="Formular-Aktionen">
        <AppleButton
          type="button"
          variant="outline"
          onClick={() => setShowPreview(!showPreview)}
          aria-expanded={showPreview}
          aria-controls="json-preview"
        >
          {showPreview ? 'Preview ausblenden' : 'JSON Preview'}
        </AppleButton>
        <AppleButton
          type="button"
          variant="outline"
          onClick={() => setIsDryRun(true)}
          aria-label="Dry-Run durchführen"
        >
          Dry-Run
        </AppleButton>
        <AppleButton type="submit" aria-label="Konfiguration speichern">
          Apply
        </AppleButton>
      </div>

      {/* JSON Preview */}
      {showPreview && (
        <AppleCard padding="md" id="json-preview" role="region" aria-label="JSON Preview">
          <pre className="text-xs overflow-auto" aria-label="Konfiguration als JSON">
            {JSON.stringify(formData, null, 2)}
          </pre>
        </AppleCard>
      )}
    </form>
  );
}

