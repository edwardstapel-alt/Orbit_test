import React from 'react';
import { useData } from '../context/DataContext';
import { Notification } from '../types';

interface NotificationsProps {
  onBack: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ onBack }) => {
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification, getUnreadNotificationsCount } = useData();
  const unreadCount = getUnreadNotificationsCount();

  const formatTime = (createdAt: string): string => {
    const now = new Date();
    const time = new Date(createdAt);
    const diffMs = now.getTime() - time.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Nu';
    if (diffMins < 60) return `${diffMins}m geleden`;
    if (diffHours < 24) return `${diffHours}u geleden`;
    if (diffDays < 7) return `${diffDays}d geleden`;
    return time.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  };

  const getIconColor = (color: string): string => {
    // Convert hex to tailwind classes
    const colorMap: { [key: string]: string } = {
      '#3B82F6': 'bg-blue-100 text-blue-600',
      '#10B981': 'bg-green-100 text-green-600',
      '#F59E0B': 'bg-amber-100 text-amber-600',
      '#8B5CF6': 'bg-purple-100 text-purple-600',
      '#EC4899': 'bg-pink-100 text-pink-600',
      '#EF4444': 'bg-red-100 text-red-600',
    };
    return colorMap[color] || 'bg-gray-100 text-gray-600';
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-slate-200/50">
        <button onClick={onBack} className="size-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-text-main">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-text-main">Notifications</h1>
        {unreadCount > 0 && (
          <button 
            onClick={markAllNotificationsAsRead}
            className="ml-auto text-xs text-primary font-medium hover:text-primary/80"
          >
            Markeer alles als gelezen
          </button>
        )}
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="material-symbols-outlined text-6xl text-gray-300 mb-4">notifications_off</span>
            <p className="text-text-secondary font-medium">Geen notificaties</p>
            <p className="text-text-tertiary text-sm mt-1">Je hebt nog geen notificaties ontvangen</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div 
              key={notif.id} 
              onClick={() => handleNotificationClick(notif)}
              className={`flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 items-start cursor-pointer hover:bg-gray-50 transition-colors ${
                !notif.read ? 'ring-2 ring-primary/20' : ''
              }`}
            >
              <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${getIconColor(notif.color)}`}>
                <span className="material-symbols-outlined text-[20px]">{notif.icon}</span>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-text-main">{notif.title}</h3>
                <p className="text-xs text-text-secondary mt-0.5">{notif.message}</p>
                <p className="text-[10px] text-text-tertiary mt-1.5 font-medium">{formatTime(notif.createdAt)}</p>
              </div>
              {!notif.read && (
                <div className="size-2 bg-primary rounded-full mt-2 shrink-0"></div>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notif.id);
                }}
                className="size-6 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-text-tertiary shrink-0"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};