import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api, setStoredToken, getStoredToken } from '../services/api';
import { Language, translations } from '../i18n/translations';

interface AuthContextType {
  user: User | null;
  profile: any;
  token: string | null;
  loading: boolean;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  isOffline: boolean;
  setIsOffline: (offline: boolean) => void;
  login: (email: string, pass: string) => Promise<void>;
  switchPersona: (role: UserRole, userId?: string) => Promise<void>;
  logout: () => void;
  resetDemo: () => Promise<void>;
  pendingOfflineActionsCount: number;
  setPendingOfflineActionsCount: React.Dispatch<React.SetStateAction<number>>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [loading, setLoading] = useState<boolean>(true);
  const [language, setLanguageState] = useState<Language>(
    (localStorage.getItem('caregrid_lang') as Language) || 'en'
  );
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [pendingOfflineActionsCount, setPendingOfflineActionsCount] = useState<number>(0);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('caregrid_lang', lang);
  };

  const t = translations[language] || translations.en;

  // Listen to browser online/offline events
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize user session on mount
  useEffect(() => {
    async function initSession() {
      const stored = getStoredToken();
      if (stored) {
        try {
          const res = await api.getCurrentUser();
          setUser(res.user);
          setProfile(res.profile);
        } catch (err) {
          console.warn('Session expired or invalid, auto-logging in as default Patient persona');
          await autoLoginDefault();
        }
      } else {
        await autoLoginDefault();
      }
      setLoading(false);
    }

    async function autoLoginDefault() {
      try {
        const res = await api.switchPersona('HEALTH_WORKER');
        setStoredToken(res.token);
        setToken(res.token);
        setUser(res.user);
        setProfile(res.profile);
      } catch (e) {
        console.error('Initial auto-login failed:', e);
      }
    }

    initSession();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setStoredToken(res.token);
    setToken(res.token);
    setUser(res.user);
    setProfile(res.profile);
  };

  const switchPersona = async (role: UserRole, userId?: string) => {
    setLoading(true);
    try {
      const res = await api.switchPersona(role, userId);
      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);
      setProfile(res.profile);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setStoredToken(null);
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  const resetDemo = async () => {
    setLoading(true);
    try {
      await api.resetDemo();
      // Re-fetch current user profile
      const res = await api.getCurrentUser();
      setUser(res.user);
      setProfile(res.profile);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        token,
        loading,
        language,
        setLanguage,
        t,
        isOffline,
        setIsOffline,
        login,
        switchPersona,
        logout,
        resetDemo,
        pendingOfflineActionsCount,
        setPendingOfflineActionsCount
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
