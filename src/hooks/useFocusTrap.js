import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const isVisible = (element) => !element.hidden && element.getClientRects().length > 0;

/** Keeps keyboard focus inside an open dialog and returns it to its trigger on close. */
export default function useFocusTrap(active, panelRef, { initialFocusRef, onEscape } = {}) {
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    previouslyFocused.current = document.activeElement;
    const timer = window.setTimeout(() => {
      const initial = initialFocusRef?.current;
      if (initial && isVisible(initial)) {
        initial.focus();
      } else {
        panelRef.current?.focus();
      }
    }, 20);

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscape?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const panel = panelRef.current;
      if (!panel) return;
      const focusable = [...panel.querySelectorAll(FOCUSABLE)].filter(isVisible);
      if (focusable.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;
      if (event.shiftKey && (current === first || !panel.contains(current))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (current === last || !panel.contains(current))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKeyDown);
      const previous = previouslyFocused.current;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [active, initialFocusRef, onEscape, panelRef]);
}
