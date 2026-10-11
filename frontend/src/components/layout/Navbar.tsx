import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/layout/NotificationBell';
import {
  Search,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';

const pageTitles: Record<string, { title: string; description: string }> = {
  '/dashboard': { title: 'Dashboard', description: "Vue d'ensemble de votre entreprise" },
  '/rh': { title: 'RH Management', description: 'Gestion des responsables ressources humaines' },
  '/departments': { title: 'Departments', description: 'Organisation des départements' },
  '/contracts': { title: 'Contracts', description: 'Gestion des contrats' },
  '/finance': { title: 'Finance', description: 'Budgets, revenus et dépenses' },
  '/recruitments': { title: 'Recruitment', description: 'Offres de recrutement et candidatures' },
  '/analytics': { title: 'Analytics', description: 'Tableaux de bord analytiques' },
  '/profile': { title: 'Profile', description: 'Votre profil administrateur' },
  '/notifications': { title: 'Notifications', description: 'Centre de notifications' },
  '/ai-assistant': { title: 'AI Assistant', description: 'Assistant intelligent' },
};

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const page = pageTitles[location.pathname] || { title: 'Dashboard', description: '' };
  const [showProfile, setShowProfile] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-lg border-b border-surface-200/60">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left: Page title */}
        <div>
          <h2 className="text-lg font-semibold text-surface-900">{page.title}</h2>
          <p className="text-xs text-surface-400 -mt-0.5">{page.description}</p>
        </div>

        {/* Right: Search, Notifications, Profile */}
        <div className="flex items-center gap-2">
          {/* Search */}
          <div
            className={cn(
              'relative transition-all duration-300',
              searchFocused ? 'w-72' : 'w-56',
            )}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className={cn(
                'w-full rounded-xl border border-surface-200 bg-surface-50/50 pl-10 pr-4 py-2 text-sm text-surface-900 placeholder:text-surface-400',
                'transition-all duration-200',
                'focus:border-primary-500 focus:ring-2 focus:ring-primary-500/10 focus:outline-none focus:bg-white',
              )}
            />
          </div>

          {/* Notifications */}
          <NotificationBell />

          {/* Profile */}
          <div className="relative">
            <button
              onClick={() => {
                setShowProfile(!showProfile);
              }}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-50 transition-colors duration-200"
            >
              <Avatar name={user?.name || 'Admin'} size="sm" status="online" />
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-surface-900 leading-tight">{user?.name || 'Admin'}</p>
                <p className="text-[11px] text-surface-400">{user?.email || ''}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-surface-400 hidden md:block" />
            </button>

            {showProfile && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-surface-200/50 border border-surface-100 z-50 animate-scale-in overflow-hidden">
                  <div className="p-2">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-surface-600 hover:bg-surface-50 transition-colors">
                      <Settings className="w-4 h-4" />
                      <span>Paramètres</span>
                    </button>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors">
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
