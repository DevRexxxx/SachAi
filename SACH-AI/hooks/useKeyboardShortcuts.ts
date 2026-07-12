import { useEffect, useCallback } from 'react';

export interface ShortcutHandlers {
  onUpload?: () => void;
  onDownload?: () => void;
  onCopy?: () => void;
  onCopyComparison?: () => void;
  onClear?: () => void;
  onHelp?: () => void;
}

export const useKeyboardShortcuts = (handlers: ShortcutHandlers) => {
  const handle = useCallback(
    (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey;

      // Prevent triggering inside text inputs / textareas
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (ctrl && e.key === 'u') {
        e.preventDefault();
        handlers.onUpload?.();
      } else if (ctrl && e.key === 'd') {
        e.preventDefault();
        handlers.onDownload?.();
      } else if (ctrl && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        handlers.onCopyComparison?.();
      } else if (ctrl && e.key === 'c') {
        e.preventDefault();
        handlers.onCopy?.();
      } else if (e.key === 'Escape') {
        handlers.onClear?.();
      } else if (ctrl && e.key === '?') {
        e.preventDefault();
        handlers.onHelp?.();
      }
    },
    [handlers]
  );

  useEffect(() => {
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [handle]);
};
