import { useState } from 'react';
import { NavLink, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { Avatar } from '@/components/ui/Avatar';
import { useAuth } from '@/contexts/AuthContext';
import { NotificationBell } from '@/components/layout/NotificationBell';
import {
  Shield,
  LayoutDashboard,
  Users,
  Briefcase,
  CalendarDays,
  CalendarClock,
  FileText,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  Settings,
  Search,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/rh-dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Calendar', path: '/rh/calendar', icon: <CalendarDays className="w-5 h-5" /> },
  { label: 'Employees', path: '/rh/employees', icon: <Users className="w-5 h-5" /> },
  { label: 'Recruitment', path: '/rh/recruitment', icon: <Briefcase className="w-5 h-5" /> },
  { label: 'Meetings', path: '/rh/meetings', icon: <CalendarClock className="w-5 h-5" /> },
  { label: 'Contracts', path: '/rh/contracts', icon: <FileText className="w-5 h-5" /> },
  { label: 'Profile', path: '/rh/profile', icon: <UserCheck className="w-5 h-5" /> },
];

export function RHLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-surface-50 flex">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen flex flex-col bg-white border-r border-surface-200/60 transition-all duration-300 ease-in-out',
          collapsed ? 'w-[72px]' : 'w-[260px]',
        )}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-surface-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shrink-0 shadow-sm shadow-primary-500/20">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-bold text-surface-900 truncate">RH Manager</h1>
                <p className="text-[11px] text-surface-400 truncate">HR Platform</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary-50 text-primary-700 shadow-sm shadow-primary-100'
                      : 'text-surface-500 hover:bg-surface-50 hover:text-surface-900',
                    collapsed && 'justify-center px-0',
                  )}
                  title={collapsed ? item.label : undefined}
                >
                  <span
                    className={cn(
                      'shrink-0 transition-colors duration-200',
                      isActive ? 'text-primary-600' : 'text-surface-400 group-hover:text-surface-600',
                    )}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Collapse toggle */}
        <div className="px-3 py-3 border-t border-surface-100">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-surface-400 hover:bg-surface-50 hover:text-surface-600 transition-all duration-200"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="text-xs">Réduire</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn('flex-1 transition-all duration-300', collapsed ? 'pl-[72px]' : 'pl-[260px]')}>
        {/* Navbar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-lg border-b border-surface-200/60">
          <div className="flex items-center justify-between h-full px-6">
            <div>
              <h2 className="text-lg font-semibold text-surface-900">Espace RH</h2>
              <p className="text-xs text-surface-400 -mt-0.5">Tableau de bord du responsable RH</p>
            </div>

            <div className="flex items-center gap-2">
              {/* Search */}
              <div className={cn('relative transition-all duration-300', searchFocused ? 'w-72' : 'w-56')}>
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
                  onClick={() => { setShowProfile(!showProfile); }}
                  className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-50 transition-colors duration-200"
                >
                  <Avatar name={user?.name || 'RH'} size="sm" status="online" />
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-surface-900 leading-tight">{user?.name || 'RH'}</p>
                    <p className="text-[11px] text-surface-400">{user?.email || ''}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-surface-400 hidden md:block" />
                </button>

                {showProfile && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfile(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl shadow-surface-200/50 border border-surface-100 z-50 animate-scale-in overflow-hidden">
                      <div className="p-2">
                        <button onClick={() => { navigate('/rh/profile'); setShowProfile(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-surface-600 hover:bg-surface-50 transition-colors">
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

        {/* Page content */}
        <main className="p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
