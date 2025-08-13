import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, getCurrentUser } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
  resetPassword: (email: string) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    signIn: async (email: string, password: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error };
    },
    signUp: async (email: string, password: string) => {
      console.log('🔐 Attempting to sign up user:', email);
      
      // Check if we're in development mode (you can set this via environment variable)
      const isDevelopment = process.env.NODE_ENV === 'development' || __DEV__;
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: 'exp://192.168.8.185:8083', // Add redirect URL for email confirmation
          data: {
            // Add any additional user metadata here
          }
        }
      });
      
      if (error) {
        console.error('❌ Sign up error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          name: error.name
        });
        
        // If it's an email confirmation error, provide helpful message
        if (error.message === 'Error sending confirmation email') {
          console.log('💡 Solution: Configure email service in Supabase dashboard or disable email confirmation');
          console.log('💡 Alternative: Disable email confirmation in Supabase dashboard for immediate sign-up');
          if (isDevelopment) {
            console.log('🔧 Development mode: You can manually confirm the user in Supabase dashboard');
          }
        }
        
        // If it's a rate limit error, provide helpful message
        if (error.message === 'email rate limit exceeded') {
          console.log('⏰ Rate limit exceeded. Please wait 5-10 minutes before trying again.');
          console.log('💡 Try using a different email address or wait for rate limit to reset.');
        }
      } else {
        console.log('✅ Sign up successful:', data);
        console.log('📧 User email confirmed:', data.user?.email_confirmed_at);
        console.log('📧 User ID:', data.user?.id);
        
        if (isDevelopment && !data.user?.email_confirmed_at) {
          console.log('🔧 Development mode: User created but email not confirmed. Check Supabase dashboard.');
        }
      }
      
      return { error };
    },
    signOut: async () => {
      const { error } = await supabase.auth.signOut();
      return { error };
    },
    resetPassword: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      return { error };
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 