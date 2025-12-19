'use client';

import { AuthGuard } from '@/components/auth/auth-guard';
import ChatPageContent from './chat-content';

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatPageContent />
    </AuthGuard>
  );
}

