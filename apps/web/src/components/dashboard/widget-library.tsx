'use client';

import React from 'react';
import { Plus, TrendingUp, MessageSquare, Users, FileText, BarChart3, PieChart } from 'lucide-react';

interface WidgetType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: string;
}

const WIDGET_TYPES: WidgetType[] = [
  {
    id: 'kpi-answered',
    name: 'KPI: Beantwortete Anfragen',
    description: 'Anzahl beantworteter Anfragen mit Trend',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'kpi',
  },
  {
    id: 'kpi-self-service',
    name: 'KPI: Self-Service-Quote',
    description: 'Self-Service-Quote mit Chart',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'kpi',
  },
  {
    id: 'kpi-csat',
    name: 'KPI: CSAT Score',
    description: 'Customer Satisfaction Score',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'kpi',
  },
  {
    id: 'chart-line',
    name: 'Line Chart',
    description: 'Liniendiagramm für Zeitreihen',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'charts',
  },
  {
    id: 'chart-bar',
    name: 'Bar Chart',
    description: 'Balkendiagramm für Vergleiche',
    icon: <BarChart3 className="w-5 h-5" />,
    category: 'charts',
  },
  {
    id: 'chart-pie',
    name: 'Pie Chart',
    description: 'Kreisdiagramm für Verteilungen',
    icon: <PieChart className="w-5 h-5" />,
    category: 'charts',
  },
  {
    id: 'overview',
    name: 'Overview',
    description: 'Übersicht über wichtige Metriken',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'metrics',
  },
  {
    id: 'conversations',
    name: 'Conversations',
    description: 'Aktuelle Konversationen',
    icon: <MessageSquare className="w-5 h-5" />,
    category: 'communication',
  },
  {
    id: 'agents',
    name: 'Agents',
    description: 'Agent-Status und Performance',
    icon: <Users className="w-5 h-5" />,
    category: 'agents',
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Analysen und Trends',
    icon: <TrendingUp className="w-5 h-5" />,
    category: 'analytics',
  },
  {
    id: 'kb-sync',
    name: 'KB Sync',
    description: 'Knowledge Base Synchronisation',
    icon: <FileText className="w-5 h-5" />,
    category: 'knowledge',
  },
];

interface WidgetLibraryProps {
  onAddWidget: (widgetType: string) => void;
  selectedCategory?: string;
}

/**
 * Widget Library Component
 * 
 * Bibliothek verfügbarer Widgets zum Hinzufügen zum Dashboard
 */
export function WidgetLibrary({ onAddWidget, selectedCategory }: WidgetLibraryProps) {
  const filteredWidgets = selectedCategory
    ? WIDGET_TYPES.filter((w) => w.category === selectedCategory)
    : WIDGET_TYPES;

  const categories = Array.from(new Set(WIDGET_TYPES.map((w) => w.category)));

  return (
    <div className="widget-library p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-semibold mb-4">Widget Library</h3>

      {/* Category Filter */}
      <div className="mb-4 flex gap-2 flex-wrap">
        <button
          onClick={() => {}}
          className={`px-3 py-1 text-sm rounded ${
            !selectedCategory
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => {}}
            className={`px-3 py-1 text-sm rounded capitalize ${
              selectedCategory === category
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Widget List */}
      <div className="space-y-2">
        {filteredWidgets.map((widget) => (
          <button
            key={widget.id}
            onClick={() => onAddWidget(widget.id)}
            className="w-full flex items-center gap-3 p-3 bg-white border rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
          >
            <div className="text-gray-600">{widget.icon}</div>
            <div className="flex-1">
              <div className="font-medium text-sm text-gray-900">{widget.name}</div>
              <div className="text-xs text-gray-500">{widget.description}</div>
            </div>
            <Plus className="w-4 h-4 text-gray-400" />
          </button>
        ))}
      </div>
    </div>
  );
}

