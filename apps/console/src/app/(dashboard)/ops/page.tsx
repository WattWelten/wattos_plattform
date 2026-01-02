import { AppleCard, AppleButton } from '@wattweiser/ui';

export default function OpsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ops</h1>
        <p className="text-gray-600 mt-2">Crawler-Queue und Delete-Artifact</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AppleCard padding="lg">
          <h2 className="text-xl font-semibold mb-4">Crawler-Queue</h2>
          <div className="text-gray-400 text-center py-8">
            Crawler-Queue wird hier angezeigt
          </div>
        </AppleCard>

        <AppleCard padding="lg">
          <h2 className="text-xl font-semibold mb-4">Delete-Artifact</h2>
          <div className="text-gray-400 text-center py-8">
            Delete-Artifact Tools werden hier angezeigt
          </div>
        </AppleCard>
      </div>
    </div>
  );
}



