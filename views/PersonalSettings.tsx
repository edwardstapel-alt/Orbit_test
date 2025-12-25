import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';

interface PersonalSettingsProps {
  onBack: () => void;
}

export const PersonalSettings: React.FC<PersonalSettingsProps> = ({ onBack }) => {
  const { userProfile, updateUserProfile } = useData();
  
  const [firstName, setFirstName] = useState(userProfile.firstName);
  const [lastName, setLastName] = useState(userProfile.lastName);
  const [email, setEmail] = useState(userProfile.email);
  const [dob, setDob] = useState(userProfile.dob);
  const [image, setImage] = useState(userProfile.image);

  useEffect(() => {
      setFirstName(userProfile.firstName);
      setLastName(userProfile.lastName);
      setEmail(userProfile.email);
      setDob(userProfile.dob);
      setImage(userProfile.image);
  }, [userProfile]);

  const handleSave = () => {
      updateUserProfile({ firstName, lastName, email, dob, image });
      onBack();
  };

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
       <header className="sticky top-0 z-20 bg-background/95 backdrop-blur-md px-6 py-4 flex items-center justify-between border-b border-slate-200/50">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="size-10 -ml-2 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors text-text-main">
                <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold text-text-main">Personal Info</h1>
        </div>
        <button onClick={handleSave} className="text-primary font-bold text-sm">Save</button>
      </header>

      <div className="flex flex-col items-center py-8">
        <div className="relative mb-6 group">
             <div 
               className="size-32 rounded-full bg-cover bg-center shadow-soft border-4 border-white" 
               style={{
                 backgroundImage: userProfile.image ? `url("${userProfile.image}")` : 'none',
                 backgroundColor: userProfile.image ? 'transparent' : '#E5E7EB'
               }}
             >
               {!userProfile.image && (
                 <div className="w-full h-full flex items-center justify-center text-text-tertiary">
                   <span className="material-symbols-outlined text-6xl">account_circle</span>
                 </div>
               )}
             </div>
             <button className="absolute bottom-0 right-0 size-10 bg-primary text-white rounded-full border-4 border-background flex items-center justify-center shadow-sm hover:scale-105 transition-transform">
                 <span className="material-symbols-outlined text-[20px]">photo_camera</span>
             </button>
        </div>
      </div>

      <div className="px-6 space-y-6 pb-32 lg:pb-8">
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider ml-1">First Name</label>
                      <input 
                        type="text" 
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="w-full p-4 rounded-xl bg-white border border-gray-100 font-medium text-text-main outline-none focus:border-primary/50 transition-colors"
                      />
                  </div>
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider ml-1">Last Name</label>
                      <input 
                        type="text" 
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full p-4 rounded-xl bg-white border border-gray-100 font-medium text-text-main outline-none focus:border-primary/50 transition-colors"
                      />
                  </div>
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider ml-1">Date of Birth</label>
                  <input 
                    type="date" 
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white border border-gray-100 font-medium text-text-main outline-none focus:border-primary/50 transition-colors"
                  />
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-bold text-text-tertiary uppercase tracking-wider ml-1">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-4 rounded-xl bg-white border border-gray-100 font-medium text-text-main outline-none focus:border-primary/50 transition-colors"
                  />
              </div>
          </div>
      </div>
    </div>
  );
};