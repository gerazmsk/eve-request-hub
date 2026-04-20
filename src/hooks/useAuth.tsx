import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isReady: boolean;
  profile: { id: string; user_id: string; role: string; first_name: string; last_name: string; phone: string; is_verified: boolean } | null;
  signUp: (email: string, password: string, metadata: { role: string; first_name: string; last_name: string; phone: string }) => Promise<{ error: Error | null }>;
  logIn: (email: string, password: string, expectedRole?: 'client' | 'provider') => Promise<{ error: Error | null }>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState<AuthContextType['profile']>(null);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfile(session.user.id);
      }
      setIsReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(() => fetchProfile(session.user.id), 0);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) console.error('[auth] profile fetch failed:', error);
    if (data) setProfile(data);
  };

  const refreshProfile = async () => {
    const userId = user?.id || session?.user?.id;
    if (userId) await fetchProfile(userId);
  };

  const signUp = async (email: string, password: string, metadata: { role: string; first_name: string; last_name: string; phone: string }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    return { error: error as Error | null };
  };

  const logIn = async (email: string, password: string, expectedRole?: 'client' | 'provider') => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error && data.user && expectedRole) {
      const { data: loginProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (profileError || !loginProfile) {
        console.error('[auth] login profile lookup failed:', profileError);
        await supabase.auth.signOut();
        return { error: new Error('We could not verify this account. Please try again.') };
      }

      if (loginProfile.role !== expectedRole) {
        await supabase.auth.signOut();
        return { error: new Error(`This is a ${loginProfile.role} account. Please choose the correct account type before logging in.`) };
      }

      setProfile(loginProfile);
    }
    return { error: error as Error | null };
  };

  const logOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isReady, profile, signUp, logIn, logOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
