import { useEffect, useRef, useState } from 'react';
import { cx } from '../utils/format';

/**
 * Image with a fade-in, a shimmer placeholder and a graceful fallback.
 * `alt` is required so every image on the site stays accessible.
 */
export default function SmartImage({
  src,
  alt,
  className,
  wrapperClassName,
  ratio = 'aspect-[3/4]',
  loading = 'lazy',
  priority = false,
  sizes,
}) {
  const [status, setStatus] = useState('loading');
  const imageRef = useRef(null);

  /**
   * Cached images can finish loading before React attaches the normal `onLoad`
   * handler. Read the native image state after each source update so a cached
   * product image never gets reset to transparent after it has already loaded.
   */
  useEffect(() => {
    const image = imageRef.current;
    if (!image) return;

    if (!image.complete) {
      setStatus('loading');
      return;
    }

    setStatus(image.naturalWidth > 0 ? 'loaded' : 'error');
  }, [src]);

  return (
    <div className={cx('relative overflow-hidden bg-sand', ratio, wrapperClassName)}>
      {status === 'loading' && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-sand via-shell to-sand" />
      )}

      {status === 'error' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-sand text-muted">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-7 w-7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
          >
            <path d="M4 5h16v14H4z" />
            <path d="M4 15l5-5 4 4 3-3 4 4" />
          </svg>
          <span className="text-[10px] uppercase tracking-[0.2em]">Image unavailable</span>
        </div>
      )}

      <img
        ref={imageRef}
        src={src}
        alt={alt}
        sizes={sizes}
        loading={priority ? 'eager' : loading}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        className={cx(
          'h-full w-full object-cover transition-opacity duration-700',
          status === 'loaded' ? 'opacity-100' : 'opacity-0',
          className
        )}
      />
    </div>
  );
}
