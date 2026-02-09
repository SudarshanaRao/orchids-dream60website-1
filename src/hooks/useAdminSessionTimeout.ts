import { useState, useEffect, useCallback, useRef } from 'react';

const ADMIN_SESSION_DURATION = 30 * 60 * 1000; // 30 minutes
const SESSION_START_KEY = 'admin_session_start';
const SESSION_ACTIVE_KEY = 'admin_session_active';

interface UseAdminSessionTimeoutOptions {
  adminType: string;
  onSessionTimeout: () => void;
}

export const useAdminSessionTimeout = ({
  adminType,
  onSessionTimeout,
}: UseAdminSessionTimeoutOptions) => {
  const [remainingMs, setRemainingMs] = useState<number>(ADMIN_SESSION_DURATION);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Only ADMIN role has timeout, not SUPER_ADMIN or DEVELOPER
  const isSubjectToTimeout = adminType === 'ADMIN';

  const getSessionStart = useCallback((): number => {
    const stored = localStorage.getItem(SESSION_START_KEY);
    if (stored) return parseInt(stored, 10);
    const now = Date.now();
    localStorage.setItem(SESSION_START_KEY, String(now));
    return now;
  }, []);

  const resetSession = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(SESSION_START_KEY, String(now));
    localStorage.setItem(SESSION_ACTIVE_KEY, 'true');
    setRemainingMs(ADMIN_SESSION_DURATION);
  }, []);

  const clearSession = useCallback(() => {
    localStorage.removeItem(SESSION_START_KEY);
    localStorage.removeItem(SESSION_ACTIVE_KEY);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (!isSubjectToTimeout) return;

    // Mark session as active
    localStorage.setItem(SESSION_ACTIVE_KEY, 'true');

    const sessionStart = getSessionStart();
    const elapsed = Date.now() - sessionStart;
    const remaining = ADMIN_SESSION_DURATION - elapsed;

    if (remaining <= 0) {
      // Session already expired
      clearSession();
      onSessionTimeout();
      return;
    }

    setRemainingMs(remaining);

    // Set main timeout
    timeoutRef.current = setTimeout(() => {
      clearSession();
      onSessionTimeout();
    }, remaining);

    // Update remaining time every second
    intervalRef.current = setInterval(() => {
      const start = parseInt(localStorage.getItem(SESSION_START_KEY) || '0', 10);
      const now = Date.now();
      const left = ADMIN_SESSION_DURATION - (now - start);
      if (left <= 0) {
        clearSession();
        onSessionTimeout();
      } else {
        setRemainingMs(left);
      }
    }, 1000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isSubjectToTimeout, getSessionStart, clearSession, onSessionTimeout]);

  // On tab close, clear the session_active flag (but keep session_start)
  // On tab reopen, App.tsx checks if session_active is missing
  useEffect(() => {
    if (!isSubjectToTimeout) return;

    const handleBeforeUnload = () => {
      // Remove session_active so reopened tab knows it was closed
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
