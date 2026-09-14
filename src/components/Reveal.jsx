import { useEffect, useRef, useState } from 'react';
import { cx } from '../utils/format';

/**
 * Reveals children with a short fade-and-rise the first time they scroll
 * into view. Falls back to visible immediately when IntersectionObserver
 * is unavailable or motion is reduced.
 */
export default function Reveal({ children, delay = 0, className, as: Tag = 'div' }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (!node || reduceMotion || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      style={visible && delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cx(
        'transition-[opacity,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-[opacity,transform]',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0',
        className
      )}
    >
      {children}
    </Tag>
  );
}
