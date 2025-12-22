'use client';

import { AvatarV2Container } from '@/components/avatar';

/**
 * Avatar Lab Page
 * 
 * Test-Seite für Avatar-Funktionalität
 */
export default function AvatarLabPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Avatar Lab</h1>
      <div className="w-full h-[600px] border rounded-lg">
        <AvatarV2Container agentId="test-agent" />
      </div>
    </div>
  );
}

