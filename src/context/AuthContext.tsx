import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '../supabase';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    // Failsafe strictly for production Vercel environments where getSession can silently hang
    const failsafe = setTimeout(() => {
      if (isMounted) setLoading(false);
    }, 2500);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) throw error;
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
      }
    }).catch(console.error).finally(() => {
      if (isMounted) {
        setLoading(false);
        clearTimeout(failsafe);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (isMounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
          clearTimeout(failsafe);
        }
      }
    );

    return () => {
      isMounted = false;
      clearTimeout(failsafe);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    loading,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
