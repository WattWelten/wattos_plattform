import { AppleCard } from '@wattweiser/ui';

export default function TenantsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tenants</h1>
        <p className="text-gray-600 mt-2">Mandanten-Verwaltung</p>
      </div>

      <AppleCard padding="lg">
        <div className="text-gray-400 text-center py-12">
          Tenants-Liste wird hier angezeigt
        </div>
      </AppleCard>
    </div>
  );
}


