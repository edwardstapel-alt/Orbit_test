import React, { useState } from 'react';
import { useData } from '../context/DataContext';

interface MapDiscoveryProps {
  onEdit: (type: any) => void;
}

export const MapDiscovery: React.FC<MapDiscoveryProps> = ({ onEdit }) => {
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const { places, deletePlace } = useData();

  const toggleSheet = () => setShowSaveSheet(!showSaveSheet);

  const handleFilter = (filter: string) => {
    setActiveFilter(activeFilter === filter ? '' : filter);
    setSearchQuery(activeFilter === filter ? '' : `Searching for ${filter}...`);
  };

  const handleDelete = (id: string) => {
      if(window.confirm("Remove this place?")) deletePlace(id);
  }

  return (
    <div className="relative h-screen w-full flex flex-col bg-[#e6eae8]">
      {/* Map Layer */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div className="w-full h-full bg-cover bg-center opacity-80 mix-blend-multiply filter grayscale-[0.5] contrast-[1.05]" 
             style={{backgroundImage: 'url("https://picsum.photos/id/175/800/1200")'}}>
        </div>
        
        {/* Fake Markers for demo */}
        <button onClick={toggleSheet} className="absolute top-[45%] left-[55%] flex flex-col items-center gap-2 group z-10 transition-transform hover:scale-110 focus:outline-none">
          <div className="relative flex items-center justify-center size-12 rounded-full bg-primary shadow-lg text-white border-4 border-white animate-bounce">
            <span className="material-symbols-outlined text-[22px]">local_cafe</span>
          </div>
        </button>
      </div>

      {/* Top Search */}
      <div className="relative z-10 flex flex-col pointer-events-none w-full max-w-md mx-auto h-full">
        <div className="pt-14 px-5 pb-2 w-full flex flex-col gap-4">
          <div className="pointer-events-auto flex items-center gap-3 w-full">
            <label className="flex flex-1 items-center h-[52px] bg-white rounded-full shadow-soft pl-5 pr-1 transition-all focus-within:ring-2 focus-within:ring-primary/20 border border-gray-200">
              <span className="material-symbols-outlined text-text-tertiary">search</span>
              <input 
                className="w-full bg-transparent border-none focus:ring-0 text-text-main placeholder:text-text-tertiary text-[15px] font-medium px-3 leading-normal focus:outline-none" 
                placeholder="Find places in Orbit..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="size-9 flex items-center justify-center rounded-full bg-background text-text-secondary hover:bg-gray-200 transition-colors">
                <span className="material-symbols-outlined text-[18px]">tune</span>
              </button>
            </label>
            <button onClick={() => onEdit('place')} className="pointer-events-auto shrink-0 size-[52px] rounded-full bg-primary text-white shadow-soft p-1 overflow-hidden border border-white flex items-center justify-center">
              <span className="material-symbols-outlined">add</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Sheet for Location Detail / List */}
      <div className={`absolute bottom-[80px] left-0 right-0 z-40 flex flex-col justify-end pointer-events-none px-4 transition-all duration-300 ${showSaveSheet ? 'translate-y-0' : 'translate-y-[85%]'}`}>
          <div className="w-full bg-white rounded-3xl shadow-floating pointer-events-auto transform flex flex-col border border-white/50 max-h-[60vh] overflow-hidden">
            <div className="flex flex-col items-center pt-3 pb-1 w-full cursor-grab active:cursor-grabbing bg-white border-b border-gray-100" onClick={toggleSheet}>
                 <div className="h-1.5 w-10 rounded-full bg-gray-200"></div>
                 <span className="text-xs font-bold text-text-tertiary uppercase mt-2">Saved Places</span>
            </div>

            <div className="px-5 pb-6 space-y-4 overflow-y-auto pt-4">
                {places.length === 0 && <div className="text-center text-text-tertiary text-sm">No saved places yet.</div>}
                {places.map((place) => (
                    <div key={place.id} className="flex gap-4 items-start border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                        <div className="h-16 w-16 shrink-0 rounded-2xl bg-gray-100 flex items-center justify-center text-text-secondary">
                             <span className="material-symbols-outlined">{place.type === 'Coffee' ? 'local_cafe' : 'place'}</span>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h3 className="text-text-main text-lg font-bold leading-tight truncate">{place.name}</h3>
                        <p className="text-text-secondary text-sm font-normal leading-normal">{place.address}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-[11px] font-bold text-primary">{place.rating} ★</span>
                            <span className="text-[11px] text-text-tertiary">{place.type}</span>
                        </div>
                        </div>
                        <button onClick={() => handleDelete(place.id)} className="text-gray-300 hover:text-red-500"><span className="material-symbols-outlined">delete</span></button>
                    </div>
                ))}
            </div>
          </div>
        </div>
    </div>
  );
};
