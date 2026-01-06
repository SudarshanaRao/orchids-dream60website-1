import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';

interface DeviceInfo {
  userAgent: string;
  platform: string;
  screenWidth: number;
  screenHeight: number;
  isMobile: boolean;
  isPWA: boolean;
}

interface PageView {
  page: string;
  path: string;
  enterTime: Date;
  exitTime?: Date;
  duration: number;
  scrollDepth: number;
}

interface Interaction {
  type: 'click' | 'scroll' | 'input' | 'navigation' | 'auction_join' | 'bid' | 'purchase' | 'download' | 'button_click' | 'link_click' | 'form_submit' | 'modal_open' | 'modal_close' | 'tab_switch' | 'other';
  element?: string;
  page?: string;
  path?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL || 'https://dev-api.dream60.com';
const HEARTBEAT_INTERVAL = 10000;
const BATCH_INTERVAL = 15000;

const isPWA = () => {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true ||
    document.referrer.includes('android-app://');
};

export function useUserActivityTracker(userId: string | null, username: string | null) {
  const location = useLocation();
  const sessionIdRef = useRef<string | null>(null);
  const currentPageRef = useRef<{ path: string; enterTime: Date; scrollDepth: number; title: string } | null>(null);
  const pendingPageViews = useRef<PageView[]>([]);
  const pendingInteractions = useRef<Interaction[]>([]);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);
  const batchInterval = useRef<NodeJS.Timeout | null>(null);
  const isInitialized = useRef(false);
  const lastPath = useRef<string>('');
  const currentPathRef = useRef<string>(location.pathname);

  useEffect(() => {
    currentPathRef.current = location.pathname;
  }, [location.pathname]);

