import { useState } from 'react';
import { ArrowRight, CircleCheckBig } from 'lucide-react';
import { store } from '../config/store';
import { useToast } from '../context/ToastContext';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Newsletter capture used in the footer. Validates locally, no backend. */
export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const { toast } = useToast();

  const submit = (event) => {
    event.preventDefault();
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Enter a valid email address so we can reach you.');
      return;
    }
    setError('');
    setDone(true);
    toast('You are on the list', { description: 'Look out for our next collection drop.' });
  };

  return (
    <section className="shell py-16 lg:py-20" aria-labelledby="newsletter-heading">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-cream/45">Newsletter</p>
          <h2 id="newsletter-heading" className="mt-4 text-[2.2rem] leading-[1.1] text-cream sm:text-[2.8rem]">
            Stay in Style.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-cream/60">
            {store.newsletterOffer}
          </p>
        </div>

        <div>
          {done ? (
            <div className="flex items-start gap-3.5 border border-cream/20 bg-cream/5 px-6 py-7">
              <CircleCheckBig size={20} strokeWidth={1.3} className="mt-0.5 shrink-0 text-clay" />
              <div>
                <p className="font-display text-xl text-cream">Welcome to {store.storeName}.</p>
                <p className="mt-1.5 text-sm text-cream/60">
                  We have added {email.trim()} to the list. Your first look lands soon.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="flex-1">
                  <label htmlFor="newsletter-email" className="sr-only">
                    Email address
                  </label>
                  <input
                    id="newsletter-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (error) setError('');
                    }}
                    placeholder="your@email.com"
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? 'newsletter-error' : undefined}
                    className="w-full border border-cream/25 bg-transparent px-4 py-4 text-sm text-cream outline-none transition-colors placeholder:text-cream/35 hover:border-cream/45 focus:border-cream"
                  />
                </div>
                <button
                  type="submit"
                  className="group inline-flex items-center justify-center gap-2.5 bg-cream px-8 py-4 text-[11px] font-normal uppercase tracking-[0.22em] text-ink transition-colors duration-300 hover:bg-clay hover:text-cream"
                >
                  Join us
                  <ArrowRight
                    size={14}
                    strokeWidth={1.5}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </button>
              </div>
              {error ? (
                <p id="newsletter-error" role="alert" className="mt-3 text-xs text-clay">
                  {error}
                </p>
              ) : (
                <p className="mt-3 text-xs text-cream/40">
                  No spam. Unsubscribe whenever you like.
                </p>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
