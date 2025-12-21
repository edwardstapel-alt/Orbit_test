import React from 'react';

interface TopNavProps {
  title: string;
  subtitle?: string;
  onProfileClick: () => void;
  onMenuClick: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ title, subtitle, onProfileClick, onMenuClick }) => {
  return (
    <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md px-6 pt-6 pb-2 flex items-center justify-between transition-all duration-300 border-b border-transparent">
      <button 
        className="flex items-center justify-center p-2 -ml-2 text-text-main rounded-full hover:bg-black/5 transition-colors"
        onClick={onMenuClick}
      >
        <span className="material-symbols-outlined text-[24px]">menu</span>
      </button>

      <div className="flex flex-col items-center">
        <h1 className="text-lg font-bold tracking-tight text-text-main leading-tight">{title}</h1>
        {subtitle && <span className="text-xs font-medium text-text-tertiary">{subtitle}</span>}
      </div>

      <button 
        onClick={onProfileClick} 
        className="relative group cursor-pointer transition-transform active:scale-95"
      >
         <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 ring-2 ring-white shadow-sm" 
              style={{backgroundImage: 'url("https://picsum.photos/id/64/200/200")'}}>
         </div>
      </button>
    </header>
  );
};