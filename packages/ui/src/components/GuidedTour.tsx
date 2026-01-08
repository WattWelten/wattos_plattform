import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';
import { Button } from './Button';
import { cn } from '../lib/utils';

export interface TourStep {
  id: string;
  target: string; // CSS selector or data-tour attribute
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface GuidedTourProps {
  steps: TourStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

export const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  onComplete,
  onSkip,
  className,
}) => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isActive, setIsActive] = React.useState(false);
  const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState<{ top: number; left: number } | null>(null);

  React.useEffect(() => {
    if (isActive && steps.length > 0) {
      const step = steps[currentStep];
      if (!step) {
        return;
      }
      const element = document.querySelector(step.target) as HTMLElement;
      
      if (element) {
        setTargetElement(element);
        const rect = element.getBoundingClientRect();
        const position = step.position || 'bottom';
        
        let top = 0;
        let left = 0;
        
        switch (position) {
          case 'top':
            top = rect.top - 20;
            left = rect.left + rect.width / 2;
            break;
          case 'bottom':
            top = rect.bottom + 20;
            left = rect.left + rect.width / 2;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - 20;
            break;
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + 20;
            break;
        }
        
        setTooltipPosition({ top, left });
        
        // Highlight target element
        element.style.outline = '2px solid #00D28F';
        element.style.outlineOffset = '4px';
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
    
    return () => {
      if (targetElement) {
        targetElement.style.outline = '';
        targetElement.style.outlineOffset = '';
      }
    };
  }, [isActive, currentStep, steps, targetElement]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsActive(false);
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    setIsActive(false);
    onSkip?.();
  };


  if (!isActive || steps.length === 0) {
    return null;
  }

  const currentStepData = steps[currentStep];
  if (!currentStepData) {
    return null;
  }

  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!tooltipPosition) {
    return null;
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm" />

      {/* Tooltip */}
      <div
        className={cn(
          'fixed z-[9999] w-full max-w-sm',
          className
        )}
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: 'translate(-50%, 0)',
        }}
      >
        <Card variant="elevated" className="p-4 shadow-2xl">
          {/* Progress */}
          <div className="mb-4">
            <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
              <span>
                Schritt {currentStep + 1} von {steps.length}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-primary-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <CardHeader className="px-0 pb-2">
            <CardTitle className="text-lg">{currentStepData.title}</CardTitle>
            <CardDescription className="text-sm">{currentStepData.description}</CardDescription>
          </CardHeader>

          <CardContent className="px-0">
            <div className="flex items-center justify-between">
              <div>
                {currentStep > 0 && (
                  <Button variant="ghost" size="sm" onClick={handlePrevious}>
                    Zurück
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                {onSkip && (
                  <Button variant="outline" size="sm" onClick={handleSkip}>
                    Überspringen
                  </Button>
                )}
                {currentStepData.action && (
                  <Button variant="outline" size="sm" onClick={currentStepData.action.onClick}>
                    {currentStepData.action.label}
                  </Button>
                )}
                <Button size="sm" onClick={handleNext}>
                  {currentStep === steps.length - 1 ? 'Fertig' : 'Weiter'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

// Hook to start tour
export const useGuidedTour = (steps: TourStep[]) => {
  const [tourInstance, setTourInstance] = React.useState<React.ReactNode>(null);

  const startTour = React.useCallback(() => {
    setTourInstance(
      <GuidedTour
        steps={steps}
        onComplete={() => setTourInstance(null)}
        onSkip={() => setTourInstance(null)}
      />
    );
  }, [steps]);

  return { startTour, tourInstance };
};
