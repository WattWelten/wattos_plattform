'use client';

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command-palette';
import { useChatStore } from '@/hooks/use-chat-store';
import { useRouter } from 'next/navigation';
import { MessageSquare, Settings, FileText, Bot } from 'lucide-react';

export interface CommandPaletteProps {
  onClose: () => void;
}

export function CommandPalette({ onClose }: CommandPaletteProps) {
  const { setCurrentChatId, clearMessages } = useChatStore();
  const router = useRouter();

  const handleNewChat = () => {
    setCurrentChatId(null);
    clearMessages();
    onClose();
  };

  const commands = [
    {
      group: 'Chat',
      items: [
        {
          id: 'new-chat',
          label: 'Neuer Chat',
          icon: MessageSquare,
          shortcut: '⌘N',
          action: handleNewChat,
        },
        {
          id: 'settings',
          label: 'Einstellungen',
          icon: Settings,
          shortcut: '⌘,',
          action: () => {
            router.push('/admin');
            onClose();
          },
        },
      ],
    },
    {
      group: 'Wissensräume',
      items: [
        {
          id: 'knowledge-spaces',
          label: 'Wissensräume verwalten',
          icon: FileText,
          action: () => {
            router.push('/admin/knowledge-spaces');
            onClose();
          },
        },
      ],
    },
    {
      group: 'Agenten',
      items: [
        {
          id: 'agents',
          label: 'Agenten verwalten',
          icon: Bot,
          action: () => {
            router.push('/admin');
            onClose();
          },
        },
      ],
    },
  ];

  return (
    <CommandDialog open={true} onOpenChange={(open) => !open && onClose()}>
      <CommandInput placeholder="Befehl oder Suche eingeben..." />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
        {commands.map((group) => (
          <CommandGroup key={group.group} heading={group.group}>
            {group.items.map((item) => {
              const Icon = item.icon;
              const hasShortcut = 'shortcut' in item && item.shortcut;
              return (
                <CommandItem
                  key={item.id}
                  onSelect={() => item.action()}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {hasShortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}