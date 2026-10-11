import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/utils/cn';
import {
  LayoutDashboard,
  Building2,
  FileText,
  UserCheck,
  UserCog,
  PieChart,
  ChevronLeft,
  ChevronRight,
  Shield,
  CalendarDays,
  DollarSign,
  Briefcase,
  Sparkles,
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navSections: { title?: string; items: NavItem[] }[] = [
  {
    items: [
      { label: 'Dashboard', path: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Gestion',
    items: [
      { label: 'RH Management', path: '/rh', icon: <UserCog className="w-5 h-5" /> },
      { label: 'Departments', path: '/departments', icon: <Building2 className="w-5 h-5" /> },
      { label: 'Contracts', path: '/contracts', icon: <FileText className="w-5 h-5" /> },
      { label: 'Meetings & Events', path: '/meetings', icon: <CalendarDays className="w-5 h-5" /> },
      { label: 'Finance', path: '/finance', icon: <DollarSign className="w-5 h-5" /> },
      { label: 'Recruitment', path: '/recruitments', icon: <Briefcase className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Analyse',
    items: [
      { label: 'Analytics', path: '/analytics', icon: <PieChart className="w-5 h-5" /> },
      { label: 'AI Assistant', path: '/ai-assistant', icon: <Sparkles className="w-5 h-5" /> },
    ],
  },
  {
    title: 'Système',
    items: [
      { label: 'Profile', path: '/profile', icon: <UserCheck className="w-5 h-5" /> },
    ],
  },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
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
              <h1 className="text-sm font-bold text-surface-900 truncate">SuperAdmin</h1>
              <p className="text-[11px] text-surface-400 truncate">HR Platform</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className={cn(sIdx > 0 && 'mt-6')}>
            {section.title && !collapsed && (
              <p className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-surface-400">
                {section.title}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
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
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="px-3 py-3 border-t border-surface-100">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-surface-400 hover:bg-surface-50 hover:text-surface-600 transition-all duration-200',
          )}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          {!collapsed && <span className="text-xs">Réduire</span>}
        </button>
      </div>
    </aside>
  );
}
