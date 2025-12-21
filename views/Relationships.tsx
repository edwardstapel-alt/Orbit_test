import React, { useState } from 'react';
import { Friend, View } from '../types';
import { useData } from '../context/DataContext';
import { TopNav } from '../components/TopNav';

interface RelationshipsProps {
  onFriendSelect: (friend: Friend) => void;
  onNavigate: (view: View) => void;
  onEdit: (type: any, id?: string) => void;
  onMenuClick: () => void;
  onProfileClick: () => void;
}

export const Relationships: React.FC<RelationshipsProps> = ({ onFriendSelect, onNavigate, onEdit, onMenuClick, onProfileClick }) => {
  const [filter, setFilter] = useState<'all' | 'friend' | 'professional'>('all');
  const { friends } = useData();

  const getTagStyle = (type: string) => {
    switch (type) {
      case 'friend': return 'bg-primary/10 text-primary border-primary/20';
      case 'mentor': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'professional': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'gym': return 'bg-orange-50 text-orange-700 border-orange-100';
      default: return 'bg-gray-100 text-text-secondary border-gray-200';
    }
  };

  const filteredFriends = friends.filter(friend => {
    if (filter === 'all') return true;
    if (filter === 'friend') return friend.roleType === 'friend';
    if (filter === 'professional') return friend.roleType === 'professional' || friend.roleType === 'mentor';
    return true;
  });

  return (
    <div className="flex flex-col w-full h-full bg-background min-h-screen">
       <TopNav 
        title="My Orbit" 
        onMenuClick={onMenuClick}
        onProfileClick={onProfileClick} 
      />
      
      {/* Sub-toolbar for Map/Search */}
      <div className="px-6 pb-2 pt-2 flex items-center justify-between gap-3 bg-background">
         <div className="flex items-center gap-2">
            <button onClick={() => onNavigate(View.MAP)} className="h-10 px-4 rounded-full bg-white hover:bg-gray-100 transition-colors text-primary shadow-sm border border-gray-100 flex items-center gap-2">
                <span className="material-symbols-outlined filled text-[18px]">map</span>
                <span className="text-xs font-bold uppercase">Map</span>
            </button>
            <button className="size-10 flex items-center justify-center rounded-full bg-white hover:bg-gray-100 transition-colors text-text-main shadow-sm border border-gray-100">
                <span className="material-symbols-outlined">search</span>
            </button>
        </div>
      </div>
      
      <div className="sticky top-[73px] z-20 bg-background/95 backdrop-blur-sm pt-2 pb-6 px-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 w-max">
          <button 
            onClick={() => setFilter('all')}
            className={`flex items-center justify-center px-6 h-10 rounded-full text-sm font-medium shadow-sm transition-all transform active:scale-95 border ${filter === 'all' ? 'bg-primary text-white border-transparent shadow-soft' : 'bg-white border-gray-100 text-text-secondary hover:bg-gray-50'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('friend')}
            className={`flex items-center justify-center px-6 h-10 rounded-full text-sm font-medium shadow-sm transition-all transform active:scale-95 border ${filter === 'friend' ? 'bg-primary text-white border-transparent shadow-soft' : 'bg-white border-gray-100 text-text-secondary hover:bg-gray-50'}`}
          >
            Close Friend
          </button>
          <button 
            onClick={() => setFilter('professional')}
            className={`flex items-center justify-center px-6 h-10 rounded-full text-sm font-medium shadow-sm transition-all transform active:scale-95 border ${filter === 'professional' ? 'bg-primary text-white border-transparent shadow-soft' : 'bg-white border-gray-100 text-text-secondary hover:bg-gray-50'}`}
          >
            Professional
          </button>
        </div>
      </div>

      <main className="flex-1 px-4 py-2 pb-32 space-y-4">
        {filteredFriends.map((friend) => (
          <div 
            key={friend.id} 
            className="group relative flex items-center gap-4 p-4 rounded-3xl bg-white hover:bg-gray-50 shadow-sm hover:shadow-soft border border-white transition-all duration-300 cursor-pointer"
          >
             <div className="relative shrink-0" onClick={() => { onFriendSelect(friend); onNavigate(View.FRIEND_DETAIL); }}>
              <div className="h-16 w-16 rounded-2xl rotate-3 group-hover:rotate-0 transition-transform shadow-sm bg-gray-100 bg-cover bg-center border-2 border-white ring-1 ring-gray-100" style={{backgroundImage: `url(${friend.image})`}}></div>
              {friend.roleType === 'friend' && (
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-sm border border-gray-50">
                  <div className="h-2.5 w-2.5 rounded-full bg-primary"></div>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pl-1" onClick={() => { onFriendSelect(friend); onNavigate(View.FRIEND_DETAIL); }}>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-text-main text-lg font-bold truncate tracking-tight">{friend.name}</h3>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getTagStyle(friend.roleType)}`}>
                  {friend.role}
                </span>
              </div>
              <p className="text-text-secondary text-sm font-medium truncate flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-text-tertiary">history</span>
                {friend.lastSeen}
              </p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onEdit('friend', friend.id); }} className="size-8 flex items-center justify-center rounded-full bg-gray-50 text-text-tertiary hover:bg-primary hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[18px]">edit</span>
            </button>
          </div>
        ))}
        {filteredFriends.length === 0 && (
            <div className="py-12 text-center text-text-tertiary">
                <p>No connections found in this category.</p>
            </div>
        )}
        <div className="h-12 w-full flex items-center justify-center opacity-40 pb-4">
          <span className="text-xs text-text-tertiary uppercase tracking-widest font-medium">End of list</span>
        </div>
      </main>

      <button 
        onClick={() => onEdit('friend')}
        className="fixed z-40 bottom-[100px] right-6 h-14 w-14 rounded-full bg-primary text-white shadow-floating flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-white ring-2 ring-primary/20"
      >
        <span className="material-symbols-outlined text-[28px]">add</span>
      </button>
    </div>
  );
};