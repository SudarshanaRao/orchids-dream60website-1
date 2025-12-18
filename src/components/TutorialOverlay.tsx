import { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Optional action to open the right page/section
  shouldSkip?: () => boolean; // Skip this step automatically if already done
  actionLabel?: string; // Custom CTA label per step
}

interface TutorialOverlayProps {
  steps: TutorialStep[];
  tutorialId: string; // Unique ID to track completion
  onComplete?: () => void;
  returnTo?: string; // Where to return after completion (e.g., 'home')
  startToken?: number; // Change this to force-start the tutorial
  forceShow?: boolean; // Ignore completion flag when true
}

export function TutorialOverlay({ steps, tutorialId, onComplete, returnTo, startToken, forceShow }: TutorialOverlayProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem(`tutorial_completed_${tutorialId}`) === 'true';
    const shouldStart = Boolean(forceShow || startToken || !completed);

    if (shouldStart && steps.length > 0) {
      setCurrentStep(0);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorialId, startToken, forceShow, steps.length]);

  useEffect(() => {
    if (!isVisible) return;
    const step = steps[currentStep];
    if (step?.shouldSkip && step.shouldSkip()) {
      handleNext(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isVisible, steps]);

  const getVisibleTarget = (selector: string) => {
    if (typeof document === 'undefined') return null;
    const nodes = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
    return (
      nodes.find((el) => {
        const rect = el.getBoundingClientRect();
        return (el.offsetParent !== null) || rect.width > 0 || rect.height > 0;
      }) || nodes[0] || null
    );
  };

    const highlightTarget = (selector: string, attempt = 0) => {
      const element = getVisibleTarget(selector);
      if (element) {
        // Use behavior: 'smooth', block: 'center' and inline: 'nearest' to avoid horizontal layout disturbance
        element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        
        // Remove existing highlights
        document.querySelectorAll('.whatsnew-highlight').forEach(el => el.classList.remove('whatsnew-highlight'));
        
        // Add highlight class
        element.classList.add('whatsnew-highlight');
        return;
      }
      if (attempt < 10) { // Increased attempts for dynamic elements
        setTimeout(() => highlightTarget(selector, attempt + 1), 300);
      }
    };

    // Auto-highlight when step changes
    useEffect(() => {
      if (!isVisible) {
        // Clean up highlights when overlay closes
        document.querySelectorAll('.whatsnew-highlight').forEach(el => el.classList.remove('whatsnew-highlight'));
        return;
      }
      
      const step = steps[currentStep];
      if (step?.targetElement) {
        setTimeout(() => highlightTarget(step.targetElement), 250);
      }
      
      return () => {
        // Optional: clean up when moving between steps
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentStep, isVisible]);


  const handleNext = (fromSkip?: boolean) => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete(fromSkip);
    }
  };

  const handleBack = () => {
    if (currentStep === 0) return;
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    handleComplete(true);
  };

  const handleClose = () => {
    handleComplete(true);
  };

  const handleTryNow = () => {
    const step = steps[currentStep];
    if (!step) return;

    if (step.action) {
      step.action();
    }

    if (step.targetElement) {
      setTimeout(() => highlightTarget(step.targetElement), 450);
    }
  };

  const handleComplete = (fromSkip?: boolean) => {
    localStorage.setItem(`tutorial_completed_${tutorialId}`, 'true');
    setIsVisible(false);

    if (onComplete && !fromSkip) {
      onComplete();
    } else if (onComplete && fromSkip) {
      onComplete();
    }

    if (returnTo && window.location.pathname !== `/${returnTo}`) {
      setTimeout(() => {
        window.history.pushState({}, '', `/${returnTo}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 120);
    }
  };

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  // Progress must be exact: 1/5, 2/5, ... 5/5 (100% on final step)
  const progress = Math.min(100, Math.max(0, ((currentStep + 1) / steps.length) * 100));
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-[calc(100vw-24px)]">
      <style>{`
        .whatsnew-highlight {
          outline: 3px solid rgba(139, 92, 246, 0.75);
          box-shadow: 0 12px 30px -12px rgba(76, 29, 149, 0.35), 0 0 0 6px rgba(167, 139, 250, 0.35);
          border-radius: 14px;
        }
      `}</style>
      <div className="w-[360px] max-w-full bg-white border border-purple-100 shadow-xl rounded-2xl p-4 sm:p-5 relative overflow-hidden">
        <button
          onClick={handleClose}
          aria-label="Close what's new"
          className="absolute top-3 right-3 p-2 rounded-full hover:bg-purple-50 text-purple-700"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 text-[11px] font-semibold text-purple-600 uppercase tracking-[0.1em] mb-2">
          <Sparkles className="w-4 h-4" />
          <span>What&apos;s new</span>
        </div>

        <div className="space-y-2 pr-8">
          <h3 className="text-lg font-bold text-purple-900 leading-tight">{step.title}</h3>
          <p className="text-sm text-purple-700 leading-relaxed">{step.description}</p>
        </div>

        <div className="mt-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-purple-600">
              <span className="font-medium">Progress</span>
              <span>Step {currentStep + 1} of {steps.length}</span>
            </div>
            <div className="h-2 w-full bg-purple-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            onClick={handleSkip}
            className="px-3 py-2 text-sm font-semibold text-purple-700 hover:text-purple-900"
          >
            Skip
          </button>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-3 py-2 text-sm font-semibold rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="inline-flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Back</span>
            </button>
            <button
              onClick={handleTryNow}
              className="px-3 py-2 text-sm font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-700 shadow-sm"
            >
              Try now
            </button>
            <button
              onClick={() => (isLastStep ? handleComplete(false) : handleNext())}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 text-white shadow-md hover:shadow-lg"
            >
              {isLastStep ? 'Start journey' : (step.actionLabel || 'Next')}
              <ChevronRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
