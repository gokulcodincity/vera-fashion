import { createPortal } from 'react-dom';
import { CircleCheckBig, Heart, Info, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const TONE_ICON = {
  default: CircleCheckBig,
  success: CircleCheckBig,
  wishlist: Heart,
  info: Info,
};

/** Bottom-left toast stack. Sits away from the WhatsApp button on the right. */
export default function ToastHost() {
  const { toasts, dismiss } = useToast();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-5 left-4 z-[110] flex w-[min(21rem,calc(100vw-2rem))] flex-col gap-2 sm:bottom-6 sm:left-6"
    >
      {toasts.map((toast) => {
        const Icon = TONE_ICON[toast.tone] || TONE_ICON.default;
        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex animate-fade-up items-start gap-3 border border-ink/10 bg-ink px-4 py-3.5 text-cream shadow-[0_18px_40px_-20px_rgb(22_19_15/0.5)]"
          >
            <Icon
              size={16}
              strokeWidth={1.5}
              className={toast.tone === 'wishlist' ? 'mt-px shrink-0 fill-clay text-clay' : 'mt-px shrink-0 text-clay'}
            />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-normal uppercase tracking-[0.18em]">{toast.message}</p>
              {toast.description && (
                <p className="mt-1 truncate text-xs text-cream/65">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss notification"
              className="-mr-1 -mt-1 shrink-0 p-1 text-cream/55 transition-colors hover:text-cream"
            >
              <X size={14} strokeWidth={1.5} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
