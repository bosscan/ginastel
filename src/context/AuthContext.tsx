import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { UserProfile } from '../types';

// Supabase client (gunakan env var saat deploy)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Akun dummy untuk development lokal (username/password)
const dummyUsers: Record<string, { password: string; role: 'staff' | 'owner' }> = {
  'penjaga_outlet': { password: 'ginastel123', role: 'staff' },
  'owner_outlet': { password: 'ginastelf2', role: 'owner' },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('authUser');
    if (stored) setUser(JSON.parse(stored));
  }, []);

  async function login(username: string, password: string): Promise<boolean> {
    setLoading(true);
    try {
      if (supabase) {
        // Jika menggunakan Supabase, field username diasumsikan email
        const { data, error } = await supabase.auth.signInWithPassword({ email: username, password });
        if (error) return false;
        // Ambil role dari user metadata atau tabel profile (disederhanakan)
        const role = (data.user.user_metadata.role as 'staff' | 'owner') || 'staff';
        const profile: UserProfile = { id: data.user.id, username: data.user.email || username, role };
        setUser(profile);
        localStorage.setItem('authUser', JSON.stringify(profile));
        return true;
      } else {
        // dummy login dengan username
        const found = dummyUsers[username];
        if (found && found.password === password) {
          const profile: UserProfile = { id: username, username, role: found.role };
          setUser(profile);
          localStorage.setItem('authUser', JSON.stringify(profile));
          return true;
        }
        return false;
      }
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem('authUser');
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
