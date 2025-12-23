import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { webNotificationService } from '../utils/webNotificationService';

interface NotificationSettingsProps {
  onBack: () => void;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({ onBack }) => {
  const { notificationSettings, updateNotificationSettings } = useData();
  const [hasPermission, setHasPermission] = useState(webNotificationService.hasPermission());
  const [isSupported, setIsSupported] = useState(webNotificationService.isNotificationSupported());

  const handleRequestPermission = async () => {
    const permission = await webNotificationService.requestPermission();
    setHasPermission(permission === 'granted');
  };

  const toggleSetting = (key: keyof typeof notificationSettings, value: any) => {
    updateNotificationSettings({ [key]: value });
  };

  const updateReminderDefault = (entityType: 'task' | 'habit' | 'objective' | 'timeSlot', minutes: number) => {
    updateNotificationSettings({
      reminderDefaults: {
        ...notificationSettings.reminderDefaults,
        [entityType]: minutes
      }
    });
  };

  const updateQuietHours = (key: 'enabled' | 'startTime' | 'endTime', value: any) => {
    updateNotificationSettings({
      quietHours: {
        ...notificationSettings.quietHours,
        [key]: value
      }
    });
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen pb-24 overflow-y-auto">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-slate-200/50">
        <button onClick={onBack} className="size-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-text-main">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-text-main">Notification Settings</h1>
      </header>

      <div className="px-6 space-y-4 pt-4">
        {/* Global Toggle */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-text-secondary">notifications</span>
              <div className="flex flex-col">
                <span className="text-text-main font-medium">Notificaties</span>
                <span className="text-xs text-text-tertiary">Schakel alle notificaties in/uit</span>
              </div>
            </div>
            <div className="relative inline-block w-11 h-6 align-middle select-none transition duration-200 ease-in">
              <input 
                type="checkbox" 
                checked={notificationSettings.enabled} 
                onChange={(e) => toggleSetting('enabled', e.target.checked)} 
                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out" 
                style={{top: '2px', left: '2px', transform: notificationSettings.enabled ? 'translateX(100%)' : 'translateX(0)'}}
              />
              <label 
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${notificationSettings.enabled ? 'bg-primary' : 'bg-gray-200'}`} 
                onClick={() => toggleSetting('enabled', !notificationSettings.enabled)}
              />
            </div>
          </div>
        </div>

        {/* Browser Notifications */}
        {isSupported && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-text-secondary">web</span>
                <div className="flex flex-col">
                  <span className="text-text-main font-medium">Browser Notificaties</span>
                  <span className="text-xs text-text-tertiary">Toon notificaties in browser</span>
                </div>
              </div>
              <div className="relative inline-block w-11 h-6 align-middle select-none transition duration-200 ease-in">
                <input 
                  type="checkbox" 
                  checked={notificationSettings.browserNotifications && hasPermission} 
                  onChange={(e) => {
                    if (e.target.checked && !hasPermission) {
                      handleRequestPermission();
                    } else {
                      toggleSetting('browserNotifications', e.target.checked);
                    }
                  }}
                  disabled={!hasPermission && !notificationSettings.browserNotifications}
                  className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out disabled:opacity-50" 
                  style={{top: '2px', left: '2px', transform: notificationSettings.browserNotifications && hasPermission ? 'translateX(100%)' : 'translateX(0)'}}
                />
                <label 
                  className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${notificationSettings.browserNotifications && hasPermission ? 'bg-primary' : 'bg-gray-200'}`} 
                  onClick={() => {
                    if (!hasPermission) {
                      handleRequestPermission();
                    } else {
                      toggleSetting('browserNotifications', !notificationSettings.browserNotifications);
                    }
                  }}
                />
              </div>
            </div>
            {!hasPermission && (
              <div className="px-4 pb-4">
                <button
                  onClick={handleRequestPermission}
                  className="w-full py-2 px-4 bg-primary/10 text-primary rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  Vraag toestemming aan
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sound */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-text-secondary">volume_up</span>
              <div className="flex flex-col">
                <span className="text-text-main font-medium">Geluid</span>
                <span className="text-xs text-text-tertiary">Speel geluid bij notificaties</span>
              </div>
            </div>
            <div className="relative inline-block w-11 h-6 align-middle select-none transition duration-200 ease-in">
              <input 
                type="checkbox" 
                checked={notificationSettings.soundEnabled} 
                onChange={(e) => toggleSetting('soundEnabled', e.target.checked)} 
                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out" 
                style={{top: '2px', left: '2px', transform: notificationSettings.soundEnabled ? 'translateX(100%)' : 'translateX(0)'}}
              />
              <label 
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${notificationSettings.soundEnabled ? 'bg-primary' : 'bg-gray-200'}`} 
                onClick={() => toggleSetting('soundEnabled', !notificationSettings.soundEnabled)}
              />
            </div>
          </div>
        </div>

        {/* Reminder Defaults */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-text-main font-medium flex items-center gap-2">
              <span className="material-symbols-outlined text-text-secondary text-lg">schedule</span>
              Standaard Herinneringstijden
            </h3>
            <p className="text-xs text-text-tertiary mt-1">Hoeveel minuten voorafgaand aan het evenement</p>
          </div>
          
          {(['task', 'habit', 'objective', 'timeSlot'] as const).map((entityType) => {
            const labels: { [key: string]: string } = {
              task: 'Taken',
              habit: 'Habits',
              objective: 'Goals',
              timeSlot: 'Afspraken'
            };
            const value = notificationSettings.reminderDefaults[entityType];
            
            return (
              <div key={entityType} className="flex items-center justify-between p-4 border-t border-gray-100">
                <span className="text-text-main font-medium">{labels[entityType]}</span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => updateReminderDefault(entityType, parseInt(e.target.value) || 0)}
                    className="w-20 px-2 py-1 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary text-center"
                  />
                  <span className="text-text-tertiary text-sm">minuten</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quiet Hours */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-text-secondary">bedtime</span>
              <div className="flex flex-col">
                <span className="text-text-main font-medium">Stille Uren</span>
                <span className="text-xs text-text-tertiary">Geen notificaties tijdens deze uren</span>
              </div>
            </div>
            <div className="relative inline-block w-11 h-6 align-middle select-none transition duration-200 ease-in">
              <input 
                type="checkbox" 
                checked={notificationSettings.quietHours.enabled} 
                onChange={(e) => updateQuietHours('enabled', e.target.checked)} 
                className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out" 
                style={{top: '2px', left: '2px', transform: notificationSettings.quietHours.enabled ? 'translateX(100%)' : 'translateX(0)'}}
              />
              <label 
                className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${notificationSettings.quietHours.enabled ? 'bg-primary' : 'bg-gray-200'}`} 
                onClick={() => updateQuietHours('enabled', !notificationSettings.quietHours.enabled)}
              />
            </div>
          </div>
          
          {notificationSettings.quietHours.enabled && (
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100">
              <div className="flex items-center justify-between pt-4">
                <span className="text-text-main font-medium">Start tijd</span>
                <input
                  type="time"
                  value={notificationSettings.quietHours.startTime}
                  onChange={(e) => updateQuietHours('startTime', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-main font-medium">Eind tijd</span>
                <input
                  type="time"
                  value={notificationSettings.quietHours.endTime}
                  onChange={(e) => updateQuietHours('endTime', e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};




