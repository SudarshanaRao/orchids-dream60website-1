export function initSecurityMeasures() {
  disableDevTools();
  disableTextSelection();
  disableInspectShortcuts();
  detectDevToolsExtensions();
}

function disableDevTools() {
  const disableContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    return false;
  };

  document.addEventListener('contextmenu', disableContextMenu);

  const showBlockedMessage = () => {
    document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;background:linear-gradient(135deg, #53317B 0%, #6B3FA0 50%, #8456BC 100%);"><div style="text-align:center;color:white;"><h1 style="font-size:2rem;margin-bottom:1rem;">Access Denied</h1><p style="opacity:0.9;">Developer tools are not allowed on this website.</p><p style="opacity:0.7;margin-top:1rem;">Please close DevTools and refresh the page.</p></div></div>';
  };

  const detectDevTools = () => {
    const widthThreshold = window.outerWidth - window.innerWidth > 160;
    const heightThreshold = window.outerHeight - window.innerHeight > 160;
    
    if (widthThreshold || heightThreshold) {
      showBlockedMessage();
    }
  };

  setInterval(detectDevTools, 1000);

  (function() {
    const devtools = { open: false, orientation: '' };
    const threshold = 160;
    
    const emitEvent = (isOpen: boolean, orientation: string) => {
      if (isOpen) {
        showBlockedMessage();
      }
    };

    setInterval(() => {
      const widthThreshold = window.outerWidth - window.innerWidth > threshold;
      const heightThreshold = window.outerHeight - window.innerHeight > threshold;
      const orientation = widthThreshold ? 'vertical' : 'horizontal';

      if (!(heightThreshold && widthThreshold) && (widthThreshold || heightThreshold)) {
        if (!devtools.open || devtools.orientation !== orientation) {
          emitEvent(true, orientation);
        }
        devtools.open = true;
        devtools.orientation = orientation;
      } else {
        if (devtools.open) {
          emitEvent(false, '');
        }
        devtools.open = false;
        devtools.orientation = '';
      }
    }, 500);
  })();
}

function disableTextSelection() {
  const style = document.createElement('style');
  style.textContent = `
    body {
      -webkit-user-select: none;
      -moz-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
    input, textarea {
      -webkit-user-select: text;
      -moz-user-select: text;
      -ms-user-select: text;
      user-select: text;
    }
  `;
  document.head.appendChild(style);
}

function disableInspectShortcuts() {
  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'F12') {
      e.preventDefault();
      return false;
    }

    if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
      e.preventDefault();
      return false;
    }

    if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
      e.preventDefault();
      return false;
    }

    if (e.ctrlKey && (e.key === 'S' || e.key === 's')) {
      e.preventDefault();
      return false;
    }

    if (e.ctrlKey && (e.key === 'P' || e.key === 'p')) {
      e.preventDefault();
      return false;
    }
  });

  document.addEventListener('keypress', (e: KeyboardEvent) => {
    if (e.key === 'F12' || (e.ctrlKey && (e.key === 'u' || e.key === 'U'))) {
      e.preventDefault();
      return false;
    }
  });
}

function detectDevToolsExtensions() {
  const checkForExtensions = () => {
    if (typeof (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined') {
      const hook = (window as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.isDisabled !== true) {
        hook.inject = function() {};
        hook.onCommitFiberRoot = function() {};
        hook.onCommitFiberUnmount = function() {};
      }
    }
  };

  checkForExtensions();
  setInterval(checkForExtensions, 2000);

  const toString = Function.prototype.toString;
  Function.prototype.toString = function() {
    if (this === Function.prototype.toString) {
      return 'function toString() { [native code] }';
    }
    return toString.call(this);
  };
}

export function obfuscateData(data: any): string {
  try {
    const jsonStr = JSON.stringify(data);
    return btoa(encodeURIComponent(jsonStr));
  } catch {
    return '';
  }
}

export function deobfuscateData<T>(encoded: string): T | null {
  try {
    const jsonStr = decodeURIComponent(atob(encoded));
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}