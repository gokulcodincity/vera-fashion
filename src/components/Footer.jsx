import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import Newsletter from './Newsletter';
import { InstagramIcon, FacebookIcon, WhatsAppIcon } from './icons/SocialIcons';
import { store, formattedAddress, whatsappLink, telLink, mailtoLink } from '../config/store';

const COLUMNS = [
  {
    title: store.storeName,
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Store locator', to: '/contact#stores' },
      { label: 'FAQs', to: '/info/faqs' },
    ],
  },
  {
    title: 'Shop',
    links: [
      { label: 'Women', to: '/shop?gender=Women' },
      { label: 'Men', to: '/shop?gender=Men' },
      { label: 'New Arrivals', to: '/shop?tag=new' },
      { label: 'Best Sellers', to: '/shop?tag=bestseller' },
      { label: 'Sale', to: '/shop?tag=sale' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Shipping', to: '/info/shipping' },
      { label: 'Returns', to: '/info/returns' },
      { label: 'Size Guide', to: '/info/size-guide' },
      { label: 'Privacy Policy', to: '/info/privacy' },
      { label: 'Terms', to: '/info/terms' },
    ],
  },
];

const SOCIALS = [
  { label: 'Instagram', href: store.instagram, Icon: InstagramIcon },
  { label: 'Facebook', href: store.facebook, Icon: FacebookIcon },
  { label: 'WhatsApp', href: whatsappLink(), Icon: WhatsAppIcon },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-ink text-cream">
      <Newsletter />

      <div className="shell grid gap-12 border-t border-cream/10 py-16 sm:grid-cols-2 lg:grid-cols-5 lg:gap-10 lg:py-20">
        {/* Brand block */}
        <div className="sm:col-span-2 lg:col-span-2">
          <span
            className="block font-sans text-xl font-medium text-cream"
            style={{ letterSpacing: '0.3em' }}
          >
            {store.storeName}
          </span>
          <p className="mt-5 max-w-xs font-display text-xl leading-snug text-cream/80">
            {store.tagline}
          </p>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-cream/55">
            An independent fashion label since {store.established}, designing considered clothing for
            everyday life.
          </p>

          <ul className="mt-7 space-y-3 text-sm text-cream/70">
            <li className="flex gap-3">
              <MapPin size={15} strokeWidth={1.4} className="mt-0.5 shrink-0 text-clay" />
              <span>{formattedAddress}</span>
            </li>
            <li className="flex gap-3">
              <Phone size={15} strokeWidth={1.4} className="mt-0.5 shrink-0 text-clay" />
              <a href={telLink} className="transition-colors hover:text-cream">
                {store.phone}
              </a>
            </li>
            <li className="flex gap-3">
              <Mail size={15} strokeWidth={1.4} className="mt-0.5 shrink-0 text-clay" />
              <a href={mailtoLink} className="transition-colors hover:text-cream">
                {store.email}
              </a>
            </li>
          </ul>
        </div>

        {/* Link columns */}
        {COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <h3 className="font-sans text-[10px] font-normal uppercase tracking-[0.24em] text-cream/50">
              {column.title}
            </h3>
            <ul className="mt-5 space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="text-sm text-cream/75 transition-colors hover:text-cream"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      {/* Social + legal */}
      <div className="shell flex flex-col gap-6 border-t border-cream/10 py-7 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          {SOCIALS.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer noopener"
              aria-label={`${store.storeNamePlain} on ${label}`}
              className="flex h-10 w-10 items-center justify-center border border-cream/20 text-cream/70 transition-colors hover:border-cream hover:text-cream"
            >
              <Icon size={17} />
            </a>
          ))}
        </div>

        <div className="flex flex-col gap-1 text-xs text-cream/45 sm:items-end">
          <p>
            {'\u00A9'} {year} {store.storeNamePlain} Fashion. All rights reserved.
          </p>
          <p>Demonstration storefront. Prices and stock are illustrative.</p>
        </div>
      </div>
    </footer>
  );
}
