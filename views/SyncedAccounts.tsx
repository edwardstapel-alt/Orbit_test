import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { 
  isGoogleConnected, 
  getAccessToken,
  exportTimeSlotToCalendar,
  exportTaskToCalendar,
  exportGoalDeadlineToCalendar,
  exportTaskToGoogleTasks,
  exportFriendToGoogleContacts,
  importGoogleContacts,
  getGoogleTaskLists,
  importGoogleTasks
} from '../utils/googleSync';
import { syncService } from '../utils/syncService';
import { View } from '../types';

declare global {
    interface Window {
        google: any;
        gapi: any;
    }
}

interface SyncedAccountsProps {
  onBack: () => void;
  onNavigate?: (view: any) => void;
}

export const SyncedAccounts: React.FC<SyncedAccountsProps> = ({ onBack, onNavigate }) => {
  const { 
    updateUserProfile, 
    addTask, 
    tasks, 
    timeSlots, 
    objectives, 
    friends,
    updateTask,
    updateTimeSlot,
    updateObjective,
    updateFriend,
    addFriend,
    getSyncQueueStatus,
    triggerSync,
    importTasksFromGoogle,
    getSyncConfig,
    updateSyncConfig,
    startAutoImport,
    stopAutoImport
  } = useData();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState('388457113122-gb1safn47js2k3rbpb2tsue52n960rsh.apps.googleusercontent.com');
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState('');
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  const [taskLists, setTaskLists] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedTaskLists, setSelectedTaskLists] = useState<string[]>([]);
  const [syncDirection, setSyncDirection] = useState<'export' | 'import' | 'bidirectional'>('bidirectional');
  const [autoImportEnabled, setAutoImportEnabled] = useState(false);
  const [autoImportInterval, setAutoImportInterval] = useState(30);
  
  // Scopes for People (Profile, Email, DOB), Calendar, and Tasks
  // Note: calendar and tasks now have write access for bi-directional sync
  const SCOPES = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/contacts';

  useEffect(() => {
    // Set current origin for help text
    setCurrentOrigin(window.location.origin);

    // Check if previously connected
    if(localStorage.getItem('orbit_google_sync') === 'true') {
        setGoogleConnected(true);
    }
    
    // Load saved client id or use default
    const savedId = localStorage.getItem('orbit_google_client_id');
    if(savedId) {
        setClientId(savedId);
    } else {
        // Save default client ID
        localStorage.setItem('orbit_google_client_id', clientId);
    }

    // Wait for Google API to load
    const checkGoogleApi = () => {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) {
        setGoogleApiLoaded(true);
        console.log('✅ Google API loaded successfully');
      } else {
        // Check again after a delay, but limit retries to prevent infinite loop
        const retryCount = parseInt(sessionStorage.getItem('google_api_retry_count') || '0', 10);
        if (retryCount < 50) { // Max 5 seconds (50 * 100ms)
          sessionStorage.setItem('google_api_retry_count', (retryCount + 1).toString());
          setTimeout(checkGoogleApi, 100);
        } else {
          console.error('❌ Google API failed to load after multiple attempts');
          sessionStorage.removeItem('google_api_retry_count');
        }
      }
    };
    
    // Reset retry count
    sessionStorage.removeItem('google_api_retry_count');
    
    // Start checking after a short delay to allow scripts to load
    setTimeout(checkGoogleApi, 500);

    // Load saved sync settings
    const savedTaskLists = localStorage.getItem('google_tasks_selected_lists');
    if (savedTaskLists) {
      try {
        setSelectedTaskLists(JSON.parse(savedTaskLists));
      } catch (e) {
        console.error('Failed to load saved task lists:', e);
      }
    }

    const savedSyncDirection = localStorage.getItem('google_tasks_sync_direction');
    if (savedSyncDirection) {
      setSyncDirection(savedSyncDirection as 'export' | 'import' | 'bidirectional');
    }

    const savedAutoImport = localStorage.getItem('google_tasks_auto_import');
    if (savedAutoImport === 'true') {
      setAutoImportEnabled(true);
      const savedInterval = localStorage.getItem('google_tasks_auto_import_interval');
      if (savedInterval) {
        setAutoImportInterval(parseInt(savedInterval, 10));
      }
    }

    // Load task lists if connected
    if (localStorage.getItem('orbit_google_sync') === 'true') {
      loadTaskLists();
    }
  }, []);

  const loadTaskLists = async () => {
    const token = getAccessToken();
    if (!token) return;

    try {
      const result = await getGoogleTaskLists(token);
      if (result.success && result.taskLists) {
        setTaskLists(result.taskLists);
        
        // If no saved selection, select all lists by default
        if (selectedTaskLists.length === 0) {
          setSelectedTaskLists(result.taskLists.map(list => list.id));
        }
      }
    } catch (error) {
      console.error('Failed to load task lists:', error);
    }
  };

  const handleAuthClick = () => {
    const cleanClientId = clientId.trim();
    
    if (!cleanClientId) {
        alert("Voer eerst een Client ID in, of gebruik Demo Mode.");
        return;
    }

    if (!googleApiLoaded) {
        alert("Google API wordt nog geladen. Wacht even en probeer het opnieuw.");
        return;
    }

    // Save Client ID
    localStorage.setItem('orbit_google_client_id', cleanClientId);
    
    // Real Auth Flow
    try {
        if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
            alert("Google API is niet geladen. Controleer je internetverbinding en ververs de pagina.");
            return;
        }

        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: cleanClientId,
            scope: SCOPES,
            callback: (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                    setGoogleConnected(true);
                    localStorage.setItem('orbit_google_sync', 'true');
                    // Store access token for future use
                    localStorage.setItem('orbit_google_token', tokenResponse.access_token);
                    if (tokenResponse.expires_in) {
                        const expiryTime = Date.now() + (tokenResponse.expires_in * 1000);
                        localStorage.setItem('orbit_google_token_expiry', expiryTime.toString());
                    }
                    fetchData(tokenResponse.access_token);
                } else if (tokenResponse && tokenResponse.error) {
                    alert(`Authenticatiefout: ${tokenResponse.error}. Controleer of de Client ID correct is en de origin URL is toegevoegd aan Authorized JavaScript origins.`);
                    console.error('OAuth error:', tokenResponse);
                }
            },
        });
        client.requestAccessToken();
    } catch (e) {
        alert("Fout bij initialiseren van Google Sign-In. Controleer de console voor details.");
        console.error('OAuth initialization error:', e);
    }
  };

  const fetchData = async (accessToken: string) => {
      setIsLoading(true);
      setSyncStatus("Initialiseren...");
      
      try {
        // Initialize GAPI if available
        if (window.gapi) {
          try {
            await new Promise<void>((resolve, reject) => {
              window.gapi.load('client', {
                callback: resolve,
                onerror: reject,
                timeout: 5000,
                ontimeout: reject
              });
            });
        await window.gapi.client.init({});
          } catch (gapiError) {
            console.warn('GAPI initialization failed, continuing with direct API calls:', gapiError);
          }
        }
        
        // 1. Fetch Profile with Email and Birthday
        setSyncStatus("Profiel ophalen...");
        const profileRes = await fetch('https://people.googleapis.com/v1/people/me?personFields=names,photos,emailAddresses,birthdays', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (!profileRes.ok) {
          throw new Error(`People API error: ${profileRes.status} ${profileRes.statusText}`);
        }
        
        const profileData = await profileRes.json();
        
        if (profileData.error) {
          throw new Error(`People API error: ${profileData.error.message}`);
        }
        
        // Extract profile data
        const givenName = profileData.names?.[0]?.givenName || '';
        const familyName = profileData.names?.[0]?.familyName || '';
        const photoUrl = profileData.photos?.[0]?.url || '';
        
        // Extract email (get primary email or first available)
        let email = '';
        if (profileData.emailAddresses && profileData.emailAddresses.length > 0) {
            // Find primary email or use first one
            const primaryEmail = profileData.emailAddresses.find((e: any) => e.metadata?.primary) || profileData.emailAddresses[0];
            email = primaryEmail.value || '';
        }
        
        // Extract date of birth
            let dob = '';
        if (profileData.birthdays && profileData.birthdays.length > 0) {
            const birthday = profileData.birthdays[0];
            // Check if it's a date object (has year, month, day)
            if (birthday.date && birthday.date.year && birthday.date.month && birthday.date.day) {
                const b = birthday.date;
                dob = `${b.year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`;
            } else if (birthday.text) {
                // If only text is available, try to parse it (format: "YYYY-MM-DD" or similar)
                console.warn('Birthday only available as text:', birthday.text);
            }
        }

        // Update profile with all available data
        const profileUpdate: any = {};
        if (givenName) profileUpdate.firstName = givenName;
        if (familyName) profileUpdate.lastName = familyName;
        if (photoUrl) profileUpdate.image = photoUrl;
        if (email) profileUpdate.email = email;
        if (dob) profileUpdate.dob = dob;

        if (Object.keys(profileUpdate).length > 0) {
            updateUserProfile(profileUpdate);
            console.log('Profile updated:', profileUpdate);
        }

        // 2. Fetch Calendar Events (Next 7 days)
        setSyncStatus("Kalender ophalen...");
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        
        const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${nextWeek.toISOString()}&singleEvents=true&orderBy=startTime&maxResults=50`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (calRes.ok) {
          const calData = await calRes.json();
          
          if (calData.items && calData.items.length > 0) {
             calData.items.forEach((event: any) => {
                   const startTime = event.start?.dateTime || event.start?.date;
                   const eventTitle = event.summary || 'Geen titel';
                   // Avoid duplicates by checking ID
                   if (startTime && !tasks.some(t => t.id === `cal-${event.id}`)) {
                       const eventDate = new Date(startTime);
                     addTask({
                         id: `cal-${event.id}`,
                           title: eventTitle,
                         tag: 'Meeting',
                           time: eventDate.toLocaleTimeString('nl-NL', {hour: '2-digit', minute:'2-digit'}),
                         completed: false,
                         priority: false
                     });
                 }
             });
          }
        } else {
          console.warn('Calendar API error:', calRes.status, calRes.statusText);
        }

        // 3. Fetch Tasks
        setSyncStatus("Taken ophalen...");
        const tasksRes = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false&maxResults=50', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        if (tasksRes.ok) {
          const tasksData = await tasksRes.json();
          
          if (tasksData.items && tasksData.items.length > 0) {
            tasksData.items.forEach((t: any) => {
                  const taskTitle = t.title || 'Geen titel';
                  if (!tasks.some(existing => existing.id === `gtask-${t.id}`)) {
                     addTask({
                         id: `gtask-${t.id}`,
                           title: taskTitle,
                         tag: 'Work',
                         time: 'Anytime',
                         completed: false,
                         priority: false
                     });
                }
            });
          }
        } else {
          console.warn('Tasks API error:', tasksRes.status, tasksRes.statusText);
        }
        
        setSyncStatus("Synchronisatie voltooid!");
        setTimeout(() => setIsLoading(false), 1000);

      } catch (error: any) {
          console.error('Sync error:', error);
          setSyncStatus(`Fout: ${error.message || 'Onbekende fout'}`);
          alert(`Synchronisatie mislukt: ${error.message || 'Onbekende fout'}\n\nZorg ervoor dat de volgende APIs zijn ingeschakeld in Google Cloud Console:\n- People API\n- Calendar API\n- Tasks API`);
          setIsLoading(false);
      }
  };

  const simulateSync = () => {
      setIsLoading(true);
      setSyncStatus("Google verbinding simuleren...");
      setTimeout(() => {
          setGoogleConnected(true);
          updateUserProfile({
              firstName: 'Alex',
              lastName: 'Morgan (Google)',
              image: 'https://lh3.googleusercontent.com/a/ACg8ocL...=s96-c', // Fake google url
              dob: '1992-05-15'
          });
          
          addTask({ id: 'sim-1', title: 'Google Calendar: Team Sync', tag: 'Meeting', time: '10:00', completed: false, priority: true });
          addTask({ id: 'sim-2', title: 'Google Task: Email Follow-up', tag: 'Work', time: 'Anytime', completed: false, priority: false });
          
          setSyncStatus("Simulatie voltooid");
          setIsLoading(false);
          localStorage.setItem('orbit_google_sync', 'true');
      }, 1500);
  }

  const handleDisconnect = () => {
      if(confirm("Google Account loskoppelen? Dit stopt alle synchronisaties.")) {
          setGoogleConnected(false);
          localStorage.removeItem('orbit_google_sync');
          localStorage.removeItem('orbit_google_token');
          localStorage.removeItem('orbit_google_token_expiry');
      }
  }

  const copyOrigin = () => {
      navigator.clipboard.writeText(currentOrigin);
      alert("URL gekopieerd naar klembord!");
  }

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-6 py-4 flex items-center gap-4 border-b border-slate-200/50">
        <button onClick={onBack} className="size-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-text-main">
            <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-xl font-bold text-text-main">Synced Accounts</h1>
      </header>

      <div className="p-6 space-y-6 overflow-y-auto pb-24">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center gap-4">
             <div className="size-16 rounded-full bg-white border-2 border-slate-100 flex items-center justify-center p-3 shadow-sm">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" className="w-full" />
             </div>
             <div className="text-center">
                 <h2 className="text-lg font-bold text-text-main">Google Account</h2>
                 <p className="text-sm text-text-secondary">Synchroniseer je profiel, kalender en taken.</p>
             </div>
             
             {!googleConnected ? (
                 <div className="w-full space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest ml-1">Client ID</label>
                        <input 
                            type="text" 
                            placeholder="Voer OAuth 2.0 Client ID in" 
                            className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                        />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-2">
                        <p className="text-[10px] font-bold text-yellow-800 mb-1">⚠️ Huidige Origin URL:</p>
                        <div className="flex items-center gap-2 bg-white/50 p-2 rounded border border-yellow-300">
                            <code className="flex-1 truncate font-mono text-[10px] font-bold">{currentOrigin}</code>
                            <button onClick={copyOrigin} className="text-yellow-700 font-bold uppercase text-[9px] px-2 py-1 bg-yellow-100 rounded hover:bg-yellow-200">
                                Kopieer
                            </button>
                        </div>
                        <p className="text-[9px] text-yellow-700 mt-1">Voeg deze exacte URL toe aan "Authorized JavaScript origins" in Google Cloud Console</p>
                    </div>
                    <button 
                        onClick={() => setShowHelp(!showHelp)}
                        className="w-full py-2 text-xs text-primary font-medium flex items-center justify-center gap-1 hover:bg-primary/5 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px]">help</span>
                        {showHelp ? 'Instructies verbergen' : 'Hoe los ik Error 400 op?'}
                    </button>

                    {showHelp && (
                        <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-800 space-y-2 leading-relaxed border border-blue-100">
                            <p className="font-bold mb-2">Stap-voor-stap handleiding:</p>
                            <ol className="list-decimal pl-4 space-y-2 mb-3">
                                <li>Ga naar <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline font-bold">Google Cloud Console</a>.</li>
                                <li>Klik op je OAuth 2.0 Client ID: <code className="bg-white/50 px-1 rounded text-[10px]">388457113122-gb1safn47js2k3rbpb2tsue52n960rsh</code></li>
                                <li>
                                    <strong className="text-red-600">KRITIEK:</strong> Voeg deze exacte URL toe aan <strong>"Authorized JavaScript origins"</strong>:
                                    <div className="flex items-center gap-2 mt-1 bg-white/50 p-2 rounded border-2 border-red-300">
                                        <code className="flex-1 truncate font-mono text-[10px] font-bold">{currentOrigin}</code>
                                        <button onClick={copyOrigin} className="text-blue-600 font-bold uppercase text-[9px] px-2 py-1 bg-blue-100 rounded">Kopieer</button>
                                    </div>
                                    <span className="text-[10px] text-red-600 font-bold block mt-1">⚠️ Let op: Voeg GEEN trailing slash (/) toe. Bijvoorbeeld: http://localhost:3000 (NIET http://localhost:3000/)</span>
                                </li>
                                <li>
                                    <strong className="text-red-600">BELANGRIJK:</strong> Laat <strong>"Authorized redirect URIs"</strong> LEEG of verwijder alle entries daar. 
                                    <span className="text-[10px] block mt-1 text-red-600">Redirect URIs zijn alleen voor server-side apps. Deze app gebruikt client-side flow.</span>
                                </li>
                                <li>Klik op <strong>"SAVE"</strong> en wacht 5-10 minuten.</li>
                                <li>Zorg dat de volgende APIs zijn ingeschakeld: <strong>People API</strong>, <strong>Calendar API</strong>, en <strong>Tasks API</strong>.</li>
                            </ol>
                            <div className="bg-red-50 p-3 rounded border-2 border-red-200 mt-2">
                                <p className="font-bold text-[10px] uppercase mb-1 text-red-700">Error 400: redirect_uri_mismatch?</p>
                                <ul className="list-disc pl-3 text-[10px] space-y-1 text-red-700">
                                    <li><strong>Verwijder ALLES</strong> uit "Authorized redirect URIs" - dit veld moet leeg zijn!</li>
                                    <li>Voeg <code className="bg-white/50 px-1 rounded">{currentOrigin}</code> toe aan <strong>"Authorized JavaScript origins"</strong> (zonder trailing slash)</li>
                                    <li>Als je in "Testing" modus bent, voeg je email toe aan <strong>Test Users</strong> in OAuth Consent Screen.</li>
                                    <li>Wacht 5-10 minuten na het opslaan - Google's cache heeft tijd nodig.</li>
                                    <li>Ververs de pagina na het opslaan van wijzigingen.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button onClick={simulateSync} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-text-main font-bold rounded-xl transition-colors">
                            Demo Modus
                        </button>
                        <button 
                            onClick={handleAuthClick} 
                            disabled={!googleApiLoaded || isLoading}
                            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                        >
                            {isLoading ? 'Laden...' : !googleApiLoaded ? 'API laden...' : 'Verbinden'}
                        </button>
                    </div>
                 </div>
             ) : (
                 <div className="w-full">
                     <div className="bg-green-50 text-green-700 text-xs font-bold text-center py-2 rounded-lg mb-3 border border-green-100 flex items-center justify-center gap-2">
                        {isLoading ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                        {isLoading ? syncStatus : 'Succesvol gesynchroniseerd'}
                     </div>
                     <div className="bg-blue-50 text-blue-700 text-xs text-center py-2 rounded-lg mb-3 border border-blue-100">
                        <p className="font-semibold mb-1">💡 Tip:</p>
                        <p className="text-[10px]">Als email of verjaardag niet wordt gesynchroniseerd, koppel het account los en verbind opnieuw om de nieuwe permissies te geven.</p>
                     </div>
                     <button onClick={handleDisconnect} className="w-full px-6 py-2 border border-slate-200 text-text-secondary font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                         Account loskoppelen
                     </button>
                 </div>
             )}
        </div>

        {googleConnected && (
            <div className="space-y-4 animate-fade-in-up">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">Automatische Sync</h3>
                
                {/* Auto-Sync Status */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="size-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                                <span className="material-symbols-outlined">sync</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-text-main">Automatische Synchronisatie</p>
                                <p className="text-[10px] text-text-tertiary">Sync automatisch bij wijzigingen</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-text-main">Auto-sync ingeschakeld</p>
                                <p className="text-[10px] text-text-tertiary">Taken, Time Slots en Goals worden automatisch gesynchroniseerd</p>
                            </div>
                            <span className="material-symbols-outlined text-green-500 text-2xl">check_circle</span>
                        </div>
                        <div className="pt-2 border-t border-gray-100">
                            <p className="text-xs text-text-tertiary mb-2">Sync Queue Status:</p>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-text-main">
                                    {(() => {
                                        const status = getSyncQueueStatus();
                                        return status.queueLength > 0 ? `${status.queueLength} items in queue` : 'Alles gesynchroniseerd';
                                    })()}
                                </span>
                                {(() => {
                                    const status = getSyncQueueStatus();
                                    if (status.isProcessing) {
                                        return <span className="material-symbols-outlined animate-spin text-primary text-lg">sync</span>;
                                    }
                                    return null;
                                })()}
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                try {
                                    await triggerSync();
                                    alert('Sync handmatig getriggerd');
                                } catch (error: any) {
                                    alert(`Sync fout: ${error.message}`);
                                }
                            }}
                            disabled={isLoading}
                            className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">refresh</span>
                            Handmatig Sync Nu
                        </button>
                        {onNavigate && (
                            <button
                                onClick={() => onNavigate(View.CONFLICT_MANAGEMENT)}
                                className="w-full py-2 px-4 border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                            >
                                <span className="material-symbols-outlined text-base">warning</span>
                                Conflict Beheer
                            </button>
                        )}
                    </div>
                </div>
                
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">Handmatige Export</h3>
                
                {/* Export to Google Calendar */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="size-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <span className="material-symbols-outlined">calendar_month</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-text-main">Google Calendar</p>
                                <p className="text-[10px] text-text-tertiary">Export Time Slots, Tasks & Goal Deadlines</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        <button
                            onClick={async () => {
                                const token = getAccessToken();
                                if (!token) {
                                    alert('Niet verbonden met Google. Verbind opnieuw.');
                                    return;
                                }
                                setIsLoading(true);
                                setSyncStatus('Time Slots exporteren...');
                                let exported = 0;
                                let errors = 0;
                                for (const timeSlot of timeSlots) {
                                    const result = await exportTimeSlotToCalendar(timeSlot, token);
                                    if (result.success && result.eventId) {
                                        updateTimeSlot({ ...timeSlot, googleCalendarEventId: result.eventId });
                                        exported++;
                                    } else {
                                        errors++;
                                    }
                                }
                                setSyncStatus(`${exported} Time Slots geëxporteerd${errors > 0 ? `, ${errors} fouten` : ''}`);
                                setTimeout(() => setIsLoading(false), 2000);
                            }}
                            disabled={isLoading || timeSlots.length === 0}
                            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">upload</span>
                            Export Time Slots ({timeSlots.length})
                        </button>
                        <button
                            onClick={async () => {
                                const token = getAccessToken();
                                if (!token) {
                                    alert('Niet verbonden met Google. Verbind opnieuw.');
                                    return;
                                }
                                setIsLoading(true);
                                setSyncStatus('Tasks exporteren...');
                                const tasksWithDate = tasks.filter(t => t.scheduledDate);
                                let exported = 0;
                                let errors = 0;
                                for (const task of tasksWithDate) {
                                    const result = await exportTaskToCalendar(task, token);
                                    if (result.success && result.eventId) {
                                        updateTask({ ...task, calendarEventId: result.eventId });
                                        exported++;
                                    } else {
                                        errors++;
                                    }
                                }
                                setSyncStatus(`${exported} Tasks geëxporteerd${errors > 0 ? `, ${errors} fouten` : ''}`);
                                setTimeout(() => setIsLoading(false), 2000);
                            }}
                            disabled={isLoading || tasks.filter(t => t.scheduledDate).length === 0}
                            className="w-full py-2.5 px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">upload</span>
                            Export Tasks ({tasks.filter(t => t.scheduledDate).length})
                        </button>
                        <button
                            onClick={async () => {
                                const token = getAccessToken();
                                if (!token) {
                                    alert('Niet verbonden met Google. Verbind opnieuw.');
                                    return;
                                }
                                setIsLoading(true);
                                setSyncStatus('Goal Deadlines exporteren...');
                                const goalsWithDeadline = objectives.filter(o => o.endDate);
                                let exported = 0;
                                let errors = 0;
                                for (const goal of goalsWithDeadline) {
                                    const result = await exportGoalDeadlineToCalendar(goal, token);
                                    if (result.success) {
                                        exported++;
                                    } else {
                                        errors++;
                                    }
                                }
                                setSyncStatus(`${exported} Deadlines geëxporteerd${errors > 0 ? `, ${errors} fouten` : ''}`);
                                setTimeout(() => setIsLoading(false), 2000);
                            }}
                            disabled={isLoading || objectives.filter(o => o.endDate).length === 0}
                            className="w-full py-2.5 px-4 bg-blue-400 hover:bg-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">event</span>
                            Export Goal Deadlines ({objectives.filter(o => o.endDate).length})
                        </button>
                    </div>
                </div>

                {/* Export to Google Tasks */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="size-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                                <span className="material-symbols-outlined">check_circle</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-text-main">Google Tasks</p>
                                <p className="text-[10px] text-text-tertiary">Export App Tasks naar Google Tasks</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 space-y-2">
                        <button
                            onClick={async () => {
                                const token = getAccessToken();
                                if (!token) {
                                    alert('Niet verbonden met Google. Verbind opnieuw.');
                                    return;
                                }
                                
                                // First, test if we can access task lists
                                const taskListsResult = await getGoogleTaskLists(token);
                                if (!taskListsResult.success) {
                                    alert(`Kan geen toegang krijgen tot Google Tasks:\n${taskListsResult.error}\n\nControleer of de Tasks API is ingeschakeld en je de juiste permissies hebt.`);
                                    return;
                                }
                                
                                setIsLoading(true);
                                setSyncStatus('Tasks exporteren naar Google Tasks...');
                                let exported = 0;
                                let errors = 0;
                                const errorMessages: string[] = [];
                                
                                if (tasks.length === 0) {
                                    alert('Geen taken om te exporteren.');
                                    setIsLoading(false);
                                    return;
                                }
                                
                                for (let i = 0; i < tasks.length; i++) {
                                    const task = tasks[i];
                                    
                                    try {
                                        const result = await exportTaskToGoogleTasks(task, token);
                                        
                                        if (result.success && result.taskId) {
                                            updateTask({ ...task, googleTaskId: result.taskId });
                                            exported++;
                                        } else {
                                            errors++;
                                            if (result.error) {
                                                errorMessages.push(`${task.title}: ${result.error}`);
                                            }
                                        }
                                    } catch (error: any) {
                                        errors++;
                                        errorMessages.push(`${task.title}: ${error.message || 'Unknown error'}`);
                                    }
                                    
                                    // Small delay to avoid rate limiting
                                    if (i < tasks.length - 1) {
                                        await new Promise(resolve => setTimeout(resolve, 100));
                                    }
                                }
                                
                                let statusMsg = `${exported} Tasks geëxporteerd`;
                                if (errors > 0) {
                                    statusMsg += `, ${errors} fouten`;
                                }
                                setSyncStatus(statusMsg);
                                
                                if (errors > 0 && errorMessages.length > 0) {
                                    alert(`Export voltooid met fouten:\n\n${errorMessages.slice(0, 5).join('\n')}${errorMessages.length > 5 ? `\n...en ${errorMessages.length - 5} meer` : ''}`);
                                } else if (exported > 0) {
                                    alert(`✓ ${exported} task(s) succesvol geëxporteerd naar Google Tasks!`);
                                }
                                
                                setTimeout(() => setIsLoading(false), 2000);
                            }}
                            disabled={isLoading || tasks.length === 0}
                            className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">upload</span>
                            Export Tasks ({tasks.length})
                        </button>
                    </div>
                </div>

                {/* Google Tasks Sync Settings */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="size-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                <span className="material-symbols-outlined">sync</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-text-main">Google Tasks Sync</p>
                                <p className="text-[10px] text-text-tertiary">Bi-directionele synchronisatie met Google Tasks</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 space-y-4">
                        {/* Task Lists Selector */}
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-2">
                                Selecteer Task Lists
                            </label>
                            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-3">
                                {taskLists.length === 0 ? (
                                    <p className="text-sm text-text-tertiary text-center py-2">
                                        Geen task lists gevonden. Klik op "Laad Task Lists" om te laden.
                                    </p>
                                ) : (
                                    taskLists.map(list => (
                                        <label key={list.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                                            <input
                                                type="checkbox"
                                                checked={selectedTaskLists.includes(list.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedTaskLists([...selectedTaskLists, list.id]);
                                                    } else {
                                                        setSelectedTaskLists(selectedTaskLists.filter(id => id !== list.id));
                                                    }
                                                }}
                                                className="rounded"
                                            />
                                            <span className="text-sm text-text-main flex-1">{list.title}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                            <button
                                onClick={loadTaskLists}
                                disabled={isLoading || !googleConnected}
                                className="mt-2 text-xs text-primary hover:underline disabled:text-gray-400"
                            >
                                Laad Task Lists
                            </button>
                        </div>

                        {/* Sync Direction */}
                        <div>
                            <label className="block text-sm font-medium text-text-main mb-2">
                                Sync Richting
                            </label>
                            <select
                                value={syncDirection}
                                onChange={(e) => setSyncDirection(e.target.value as any)}
                                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                            >
                                <option value="export">Alleen Export (App → Google)</option>
                                <option value="import">Alleen Import (Google → App)</option>
                                <option value="bidirectional">Bi-directioneel</option>
                            </select>
                        </div>

                        {/* Auto-Import Toggle */}
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex-1">
                                <label className="block text-sm font-medium text-text-main">
                                    Auto-Import
                                </label>
                                <p className="text-xs text-text-tertiary">
                                    Automatisch Google Tasks importeren
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={autoImportEnabled}
                                    onChange={(e) => {
                                        const enabled = e.target.checked;
                                        setAutoImportEnabled(enabled);
                                        if (enabled) {
                                            importTasksFromGoogle(selectedTaskLists.length > 0 ? selectedTaskLists : undefined)
                                                .then(() => {
                                                    startAutoImport(autoImportInterval);
                                                })
                                                .catch(err => {
                                                    console.error('Auto-import start failed:', err);
                                                    setAutoImportEnabled(false);
                                                });
                                        } else {
                                            stopAutoImport();
                                        }
                                    }}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>

                        {autoImportEnabled && (
                            <div>
                                <label className="block text-sm font-medium text-text-main mb-2">
                                    Import Interval (minuten)
                                </label>
                                <input
                                    type="number"
                                    min="5"
                                    max="1440"
                                    value={autoImportInterval}
                                    onChange={(e) => {
                                        const interval = parseInt(e.target.value, 10);
                                        setAutoImportInterval(interval);
                                        if (autoImportEnabled) {
                                            stopAutoImport();
                                            startAutoImport(interval);
                                        }
                                    }}
                                    className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                                />
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2 border-t border-gray-200">
                        <button
                            onClick={async () => {
                                const token = getAccessToken();
                                if (!token) {
                                    alert('Niet verbonden met Google. Verbind opnieuw.');
                                    return;
                                }
                                
                                setIsLoading(true);
                                setSyncStatus('Google Tasks importeren...');
                                
                                try {
                                        const result = await importTasksFromGoogle(
                                            selectedTaskLists.length > 0 ? selectedTaskLists : undefined
                                        );
                                    setSyncStatus(`Import voltooid: ${result.imported} nieuw, ${result.updated} bijgewerkt, ${result.conflicts} conflicten`);
                                    
                                    if (result.imported > 0 || result.updated > 0) {
                                        alert(`✓ Import succesvol!\n\n${result.imported} nieuwe task(s)\n${result.updated} bijgewerkte task(s)${result.conflicts > 0 ? `\n${result.conflicts} conflict(en) gedetecteerd` : ''}`);
                                    } else {
                                        alert('Geen nieuwe of bijgewerkte tasks gevonden.');
                                    }
                                } catch (error: any) {
                                    setSyncStatus(`Import mislukt: ${error.message}`);
                                    alert(`Import mislukt: ${error.message}`);
                                } finally {
                                    setIsLoading(false);
                                }
                            }}
                                disabled={isLoading || (syncDirection === 'export' && selectedTaskLists.length === 0)}
                                className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">download</span>
                                Import Nu
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.setItem('google_tasks_selected_lists', JSON.stringify(selectedTaskLists));
                                    localStorage.setItem('google_tasks_sync_direction', syncDirection);
                                    localStorage.setItem('google_tasks_auto_import', autoImportEnabled.toString());
                                    localStorage.setItem('google_tasks_auto_import_interval', autoImportInterval.toString());
                                    
                                    // Update sync config
                                    const syncConfig = getSyncConfig();
                                    updateSyncConfig({
                                        ...syncConfig,
                                        syncTasks: syncDirection !== 'export',
                                    });
                                    
                                    alert('Instellingen opgeslagen');
                                }}
                                className="px-4 py-2.5 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                            >
                                Opslaan
                        </button>
                        </div>
                    </div>
                </div>

                {/* Google Contacts Sync */}
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
                    <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="size-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                <span className="material-symbols-outlined">contacts</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-text-main">Google Contacts</p>
                                <p className="text-[10px] text-text-tertiary">Import & Export Contacts</p>
                                 </div>
                                 </div>
                             </div>
                    <div className="p-4 space-y-2">
                        <button
                            onClick={async () => {
                                const token = getAccessToken();
                                if (!token) {
                                    alert('Niet verbonden met Google. Verbind opnieuw.');
                                    return;
                                }
                                setIsLoading(true);
                                setSyncStatus('Contacts importeren...');
                                
                                try {
                                    const result = await importGoogleContacts(token);
                                    if (result.success && result.contacts) {
                                        let imported = 0;
                                        let skipped = 0;
                                        
                                        for (const contact of result.contacts) {
                                            try {
                                                const name = contact.names?.[0];
                                                const email = contact.emailAddresses?.[0]?.value;
                                                const phone = contact.phoneNumbers?.[0]?.value;
                                                const photo = contact.photos?.[0]?.url;
                                                const contactId = contact.resourceName;
                                                
                                                // Skip if no name
                                                if (!name || (!name.givenName && !name.familyName)) {
                                                    skipped++;
                                                    continue;
                                                }
                                                
                                                // Check if already exists
                                                if (friends.some(f => f.googleContactId === contactId)) {
                                                    skipped++;
                                                    continue;
                                                }
                                                
                                                const fullName = `${name.givenName || ''} ${name.familyName || ''}`.trim();
                                                if (!fullName) {
                                                    skipped++;
                                                    continue;
                                                }
                                                
                                                addFriend({
                                                    id: `contact-${contactId.replace(/[^a-zA-Z0-9]/g, '-')}`,
                                                    name: fullName,
                                                    role: contact.biographies?.[0]?.value || 'Contact',
                                                    roleType: 'friend',
                                                    image: photo || '',
                                                    lastSeen: new Date().toISOString(),
                                                    googleContactId: contactId,
                                                    email: email,
                                                    phone: phone,
                                                });
                                                imported++;
                                            } catch (contactError: any) {
                                                console.error('Error processing contact:', contactError);
                                                skipped++;
                                            }
                                        }
                                        
                                        setSyncStatus(`${imported} Contacts geïmporteerd${skipped > 0 ? `, ${skipped} overgeslagen` : ''}`);
                                        
                                        if (imported === 0 && skipped > 0) {
                                            alert(`Geen nieuwe contacts geïmporteerd. ${skipped} contacts waren al aanwezig of hadden geen naam.`);
                                        }
                                    } else {
                                        const errorMsg = result.error || 'Onbekende fout';
                                        setSyncStatus(`Fout: ${errorMsg}`);
                                        alert(`Import mislukt: ${errorMsg}\n\nControleer of de Contacts API is ingeschakeld in Google Cloud Console.`);
                                    }
                                } catch (error: any) {
                                    console.error('Import error:', error);
                                    setSyncStatus(`Fout: ${error.message || 'Onbekende fout'}`);
                                    alert(`Import mislukt: ${error.message || 'Onbekende fout'}`);
                                }
                                
                                setTimeout(() => setIsLoading(false), 2000);
                            }}
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">download</span>
                            Import Contacts
                        </button>
                        <button
                            onClick={async () => {
                                const token = getAccessToken();
                                if (!token) {
                                    alert('Niet verbonden met Google. Verbind opnieuw.');
                                    return;
                                }
                                setIsLoading(true);
                                setSyncStatus('Friends exporteren...');
                                let exported = 0;
                                let errors = 0;
                                for (const friend of friends) {
                                    const result = await exportFriendToGoogleContacts(friend, token);
                                    if (result.success && result.contactId) {
                                        updateFriend({ ...friend, googleContactId: result.contactId });
                                        exported++;
                                    } else {
                                        errors++;
                                    }
                                }
                                setSyncStatus(`${exported} Friends geëxporteerd${errors > 0 ? `, ${errors} fouten` : ''}`);
                                setTimeout(() => setIsLoading(false), 2000);
                            }}
                            disabled={isLoading || friends.length === 0}
                            className="w-full py-2.5 px-4 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined text-base">upload</span>
                            Export Friends ({friends.length})
                        </button>
                         </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};