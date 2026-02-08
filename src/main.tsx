import React from 'react';
import { createRoot } from 'react-dom/client';
import App from "./App.tsx";
import './styles/globals.css';
import { Toaster } from 'sonner';
import { BrowserRouter } from 'react-router-dom';
import { initSecurityMeasures } from './utils/security';
import { UpdateNotification } from './components/UpdateNotification';

initSecurityMeasures();

// State for update notification
let showUpdateNotification: ((show: boolean, worker?: ServiceWorker) => void) | null = null;
let pendingWorker: ServiceWorker | null = null;

// Register service worker with update detection
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Clear any stale API caches on every app load
    if ('caches' in window) {
      caches.keys().then((names) => {
        names.forEach((name) => {
          if (name.includes('-api-') || name === 'dream60-v2') {
            caches.delete(name);
            console.log('[Cache] Cleared stale cache:', name);
          }
        });
      });
    }

    // Unregister old sw.js if present
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        if (reg.active && reg.active.scriptURL.includes('sw.js') && !reg.active.scriptURL.includes('service-worker.js')) {
          reg.unregister();
          console.log('[SW] Unregistered old sw.js');
        }
      }
    });

    navigator.serviceWorker.register('/service-worker.js')
      .then((registration) => {
        console.log('✅ [SW] Service Worker registered:', registration);
        
        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60000);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker available - show custom notification
                console.log('🔄 [SW] New version available!');
                pendingWorker = newWorker;
                if (showUpdateNotification) {
                  showUpdateNotification(true, newWorker);
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('❌ [SW] Service Worker registration failed:', error);
      });
  });
}

if (typeof window !== "undefined") {
  const sendToParent = (data: any) => {
    try {
      if (window.parent && window.parent !== window) {
        window.parent.postMessage(data, "*");
      }
    } catch {}
  };

  window.addEventListener("error", (event) => {
    console.log("[Runtime Error]", {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
    });

    // Send structured payload to parent iframe
    sendToParent({
      type: "ERROR_CAPTURED",
      error: {
        message: event.message,
        stack: event.error?.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: "window.onerror",
      },
      timestamp: Date.now(),
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.log("[Unhandled Promise Rejection]", event.reason);

    const reason: any = event.reason;
    const message =
      typeof reason === "object" && reason?.message
        ? String(reason.message)
        : String(reason);
    const stack = typeof reason === "object" ? reason?.stack : undefined;

    // Mirror to parent iframe as well
    sendToParent({
      type: "ERROR_CAPTURED",
      error: {
        message,
        stack,
        filename: undefined,
        lineno: undefined,
        colno: undefined,
        source: "unhandledrejection",
      },
      timestamp: Date.now(),
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);