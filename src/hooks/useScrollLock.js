import { useEffect } from 'react';

let lockCount = 0;

/**
 * Prevents the page behind an overlay from scrolling.
 * Reference counted so nested overlays (drawer + modal) behave correctly.
 */
export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    lockCount += 1;
    document.body.dataset.scrollLocked = 'true';
    return () => {
      lockCount = Math.max(0, lockCount - 1);
      if (lockCount === 0) delete document.body.dataset.scrollLocked;
    };
  }, [active]);
}

export default useScrollLock;
