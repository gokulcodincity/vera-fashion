import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { LockKeyhole } from 'lucide-react';
import Button from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const { configured, loading, user, isAdmin, signIn } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const setupRequired = new URLSearchParams(location.search).get('setup') === 'required';

  useEffect(() => { setError(''); }, [email, password]);
  if (!loading && user && isAdmin) return <Navigate to={location.state?.from || '/admin'} replace />;

  const submit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setSubmitting(true);
    const result = await signIn(email.trim(), password);
    if (result.error) setError(result.error.message);
    else if (result.profile?.role !== 'admin' && result.profile?.role !== 'staff') setError('This account does not have store administrator access.');
    else navigate(location.state?.from || '/admin', { replace: true });
    setSubmitting(false);
  };

  return <main className="flex min-h-screen items-center justify-center bg-sand/45 px-5 py-12"><div className="w-full max-w-md border border-line bg-cream p-7 shadow-soft sm:p-10"><p className="font-sans text-xl font-medium tracking-[0.28em] text-ink">VÉRA</p><h1 className="mt-8 text-4xl">Store Admin</h1><p className="mt-3 text-sm leading-relaxed text-slate">Sign in with an intentionally provisioned administrator account.</p>{(!configured || setupRequired) ? <div className="mt-7 border border-clay/30 bg-clay/5 p-4 text-sm leading-relaxed text-slate"><p className="font-medium text-ink">Supabase is not configured.</p><p className="mt-1">Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart Vite. Never use a service-role key here.</p></div> : <form onSubmit={submit} noValidate className="mt-8 space-y-5"><label className="block text-[10px] uppercase tracking-[0.18em] text-slate">Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" className="field mt-2" /></label><label className="block text-[10px] uppercase tracking-[0.18em] text-slate">Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" className="field mt-2" /></label>{error && <p role="alert" className="text-sm text-clay">{error}</p>}<Button type="submit" full size="lg" disabled={submitting}><LockKeyhole size={15} />{submitting ? 'Signing in...' : 'Sign in securely'}</Button></form>}</div></main>;
}
