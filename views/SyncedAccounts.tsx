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
  const [clientId, setClientId] = useState('388457113122-gb1safn47js2k3rbpb2tsue52n960rsh.apps.googleusercontent.com');
  const [syncStatus, setSyncStatus] = useState<string>('');
  const [showHelp, setShowHelp] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState('');
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  
  // Scopes for People (Profile, Email, DOB), Calendar, and Tasks
  const SCOPES = 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/tasks.readonly';

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
      if (window.google && window.google.accounts) {
        setGoogleApiLoaded(true);
      } else {
        setTimeout(checkGoogleApi, 100);
      }
    };
    
    // Start checking after a short delay to allow scripts to load
    setTimeout(checkGoogleApi, 500);
  }, []);

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
                <h3 className="text-xs font-bold text-text-tertiary uppercase tracking-widest pl-1">Gegevensbron Status</h3>
                <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                     {[
                         { id: 'profile', label: 'People API', icon: 'badge', desc: 'Naam, Foto, Verjaardag' },
                         { id: 'calendar', label: 'Calendar API', icon: 'calendar_month', desc: 'Aankomende 7 Dagen' },
                         { id: 'tasks', label: 'Tasks API', icon: 'check_circle', desc: 'Standaard Takenlijst' },
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