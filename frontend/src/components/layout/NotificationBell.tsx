import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/utils/cn';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  Bell,
  CheckCircle,
  Info,
  AlertTriangle,
  XCircle,
  X,
  CheckCheck,
} from 'lucide-react';

const typeConfig = {
  success: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50' },
  error: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50' },
};

interface NotificationBellProps {
  onNavigate?: () => void;
}

export function NotificationBell({ onNavigate }: NotificationBellProps) {
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleViewAll = () => {
    setShowDropdown(false);
    navigate('/notifications');
    onNavigate?.();
  };

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      setShowDropdown(false);
      navigate(notification.link);
      onNavigate?.();
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowDropdown(!showDropdown);
        }}
        className="relative p-2.5 rounded-xl text-surface-400 hover:bg-surface-50 hover:text-surface-600 transition-colors duration-200"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl shadow-surface-200/50 border border-surface-100 z-50 animate-scale-in overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-surface-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-surface-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-primary-100 text-primary-700 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 rounded-lg text-surface-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setShowDropdown(false)}
                  className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 hover:bg-surface-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center">
                  <Bell className="w-8 h-8 text-surface-300 mx-auto mb-2" />
                  <p className="text-sm text-surface-500">Aucune notification</p>
                </div>
              ) : (
                notifications.map((notification) => {
                  const config = typeConfig[notification.type] || typeConfig.info;
                  const Icon = config.icon;

                  return (
                    <div
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={cn(
                        'px-4 py-3 border-b border-surface-50 hover:bg-surface-50/50 transition-colors cursor-pointer',
                        !notification.is_read && 'bg-primary-50/30',
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={cn('mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center shrink-0', config.bg)}>
                          <Icon className={cn('w-3.5 h-3.5', config.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className={cn('text-sm leading-snug', !notification.is_read ? 'font-semibold text-surface-900' : 'text-surface-700')}>
                              {notification.title}
                            </p>
                            {!notification.is_read && (
                              <span className="w-2 h-2 rounded-full bg-primary-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-surface-500 mt-0.5 line-clamp-2">{notification.message}</p>
                          <p className="text-[11px] text-surface-400 mt-1">{notification.time_ago}</p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-surface-100 text-center">
                <button
                  onClick={handleViewAll}
                  className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Voir toutes les notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
