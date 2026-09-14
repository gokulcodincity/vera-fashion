import { store } from '../config/store';

const currencyFormatter = new Intl.NumberFormat(store.locale, {
  style: 'currency',
  currency: store.currency,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat(store.locale);

/** 2499 -> "Rs.2,499" rendered with the native rupee glyph. */
export const formatPrice = (value) => currencyFormatter.format(Number(value) || 0);

/** 1299 -> "1,299" */
export const formatNumber = (value) => numberFormatter.format(Number(value) || 0);

/** Pluralise a countable noun: pluralise(1, 'item') -> "1 item" */
export const pluralise = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

/** Order ids look like VRA-8F2K41 */
export function generateOrderId() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `VRA-${code}`;
}

/** A friendly delivery window, e.g. "Fri, 18 Sep - Mon, 21 Sep" */
export function deliveryWindow(fromDays = 3, toDays = 6) {
  const options = { weekday: 'short', day: 'numeric', month: 'short' };
  const start = new Date();
  start.setDate(start.getDate() + fromDays);
  const end = new Date();
  end.setDate(end.getDate() + toDays);
  const fmt = new Intl.DateTimeFormat(store.locale, options);
  return `${fmt.format(start)} - ${fmt.format(end)}`;
}

/** Joins class names, ignoring falsy values. */
export const cx = (...classes) => classes.filter(Boolean).join(' ');
