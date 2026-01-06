'use client';

import { useEffect, useState } from 'react';

interface CommandPaletteItem {
  id: string;
  label: string;
  shortcut?: string;
  keywords?: string[];
  group?: string;
  icon?: React.ReactNode;
  onSelect: () => void;
}

interface UseCommandPaletteOptions {
  items: CommandPaletteItem[];
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Command Palette Hook
 * 
 * Verwaltet Command Palette State und Keyboard Shortcuts
 */
export function useCommandPalette({
  items,
  defaultOpen = false,
  onOpenChange,
}: UseCommandPaletteOptions) {
  const [open, setOpen] = useState(defaultOpen);
  const [search, setSearch] = useState('');

  // Keyboard Shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) oder Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => {
          const newValue = !prev;
          if (onOpenChange) {
            onOpenChange(newValue);
          }
          return newValue;
        });
      }

      // Escape zum Schließen
      if (e.key === 'Escape' && open) {
        setOpen(false);
        if (onOpenChange) {
          onOpenChange(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  // Filter Items basierend auf Search
  const filteredItems = items.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.label.toLowerCase().includes(searchLower) ||
      item.keywords?.some((keyword) => keyword.toLowerCase().includes(searchLower)) ||
      item.id.toLowerCase().includes(searchLower)
    );
  });

  // Gruppiere Items
  const groupedItems = filteredItems.reduce((acc, item) => {
    const group = item.group || 'Other';
    if (!acc[group]) {
      acc[group] = [];
    }
    acc[group].push(item);
    return acc;
  }, {} as Record<string, CommandPaletteItem[]>);

  return {
    open,
    setOpen,
    search,
    setSearch,
    items: filteredItems,
    groupedItems,
  };
}

/**
 * Keyboard Shortcut Display Helper
 */
export function formatShortcut(shortcut: string): string {
  // Konvertiere "cmd+k" zu "⌘K" (Mac) oder "Ctrl+K" (Windows/Linux)
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  return shortcut
    .replace(/cmd/gi, isMac ? '⌘' : 'Ctrl')
    .replace(/ctrl/gi, isMac ? '⌘' : 'Ctrl')
    .replace(/alt/gi, isMac ? '⌥' : 'Alt')
    .replace(/shift/gi, isMac ? '⇧' : 'Shift')
    .replace(/\+/g, '')
    .toUpperCase();
}

