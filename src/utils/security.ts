export function initSecurityMeasures() {
  disableInspectShortcuts();
}

function disableDevTools() {
  const disableContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    return false;
  };

  document.addEventListener('contextmenu', disableContextMenu);
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