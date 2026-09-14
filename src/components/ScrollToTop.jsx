import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/**
 * Resets scroll position on navigation, but honours in-page hash links
 * (for example the store locator anchor in the footer).
 */
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    /* Browser Back/Forward should keep its recorded shopping position. */
    if (navigationType === 'POP' && !hash) return;
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search, hash, navigationType]);

  return null;
}
