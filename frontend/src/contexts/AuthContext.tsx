import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api, type User, type CandidateProfile } from '@/services/api';

export interface RhDepartment {
  id: number;
  name: string;
  code: string;
}

export interface RhManagerInfo {
  id: number;
  matricule: string;
  full_name: string;
  email: string;
  department: RhDepartment | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  rhManager: RhManagerInfo | null;
  candidateProfile: CandidateProfile | null;
  login: (email: string, password: string) => Promise<{ user: User }>;
  register: (data: { name: string; email: string; password: string; password_confirmation: string }) => Promise<{ user: User }>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  updateCandidateProfile: (profile: CandidateProfile) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [rhManager, setRhManager] = useState<RhManagerInfo | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.auth.me()
        .then((res) => {
          setUser(res.user);
          if ('rh_manager' in res && res.rh_manager) {
            setRhManager(res.rh_manager as RhManagerInfo);
          }
          if ('candidate_profile' in res && res.candidate_profile) {
            setCandidateProfile(res.candidate_profile);
          }
        })
        .catch(() => { localStorage.removeItem('auth_token'); })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    localStorage.setItem('auth_token', res.token);
    setUser(res.user);

    const meRes = await api.auth.me();
    if ('rh_manager' in meRes && meRes.rh_manager) {
      setRhManager(meRes.rh_manager as RhManagerInfo);
    }
    if ('candidate_profile' in meRes && meRes.candidate_profile) {
      setCandidateProfile(meRes.candidate_profile);
    }

    return { user: res.user };
  };

  const register = async (data: { name: string; email: string; password: string; password_confirmation: string }) => {
    const res = await api.auth.register(data);
    localStorage.setItem('auth_token', res.token);
    setUser(res.user);
    return { user: res.user };
  };

  const logout = async () => {
    try { await api.auth.logout(); } catch {}
    localStorage.removeItem('auth_token');
    setUser(null);
    setRhManager(null);
    setCandidateProfile(null);
  };

  const updateUser = (updated: User) => setUser(updated);
  const updateCandidateProfile = (profile: CandidateProfile) => setCandidateProfile(profile);

  return (
    <AuthContext.Provider value={{ user, loading, rhManager, candidateProfile, login, register, logout, updateUser, updateCandidateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
