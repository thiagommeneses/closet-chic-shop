import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AdminContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  hasAnyAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasAnyAdmin, setHasAnyAdmin] = useState(true); // Always true since we manually created admin
  
  console.log('AdminContext state:', { loading, hasAnyAdmin, isAdmin, user });

  useEffect(() => {
    let mounted = true;

    const checkAdminUser = async (userId?: string) => {
      if (!userId) {
        setIsAdmin(false);
        return;
      }

      try {
        const { data: adminUser, error } = await supabase
          .from('admin_users')
          .select('*')
          .eq('user_id', userId)
          .eq('active', true)
          .maybeSingle();
        
        if (mounted && !error) {
          setIsAdmin(!!adminUser);
        }
      } catch (error) {
        console.error('Error checking admin user:', error);
        if (mounted) {
          setIsAdmin(false);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Check admin status for new session
        checkAdminUser(session?.user?.id);
        setLoading(false);
      }
    );

    // Initialize with existing session
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        // Admin always exists now
        setHasAnyAdmin(true);
        
        // Check current user admin status
        await checkAdminUser(session?.user?.id);
        
        setLoading(false);
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshAdminStatus = async () => {
    // Since admin always exists, just set to true
    setHasAnyAdmin(true);
  };

  return (
    <AdminContext.Provider value={{
      user,
      session,
      isAdmin,
      loading,
      hasAnyAdmin,
      signIn,
      signOut,
      refreshAdminStatus,
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};