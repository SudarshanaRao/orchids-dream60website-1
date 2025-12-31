import { useEffect, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement: string; // CSS selector for the element to highlight
  mobileTargetElement?: string; // CSS selector for mobile-specific element
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  scrollBlock?: ScrollIntoViewOptions['block']; // Optional scroll block position
  action?: () => void; // Optional action to open the right page/section
  mobileAction?: () => void; // Optional action for mobile (e.g., open menu first)
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
    const dismissed = localStorage.getItem(`tutorial_dismissed_${tutorialId}`) === 'true';
    
    // Auto-start ONLY if (forceShow OR startToken is provided) AND NOT already completed/dismissed
    // forceShow overrides the check ONLY if it's explicitly true (manual trigger)
    const shouldStart = forceShow || (Boolean(startToken) && !completed && !dismissed);

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

  const isMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 1024; // lg breakpoint
  };

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
      const rect = element.getBoundingClientRect();
      const isVisibleInViewport = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );

      const step = steps[currentStep];
      if (!isVisibleInViewport || step?.scrollBlock) {
        if (step?.scrollBlock === 'start' && !isMobile()) {
          const elementTop = element.getBoundingClientRect().top + window.pageYOffset;
          const middleOffset = window.innerHeight / 3;
          window.scrollTo({
            top: elementTop - middleOffset,
            behavior: 'smooth'
          });
        } else {
          element.scrollIntoView({ 
            behavior: 'smooth', 
            block: step?.scrollBlock || 'center' 
          });
        }
      }
      
      element.classList.add('whatsnew-highlight');
      setTimeout(() => element.classList.remove('whatsnew-highlight'), 2200);
      return;
    }
    if (attempt < 6) {
      setTimeout(() => highlightTarget(selector, attempt + 1), 200);
    }
  };

  const highlightMobileTarget = (step: TutorialStep) => {
    const selector = step.mobileTargetElement || step.targetElement;
    if (isMobile() && step.mobileAction) {
      step.mobileAction();
      setTimeout(() => highlightTarget(selector), 500);
    } else if (step.action) {
      step.action();
      setTimeout(() => highlightTarget(selector), 450);
    } else {
      highlightTarget(selector);
    }
  };

  useEffect(() => {
    if (!isVisible) return;
    const step = steps[currentStep];
    if (step?.targetElement) {
      setTimeout(() => highlightTarget(step.targetElement), 250);
    }
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
    localStorage.setItem(`tutorial_dismissed_${tutorialId}`, 'true');
    handleComplete(true);
  };

  const handleClose = () => {
    localStorage.setItem(`tutorial_dismissed_${tutorialId}`, 'true');
    handleComplete(true);
  };

  const handleTryNow = () => {
    const step = steps[currentStep];
    if (!step) return;
    highlightMobileTarget(step);
  };

  const handleComplete = (fromSkip?: boolean) => {
    localStorage.setItem(`tutorial_completed_${tutorialId}`, 'true');
    setIsVisible(false);

    if (onComplete) {
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
  const progress = Math.min(100, Math.max(0, ((currentStep + 1) / steps.length) * 100));
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] max-w-[calc(100vw-32px)] sm:max-w-[400px]">
      <style>{`
        .whatsnew-highlight {
          outline: 4px solid rgba(139, 92, 246, 0.85) !important;
          outline-offset: 4px !important;
          box-shadow: 0 0 0 8px rgba(167, 139, 250, 0.4), 0 20px 40px -12px rgba(76, 29, 149, 0.5) !important;
          z-index: 60 !important;
          transition: outline 0.3s ease, box-shadow 0.3s ease !important;
          pointer-events: auto !important;
        }
        @keyframes slide-up {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }
      `}</style>
      <div className="w-full bg-white/95 backdrop-blur-2xl border-2 border-purple-100 shadow-[0_20px_50px_rgba(76,29,149,0.15)] rounded-[2rem] p-5 sm:p-6 relative overflow-hidden animate-slide-up">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-100/50 blur-3xl -z-10 rounded-full" />
        
        <button
          onClick={handleClose}
          aria-label="Close what's new"
          className="absolute top-4 right-4 p-2 rounded-2xl hover:bg-purple-50 text-purple-400 hover:text-purple-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-[11px] font-black text-purple-600 uppercase tracking-[0.2em] mb-4">
          <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span>New Feature</span>
        </div>

        <div className="space-y-3 pr-6">
          <h3 className="text-xl sm:text-2xl font-black text-purple-950 leading-tight tracking-tight">{step.title}</h3>
          <p className="text-sm sm:text-base text-purple-800/80 leading-relaxed font-medium">{step.description}</p>
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-[10px] font-bold text-purple-400 uppercase tracking-widest">
            <span>Progress</span>
            <span>{currentStep + 1} / {steps.length}</span>
          </div>
          <div className="h-2 w-full bg-purple-50 rounded-full overflow-hidden border border-purple-100/50 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-bold text-purple-400 hover:text-purple-700 transition-colors"
          >
            Skip
          </button>

          <div className="ml-auto flex items-center gap-2">
            {currentStep > 0 && (
              <button
                onClick={handleBack}
                className="p-3 rounded-2xl border-2 border-purple-50 text-purple-600 hover:bg-purple-50 transition-all active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            
            <button
              onClick={handleTryNow}
              className="px-5 py-2.5 text-sm font-bold rounded-2xl bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all active:scale-95"
            >
              Try Now
            </button>

            <button
              onClick={() => (isLastStep ? handleComplete(false) : handleNext())}
              className="px-6 py-2.5 text-sm font-black rounded-2xl bg-gradient-to-r from-purple-600 to-violet-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all active:scale-95 flex items-center gap-2"
            >
              {isLastStep ? 'Get Started' : (step.actionLabel || 'Next')}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
