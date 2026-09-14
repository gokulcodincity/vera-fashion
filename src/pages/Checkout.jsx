import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Banknote,
  CircleCheckBig,
  ChevronDown,
  CreditCard,
  Lock,
  ShoppingBag,
  Smartphone,
  Truck,
} from 'lucide-react';
import PageMeta from '../components/PageMeta';
import Breadcrumbs from '../components/Breadcrumbs';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import { useCart } from '../context/CartContext';
import { store, whatsappLink } from '../config/store';
import { isSupabaseConfigured } from '../lib/supabase';
import { createOrder } from '../services/orders';
import { userMessage } from '../services/errors';
import { formatPrice, generateOrderId, deliveryWindow, pluralise, cx } from '../utils/format';

const PAYMENT_METHODS = [
  {
    id: 'cod',
    label: 'Cash on Delivery',
    Icon: Banknote,
    note: `Pay when it arrives. Handling fee ${formatPrice(store.codFee)}.`,
  },
  {
    id: 'upi',
    label: 'UPI',
    Icon: Smartphone,
    note: 'GPay, PhonePe, Paytm or any UPI app.',
  },
  {
    id: 'card',
    label: 'Credit / Debit Card',
    Icon: CreditCard,
    note: 'Visa, Mastercard, RuPay and Amex.',
  },
];

const INITIAL_FORM = {
  fullName: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  upiId: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvv: '',
  notes: '',
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Field({ label, name, value, onChange, error, type = 'text', ...rest }) {
  const id = `field-${name}`;
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-slate">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className="field"
        {...rest}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-clay">
          {error}
        </p>
      )}
    </div>
  );
}

