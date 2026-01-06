'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Table } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { authenticatedFetch } from '@/lib/auth';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { UserEditDialog } from '@/components/user/user-edit-dialog';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<{
    id: string;
    email: string;
    name?: string;
    roles?: string[];
  } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      try {
        const response = await authenticatedFetch(`${apiUrl}/admin/users`);
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        return await response.json();
      } catch (error) {
        console.error('Users fetch error:', error);
        // Fallback zu Mock-Daten
        return [
          { id: '1', name: 'Max Mustermann', email: 'max@example.com', roles: ['admin'], tenantId: 'tenant1' },
          { id: '2', name: 'Anna Schmidt', email: 'anna@example.com', roles: ['user'], tenantId: 'tenant1' },
        ];
      }
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await authenticatedFetch(`${apiUrl}/admin/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: { id: string; email: string; name?: string; roles: string[] }) => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await authenticatedFetch(`${apiUrl}/admin/users/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          roles: data.roles,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to update user');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const handleEditUser = (user: any) => {
    setSelectedUser({
      id: user.id,
      email: user.email,
      name: user.name,
      roles: user.roles || [],
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveUser = async (data: { email: string; name?: string; roles: string[] }) => {
    if (!selectedUser) return;
    await updateUserMutation.mutateAsync({
      id: selectedUser.id,
      ...data,
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Nutzer & Rollen</h1>
          <p className="text-gray-600 mt-1">Verwalten Sie Benutzer und deren Rollen</p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Neuer Nutzer
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <thead>
            <tr>
              <th>Name</th>
              <th>E-Mail</th>
              <th>Rollen</th>
              <th>Tenant</th>
              <th>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {users?.map((user: any) => (
              <tr key={user.id}>
                <td>{user.name || 'N/A'}</td>
                <td>{user.email}</td>
                <td>
                  <div className="flex gap-2">
                    {user.roles?.map((role: string) => (
                      <Badge key={role} variant="secondary">
                        {role}
                      </Badge>
                    ))}
                  </div>
                </td>
                <td>{user.tenantId}</td>
                <td>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditUser(user)}
                      aria-label={`Edit user ${user.name || user.email}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteUserMutation.mutate(user.id)}
                      className="text-error-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <UserEditDialog
        user={selectedUser}
        availableRoles={['admin', 'user', 'viewer', 'editor']}
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedUser(null);
        }}
        onSave={handleSaveUser}
      />
    </div>
  );
}

