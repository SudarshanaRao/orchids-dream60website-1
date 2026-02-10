import { useState, useEffect, useCallback, useRef } from 'react';

const ADMIN_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes of inactivity
const SESSION_START_KEY = 'admin_session_start';
const SESSION_ACTIVE_KEY = 'admin_session_active';
const LAST_ACTIVITY_KEY = 'admin_last_activity';

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

  const updateLastActivity = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(LAST_ACTIVITY_KEY, String(now));
    localStorage.setItem(SESSION_START_KEY, String(now));
    localStorage.setItem(SESSION_ACTIVE_KEY, 'true');
    setRemainingMs(ADMIN_SESSION_DURATION);
  }, []);

  const resetSession = useCallback(() => {
    updateLastActivity();
  }, [updateLastActivity]);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_START_KEY);
    localStorage.removeItem(SESSION_ACTIVE_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!isSubjectToTimeout) return;

    // Initialize activity timestamp
    updateLastActivity();

    // Track user activity events - reset inactivity timer on any interaction
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    let throttleTimer: ReturnType<typeof setTimeout> | null = null;

    const handleActivity = () => {
      // Throttle to once per 5 seconds to avoid excessive localStorage writes
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
      }, 5000);
      updateLastActivity();
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    // Reset timer when tab becomes visible again
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Check if session expired while tab was hidden
        const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
        const elapsed = Date.now() - lastActivity;
        if (elapsed >= ADMIN_SESSION_DURATION) {
          clearSession();
          onSessionTimeoutRef.current();
        } else {
          // Tab is active again - reset the timer fresh
          updateLastActivity();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Check remaining time every second
    intervalRef.current = setInterval(() => {
      const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
      const elapsed = Date.now() - lastActivity;
      const left = ADMIN_SESSION_DURATION - elapsed;
      if (left <= 0) {
        clearSession();
        onSessionTimeoutRef.current();
      } else {
        setRemainingMs(left);
      }
    }, 1000);

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [isSubjectToTimeout, updateLastActivity, clearSession]);

  // On tab close, clear the session_active flag
  useEffect(() => {
    if (!isSubjectToTimeout) return;

    const handleBeforeUnload = () => {
      localStorage.removeItem(SESSION_ACTIVE_KEY);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isSubjectToTimeout]);

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
