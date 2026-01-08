'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { GuidedTour, TourStep, useGuidedTour } from '@wattweiser/ui';

interface GuidedTourContextType {
  startTour: (steps: TourStep[]) => void;
  stopTour: () => void;
  isActive: boolean;
}

const GuidedTourContext = createContext<GuidedTourContextType | undefined>(undefined);

export function GuidedTourProvider({ children }: { children: ReactNode }) {
  const [tourSteps, setTourSteps] = useState<TourStep[]>([]);
  const [isActive, setIsActive] = useState(false);

  const startTour = (steps: TourStep[]) => {
    setTourSteps(steps);
    setIsActive(true);
  };

  const stopTour = () => {
    setIsActive(false);
    setTourSteps([]);
  };

  return (
    <GuidedTourContext.Provider value={{ startTour, stopTour, isActive }}>
      {children}
      {isActive && tourSteps.length > 0 && (
        <GuidedTour
          steps={tourSteps}
          onComplete={stopTour}
          onSkip={stopTour}
        />
      )}
    </GuidedTourContext.Provider>
  );
}

export function useGuidedTourContext() {
  const context = useContext(GuidedTourContext);
  if (!context) {
    throw new Error('useGuidedTourContext must be used within GuidedTourProvider');
  }
  return context;
}
