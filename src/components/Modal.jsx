import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import useFocusTrap from '../hooks/useFocusTrap';
import useScrollLock from '../hooks/useScrollLock';
import { cx } from '../utils/format';

/** Centred modal dialog with Escape, focus containment and focus restoration. */
export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  hideClose = false,
}) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const titleId = useId();

  useScrollLock(open);
  useFocusTrap(open, panelRef, { initialFocusRef: hideClose ? undefined : closeRef, onEscape: onClose });

  if (!open) return null;

  const widths = {
    sm: 'max-w-md',
    md: 'max-w-xl',
    lg: 'max-w-3xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-ink/45 backdrop-blur-[2px]"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={title ? undefined : 'Dialog'}
        className={cx(
          'relative z-10 max-h-[92vh] w-full overflow-y-auto bg-cream shadow-[0_24px_60px_-28px_rgb(22_19_15/0.28)] outline-none',
          'animate-scale-in',
          widths[size] || widths.md
        )}
      >
        {!hideClose && (
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-clay"
          >
            <X size={18} strokeWidth={1.4} />
          </button>
        )}
        <div className="px-6 py-10 sm:px-10">
          {title && <h2 id={titleId} className="text-3xl sm:text-4xl">{title}</h2>}
          {description && <p className="mt-3 text-sm leading-relaxed text-slate">{description}</p>}
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
