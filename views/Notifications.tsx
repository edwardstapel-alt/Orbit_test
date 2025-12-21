import React from 'react';

interface NotificationsProps {
  onBack: () => void;
}

export const Notifications: React.FC<NotificationsProps> = ({ onBack }) => {
  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-slate-200/50">
        <button onClick={onBack} className="size-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-text-main">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-text-main">Notifications</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {[
            { title: "New Connection", desc: "Sarah Jenkins accepted your request", time: "2m ago", icon: "person_add", color: "bg-blue-100 text-blue-600" },
            { title: "Goal Achieved", desc: "You hit your meditation streak!", time: "1h ago", icon: "emoji_events", color: "bg-amber-100 text-amber-600" },
            { title: "Meeting Reminder", desc: "1:1 with CTO in 30 minutes", time: "30m ago", icon: "calendar_clock", color: "bg-primary-light text-primary" },
            { title: "System Update", desc: "Orbit has been updated to v2.0", time: "1d ago", icon: "update", color: "bg-gray-200 text-gray-600" },
        ].map((notif, i) => (
            <div key={i} className="flex gap-4 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 items-start">
                <div className={`size-10 rounded-full flex items-center justify-center shrink-0 ${notif.color}`}>
                    <span className="material-symbols-outlined text-[20px]">{notif.icon}</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-text-main">{notif.title}</h3>
                    <p className="text-xs text-text-secondary mt-0.5">{notif.desc}</p>
                    <p className="text-[10px] text-text-tertiary mt-1.5 font-medium">{notif.time}</p>
                </div>
                <div className="size-2 bg-primary rounded-full mt-2"></div>
            </div>
        ))}
      </div>
    </div>
  );
};