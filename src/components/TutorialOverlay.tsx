import { useState, useEffect } from 'react';
import { X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetElement: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Optional action when user clicks "Try It"
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
  const [highlightPosition, setHighlightPosition] = useState<DOMRect | null>(null);

  useEffect(() => {
    const shouldTrigger = forceShow || !!startToken;

    if (shouldTrigger) {
      setCurrentStep(0);
      setIsVisible(true);
      requestAnimationFrame(() => updateHighlight());
      return;
    }

    setIsVisible(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tutorialId, startToken, forceShow]);

  useEffect(() => {
    if (isVisible) {
      updateHighlight();
      // Re-calculate position on window resize
      const handleResize = () => updateHighlight();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [currentStep, isVisible]);

  const updateHighlight = () => {
    const step = steps[currentStep];
    if (!step) return;

    const element = document.querySelector(step.targetElement);
    if (element) {
      const rect = element.getBoundingClientRect();
      setHighlightPosition(rect);
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleClose = () => {
    handleComplete();
  };

  const handleComplete = () => {
    localStorage.setItem(`tutorial_completed_${tutorialId}`, 'true');
    setIsVisible(false);
    
    if (onComplete) {
      onComplete();
    }
    
    // Return to specified location
    if (returnTo && window.location.pathname !== `/${returnTo}`) {
      setTimeout(() => {
        window.history.pushState({}, '', `/${returnTo}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 300);
    }
  };

  const handleTryIt = () => {
    const step = steps[currentStep];
    if (step.action) {
      step.action();
    }
    handleNext();
  };

  if (!isVisible || steps.length === 0) return null;

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999]">
        {/* Semi-transparent overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        />

        {/* Highlight cutout for target element */}
        {highlightPosition && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              boxShadow: `0 0 0 9999px rgba(0, 0, 0, 0.6)`,
            }}
          >
            <div
              className="absolute bg-transparent border-4 border-blue-500 rounded-lg animate-pulse"
              style={{
                top: highlightPosition.top - 8,
                left: highlightPosition.left - 8,
                width: highlightPosition.width + 16,
                height: highlightPosition.height + 16,
              }}
            />
          </div>
        )}

        {/* Tutorial card */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="absolute max-w-md bg-white rounded-2xl shadow-2xl pointer-events-auto"
          style={{
            top: highlightPosition
              ? step.position === 'top'
                ? highlightPosition.top - 20
                : step.position === 'bottom'
                ? highlightPosition.bottom + 20
                : '50%'
              : '50%',
            left: highlightPosition
              ? step.position === 'left'
                ? highlightPosition.left - 20
                : step.position === 'right'
                ? highlightPosition.right + 20
                : '50%'
              : '50%',
            transform:
              step.position === 'center' || !highlightPosition
                ? 'translate(-50%, -50%)'
                : step.position === 'top'
                ? 'translate(-50%, -100%)'
                : step.position === 'bottom'
                ? 'translate(-50%, 0)'
                : step.position === 'left'
                ? 'translate(-100%, -50%)'
                : 'translate(0, -50%)',
          }}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>

          {/* Content */}
          <div className="p-6">
            {/* Progress bar */}
            <div className="mb-4">
              <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Step {currentStep + 1} of {steps.length}
              </p>
            </div>

            {/* Title and description */}
            <h3 className="text-xl font-bold text-gray-900 mb-2 pr-8">{step.title}</h3>
            <p className="text-gray-600 mb-6">{step.description}</p>

            {/* Action buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={handleSkip}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-semibold transition-colors"
              >
                Skip Tutorial
              </button>
              <div className="flex items-center gap-2">
                {step.action && (
                  <button
                    onClick={handleTryIt}
                    className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    Try It
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {!step.action && (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2"
                  >
                    {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
