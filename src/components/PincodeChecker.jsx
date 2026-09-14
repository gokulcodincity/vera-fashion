import { useState } from 'react';
import { MapPin } from 'lucide-react';
import Button from './Button';

/** Demo-only delivery estimate; it validates the format without calling a delivery API. */
export default function PincodeChecker({ eta }) {
  const [pincode, setPincode] = useState('');
  const [status, setStatus] = useState('idle');

  const check = () => setStatus(/^\d{6}$/.test(pincode) ? 'available' : 'invalid');

  return (
    <section className="mt-7 border border-line bg-sand/35 p-4" aria-labelledby="delivery-check-heading">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-ink">
        <MapPin size={14} strokeWidth={1.4} className="text-clay" />
        <h2 id="delivery-check-heading" className="font-normal">Check delivery</h2>
      </div>
      <div className="mt-3 flex gap-2.5">
        <label className="sr-only" htmlFor="product-pincode">Enter pincode</label>
        <input
          id="product-pincode"
          value={pincode}
          onChange={(event) => { setPincode(event.target.value.replace(/\D/g, '').slice(0, 6)); setStatus('idle'); }}
          onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); check(); } }}
          inputMode="numeric"
          maxLength={6}
          autoComplete="postal-code"
          placeholder="Enter pincode"
          className="field min-w-0 flex-1 py-2.5"
        />
        <Button type="button" onClick={check} size="sm">Check</Button>
      </div>
      <p aria-live="polite" className="mt-3 text-xs leading-relaxed text-slate">
        {status === 'available' && <><span className="text-clay">Delivery available.</span> Estimated delivery: {eta}.</>}
        {status === 'invalid' && <span className="text-clay">Enter a valid 6 digit pincode to view a demo delivery estimate.</span>}
        {status === 'idle' && 'Enter a pincode for a demo delivery estimate.'}
      </p>
    </section>
  );
}
