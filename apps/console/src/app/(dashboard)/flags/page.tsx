import { AppleCard } from '@wattweiser/ui';

export default function FlagsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Feature Flags</h1>
        <p className="text-gray-600 mt-2">Feature-Flag Verwaltung</p>
      </div>

      <AppleCard padding="lg">
        <div className="text-gray-400 text-center py-12">
          Feature-Flags werden hier angezeigt
        </div>
      </AppleCard>
    </div>
  );
}

