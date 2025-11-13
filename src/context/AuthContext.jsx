// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../config/supabaseClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);         // current user
  const [profile, setProfile] = useState(null);   // profile info from DB
  const [authChecked, setAuthChecked] = useState(false); // initial session check

  // Fetch profile from Supabase
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (!error && data) setProfile(data);
    } catch (err) {
      console.error('Profile fetch error:', err);
    }
  };

  useEffect(() => {
    // Initial session check
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        // fetch profile asynchronously, do not block render
        fetchProfile(session.user.id);
      }
      setAuthChecked(true);
    };

    initAuth();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    return () => subscription?.unsubscribe();
  }, []);

  // Sign up
  const signUp = async (email, password, fullName, role) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, role } },
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign in
  const signIn = async (email, password, expectedRole) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw new Error('Failed to verify account role');
      if (profileData.role !== expectedRole) {
        await supabase.auth.signOut();
        throw new Error(`This account is registered as ${profileData.role}.`);
      }

      setUser(data.user);
      setProfile(profileData);
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (!error) {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const value = { user, profile, authChecked, signUp, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
