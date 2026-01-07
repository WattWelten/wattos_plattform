/**
 * Journey Step Component
 * 
 * Apple Design: Journey-basierte UX mit smooth transitions
 */

'use client';

import { LucideIcon, Check } from 'lucide-react';
import { AppleCard } from '@wattweiser/ui';

interface JourneyStepProps {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
  status: 'completed' | 'active' | 'upcoming';
  onClick?: () => void;
}

export function JourneyStep({
  step,
  title,
  description,
  icon: Icon,
  status,
  onClick,
}: JourneyStepProps) {
  const statusStyles = {
    completed: 'bg-success-50 border-success-200 text-success-700',
    active: 'bg-primary-50 border-primary-500 text-primary-700 shadow-lg',
    upcoming: 'bg-gray-50 border-gray-200 text-gray-500',
  };

  return (
    <div
      className="relative animate-in fade-in slide-in-from-left-4 duration-300"
      style={{ animationDelay: `${step * 100}ms` }}
    >
      {/* Connection Line */}
      {step > 1 && (
        <div className="absolute left-6 top-0 w-0.5 h-full bg-gray-200 -translate-y-full" />
      )}

      <AppleCard
        variant="outlined"
        padding="md"
        className={`cursor-pointer transition-all duration-300 hover:shadow-md ${statusStyles[status]}`}
        onClick={onClick}
      >
        <div className="flex items-start gap-4">
          {/* Step Number / Icon */}
          <div className="flex-shrink-0">
            {status === 'completed' ? (
              <div className="w-12 h-12 rounded-full bg-success-500 flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
            ) : (
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  status === 'active'
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {status === 'active' ? (
                  <Icon className="w-6 h-6" />
                ) : (
                  <span className="text-lg font-semibold">{step}</span>
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">{title}</h3>
            <p className="text-sm opacity-80">{description}</p>
          </div>
        </div>
      </AppleCard>
    </div>
  );
}

