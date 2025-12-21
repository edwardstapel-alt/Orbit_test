import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { EntityType, Task, Habit, Friend, Objective, KeyResult, Place } from '../types';

interface EditorProps {
  type: EntityType;
  editId?: string;
  parentId?: string; // For creating child Key Results
  onClose: () => void;
}

export const Editor: React.FC<EditorProps> = ({ type, editId, parentId, onClose }) => {
  const data = useData();
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (editId) {
      let existingItem;
      if (type === 'task') existingItem = data.tasks.find(t => t.id === editId);
      if (type === 'habit') existingItem = data.habits.find(h => h.id === editId);
      if (type === 'friend') existingItem = data.friends.find(f => f.id === editId);
      if (type === 'objective') existingItem = data.objectives.find(o => o.id === editId);
      if (type === 'keyResult') existingItem = data.keyResults.find(k => k.id === editId);
      if (type === 'place') existingItem = data.places.find(p => p.id === editId);
      
      if (existingItem) setFormData({ ...existingItem });
    } else {
        // Defaults
        if (type === 'task') setFormData({ title: '', tag: 'Work', time: '', priority: false });
        if (type === 'habit') setFormData({ name: '', icon: 'star', streak: 0, time: 'Daily', linkedKeyResultId: '' });
        if (type === 'friend') setFormData({ name: '', role: 'Friend', roleType: 'friend', location: '' });
        if (type === 'objective') setFormData({ title: '', description: '', status: 'On Track', category: 'professional', owner: 'Alex Morgan', dueDate: 'Q4 2024', progress: 0 });
        if (type === 'keyResult') setFormData({ title: '', objectiveId: parentId || '', current: 0, target: 100, unit: '%', status: 'On Track' });
        if (type === 'place') setFormData({ name: '', address: '', type: 'Coffee', rating: '5.0' });
    }
  }, [editId, type, parentId]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const id = editId || Math.random().toString(36).substr(2, 9);
    const newItem = { ...formData, id };

    // Basic Validation
    if ((type === 'task' && !newItem.title) || (type === 'habit' && !newItem.name) || (type === 'friend' && !newItem.name) || (type === 'objective' && !newItem.title) || (type === 'keyResult' && !newItem.title)) {
        alert("Please fill in the required name/title field.");
        return;
    }

    if (type === 'task') editId ? data.updateTask(newItem as Task) : data.addTask(newItem as Task);
    if (type === 'habit') editId ? data.updateHabit(newItem as Habit) : data.addHabit(newItem as Habit);
    if (type === 'friend') editId ? data.updateFriend({ ...newItem, image: 'https://picsum.photos/200' } as Friend) : data.addFriend({ ...newItem, image: 'https://picsum.photos/200', lastSeen: 'Just now' } as Friend);
    if (type === 'objective') editId ? data.updateObjective({ ...newItem, ownerImage: 'https://picsum.photos/id/64/200/200' } as Objective) : data.addObjective({ ...newItem, ownerImage: 'https://picsum.photos/id/64/200/200' } as Objective);
    if (type === 'keyResult') editId ? data.updateKeyResult(newItem as KeyResult) : data.addKeyResult(newItem as KeyResult);
    if (type === 'place') editId ? alert("Places cannot be edited yet") : data.addPlace(newItem as Place);

    onClose();
  };

  const handleDelete = () => {
    if (!editId) return;
    if (window.confirm("Are you sure you want to delete this item?")) {
        if (type === 'task') data.deleteTask(editId);
        if (type === 'habit') data.deleteHabit(editId);
        if (type === 'friend') data.deleteFriend(editId);
        if (type === 'objective') data.deleteObjective(editId);
        if (type === 'keyResult') data.deleteKeyResult(editId);
        if (type === 'place') data.deletePlace(editId);
        onClose();
    }
  };

  const renderTitle = () => {
      switch(type) {
          case 'task': return editId ? 'Edit Focus Point' : 'New Focus Point';
          case 'habit': return editId ? 'Edit Habit' : 'New Habit';
          case 'friend': return editId ? 'Edit Connection' : 'New Connection';
          case 'objective': return editId ? 'Edit Objective' : 'New Objective';
          case 'keyResult': return editId ? 'Edit Key Result' : 'New Key Result';
          case 'place': return 'Add Place';
      }
  };

  const isOKR = type === 'objective' || type === 'keyResult';

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-fade-in">
      <header className={`px-6 py-4 flex items-center justify-between backdrop-blur-md border-b border-gray-100 ${isOKR ? 'bg-white' : 'bg-white/50'}`}>
        <button onClick={onClose} className="text-text-secondary font-medium hover:bg-gray-100 px-3 py-1 rounded-full transition-colors">Cancel</button>
        <h1 className="text-base font-bold text-text-main uppercase tracking-wider">{renderTitle()}</h1>
        <button onClick={handleSave} className="text-white bg-primary hover:bg-primary-soft px-5 py-2 rounded-full font-bold shadow-glow transition-all active:scale-95">Save</button>
      </header>
      
      <div className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="max-w-md mx-auto p-6 space-y-6">
        
        {/* TASK FORM */}
        {type === 'task' && (
            <div className="space-y-6">
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <input type="text" className="w-full p-4 rounded-xl text-xl font-bold bg-transparent outline-none placeholder:text-gray-300" 
                        value={formData.title || ''} onChange={(e) => handleChange('title', e.target.value)} placeholder="What needs focus?" autoFocus />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Category</label>
                        <select className="w-full bg-transparent font-medium outline-none text-text-main" 
                            value={formData.tag || 'Work'} onChange={(e) => handleChange('tag', e.target.value)}>
                            <option value="Work">Work</option>
                            <option value="Personal">Personal</option>
                            <option value="Health">Health</option>
                            <option value="Family">Family</option>
                            <option value="Finance">Finance</option>
                            <option value="Strategy">Strategy</option>
                        </select>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                         <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Timing</label>
                         <input type="text" className="w-full bg-transparent font-medium outline-none text-text-main" 
                        value={formData.time || ''} onChange={(e) => handleChange('time', e.target.value)} placeholder="e.g. 2:00 PM" />
                    </div>
                </div>

                <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-100 shadow-sm cursor-pointer" onClick={() => handleChange('priority', !formData.priority)}>
                    <div className="flex items-center gap-3">
                         <div className={`size-8 rounded-full flex items-center justify-center ${formData.priority ? 'bg-red-100 text-red-500' : 'bg-gray-100 text-gray-400'}`}>
                            <span className="material-symbols-outlined text-[20px]">priority_high</span>
                         </div>
                         <span className="font-semibold text-text-main">High Priority</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${formData.priority ? 'border-primary bg-primary' : 'border-gray-300'}`}>
                         {formData.priority && <span className="material-symbols-outlined text-white text-[16px] font-bold">check</span>}
                    </div>
                </div>
            </div>
        )}

        {/* HABIT FORM */}
        {type === 'habit' && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 flex flex-col items-center gap-4">
                    <div className="size-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-4xl mb-2">
                        <span className="material-symbols-outlined" style={{fontSize: '40px'}}>{formData.icon || 'star'}</span>
                    </div>
                    <input type="text" className="w-full text-center text-2xl font-bold bg-transparent outline-none placeholder:text-gray-300 border-b border-transparent focus:border-gray-100 pb-2 transition-colors" 
                        value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} placeholder="Name your habit" autoFocus />
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-4">
                    
                    {/* Key Result Linkage */}
                    <div>
                         <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Connect to Goal</label>
                         <select 
                            className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main appearance-none" 
                            value={formData.linkedKeyResultId || ''} 
                            onChange={(e) => handleChange('linkedKeyResultId', e.target.value)}
                         >
                            <option value="">No Connection</option>
                            {data.keyResults.map(kr => (
                                <option key={kr.id} value={kr.id}>{kr.title}</option>
                            ))}
                         </select>
                    </div>

                     <div>
                        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Icon Code</label>
                        <div className="flex gap-2">
                            <input type="text" className="flex-1 p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main" 
                                value={formData.icon || ''} onChange={(e) => handleChange('icon', e.target.value)} placeholder="e.g. water_drop" />
                            <a href="https://fonts.google.com/icons" target="_blank" className="px-4 py-3 bg-gray-100 text-text-secondary rounded-xl font-medium hover:bg-gray-200 transition-colors">
                                Find
                            </a>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Current Streak</label>
                            <input type="number" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main" 
                                value={formData.streak || 0} onChange={(e) => handleChange('streak', parseInt(e.target.value))} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Frequency</label>
                            <input type="text" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main" 
                                value="Daily" disabled />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* OBJECTIVE FORM (OKRs Parent) - REDESIGNED */}
        {type === 'objective' && (
            <div className="space-y-6 animate-fade-in-up">
                
                {/* Hero Card */}
                <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-[2rem] shadow-soft border border-white">
                    <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">flag</span>
                        Objective
                    </label>
                    <textarea 
                        className="w-full text-3xl font-bold bg-transparent outline-none placeholder:text-gray-300 resize-none leading-tight" 
                        rows={2}
                        value={formData.title || ''} 
                        onChange={(e) => handleChange('title', e.target.value)} 
                        placeholder="What do you want to achieve?" 
                        autoFocus 
                    />
                    <input 
                        type="text" 
                        className="w-full mt-4 text-base font-medium text-text-secondary bg-transparent outline-none placeholder:text-gray-400"
                        value={formData.description || ''} 
                        onChange={(e) => handleChange('description', e.target.value)} 
                        placeholder="Add a brief description or 'why'..." 
                    />
                </div>

                {/* Context Switcher */}
                <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-100 flex">
                    {['professional', 'personal'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => handleChange('category', cat)}
                            className={`flex-1 py-3 rounded-xl text-sm font-bold capitalize transition-all ${formData.category === cat ? 'bg-primary/10 text-primary shadow-sm' : 'text-text-tertiary hover:bg-gray-50'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Meta Details */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 group hover:border-primary/20 transition-colors">
                        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Status</label>
                        <select className="w-full bg-transparent font-semibold outline-none text-text-main appearance-none cursor-pointer" 
                            value={formData.status || 'On Track'} onChange={(e) => handleChange('status', e.target.value)}>
                            <option value="On Track">🟢 On Track</option>
                            <option value="At Risk">🟠 At Risk</option>
                            <option value="Off Track">🔴 Off Track</option>
                        </select>
                    </div>
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 group hover:border-primary/20 transition-colors">
                        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Timeline</label>
                        <input type="text" className="w-full bg-transparent font-semibold outline-none text-text-main placeholder:text-gray-300" 
                            value={formData.dueDate || ''} onChange={(e) => handleChange('dueDate', e.target.value)} placeholder="e.g. Q4 2024" />
                    </div>
                </div>

                {/* Owner Card */}
                <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="size-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                        {formData.ownerImage ? <img src={formData.ownerImage} alt="owner" /> : <span className="material-symbols-outlined text-gray-400">person</span>}
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-0.5">Owner</label>
                         <input type="text" className="w-full bg-transparent font-bold text-lg outline-none text-text-main" 
                            value={formData.owner || ''} onChange={(e) => handleChange('owner', e.target.value)} />
                    </div>
                </div>
            </div>
        )}

        {/* KEY RESULT FORM (OKRs Child) - REDESIGNED */}
        {type === 'keyResult' && (
            <div className="space-y-6 animate-fade-in-up">
                 
                {/* Visual Preview */}
                <div className="bg-white p-5 rounded-2xl shadow-soft border border-slate-100 mb-6">
                    <div className="flex justify-between items-start mb-2 opacity-50">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-tertiary">Live Preview</span>
                    </div>
                    <div className="pointer-events-none">
                        <div className="flex justify-between items-start mb-2">
                            <h4 className="text-base font-semibold text-text-main leading-snug flex-1 mr-2">{formData.title || 'Result Title'}</h4>
                            <span className="shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-green-100 text-green-700">{formData.status}</span>
                        </div>
                        <div className="flex items-end justify-between mb-2">
                            <span className="text-xs text-text-secondary font-medium">
                                {formData.current || 0} / <span className="text-text-tertiary">{formData.target || 100} {formData.unit || '%'}</span>
                            </span>
                            <span className="text-xs font-bold text-text-main">
                                {Math.min(Math.round(((formData.current || 0) / (formData.target || 1)) * 100), 100)}%
                            </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-green-500" style={{width: `${Math.min(Math.round(((formData.current || 0) / (formData.target || 1)) * 100), 100)}%`}}></div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">target</span>
                        Measurable Result
                    </label>
                    <input 
                        type="text" 
                        className="w-full text-2xl font-bold bg-transparent outline-none placeholder:text-gray-300" 
                        value={formData.title || ''} 
                        onChange={(e) => handleChange('title', e.target.value)} 
                        placeholder="e.g. Increase NPS to 50" 
                        autoFocus 
                    />
                </div>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                     <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Metrics Configuration</label>
                     
                     <div className="flex items-center gap-4">
                        <div className="flex-1">
                             <label className="block text-[10px] font-bold text-text-tertiary mb-1">Start</label>
                             <input type="number" className="w-full text-xl font-bold border-b border-gray-200 focus:border-primary outline-none py-2 bg-transparent" 
                                value={formData.current || 0} onChange={(e) => handleChange('current', parseFloat(e.target.value))} />
                        </div>
                        <div className="text-gray-300 font-light text-2xl pt-4">/</div>
                        <div className="flex-1">
                             <label className="block text-[10px] font-bold text-text-tertiary mb-1">Target</label>
                             <input type="number" className="w-full text-xl font-bold border-b border-gray-200 focus:border-primary outline-none py-2 bg-transparent" 
                                value={formData.target || 100} onChange={(e) => handleChange('target', parseFloat(e.target.value))} />
                        </div>
                        <div className="flex-1">
                             <label className="block text-[10px] font-bold text-text-tertiary mb-1">Unit</label>
                             <input type="text" className="w-full text-xl font-bold border-b border-gray-200 focus:border-primary outline-none py-2 bg-transparent" 
                                value={formData.unit || '%'} onChange={(e) => handleChange('unit', e.target.value)} placeholder="%" />
                        </div>
                     </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                     <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Initial Status</label>
                     <div className="flex gap-2">
                        {['On Track', 'At Risk', 'Off Track'].map(s => (
                             <button 
                                key={s} 
                                onClick={() => handleChange('status', s)}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-colors ${formData.status === s ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-text-secondary border-transparent'}`}
                             >
                                 {s}
                             </button>
                        ))}
                     </div>
                </div>

                {!editId && parentId && (
                    <div className="flex items-center gap-2 justify-center text-text-tertiary">
                        <span className="material-symbols-outlined text-[16px]">link</span>
                        <span className="text-xs font-medium">Linked to parent Objective</span>
                    </div>
                )}
            </div>
        )}

        {/* FRIEND FORM */}
        {type === 'friend' && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100 flex flex-col items-center gap-4">
                     <div className="size-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                         <span className="material-symbols-outlined text-[40px] text-gray-300">person_add</span>
                     </div>
                     <input type="text" className="w-full text-center text-2xl font-bold bg-transparent outline-none placeholder:text-gray-300" 
                        value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} placeholder="New Friend's Name" autoFocus />
                </div>

                <div className="space-y-4">
                     <div className="bg-white p-4 rounded-2xl border border-gray-100">
                        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Relationship</label>
                        <div className="flex flex-wrap gap-2">
                            {['friend', 'professional', 'family', 'mentor'].map(role => (
                                <button key={role} onClick={() => handleChange('roleType', role)} className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${formData.roleType === role ? 'bg-primary text-white' : 'bg-gray-50 text-text-secondary'}`}>
                                    {role}
                                </button>
                            ))}
                        </div>
                     </div>
                     <div className="bg-white p-4 rounded-2xl border border-gray-100">
                        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Label</label>
                        <input type="text" className="w-full bg-gray-50 p-3 rounded-xl outline-none font-medium" 
                            value={formData.role || ''} onChange={(e) => handleChange('role', e.target.value)} placeholder="e.g. Bestie, Gym Buddy" />
                     </div>
                     <div className="bg-white p-4 rounded-2xl border border-gray-100">
                        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Location</label>
                        <input type="text" className="w-full bg-gray-50 p-3 rounded-xl outline-none font-medium" 
                            value={formData.location || ''} onChange={(e) => handleChange('location', e.target.value)} placeholder="e.g. San Francisco" />
                     </div>
                </div>
            </div>
        )}

         {/* PLACE FORM */}
         {type === 'place' && (
            <div className="space-y-6">
                 <div className="bg-white p-6 rounded-3xl shadow-soft border border-gray-100">
                     <div className="flex items-center gap-4 mb-4">
                         <div className="size-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                             <span className="material-symbols-outlined">storefront</span>
                         </div>
                         <input type="text" className="flex-1 text-xl font-bold outline-none placeholder:text-gray-300" 
                            value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} placeholder="Place Name" autoFocus />
                     </div>
                     <input type="text" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main mb-4" 
                        value={formData.address || ''} onChange={(e) => handleChange('address', e.target.value)} placeholder="Address or Area" />
                     
                     <div className="flex gap-2">
                         {['Coffee', 'Food', 'Gym', 'Park'].map(t => (
                             <button key={t} onClick={() => handleChange('type', t)} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${formData.type === t ? 'bg-text-main text-white' : 'bg-gray-50 text-text-secondary'}`}>
                                 {t}
                             </button>
                         ))}
                     </div>
                 </div>
            </div>
        )}

        {editId && (
            <button onClick={handleDelete} className="w-full py-4 rounded-2xl border border-red-100 text-red-500 font-bold bg-red-50 hover:bg-red-100 transition-colors mt-8">
                Delete This Item
            </button>
        )}

        </div>
      </div>
    </div>
  );
};