export default function Checkout() {
  const { items, totalItems, subtotal, savings, delivery, total, clearCart, isEmpty } = useCart();
  const [form, setForm] = useState(INITIAL_FORM);
  const [payment, setPayment] = useState('cod');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [submissionError, setSubmissionError] = useState('');

  const codFee = payment === 'cod' ? store.codFee : 0;
  const grandTotal = total + codFee;

  const summaryLines = useMemo(
    () =>
      items.map((line) => ({
        key: line.key,
        name: line.product.name,
        image: line.product.images[0],
        meta: `${line.size} / ${line.color} / Qty ${line.quantity}`,
        amount: line.lineTotal,
      })),
    [items]
  );

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

  const validate = () => {
    const next = {};
    if (form.fullName.trim().length < 3) next.fullName = 'Enter your full name.';
    if (!EMAIL_PATTERN.test(form.email.trim())) next.email = 'Enter a valid email address.';
    if (!/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, '')))
      next.phone = 'Enter a valid 10 digit Indian mobile number.';
    if (form.address.trim().length < 8) next.address = 'Enter your full delivery address.';
    if (form.city.trim().length < 2) next.city = 'Enter your city.';
    if (form.state.trim().length < 2) next.state = 'Enter your state.';
    if (!/^\d{6}$/.test(form.pincode.trim())) next.pincode = 'Pincode must be 6 digits.';

    if (payment === 'upi' && form.upiId && !/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(form.upiId.trim()))
      next.upiId = 'Enter a UPI id like name@bank.';

    if (payment === 'card') {
      if (form.cardNumber.replace(/\s/g, '').length < 12)
        next.cardNumber = 'Enter a card number (demo only, do not use a real card).';
      if (!/^\d{2}\/\d{2}$/.test(form.cardExpiry.trim())) next.cardExpiry = 'Use MM/YY.';
      if (!/^\d{3,4}$/.test(form.cardCvv.trim())) next.cardCvv = 'CVV must be 3 or 4 digits.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    setSubmissionError('');
    if (!validate()) {
      const firstError = document.querySelector('[aria-invalid="true"]');
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstError?.focus?.();
      return;
    }
    if (isSupabaseConfigured && payment !== 'cod') {
      setSubmissionError('UPI and card payments are coming soon. Please choose Cash on Delivery.');
      return;
    }
    if (isSupabaseConfigured && items.some((item) => !item.variantId)) {
      setSubmissionError('Please reopen the affected product and add its selected size and colour again.');
      return;
    }

    setSubmitting(true);
    try {
      if (isSupabaseConfigured) {
        const result = await createOrder({
          name: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(),
          address_line1: form.address.trim(), address_line2: form.notes.trim(), city: form.city.trim(), state: form.state.trim(), pincode: form.pincode.trim(),
        }, items);
        setOrder({ id: result.order_number, name: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(), address: `${form.address.trim()}, ${form.city.trim()}, ${form.state.trim()} ${form.pincode.trim()}`, method: 'Cash on Delivery', amount: Number(result.total), items: totalItems, eta: deliveryWindow() });
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 850));
        setOrder({ id: generateOrderId(), name: form.fullName.trim(), email: form.email.trim(), phone: form.phone.trim(), address: `${form.address.trim()}, ${form.city.trim()}, ${form.state.trim()} ${form.pincode.trim()}`, method: PAYMENT_METHODS.find((method) => method.id === payment)?.label, amount: grandTotal, items: totalItems, eta: deliveryWindow() });
      }
      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setSubmissionError(userMessage(error, 'We could not place your order. Your bag is unchanged.'));
    } finally {
      setSubmitting(false);
    }
  };

  /* ------------------------------ Success ------------------------------ */
  if (order) {
    return (
      <>
        <PageMeta title="Order Confirmed" description="Your VERA order has been confirmed." />
        <div className="shell py-16 lg:py-24">
          <div className="mx-auto max-w-2xl animate-fade-up border border-line bg-white px-6 py-12 text-center sm:px-12">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-clay/10 text-clay">
              <CircleCheckBig size={28} strokeWidth={1.2} />
            </span>

            <h1 className="mt-7 text-[2.3rem] leading-tight sm:text-[3rem]">Order Confirmed!</h1>
            <p className="mt-4 text-sm leading-relaxed text-slate">
              Thank you for shopping with {store.storeName}. A confirmation has been sent to{' '}
              <span className="text-ink">{order.email}</span>.
            </p>

            <dl className="mt-9 divide-y divide-line border-y border-line text-left text-sm">
              {[
                ['Order ID', order.id],
                ['Items', pluralise(order.items, 'piece')],
                ['Amount', formatPrice(order.amount)],
                ['Payment', order.method],
                ['Delivering to', order.address],
                ['Estimated arrival', order.eta],
              ].map(([label, value]) => (
                <div key={label} className="flex flex-wrap gap-2 py-3.5 sm:grid sm:grid-cols-[9rem_1fr]">
                  <dt className="text-[10px] uppercase tracking-[0.16em] text-muted sm:pt-0.5">
                    {label}
                  </dt>
                  <dd className="text-ink">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button to="/shop">Continue Shopping</Button>
              <Button
                href={whatsappLink(`Hi ${store.storeNamePlain}, I just placed order ${order.id}.`)}
                target="_blank"
                rel="noreferrer noopener"
                variant="outline"
              >
                Track on WhatsApp
              </Button>
            </div>

            <p className="mt-8 text-xs text-muted">
              This is a demonstration store. No payment has been taken and no order will be shipped.
            </p>
          </div>
        </div>
      </>
    );
  }

  /* ------------------------------- Empty ------------------------------- */
  if (isEmpty) {
    return (
      <>
        <PageMeta title="Checkout" description="Complete your VERA order." />
        <div className="shell py-16">
          <div className="border border-line bg-white">
            <EmptyState
              icon={ShoppingBag}
              title="Nothing to check out yet."
              description="Your bag is empty. Add a few pieces and we will be right here."
            >
              <Button to="/shop">Continue Shopping</Button>
            </EmptyState>
          </div>
        </div>
      </>
    );
  }

  /* ------------------------------ Checkout ----------------------------- */
  return (
    <>
      <PageMeta
        title="Checkout"
        description="Enter your delivery details and choose cash on delivery, UPI or card to complete your VERA order."
      />

      <div className="shell pt-8">
        <Breadcrumbs
          items={[{ label: 'Home', to: '/' }, { label: 'Bag', to: '/cart' }, { label: 'Checkout' }]}
        />
      </div>

      <div className="shell pb-24 pt-6">
        <h1 className="text-[2.4rem] leading-none sm:text-[3.2rem]">Checkout</h1>
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate">
          <Lock size={13} strokeWidth={1.5} className="text-clay" />
          {isSupabaseConfigured ? 'Secure cash on delivery checkout. Prices and stock are confirmed when you place the order.' : 'Demo checkout. Configure Supabase to create real orders.'}
        </p>
        {submissionError && <p role="alert" className="mt-4 border border-clay/30 bg-clay/5 px-4 py-3 text-sm text-clay">{submissionError}</p>}

        <form
          onSubmit={placeOrder}
          noValidate
          className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem] lg:gap-14 xl:grid-cols-[1fr_24rem]"
        >
          <div className="space-y-10">
            {/* Contact */}
            <section aria-labelledby="contact-heading">
              <div className="mb-5 flex items-baseline gap-3">
                <span className="font-display text-2xl text-clay">01</span>
                <h2 id="contact-heading" className="text-[11px] uppercase tracking-[0.24em] text-ink">
                  Contact Information
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Field
                    label="Full name"
                    name="fullName"
                    value={form.fullName}
                    onChange={update}
                    error={errors.fullName}
                    autoComplete="name"
                    placeholder="Ananya Sharma"
                  />
                </div>
                <Field
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={update}
                  error={errors.email}
                  autoComplete="email"
                  placeholder="you@email.com"
                />
                <Field
                  label="Phone"
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={update}
                  error={errors.phone}
                  autoComplete="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="98765 43210"
                />
              </div>
            </section>

            {/* Address */}
            <section aria-labelledby="address-heading">
              <div className="mb-5 flex items-baseline gap-3">
                <span className="font-display text-2xl text-clay">02</span>
                <h2 id="address-heading" className="text-[11px] uppercase tracking-[0.24em] text-ink">
                  Delivery Address
                </h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="field-address"
                    className="mb-2 block text-[10px] uppercase tracking-[0.18em] text-slate"
                  >
                    Address
                  </label>
                  <textarea
                    id="field-address"
                    name="address"
                    rows={3}
                    value={form.address}
                    onChange={update}
                    aria-invalid={Boolean(errors.address)}
                    aria-describedby={errors.address ? 'field-address-error' : undefined}
                    className="field resize-none"
                    placeholder="Flat, building, street, landmark"
                    autoComplete="street-address"
                  />
                  {errors.address && (
                    <p id="field-address-error" role="alert" className="mt-1.5 text-xs text-clay">
                      {errors.address}
                    </p>
                  )}
                </div>
                <Field
                  label="City"
                  name="city"
                  value={form.city}
                  onChange={update}
                  error={errors.city}
                  autoComplete="address-level2"
                  placeholder="Chennai"
                />
                <Field
                  label="State"
                  name="state"
                  value={form.state}
                  onChange={update}
                  error={errors.state}
                  autoComplete="address-level1"
                  placeholder="Tamil Nadu"
                />
                <Field
                  label="Pincode"
                  name="pincode"
                  value={form.pincode}
                  onChange={update}
                  error={errors.pincode}
                  autoComplete="postal-code"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="600002"
                />
                <Field
                  label="Delivery notes (optional)"
                  name="notes"
                  value={form.notes}
                  onChange={update}
                  placeholder="Leave with security"
                />
              </div>
            </section>

            {/* Payment */}
            <section aria-labelledby="payment-heading">
              <div className="mb-5 flex items-baseline gap-3">
                <span className="font-display text-2xl text-clay">03</span>
                <h2 id="payment-heading" className="text-[11px] uppercase tracking-[0.24em] text-ink">
                  Payment Method
                </h2>
              </div>

              <div role="radiogroup" aria-label="Payment method" className="space-y-2.5">
                {PAYMENT_METHODS.map(({ id, label, Icon, note }) => {
                  const active = payment === id;
                  return (
                    <label
                      key={id}
                      className={cx(
                        'flex cursor-pointer items-start gap-4 border bg-white p-4 transition-colors',
                        active ? 'border-ink' : 'border-line hover:border-ink/40'
                      )}
                    >
                      <input
                        type="radio"
                        name="payment"
                        value={id}
                        checked={active}
                        onChange={() => {
                          setPayment(id);
                          setErrors({});
                        }}
                        className="sr-only"
                      />
                      <span
                        className={cx(
                          'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border',
                          active ? 'border-ink' : 'border-line'
                        )}
                      >
                        {active && <span className="h-2 w-2 rounded-full bg-ink" />}
                      </span>
                      <span className="flex-1">
                        <span className="flex items-center gap-2.5">
                          <Icon size={16} strokeWidth={1.4} className="text-ink" />
                          <span className="text-sm text-ink">{label}</span>
                        </span>
                        <span className="mt-1 block text-xs text-slate">{note}</span>
                      </span>
                    </label>
                  );
                })}
              </div>

              {payment === 'upi' && (
                <div className="mt-4 animate-fade-in border border-line bg-sand/40 p-4">
                  <Field
                    label="UPI ID (optional for this demo)"
                    name="upiId"
                    value={form.upiId}
                    onChange={update}
                    error={errors.upiId}
                    placeholder="yourname@okbank"
                  />
                  <p className="mt-3 text-xs text-slate">
                    In a live store this step would open your UPI app to approve the payment.
                  </p>
                </div>
              )}

              {payment === 'card' && (
                <div className="mt-4 animate-fade-in space-y-4 border border-line bg-sand/40 p-4">
                  <Field
                    label="Card number"
                    name="cardNumber"
                    value={form.cardNumber}
                    onChange={update}
                    error={errors.cardNumber}
                    inputMode="numeric"
                    maxLength={19}
                    placeholder="4111 1111 1111 1111"
                    autoComplete="off"
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="Expiry"
                      name="cardExpiry"
                      value={form.cardExpiry}
                      onChange={update}
                      error={errors.cardExpiry}
                      maxLength={5}
                      placeholder="09/29"
                      autoComplete="off"
                    />
                    <Field
                      label="CVV"
                      name="cardCvv"
                      value={form.cardCvv}
                      onChange={update}
                      error={errors.cardCvv}
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="123"
                      autoComplete="off"
                    />
                  </div>
                  <p className="text-xs text-clay">
                    Never enter real card details on a demonstration site. Any placeholder value works
                    here.
                  </p>
                </div>
              )}
            </section>
          </div>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-line bg-white">
              <button
                type="button"
                onClick={() => setSummaryOpen((open) => !open)}
                aria-expanded={summaryOpen}
                aria-controls="checkout-summary-details"
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left lg:hidden"
              >
                <span>
                  <span className="block text-[11px] uppercase tracking-[0.22em] text-ink">Order Summary</span>
                  <span className="mt-1 block text-xs text-slate">{pluralise(totalItems, 'item')} · {formatPrice(grandTotal)}</span>
                </span>
                <ChevronDown size={18} strokeWidth={1.4} className={cx('shrink-0 transition-transform duration-300', summaryOpen && 'rotate-180')} />
              </button>

              <div className="hidden items-center justify-between border-b border-line px-6 py-5 lg:flex">
                <h2 className="text-[11px] uppercase tracking-[0.24em] text-ink">Order Summary</h2>
                <Link to="/cart" className="text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink">Edit</Link>
              </div>

              <div id="checkout-summary-details" className={cx(!summaryOpen && 'hidden', 'lg:block')}>
                <div className="flex justify-end border-t border-line px-5 py-2 lg:hidden">
                  <Link to="/cart" className="text-[10px] uppercase tracking-[0.16em] text-muted transition-colors hover:text-ink">Edit bag</Link>
                </div>
                <ul className="max-h-72 divide-y divide-line overflow-y-auto px-6">
                  {summaryLines.map((line) => (
                    <li key={line.key} className="flex gap-3.5 py-4">
                      <img src={line.image} alt={line.name} loading="lazy" className="h-20 w-16 shrink-0 bg-sand object-cover" />
                      <div className="min-w-0 flex-1"><p className="truncate text-sm text-ink">{line.name}</p><p className="mt-1 text-[11px] uppercase tracking-[0.1em] text-muted">{line.meta}</p></div>
                      <span className="shrink-0 text-sm tabular-nums text-ink">{formatPrice(line.amount)}</span>
                    </li>
                  ))}
                </ul>

                <dl className="space-y-3 border-t border-line px-6 py-5 text-sm">
                  <div className="flex justify-between"><dt className="text-slate">Subtotal</dt><dd className="tabular-nums">{formatPrice(subtotal)}</dd></div>
                  {savings > 0 && <div className="flex justify-between text-clay"><dt>Discount</dt><dd className="tabular-nums">-{formatPrice(savings)}</dd></div>}
                  <div className="flex justify-between"><dt className="text-slate">Delivery</dt><dd className="tabular-nums">{delivery === 0 ? 'Free' : formatPrice(delivery)}</dd></div>
                  {codFee > 0 && <div className="flex justify-between"><dt className="text-slate">COD handling</dt><dd className="tabular-nums">{formatPrice(codFee)}</dd></div>}
                  <div className="flex items-baseline justify-between border-t border-line pt-4"><dt className="text-base">Total</dt><dd className="font-display text-2xl tabular-nums">{formatPrice(grandTotal)}</dd></div>
                </dl>

                <div className="px-6 pb-6">
                  <Button type="submit" full size="lg" disabled={submitting}>{submitting ? 'Placing order...' : 'Place Order'}</Button>
                  <p className="mt-4 flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted"><Truck size={13} strokeWidth={1.5} />Arrives {deliveryWindow()}</p>
                </div>
              </div>
            </div>
          </aside>
        </form>
      </div>
    </>
  );
}
