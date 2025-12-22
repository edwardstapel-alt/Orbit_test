import React from 'react';
import { useData } from '../context/DataContext';

interface TopNavProps {
  title: string;
  subtitle?: string;
  onProfileClick: () => void;
  onMenuClick: () => void;
  onBack?: () => void;
  showBack?: boolean;
  onSearchClick?: () => void;
  showSearch?: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({ title, subtitle, onProfileClick, onMenuClick, onBack, showBack, onSearchClick, showSearch = true }) => {
  const { userProfile } = useData();
  
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-6 md:px-12 lg:px-16 pt-6 pb-2 flex items-center justify-between transition-all duration-300 border-b border-transparent">
      {showBack && onBack ? (
        <button 
          className="flex items-center justify-center p-2 -ml-2 text-text-main rounded-full hover:bg-black/5 transition-colors"
          onClick={onBack}
        >
          <span className="material-symbols-outlined text-[24px]">arrow_back</span>
        </button>
      ) : (
      <button 
        className="flex items-center justify-center p-2 -ml-2 text-text-main rounded-full hover:bg-black/5 transition-colors"
        onClick={onMenuClick}
      >
        <span className="material-symbols-outlined text-[24px]">menu</span>
      </button>
      )}

      <div className="flex flex-col items-center">
        <h1 className="text-lg font-bold tracking-tight text-text-main leading-tight">{title}</h1>
        {subtitle && <span className="text-xs font-medium text-text-tertiary">{subtitle}</span>}
      </div>

      <div className="flex items-center gap-2">
        {showSearch && onSearchClick && (
          <button 
            onClick={onSearchClick} 
            className="flex items-center justify-center p-2 text-text-main rounded-full hover:bg-black/5 transition-colors"
          >
            <span className="material-symbols-outlined text-[24px]">search</span>
          </button>
        )}
      <button 
        onClick={onProfileClick} 
        className="relative group cursor-pointer transition-transform active:scale-95"
      >
         <div 
           className="bg-center bg-no-repeat bg-cover rounded-full size-10 ring-2 ring-white shadow-sm" 
           style={{
             backgroundImage: userProfile.image ? `url("${userProfile.image}")` : 'none',
             backgroundColor: userProfile.image ? 'transparent' : '#E5E7EB'
           }}
         >
           {!userProfile.image && (
             <div className="w-full h-full flex items-center justify-center text-text-tertiary">
               <span className="material-symbols-outlined text-2xl">account_circle</span>
             </div>
           )}
         </div>
      </button>
      </div>
    </header>
  );
};