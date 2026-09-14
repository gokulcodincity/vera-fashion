import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

const AuthContext = createContext(null);

const safeAuthMessage = (error) => {
  if (!error) return 'Unable to complete that request. Please try again.';
  if (error.message?.toLowerCase().includes('invalid login')) return 'Email or password is incorrect.';
  return 'Unable to sign in. Please try again.';
};

/** Session and role state. Roles are read from RLS-protected public.profiles. */
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (user) => {
    if (!supabase || !user) {
      setProfile(null);
      return null;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', user.id)
      .maybeSingle();
    if (error) {
      setProfile(null);
      return null;
    }
    setProfile(data);
    return data;
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    const restore = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session ?? null);
      await loadProfile(data.session?.user);
      if (active) setLoading(false);
    };
    restore();

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      setLoading(true);
      window.setTimeout(async () => {
        await loadProfile(nextSession?.user);
        if (active) setLoading(false);
      }, 0);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email, password) => {
    if (!supabase) return { error: new Error('Admin access has not been configured yet.') };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: new Error(safeAuthMessage(error)) };
    setSession(data.session ?? null);
    const nextProfile = await loadProfile(data.user);
    return { data, profile: nextProfile, error: null };
  }, [loadProfile]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo(() => ({
    configured: isSupabaseConfigured,
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isAdmin: profile?.role === 'admin' || profile?.role === 'staff',
    signIn,
    signOut,
  }), [session, profile, loading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

export default AuthContext;
