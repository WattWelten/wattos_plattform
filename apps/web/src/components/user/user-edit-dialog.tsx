'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { X } from 'lucide-react';

const userEditSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  name: z.string().min(1, 'Name ist erforderlich'),
  roles: z.array(z.string()).min(1, 'Mindestens eine Rolle ist erforderlich'),
});

type UserEditFormData = z.infer<typeof userEditSchema>;

interface UserEditDialogProps {
  user: {
    id: string;
    email: string;
    name?: string;
    roles?: string[];
  } | null;
  availableRoles: string[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: UserEditFormData) => Promise<void>;
}

/**
 * User Edit Dialog Component
 * 
 * Dialog zum Bearbeiten von Benutzer-Daten und Rollen
 */
export function UserEditDialog({
  user,
  availableRoles,
  isOpen,
  onClose,
  onSave,
}: UserEditDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      email: user?.email || '',
      name: user?.name || '',
      roles: user?.roles || [],
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        email: user.email,
        name: user.name || '',
        roles: user.roles || [],
      });
      setSelectedRoles(user.roles || []);
    }
  }, [user, reset]);

  const handleRoleToggle = (role: string) => {
    const newRoles = selectedRoles.includes(role)
      ? selectedRoles.filter((r) => r !== role)
      : [...selectedRoles, role];
    setSelectedRoles(newRoles);
    setValue('roles', newRoles);
  };

  const onSubmit = async (data: UserEditFormData) => {
    setIsSaving(true);
    try {
      await onSave({ ...data, roles: selectedRoles });
      onClose();
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Benutzer bearbeiten</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">E-Mail</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              className={errors.email ? 'border-red-500' : ''}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register('name')}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label>Rollen</Label>
            <div className="mt-2 space-y-2">
              {availableRoles.map((role) => (
                <label key={role} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => handleRoleToggle(role)}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">{role}</span>
                </label>
              ))}
            </div>
            {errors.roles && (
              <p className="text-sm text-red-500 mt-1">{errors.roles.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Speichern...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