  const getDeviceInfo = useCallback((): DeviceInfo => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      isPWA: isPWA(),
    };
  }, []);

  const sendRequest = useCallback(async (endpoint: string, data: Record<string, unknown>) => {
    try {
      const response = await fetch(`${BACKEND_URL}/user-activity${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        keepalive: true,
      });
      return response.ok;
    } catch (error) {
      console.debug('Activity tracking error:', error);
      return false;
    }
  }, []);

  const startSession = useCallback(async () => {
    if (!userId || !username || sessionIdRef.current) return;

    try {
      const response = await fetch(`${BACKEND_URL}/user-activity/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          username,
          deviceInfo: getDeviceInfo(),
        }),
      });
      const data = await response.json();
      if (data.success && data.sessionId) {
        sessionIdRef.current = data.sessionId;
        isInitialized.current = true;
        
        currentPageRef.current = {
          path: currentPathRef.current || '/',
          enterTime: new Date(),
          scrollDepth: 0,
          title: document.title,
        };
        lastPath.current = currentPathRef.current || '/';
      }
    } catch (error) {
      console.debug('Failed to start session:', error);
    }
  }, [userId, username, getDeviceInfo]);

  const sendBatch = useCallback(async () => {
    if (!userId || !sessionIdRef.current) return;
    if (pendingPageViews.current.length === 0 && pendingInteractions.current.length === 0) return;

    await sendRequest('/batch', {
      userId,
      sessionId: sessionIdRef.current,
      pageViews: [...pendingPageViews.current],
      interactions: [...pendingInteractions.current],
    });

    pendingPageViews.current = [];
    pendingInteractions.current = [];
  }, [userId, sendRequest]);

  const sendHeartbeat = useCallback(async () => {
    if (!userId || !sessionIdRef.current) return;

    await sendRequest('/heartbeat', {
      userId,
      sessionId: sessionIdRef.current,
      currentPage: currentPathRef.current,
    });
  }, [userId, sendRequest]);

  const trackPageView = useCallback(() => {
    if (!sessionIdRef.current || !isInitialized.current) return;
    if (currentPathRef.current === lastPath.current) return;

    const prevPath = lastPath.current;

    if (currentPageRef.current) {
      const now = new Date();
      const duration = Math.floor((now.getTime() - currentPageRef.current.enterTime.getTime()) / 1000);
      pendingPageViews.current.push({
        page: currentPageRef.current.title || document.title,
        path: currentPageRef.current.path,
        enterTime: currentPageRef.current.enterTime,
        exitTime: now,
        duration,
        scrollDepth: currentPageRef.current.scrollDepth,
      });
    }

    currentPageRef.current = {
      path: currentPathRef.current,
      enterTime: new Date(),
      scrollDepth: 0,
      title: document.title,
    };
    lastPath.current = currentPathRef.current;

    pendingInteractions.current.push({
      type: 'navigation',
      element: currentPathRef.current,
      page: document.title,
      path: currentPathRef.current,
      timestamp: new Date(),
      metadata: { 
        fromPath: prevPath || '/',
        toPath: currentPathRef.current,
      },
    });
  }, []);

  const trackInteraction = useCallback((
    type: Interaction['type'],
    element?: string,
    metadata?: Record<string, unknown>
  ) => {
    if (!sessionIdRef.current) return;

    pendingInteractions.current.push({
      type,
      element,
      page: document.title,
      path: currentPathRef.current,
      timestamp: new Date(),
      metadata,
    });
  }, []);

  useEffect(() => {
    if (!userId || !username) return;

    startSession();

    heartbeatInterval.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
    batchInterval.current = setInterval(sendBatch, BATCH_INTERVAL);

    const handleScroll = () => {
      if (currentPageRef.current) {
        const scrollPercent = Math.round(
          (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        currentPageRef.current.scrollDepth = Math.max(currentPageRef.current.scrollDepth, scrollPercent || 0);
      }
    };

    const handleBeforeUnload = () => {
      if (userId && sessionIdRef.current) {
        if (currentPageRef.current) {
          const now = new Date();
          const duration = Math.floor((now.getTime() - currentPageRef.current.enterTime.getTime()) / 1000);
          pendingPageViews.current.push({
            page: currentPageRef.current.title || document.title,
            path: currentPageRef.current.path,
            enterTime: currentPageRef.current.enterTime,
            exitTime: now,
            duration,
            scrollDepth: currentPageRef.current.scrollDepth,
          });
          currentPageRef.current = null;
        }

        if (pendingPageViews.current.length > 0 || pendingInteractions.current.length > 0) {
          const batchBlob = new Blob([JSON.stringify({
            userId,
            sessionId: sessionIdRef.current,
            pageViews: pendingPageViews.current,
            interactions: pendingInteractions.current,
          })], { type: 'application/json' });
          navigator.sendBeacon(`${BACKEND_URL}/user-activity/batch`, batchBlob);
        }

        const endBlob = new Blob([JSON.stringify({
          userId,
          sessionId: sessionIdRef.current,
        })], { type: 'application/json' });
        navigator.sendBeacon(`${BACKEND_URL}/user-activity/session/end`, endBlob);
      }
    };

    const handlePageHide = (e: PageTransitionEvent) => {
      if (e.persisted) return;
      handleBeforeUnload();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendBatch();
        if (isPWA()) {
          setTimeout(() => {
            if (document.hidden && userId && sessionIdRef.current) {
              handleBeforeUnload();
            }
          }, 5000);
        }
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (!sessionIdRef.current) return;
      
      const target = e.target as HTMLElement;
      
      if (target.tagName === 'A' || target.closest('a')) {
        const link = (target.tagName === 'A' ? target : target.closest('a')) as HTMLAnchorElement;
        const href = link?.href || '';
        const text = link?.textContent?.trim().substring(0, 100) || link?.getAttribute('aria-label') || 'Link';
        
        if (href.includes('.pdf') || href.includes('/download') || link?.hasAttribute('download')) {
          pendingInteractions.current.push({
            type: 'download',
            element: text,
            page: document.title,
            path: currentPathRef.current,
            timestamp: new Date(),
            metadata: { fileType: href.split('.').pop(), fileName: text, href },
          });
        } else if (href && !href.startsWith('javascript:')) {
          pendingInteractions.current.push({
            type: 'link_click',
            element: text,
            page: document.title,
            path: currentPathRef.current,
            timestamp: new Date(),
            metadata: { href },
          });
        }
        return;
      }
      
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = (target.tagName === 'BUTTON' ? target : target.closest('button')) as HTMLButtonElement;
        const buttonText = button?.textContent?.trim().substring(0, 100) || button?.getAttribute('aria-label') || 'Button';
        
        if (buttonText && buttonText !== '') {
          pendingInteractions.current.push({
            type: 'button_click',
            element: buttonText,
            page: document.title,
            path: currentPathRef.current,
            timestamp: new Date(),
            metadata: { 
              className: button?.className?.substring(0, 200),
              id: button?.id,
            },
          });
        }
        return;
      }

      const downloadAttr = target.getAttribute('download') || target.closest('[download]')?.getAttribute('download');
      if (downloadAttr) {
        pendingInteractions.current.push({
          type: 'download',
          element: downloadAttr,
          page: document.title,
          path: currentPathRef.current,
          timestamp: new Date(),
          metadata: { fileType: 'file', fileName: downloadAttr },
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('click', handleClick, { capture: true });

    return () => {
      if (heartbeatInterval.current) clearInterval(heartbeatInterval.current);
      if (batchInterval.current) clearInterval(batchInterval.current);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('click', handleClick, { capture: true });
    };
  }, [userId, username, startSession, sendHeartbeat, sendBatch]);

  useEffect(() => {
    if (isInitialized.current && location.pathname !== lastPath.current) {
      trackPageView();
    }
  }, [location.pathname, trackPageView]);

  return { trackInteraction };
}
