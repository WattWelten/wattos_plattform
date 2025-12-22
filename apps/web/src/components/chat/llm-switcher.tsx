'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Settings, Check } from 'lucide-react';

interface LLMSwitcherProps {
  currentModel: string;
  currentProvider: string;
  onModelChange: (model: string, provider: string) => void;
}

const providers = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'gpt-4', name: 'GPT-4', description: 'Leistungsstärkstes Modell' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Schneller und günstiger' },
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Schnell und kosteneffizient' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'claude-3-opus', name: 'Claude 3 Opus', description: 'Höchste Qualität' },
      { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet', description: 'Ausgewogene Leistung' },
      { id: 'claude-3-haiku', name: 'Claude 3 Haiku', description: 'Schnell und effizient' },
    ],
  },
  {
    id: 'google',
    name: 'Google',
    models: [
      { id: 'gemini-pro', name: 'Gemini Pro', description: 'Multimodales Modell' },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (Lokal)',
    models: [
      { id: 'llama2', name: 'Llama 2', description: 'Lokales Modell' },
      { id: 'mistral', name: 'Mistral', description: 'Lokales Modell' },
    ],
  },
];

export function LLMSwitcher({ currentModel, currentProvider, onModelChange }: LLMSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(currentProvider);
  const [selectedModel, setSelectedModel] = useState(currentModel);

  const currentProviderData = providers.find((p) => p.id === currentProvider);
  const currentModelData = currentProviderData?.models.find((m) => m.id === currentModel);

  const handleSave = () => {
    onModelChange(selectedModel, selectedProvider);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">{currentModelData?.name || currentModel}</span>
          <Badge variant="secondary" className="text-xs">
            {currentProviderData?.name || currentProvider}
          </Badge>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>KI-Modell auswählen</DialogTitle>
          <DialogDescription>
            Wählen Sie den Provider und das Modell für Ihre Unterhaltung.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="provider">Provider</Label>
            <Select
              id="provider"
              value={selectedProvider}
              onChange={(e) => {
                setSelectedProvider(e.target.value);
                const provider = providers.find((p) => p.id === e.target.value);
                if (provider && provider.models.length > 0) {
                  const firstModel = provider.models[0];
                  if (firstModel) {
                    setSelectedModel(firstModel.id);
                  }
                }
              }}
            >
              {providers.map((provider) => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">Modell</Label>
            <div className="space-y-2">
              {providers
                .find((p) => p.id === selectedProvider)
                ?.models.map((model) => (
                  <button
                    key={model.id}
                    type="button"
                    onClick={() => setSelectedModel(model.id)}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                      selectedModel === model.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-gray-500">{model.description}</div>
                      </div>
                      {selectedModel === model.id && (
                        <Check className="w-5 h-5 text-primary-500" />
                      )}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Abbrechen
          </Button>
          <Button onClick={handleSave}>Speichern</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


