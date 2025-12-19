import { useState } from 'react';

export function useDragAndDrop(
  widgets: any[],
  onUpdateWidget: (widgetId: string, updates: any) => void,
) {
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, widgetId: string) => {
    setDraggedWidget(widgetId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedWidget) return;

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Berechne Grid-Position
    const gridSize = 12; // 12-Spalten-Grid
    const cellWidth = rect.width / gridSize;
    const col = Math.floor(x / cellWidth);
    const row = Math.floor(y / 100); // Annahme: 100px pro Zeile

    const widget = widgets.find((w) => w.id === draggedWidget);
    if (widget) {
      onUpdateWidget(draggedWidget, {
        position: {
          ...widget.position,
          x: col,
          y: row,
        },
      });
    }

    setDraggedWidget(null);
  };

  return { handleDragStart, handleDragOver, handleDrop };
}

