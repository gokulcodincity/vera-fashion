import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { WhatsAppIcon } from './icons/SocialIcons';
import { store, whatsappLink } from '../config/store';

/**
 * Floating WhatsApp CTA. The number and the pre-filled message both come
 * from `config/store.js`, so a client swap is a one line change.
 */
export default function WhatsAppButton() {
  const [visible, setVisible] = useState(false);
  const { pathname } = useLocation();
  const hasMobilePurchaseBar = pathname.startsWith('/product/');

  useEffect(() => {
    const timer = window.setTimeout(() => setVisible(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  if (pathname.startsWith('/admin')) return null;

  return (
    <a
      href={whatsappLink()}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`Chat with ${store.storeNamePlain} on WhatsApp`}
      className={[
        'group fixed right-4 z-[80] flex items-center gap-0 overflow-hidden rounded-full bg-[#1f8f5f] text-white',
        'shadow-[0_12px_30px_-10px_rgb(31_143_95/0.65)] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
        hasMobilePurchaseBar
          ? 'bottom-[calc(5.25rem+env(safe-area-inset-bottom))] sm:right-7 lg:bottom-7'
          : 'bottom-5 sm:bottom-7 sm:right-7',
        'hover:bg-[#18784f]',
        visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
      ].join(' ')}
    >
      <span className="flex h-13 w-13 items-center justify-center sm:h-14 sm:w-14">
        <WhatsAppIcon size={26} />
      </span>
      <span className="max-w-0 whitespace-nowrap text-[11px] font-normal uppercase tracking-[0.18em] opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:max-w-[10rem] group-hover:pr-6 group-hover:opacity-100">
        Chat with us
      </span>
    </a>
  );
}
