import { useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import useFocusTrap from '../hooks/useFocusTrap';
import useScrollLock from '../hooks/useScrollLock';
import { cx } from '../utils/format';

/** Side sheet used for the bag and for the mobile filter panel. */
export default function Drawer({
  open,
  onClose,
  title,
  side = 'right',
  children,
  footer,
  widthClass = 'max-w-[26rem]',
}) {
  const panelRef = useRef(null);
  const closeRef = useRef(null);
  const titleId = useId();

  useScrollLock(open);
  useFocusTrap(open, panelRef, { initialFocusRef: closeRef, onEscape: onClose });

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[95]">
      <button
        type="button"
        aria-label="Close panel"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in cursor-default bg-ink/40 backdrop-blur-[2px]"
      />
      <aside
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cx(
          'absolute inset-y-0 flex w-full flex-col bg-cream shadow-[0_24px_60px_-28px_rgb(22_19_15/0.28)] outline-none',
          widthClass,
          side === 'right' ? 'right-0 animate-slide-in-right' : 'left-0 animate-slide-in-left'
        )}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-line px-5 py-5 sm:px-6">
          <h2 id={titleId} className="text-[11px] font-normal uppercase tracking-[0.28em] text-ink">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-clay"
          >
            <X size={18} strokeWidth={1.4} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="shrink-0 border-t border-line bg-sand/60">{footer}</div>}
      </aside>
    </div>,
    document.body
  );
}
