import { useEffect, useRef, useState } from 'react';
import { X, ChevronRight, ChevronLeft, Flag, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [actionRunMap, setActionRunMap] = useState<Record<string, boolean>>({});
  const previousOverflow = useRef<string | null>(null);

  const lockScroll = () => {
    if (typeof document === 'undefined') return;
    if (previousOverflow.current === null) {
      previousOverflow.current = document.body.style.overflow;
    }
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
  };

  const unlockScroll = () => {
    if (typeof document === 'undefined') return;
    if (previousOverflow.current !== null) {
      document.body.style.overflow = previousOverflow.current;
      document.body.style.touchAction = '';
      previousOverflow.current = null;
    }
  };

  const updateHighlight = () => {
    const step = steps[currentStep];
    if (!step || typeof document === 'undefined') return;

    const element = document.querySelector(step.targetElement) as HTMLElement | null;
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightRect(rect);
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
    } else {
      setHighlightRect(null);
    }
  };

  useEffect(() => {
    const completed = localStorage.getItem(`tutorial_completed_${tutorialId}`) === 'true';
    const shouldStart = Boolean(forceShow || startToken || !completed);

    if (shouldStart) {
      setCurrentStep(0);
      setActionRunMap({});
      setIsVisible(true);
      requestAnimationFrame(updateHighlight);
    } else {
      setIsVisible(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorialId, startToken, forceShow]);

  useEffect(() => {
    if (!isVisible) return;

    const step = steps[currentStep];
    if (step?.shouldSkip && step.shouldSkip()) {
      handleNext(true);
      return;
    }

    if (step?.action && !actionRunMap[step.id]) {
      step.action();
      setActionRunMap((prev) => ({ ...prev, [step.id]: true }));
    }

    updateHighlight();
  }, [currentStep, isVisible, steps, actionRunMap]);

  useEffect(() => {
    if (!isVisible) {
      unlockScroll();
      return;
    }
    lockScroll();
    const handleResizeOrScroll = () => requestAnimationFrame(updateHighlight);
    window.addEventListener('resize', handleResizeOrScroll);
    window.addEventListener('scroll', handleResizeOrScroll, true);
    return () => {
      unlockScroll();
      window.removeEventListener('resize', handleResizeOrScroll);
      window.removeEventListener('scroll', handleResizeOrScroll, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft') handleBack();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isVisible, currentStep]);

  const handleNext = (fromSkip?: boolean) => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else if (!fromSkip) {
      handleComplete();
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep === 0) return;
    setCurrentStep((prev) => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleClose = () => {
    handleComplete();
  };

  const handleComplete = () => {
    unlockScroll();
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(tutorialId, 'completed');
    }
    setIsVisible(false);
    
    if (returnTo === 'home') {
      setTimeout(() => {
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 300);
    }
    
    onComplete?.();
  };

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const getTooltipPosition = () => {
    if (!highlightRect || typeof window === 'undefined') {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const centerX = highlightRect.left + highlightRect.width / 2;
    const centerY = highlightRect.top + highlightRect.height / 2;

    let top = highlightRect.bottom + 16;
    let left = centerX;
    let transform = 'translate(-50%, 0)';

    if (step.position === 'top') {
      top = highlightRect.top - 16;
      transform = 'translate(-50%, -100%)';
    } else if (step.position === 'left') {
      left = highlightRect.left - 16;
      top = centerY;
      transform = 'translate(-100%, -50%)';
    } else if (step.position === 'right') {
      left = highlightRect.right + 16;
      top = centerY;
      transform = 'translate(0, -50%)';
    }

    // Clamp to viewport
    const clampedLeft = Math.min(Math.max(16, left), viewportWidth - 16);
    const clampedTop = Math.min(Math.max(16, top), viewportHeight - 16);

    return { top: clampedTop, left: clampedLeft, transform };
  };

  const tooltipPosition = getTooltipPosition();

  const arrowStyle = () => {
    if (!highlightRect) return { display: 'none' as const };
    const base: any = { left: highlightRect.left + highlightRect.width / 2 - 6, top: highlightRect.bottom + 6 };
    if (step.position === 'top') {
      base.top = highlightRect.top - 6;
      base.transform = 'translate(-50%, -100%) rotate(45deg)';
    } else if (step.position === 'left') {
      base.left = highlightRect.left - 6;
      base.top = highlightRect.top + highlightRect.height / 2;
      base.transform = 'translate(-100%, -50%) rotate(45deg)';
    } else if (step.position === 'right') {
      base.left = highlightRect.right + 6;
      base.top = highlightRect.top + highlightRect.height / 2;
      base.transform = 'translate(0, -50%) rotate(45deg)';
    } else {
      base.transform = 'translate(-50%, 0) rotate(45deg)';
    }
    return base;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] pointer-events-auto">
        {/* Dimmed overlay with spotlight cutout */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/65 backdrop-blur-sm"
        />

        {highlightRect && (
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute rounded-2xl transition-all duration-300"
              style={{
                top: highlightRect.top - 16,
                left: highlightRect.left - 16,
                width: highlightRect.width + 32,
                height: highlightRect.height + 32,
                boxShadow: '0 0 0 9999px rgba(0,0,0,0.35)',
                background: 'rgba(255,255,255,0.02)',
                border: '2px solid rgba(139,92,246,0.5)',
              }}
            />
            <div
              className="absolute rounded-2xl ring-4 ring-purple-300/60 shadow-[0_0_0_12px_rgba(126,87,194,0.18)] transition-all duration-300 animate-pulse"
              style={{
                top: highlightRect.top - 12,
                left: highlightRect.left - 12,
                width: highlightRect.width + 24,
                height: highlightRect.height + 24,
              }}
            />
          </div>
        )}

        {/* Tooltip card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -8 }}
          className="absolute max-w-md w-[min(92vw,420px)] bg-white rounded-2xl shadow-2xl border border-purple-100/80 pointer-events-auto"
          style={tooltipPosition}
        >
          <div className="absolute -top-10 left-0 right-0 flex justify-between px-2 text-white text-xs font-semibold">
            <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" /> Guided tour</div>
            <div>Step {currentStep + 1} / {steps.length}</div>
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-3 right-3 p-2 hover:bg-purple-50 rounded-full transition-colors"
            aria-label="Close tutorial"
          >
            <X className="w-4 h-4 text-purple-700" />
          </button>

          <div className="p-5 space-y-4">
            {/* Progress bar */}
            <div className="h-1.5 bg-purple-50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Title and description */}
            <div className="space-y-2 pr-10">
              <h3 className="text-lg font-bold text-purple-900 leading-tight">{step.title}</h3>
              <p className="text-sm text-purple-700 leading-relaxed">{step.description}</p>
              <div className="text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-2 inline-flex items-center gap-2">
                <Flag className="w-3.5 h-3.5" />
                <span>Focus on the highlighted area and follow the hint.</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleSkip}
                className="text-sm font-semibold text-purple-600 hover:text-purple-800"
              >
                Skip tutorial
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="px-3 py-2 text-sm font-semibold rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="inline-flex items-center gap-1"><ChevronLeft className="w-4 h-4" /> Back</span>
                </button>
                <button
                  onClick={handleNext}
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-purple-600 via-violet-600 to-fuchsia-600 text-white shadow-md hover:shadow-lg"
                >
                  {currentStep < steps.length - 1 ? (step.actionLabel || 'Next') : 'Finish'}
                  <ChevronRight className="w-4 h-4 inline ml-1" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Arrow pointing to highlight */}
        <div
          className="absolute w-3 h-3 bg-white shadow-lg rotate-45 pointer-events-none"
          style={arrowStyle()}
        />
      </div>
    </AnimatePresence>
  );
}
