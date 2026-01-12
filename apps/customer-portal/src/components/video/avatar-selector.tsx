'use client';

import { useState, useEffect } from 'react';
import { getAvatars, createAvatar, type Avatar } from '@/lib/api';
import { useAuthContext } from '@/contexts/auth-context';
import { Upload, Loader2 } from 'lucide-react';

interface AvatarSelectorProps {
  selectedAvatarId: string | null;
  onAvatarSelect: (avatarId: string) => void;
}

export function AvatarSelector({ selectedAvatarId, onAvatarSelect }: AvatarSelectorProps) {
  const { tenantId } = useAuthContext();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tenantId) {
      loadAvatars();
    }
  }, [tenantId]);

  const loadAvatars = async () => {
    if (!tenantId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAvatars(tenantId);
      setAvatars(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Avatare');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !tenantId) return;

    setIsUploading(true);
    setError(null);

    try {
      const avatar = await createAvatar(tenantId, file, file.name);
      setAvatars((prev) => [avatar, ...prev]);
      onAvatarSelect(avatar.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Avatars');
    } finally {
      setIsUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">Avatar auswählen</h3>
        <label className="flex items-center gap-2 px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700 cursor-pointer border border-primary-300 rounded-md hover:bg-primary-50 transition-colors">
          <Upload className="h-4 w-4" />
          <span>Neuer Avatar</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {avatars.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <p className="text-sm">Keine Avatare vorhanden</p>
          <p className="text-xs mt-1">Laden Sie ein Bild hoch, um einen Avatar zu erstellen</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {avatars.map((avatar) => (
            <button
              key={avatar.id}
              onClick={() => onAvatarSelect(avatar.id)}
              className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                selectedAvatarId === avatar.id
                  ? 'border-primary-500 ring-2 ring-primary-200'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {avatar.thumbnailUrl ? (
                <img
                  src={avatar.thumbnailUrl}
                  alt={avatar.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xs text-gray-400">{avatar.name}</span>
                </div>
              )}
              {selectedAvatarId === avatar.id && (
                <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
