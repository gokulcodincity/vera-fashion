import { useState } from 'react';
import { Clock, Mail, MapPin, Navigation, Phone, Send } from 'lucide-react';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import { WhatsAppIcon } from '../components/icons/SocialIcons';
import { storeLocations } from '../data/stores';
import { useToast } from '../context/ToastContext';
import {
  store,
  formattedAddress,
  whatsappLink,
  telLink,
  mailtoLink,
} from '../config/store';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const INITIAL = { name: '', email: '', phone: '', message: '' };

export default function Contact() {
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const update = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const submit = (event) => {
    event.preventDefault();
    const next = {};
    if (form.name.trim().length < 2) next.name = 'Please tell us your name.';
    if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '')))
      next.phone = 'Enter a valid 10 digit mobile number, or leave it blank.';
    if (form.message.trim().length < 10) next.message = 'A little more detail helps us help you.';

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSent(true);
    toast('Message sent', { description: 'Our team replies within one working day.' });
  };

  return (
    <>
      <PageMeta
        title="Contact"
        description={`Visit the ${store.storeNamePlain} flagship store in ${store.address.city}, call ${store.phone} or send us a message. We reply within one working day.`}
      />

      <div className="shell pt-8">
        <Breadcrumbs items={[{ label: 'Home', to: '/' }, { label: 'Contact' }]} />
      </div>

      {/* Header */}
      <div className="shell pb-12 pt-7">
        <p className="eyebrow">Get in touch</p>
        <h1 className="mt-5 max-w-2xl text-[2.6rem] leading-[1.02] sm:text-[3.4rem]">
          We are here, and we actually reply.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-slate">
          Questions on sizing, fabric, an order or a bulk enquiry? Message us on WhatsApp for the
          fastest answer, or use the form below.
        </p>
      </div>

      {/* Quick actions */}
      <div className="shell">
        <div className="grid gap-3 sm:grid-cols-3">
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noreferrer noopener"
            className="group flex items-center gap-4 border border-line bg-white p-5 transition-colors hover:border-ink"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-[#1f8f5f]/10 text-[#1f8f5f]">
              <WhatsAppIcon size={20} />
            </span>
            <span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-muted">
                WhatsApp
              </span>
              <span className="mt-1 block text-sm text-ink">Chat with a stylist</span>
            </span>
          </a>

          <a
            href={telLink}
            className="group flex items-center gap-4 border border-line bg-white p-5 transition-colors hover:border-ink"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-clay/10 text-clay">
              <Phone size={19} strokeWidth={1.4} />
            </span>
            <span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-muted">Call</span>
              <span className="mt-1 block text-sm text-ink">{store.phone}</span>
            </span>
          </a>

          <a
            href={mailtoLink}
            className="group flex items-center gap-4 border border-line bg-white p-5 transition-colors hover:border-ink"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-ink/5 text-ink">
              <Mail size={19} strokeWidth={1.4} />
            </span>
            <span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-muted">Email</span>
              <span className="mt-1 block truncate text-sm text-ink">{store.email}</span>
            </span>
          </a>
        </div>
      </div>

      {/* Form + details */}
      <div className="shell py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:gap-20">
          {/* Form */}
          <section aria-labelledby="form-heading">
            <h2 id="form-heading" className="text-[11px] uppercase tracking-[0.24em] text-ink">
              Send a message
            </h2>

            {sent ? (
              <div className="mt-6 animate-fade-up border border-line bg-white px-6 py-10 text-center">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-clay/10 text-clay">
                  <Send size={22} strokeWidth={1.3} />
                </span>
                <h3 className="mt-6 text-2xl">Thank you, {form.name.trim().split(' ')[0]}.</h3>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate">
                  Your message is with our team. We reply to everything within one working day, and
                  usually much sooner.
                </p>
                <div className="mt-7 flex flex-wrap justify-center gap-3">
                  <Button to="/shop">Continue shopping</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setForm(INITIAL);
                      setSent(false);
                    }}
                  >
                    Send another
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={submit} noValidate className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-slate"
                    >
                      Name
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      value={form.name}
                      onChange={update}
                      aria-invalid={Boolean(errors.name)}
                      className="field"
                      placeholder="Your name"
                      autoComplete="name"
                    />
                    {errors.name && (
                      <p role="alert" className="mt-1.5 text-xs text-clay">
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="contact-email"
                      className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-slate"
                    >
                      Email
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={update}
                      aria-invalid={Boolean(errors.email)}
                      className="field"
                      placeholder="you@email.com"
                      autoComplete="email"
                    />
                    {errors.email && (
                      <p role="alert" className="mt-1.5 text-xs text-clay">
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-phone"
                    className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-slate"
                  >
                    Phone (optional)
                  </label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    value={form.phone}
                    onChange={update}
                    aria-invalid={Boolean(errors.phone)}
                    className="field"
                    placeholder="98765 43210"
                    inputMode="numeric"
                    maxLength={10}
                    autoComplete="tel"
                  />
                  {errors.phone && (
                    <p role="alert" className="mt-1.5 text-xs text-clay">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-slate"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    value={form.message}
                    onChange={update}
                    aria-invalid={Boolean(errors.message)}
                    className="field resize-none"
                    placeholder="Tell us what you are looking for"
                  />
                  {errors.message && (
                    <p role="alert" className="mt-1.5 text-xs text-clay">
                      {errors.message}
                    </p>
                  )}
                </div>

                <Button type="submit" size="lg" className="mt-2">
                  Send Message
                  <Send size={14} strokeWidth={1.5} />
                </Button>

                <p className="text-xs text-muted">
                  Demo form. Your details stay in the browser and are not transmitted anywhere.
                </p>
              </form>
            )}
          </section>

          {/* Details */}
          <section aria-labelledby="details-heading" className="lg:pl-4">
            <h2 id="details-heading" className="text-[11px] uppercase tracking-[0.24em] text-ink">
              Flagship store
            </h2>

            <ul className="mt-6 space-y-5 text-sm">
              <li className="flex gap-4">
                <MapPin size={17} strokeWidth={1.4} className="mt-0.5 shrink-0 text-clay" />
                <span>
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
                    Address
                  </span>
                  <address className="mt-1.5 not-italic leading-relaxed text-slate">
                    {formattedAddress}
                  </address>
                  <a
                    href={store.mapsUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-ink underline-offset-4 hover:underline"
                  >
                    <Navigation size={12} strokeWidth={1.5} />
                    Get directions
                  </a>
                </span>
              </li>

              <li className="flex gap-4">
                <Clock size={17} strokeWidth={1.4} className="mt-0.5 shrink-0 text-clay" />
                <span>
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
                    Opening hours
                  </span>
                  <dl className="mt-1.5 space-y-1 text-slate">
                    {store.openingHours.map((entry) => (
                      <div key={entry.days} className="flex flex-wrap gap-x-3">
                        <dt className="min-w-36">{entry.days}</dt>
                        <dd className="text-ink">{entry.hours}</dd>
                      </div>
                    ))}
                  </dl>
                </span>
              </li>

              <li className="flex gap-4">
                <Phone size={17} strokeWidth={1.4} className="mt-0.5 shrink-0 text-clay" />
                <span>
                  <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">
                    Phone and email
                  </span>
                  <span className="mt-1.5 block text-slate">
                    <a href={telLink} className="hover:text-ink">
                      {store.phone}
                    </a>
                  </span>
                  <span className="block text-slate">
                    <a href={mailtoLink} className="hover:text-ink">
                      {store.email}
                    </a>
                  </span>
                  <span className="block text-slate">
                    <a href={`mailto:${store.supportEmail}`} className="hover:text-ink">
                      {store.supportEmail}
                    </a>{' '}
                    <span className="text-muted">(order support)</span>
                  </span>
                </span>
              </li>
            </ul>

            <div className="mt-8 border border-line bg-sand/40 p-5">
              <p className="text-[10px] uppercase tracking-[0.18em] text-ink">
                Wholesale and styling
              </p>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                For bulk orders, wedding styling or press enquiries, WhatsApp us and we will set up a
                call within a day.
              </p>
              <Button
                href={whatsappLink(
                  `Hi ${store.storeNamePlain}, I would like to discuss a bulk or styling enquiry.`
                )}
                target="_blank"
                rel="noreferrer noopener"
                variant="outline"
                size="sm"
                className="mt-4"
              >
                Start a WhatsApp chat
              </Button>
            </div>
          </section>
        </div>
      </div>

      {/* Store locator */}
      <section id="stores" className="scroll-mt-28 border-t border-line bg-sand/40">
        <div className="shell py-16 lg:py-20">
          <p className="eyebrow">Store locator</p>
          <h2 className="mt-4 text-[2rem] sm:text-[2.5rem]">Find us in person</h2>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-slate">
            Three stores, the same collection, and complimentary alterations at every one.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {storeLocations.map((location) => (
              <div
                key={location.name}
                className="flex flex-col border border-line bg-white p-6 transition-colors hover:border-ink/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-2xl text-ink">{location.city}</h3>
                  {location.isFlagship && (
                    <span className="bg-ink px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-cream">
                      Flagship
                    </span>
                  )}
                </div>
                <address className="mt-3 flex-1 not-italic text-sm leading-relaxed text-slate">
                  {location.address}
                </address>
                <p className="mt-4 text-xs text-muted">{location.hours}</p>
                <p className="mt-1 text-xs text-slate">{location.phone}</p>
                <a
                  href={location.mapsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-ink underline-offset-4 transition-colors hover:text-clay hover:underline"
                >
                  <Navigation size={12} strokeWidth={1.5} />
                  Directions
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
