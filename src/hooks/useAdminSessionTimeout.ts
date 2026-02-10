import { useState, useEffect, useCallback, useRef } from 'react';

const ADMIN_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes of inactivity
const LAST_HIDDEN_KEY = 'admin_tab_hidden_at';

interface UseAdminSessionTimeoutOptions {
  adminType: string;
  onSessionTimeout: () => void;
}

export const useAdminSessionTimeout = ({
  adminType,
  onSessionTimeout,
}: UseAdminSessionTimeoutOptions) => {
  const [remainingMs, setRemainingMs] = useState<number>(ADMIN_SESSION_DURATION);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const onSessionTimeoutRef = useRef(onSessionTimeout);
  onSessionTimeoutRef.current = onSessionTimeout;

  // Only ADMIN role has timeout, not SUPER_ADMIN or DEVELOPER
  const isSubjectToTimeout = adminType === 'ADMIN';

  const stopTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTimer = useCallback((fromMs: number) => {
    stopTimer();
    let remaining = fromMs;
    setRemainingMs(remaining);

    intervalRef.current = setInterval(() => {
      remaining -= 1000;
      if (remaining <= 0) {
        stopTimer();
        localStorage.removeItem(LAST_HIDDEN_KEY);
        onSessionTimeoutRef.current();
      } else {
        setRemainingMs(remaining);
      }
    }, 1000);
  }, [stopTimer]);

  const resetSession = useCallback(() => {
    stopTimer();
    localStorage.removeItem(LAST_HIDDEN_KEY);
    setRemainingMs(ADMIN_SESSION_DURATION);
  }, [stopTimer]);

  const clearSession = useCallback(() => {
    stopTimer();
    localStorage.removeItem(LAST_HIDDEN_KEY);
  }, [stopTimer]);

  useEffect(() => {
    if (!isSubjectToTimeout) return;

    // When tab becomes hidden, record the time and start counting down
    // When tab becomes visible, check elapsed time and reset if still valid
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Tab went inactive - record timestamp and start timer
        localStorage.setItem(LAST_HIDDEN_KEY, String(Date.now()));
        startTimer(ADMIN_SESSION_DURATION);
      } else {
        // Tab came back - check how long it was inactive
        const hiddenAt = parseInt(localStorage.getItem(LAST_HIDDEN_KEY) || '0', 10);
        if (hiddenAt > 0) {
          const elapsed = Date.now() - hiddenAt;
          if (elapsed >= ADMIN_SESSION_DURATION) {
            // Session expired while away
            stopTimer();
            localStorage.removeItem(LAST_HIDDEN_KEY);
            onSessionTimeoutRef.current();
            return;
          }
        }
        // Still valid - stop the timer, reset to full
        stopTimer();
        localStorage.removeItem(LAST_HIDDEN_KEY);
        setRemainingMs(ADMIN_SESSION_DURATION);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // On mount, check if tab is already hidden (e.g., opened in background)
    if (document.visibilityState === 'hidden') {
      localStorage.setItem(LAST_HIDDEN_KEY, String(Date.now()));
      startTimer(ADMIN_SESSION_DURATION);
    } else {
      // Tab is active - no timer needed
      stopTimer();
      localStorage.removeItem(LAST_HIDDEN_KEY);
      setRemainingMs(ADMIN_SESSION_DURATION);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopTimer();
    };
  }, [isSubjectToTimeout, startTimer, stopTimer]);

  return {
    remainingMs,
    isSubjectToTimeout,
    resetSession,
    clearSession,
    formatTime: (ms: number) => {
      const totalSeconds = Math.max(0, Math.floor(ms / 1000));
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    },
  };
};
