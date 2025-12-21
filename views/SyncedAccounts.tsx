import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

declare global {
    interface Window {
        google: any;
        gapi: any;
    }
}

interface SyncedAccountsProps {
  onBack: () => void;
}

export const SyncedAccounts: React.FC<SyncedAccountsProps> = ({ onBack }) => {
  const { updateUserProfile, addTask, tasks } = useData();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [clientId, setClientId] = useState('');
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState('');
  
  // Scopes for People (Profile, DOB), Calendar, and Tasks
  const SCOPES = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly';

  useEffect(() => {
    // Set current origin for help text
    setCurrentOrigin(window.location.origin);

    // Check if previously connected (mock check)
    if(localStorage.getItem('orbit_google_sync') === 'true') {
        setGoogleConnected(true);
    }
    
    // Load local client id if saved
    const savedId = localStorage.getItem('orbit_google_client_id');
    if(savedId) setClientId(savedId);
  }, []);

  const handleAuthClick = () => {
    const cleanClientId = clientId.trim();
    
    if (!cleanClientId) {
        alert("Please enter a Client ID first, or use Demo Mode.");
        return;
    }

    // Save Client ID
    localStorage.setItem('orbit_google_client_id', cleanClientId);
    
    // Real Auth Flow
    try {
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: cleanClientId,
            scope: SCOPES,
            callback: (tokenResponse: any) => {
                if (tokenResponse && tokenResponse.access_token) {
                    setGoogleConnected(true);
                    localStorage.setItem('orbit_google_sync', 'true');
                    fetchData(tokenResponse.access_token);
                }
            },
        });
        client.requestAccessToken();
    } catch (e) {
        alert("Error initializing Google Sign-In. Check console for details.");
        console.error(e);
    }
  };

  const fetchData = async (accessToken: string) => {
      setIsLoading(true);
      setSyncStatus("Initializing GAPI...");
      
      try {
        await new Promise<void>((resolve) => window.gapi.load('client', resolve));
        await window.gapi.client.init({});
        
        // 1. Fetch Profile
        setSyncStatus("Fetching Profile...");
        const profileRes = await fetch('https://people.googleapis.com/v1/people/me?personFields=names,photos,birthdays', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const profileData = await profileRes.json();
        
        if (profileData.names) {
            const givenName = profileData.names[0]?.givenName;
            const familyName = profileData.names[0]?.familyName;
            const photoUrl = profileData.photos?.[0]?.url;
            
            // Birthday logic
            let dob = '';
            if (profileData.birthdays) {
                const b = profileData.birthdays[0]?.date;
                if (b) dob = `${b.year}-${String(b.month).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`;
            }

            updateUserProfile({
                firstName: givenName,
                lastName: familyName,
                image: photoUrl,
                dob: dob
            });
        }

        // 2. Fetch Calendar Events (Next 7 days)
        setSyncStatus("Fetching Calendar...");
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        
        const calRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${now.toISOString()}&timeMax=${nextWeek.toISOString()}&singleEvents=true&orderBy=startTime`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const calData = await calRes.json();
        
        if (calData.items) {
             calData.items.forEach((event: any) => {
                 const startTime = event.start.dateTime || event.start.date;
                 // Avoid duplicates simply by title for this demo
                 if (!tasks.some(t => t.title === event.summary)) {
                     addTask({
                         id: `cal-${event.id}`,
                         title: event.summary,
                         tag: 'Meeting',
                         time: new Date(startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                         completed: false,
                         priority: false
                     });
                 }
             });
        }

        // 3. Fetch Tasks
        setSyncStatus("Fetching Tasks...");
        const tasksRes = await fetch('https://tasks.googleapis.com/tasks/v1/lists/@default/tasks?showCompleted=false', {
            headers: { Authorization: `Bearer ${accessToken}` }
        });
        const tasksData = await tasksRes.json();
        
        if (tasksData.items) {
            tasksData.items.forEach((t: any) => {
                if (!tasks.some(existing => existing.title === t.title)) {
                     addTask({
                         id: `gtask-${t.id}`,
                         title: t.title,
                         tag: 'Work',
                         time: 'Anytime',
                         completed: false,
                         priority: false
                     });
                }
            });
        }
        
        setSyncStatus("Sync Complete!");
        setTimeout(() => setIsLoading(false), 1000);

      } catch (error) {
          console.error(error);
          setSyncStatus("Error during sync. Check console.");
          alert("Sync failed. Ensure APIs (People, Calendar, Tasks) are enabled in Google Cloud Console.");
          setIsLoading(false);
      }
  };

  const simulateSync = () => {
      setIsLoading(true);
      setSyncStatus("Simulating Google Connection...");
      setTimeout(() => {
          setGoogleConnected(true);
          updateUserProfile({
              firstName: 'Alex',
              lastName: 'Morgan (Google)',
              image: 'https://lh3.googleusercontent.com/a/ACg8ocL...=s96-c', // Fake google url
              dob: '1992-05-15'
          });
          
          addTask({ id: 'sim-1', title: 'Google Calendar: Team Sync', tag: 'Meeting', time: '10:00 AM', completed: false, priority: true });
          addTask({ id: 'sim-2', title: 'Google Task: Email Follow-up', tag: 'Work', time: 'Anytime', completed: false, priority: false });
          
          setSyncStatus("Simulation Complete");
          setIsLoading(false);
          localStorage.setItem('orbit_google_sync', 'true');
      }, 1500);
  }

  const handleDisconnect = () => {
      if(confirm("Disconnect Google Account? This will stop all syncs.")) {
          setGoogleConnected(false);
          localStorage.removeItem('orbit_google_sync');
      }
  }

  const copyOrigin = () => {
      navigator.clipboard.writeText(currentOrigin);
      alert("URL copied to clipboard!");
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
                 <p className="text-sm text-text-secondary">Sync your profile, calendar, and tasks.</p>
             </div>
             
             {!googleConnected ? (
                 <div className="w-full space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest ml-1">Client ID</label>
                        <input 
                            type="text" 
                            placeholder="Enter OAuth 2.0 Client ID" 
                            className="w-full p-3 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors"
                            value={clientId}
                            onChange={(e) => setClientId(e.target.value)}
                        />
                    </div>

                    <button 
                        onClick={() => setShowHelp(!showHelp)}
                        className="w-full py-2 text-xs text-primary font-medium flex items-center justify-center gap-1 hover:bg-primary/5 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-[16px]">help</span>
                        {showHelp ? 'Hide Instructions' : 'How to get a Client ID?'}
                    </button>

                    {showHelp && (
                        <div className="bg-blue-50 p-4 rounded-xl text-xs text-blue-800 space-y-2 leading-relaxed border border-blue-100">
                            <p className="font-bold mb-2">Step-by-step Guide:</p>
                            <ol className="list-decimal pl-4 space-y-2 mb-3">
                                <li>Go to <a href="https://console.cloud.google.com/apis/credentials" target="_blank" className="underline font-bold">Google Cloud Console</a>.</li>
                                <li>Create/Select Project &rarr; Create Credentials &rarr; <strong>OAuth client ID</strong>.</li>
                                <li>Type: <strong>Web application</strong>.</li>
                                <li>
                                    <strong>IMPORTANT:</strong> Add this exact URL to <br/> "Authorized JavaScript origins":
                                    <div className="flex items-center gap-2 mt-1 bg-white/50 p-2 rounded border border-blue-200">
                                        <code className="flex-1 truncate font-mono text-[10px]">{currentOrigin}</code>
                                        <button onClick={copyOrigin} className="text-blue-600 font-bold uppercase text-[9px]">Copy</button>
                                    </div>
                                    <span className="text-[10px] text-red-500 font-bold block mt-1">Note: Do NOT add a trailing slash (/).</span>
                                </li>
                                <li>Copy the created <strong>Client ID</strong> and paste it above.</li>
                            </ol>
                            <div className="bg-white/60 p-2 rounded border border-blue-200 mt-2">
                                <p className="font-bold text-[10px] uppercase mb-1">Getting Error 400?</p>
                                <ul className="list-disc pl-3 text-[10px] space-y-1">
                                    <li>Ensure you added the URL to <strong>Authorized JavaScript origins</strong>, NOT Redirect URIs.</li>
                                    <li>If you are in "Testing" mode, add your email to <strong>Test Users</strong> in OAuth Consent Screen.</li>
                                    <li>Wait 5-10 minutes after saving changes in Google Console.</li>
                                </ul>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button onClick={simulateSync} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-text-main font-bold rounded-xl transition-colors">
                            Demo Mode
                        </button>
                        <button onClick={handleAuthClick} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-200 flex items-center justify-center gap-2">
                            {isLoading ? 'Loading...' : 'Connect'}
                        </button>
                    </div>
                 </div>
             ) : (
                 <div className="w-full">
                     <div className="bg-green-50 text-green-700 text-xs font-bold text-center py-2 rounded-lg mb-3 border border-green-100 flex items-center justify-center gap-2">
                        {isLoading ? <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span> : <span className="material-symbols-outlined text-[16px]">check_circle</span>}
                        {isLoading ? syncStatus : 'Synced Successfully'}
                     </div>
                     <button onClick={handleDisconnect} className="w-full px-6 py-2 border border-slate-200 text-text-secondary font-semibold rounded-xl hover:bg-slate-50 transition-colors">
                         Disconnect Account
                     </button>
                 </div>
             )}
        </div>

        {googleConnected && (
            <div className="space-y-4 animate-fade-in-up">
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">Data Source Status</h3>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                     {[
                         { id: 'profile', label: 'People API', icon: 'badge', desc: 'Name, Photo, Birthday' },
                         { id: 'calendar', label: 'Calendar API', icon: 'calendar_month', desc: 'Upcoming 7 Days Events' },
                         { id: 'tasks', label: 'Tasks API', icon: 'check_circle', desc: 'Default Task List' },
                     ].map((item) => (
                         <div key={item.id} className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0">
                             <div className="flex items-center gap-3">
                                 <div className="size-10 rounded-full bg-slate-50 flex items-center justify-center text-text-secondary">
                                     <span className="material-symbols-outlined">{item.icon}</span>
                                 </div>
                                 <div>
                                     <p className="text-sm font-bold text-text-main">{item.label}</p>
                                     <p className="text-[10px] text-text-tertiary">{item.desc}</p>
                                 </div>
                             </div>
                             <span className="material-symbols-outlined text-green-500">sync_alt</span>
                         </div>
                     ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};