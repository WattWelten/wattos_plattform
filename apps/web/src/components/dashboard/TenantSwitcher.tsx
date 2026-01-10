/**
 * Tenant-Switcher Komponente
 * 
 * Ermöglicht Wechsel zwischen Tenants im Dashboard
 */

import { useState, useEffect } from 'react';
import { Button } from '@wattweiser/ui';

interface Tenant {
  id: string;
  slug: string;
  name: string;
}

interface TenantSwitcherProps {
  currentTenantId: string;
  onTenantChange: (tenantId: string) => void;
}

export function TenantSwitcher({
  currentTenantId,
  onTenantChange,
}: TenantSwitcherProps) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    async function fetchTenants() {
      try {
        const response = await fetch('/api/tenants');
        if (!response.ok) {
          throw new Error('Failed to fetch tenants');
        }
        const data = await response.json();
        setTenants(data);
      } catch (err) {
        console.error('Error fetching tenants:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTenants();
  }, []);

  const currentTenant = tenants.find((t) => t.id === currentTenantId);

  if (loading) {
    return <div>Lade Tenants...</div>;
  }

  return (
    <div className="relative">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="flex items-center gap-2"
      >
        <span>{currentTenant?.name || 'Tenant wählen'}</span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-64 bg-white border rounded-lg shadow-lg z-50">
          <div className="p-2">
            {tenants.map((tenant) => (
              <button
                key={tenant.id}
                onClick={() => {
                  onTenantChange(tenant.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 rounded hover:bg-gray-100 ${
                  tenant.id === currentTenantId
                    ? 'bg-blue-50 text-blue-600'
                    : ''
                }`}
              >
                <div className="font-medium">{tenant.name}</div>
                <div className="text-sm text-gray-500">{tenant.slug}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
