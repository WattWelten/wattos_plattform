import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from './Card';
import { cn } from '../lib/utils';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  content: React.ReactNode;
}

export interface OnboardingWizardProps {
  steps: OnboardingStep[];
  onComplete?: () => void;
  onSkip?: () => void;
  className?: string;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  steps,
  onComplete,
  onSkip,
  className,
}) => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isCompleted, setIsCompleted] = React.useState(false);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsCompleted(true);
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip?.();
  };

  if (isCompleted) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm', className)}>
      <Card variant="elevated" className="relative w-full max-w-2xl p-6">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between text-sm text-gray-600">
            <span>
              Schritt {currentStep + 1} von {steps.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-primary-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <CardHeader className="px-0">
          <CardTitle className="text-2xl">{currentStepData.title}</CardTitle>
          <CardDescription className="text-base">{currentStepData.description}</CardDescription>
        </CardHeader>

        <CardContent className="px-0">
          <div className="mb-6 min-h-[200px]">{currentStepData.content}</div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <div>
              {currentStep > 0 && (
                <Button variant="ghost" onClick={handlePrevious}>
                  Zurück
                </Button>
              )}
            </div>
            <div className="flex gap-3">
              {onSkip && (
                <Button variant="outline" onClick={handleSkip}>
                  Überspringen
                </Button>
              )}
              <Button onClick={handleNext}>
                {currentStep === steps.length - 1 ? 'Abschließen' : 'Weiter'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
