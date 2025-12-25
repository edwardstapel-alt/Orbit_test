import React, { useState, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { EntityType, Task, Habit, Friend, Objective, KeyResult, Place, LifeArea, Vision, TimeSlot, View } from '../types';
import { QuickLinkSelector } from '../components/QuickLinkSelector';
import { ReminderEditor } from '../components/ReminderEditor';
import { HabitScheduleSelector } from '../components/HabitScheduleSelector';
import { getAllTemplates, createHabitFromTemplate } from '../utils/habitTemplates';
import { getTaskTemplates, createTaskFromTemplate as createTaskFromTemplateUtil } from '../utils/taskTemplates';
import { getObjectiveTemplates, getObjectiveTemplatesByCategory, createObjectiveFromTemplate as createObjectiveFromTemplateUtil } from '../utils/objectiveTemplates';
import { TaskFormSection } from '../components/Editor/TaskFormSection';
import { HabitFormSection } from '../components/Editor/HabitFormSection';
import { FriendFormSection } from '../components/Editor/FriendFormSection';
import { LifeAreaFormSection } from '../components/Editor/LifeAreaFormSection';
import { VisionFormSection } from '../components/Editor/VisionFormSection';
import { TimeSlotFormSection } from '../components/Editor/TimeSlotFormSection';
import { ObjectiveFormSection } from '../components/Editor/ObjectiveFormSection';
import { KeyResultFormSection } from '../components/Editor/KeyResultFormSection';
import { handleEditorSave } from '../utils/editor/editorSaveHandler';
import { getEditorTitle } from '../utils/editor/editorHelpers';

interface EditorProps {
  type: EntityType;
  editId?: string;
  parentId?: string; // For creating child Key Results
  contextObjectiveId?: string; // For linking habits to objectives
  contextLifeAreaId?: string; // For linking habits to life areas
  fromTemplate?: boolean; // For loading template data when creating from template
  onClose: () => void;
  onNavigate?: (view: View, objectiveId?: string, lifeAreaId?: string) => void; // For navigation after save
  onEdit?: (type: EntityType, id?: string, parentId?: string) => void; // For creating related items
}

export const Editor: React.FC<EditorProps> = ({ type, editId, parentId, contextObjectiveId, contextLifeAreaId, fromTemplate, onClose, onNavigate, onEdit }) => {
  const data = useData();
  
  // Helper to check if key result has status updates
  const hasKeyResultStatusUpdates = (krId: string) => {
    const updates = data.getStatusUpdatesByKeyResult(krId);
    return updates.length > 0;
  };

  // Helper to check if objective has any status updates (via its key results)
  const hasObjectiveStatusUpdates = (objId: string) => {
    const linkedKRs = data.keyResults.filter(kr => kr.objectiveId === objId);
    return linkedKRs.some(kr => {
      const updates = data.getStatusUpdatesByKeyResult(kr.id);
      return updates.length > 0;
    });
  };

  // Get effective status (No status if no updates exist)
  const getEffectiveStatus = (status: string, entityId: string, isKeyResult: boolean = false) => {
    const hasUpdates = isKeyResult 
      ? hasKeyResultStatusUpdates(entityId)
      : hasObjectiveStatusUpdates(entityId);
    return hasUpdates ? status : 'No status';
  };

  const getStatusBadge = (status: string) => {
    if (status === 'On Track') return 'bg-green-100 text-green-700';
    if (status === 'At Risk') return 'bg-amber-100 text-amber-700';
    if (status === 'No status') return 'bg-gray-100 text-gray-600';
    return 'bg-red-100 text-red-700';
  };

  const getStatusColor = (status: string) => {
    if (status === 'On Track') return 'bg-green-400';
    if (status === 'At Risk') return 'bg-amber-400';
    if (status === 'No status') return 'bg-gray-400';
    return 'bg-red-400';
  };
  const [formData, setFormData] = useState<any>({});
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [showLifeAreaModal, setShowLifeAreaModal] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showObjectiveTemplateSelector, setShowObjectiveTemplateSelector] = useState(false);
  const [showLinkKeyResultModal, setShowLinkKeyResultModal] = useState(false);
  const [showReminderEditor, setShowReminderEditor] = useState(false);
  const [showRecurringOptions, setShowRecurringOptions] = useState(false);
  const [showScheduleSelector, setShowScheduleSelector] = useState(false);
  const [generateAsTasks, setGenerateAsTasks] = useState(false);
  const [habitSchedule, setHabitSchedule] = useState<{
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    interval?: number;
  } | null>(null);
  const [templateKeyResults, setTemplateKeyResults] = useState<Partial<KeyResult>[]>([]);
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);

  // Helper function to determine dayPart from time
  const getDayPartFromTime = (time: string, dayParts: any[]): string => {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    
    // Sort dayParts by order to check in correct sequence
    const sortedParts = [...dayParts].sort((a, b) => a.order - b.order).filter(p => p.startTime && p.endTime);
    
    // Find the dayPart that matches this time
    for (const part of sortedParts) {
      const [startHours, startMinutes] = part.startTime.split(':').map(Number);
      const [endHours, endMinutes] = part.endTime.split(':').map(Number);
      const startInMinutes = startHours * 60 + startMinutes;
      const endInMinutes = endHours * 60 + endMinutes;
      
      // Check if time falls within this range (inclusive start, exclusive end)
      // For the last part (Evening), include the end time
      if (timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes) {
        return part.name;
      }
      // Special case: if time equals end time and it's the last part, include it
      if (timeInMinutes === endInMinutes && part === sortedParts[sortedParts.length - 1]) {
        return part.name;
      }
    }
    
    return ''; // Default to empty if no match
  };

  // Generate tasks from habit schedule
  const generateTasksFromHabit = (habit: Habit, schedule: {
    frequency: 'daily' | 'weekly' | 'monthly';
    daysOfWeek?: number[];
    interval?: number;
  }) => {
    const tasks: Task[] = [];
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + 30); // Generate for next 30 days
    
    let currentDate = new Date(today);
    
    while (currentDate <= endDate) {
      let shouldCreate = false;
      
      if (schedule.frequency === 'daily') {
        shouldCreate = true;
      } else if (schedule.frequency === 'weekly') {
        const dayOfWeek = currentDate.getDay();
        // Convert Sunday (0) to 0, Monday (1) to 1, etc.
        const dayIndex = dayOfWeek === 0 ? 0 : dayOfWeek;
        if (schedule.daysOfWeek && schedule.daysOfWeek.includes(dayIndex)) {
          shouldCreate = true;
        }
      } else if (schedule.frequency === 'monthly') {
        // Monthly: same day of month
        const dayOfMonth = currentDate.getDate();
        if (dayOfMonth === today.getDate()) {
          shouldCreate = true;
        }
      }
      
      if (shouldCreate) {
        const task: Task = {
          id: `${habit.id}-task-${currentDate.toISOString().split('T')[0]}`,
          title: habit.name,
          tag: habit.category || 'Habit',
          completed: false,
          scheduledDate: currentDate.toISOString().split('T')[0],
          scheduledTime: habit.recurring?.reminderTime || undefined,
          objectiveId: habit.objectiveId,
          lifeAreaId: habit.lifeAreaId,
          keyResultId: habit.linkedKeyResultId,
          recurring: {
            pattern: schedule.frequency === 'daily' ? 'daily' : schedule.frequency === 'weekly' ? 'weekly' : 'monthly',
            daysOfWeek: schedule.daysOfWeek,
            interval: schedule.interval || 1,
            parentTaskId: habit.id
          }
        };
        tasks.push(task);
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Add all generated tasks
    tasks.forEach(task => {
      data.addTask(task);
    });
  };

  // Get primary owner (user with role 'You')
  const getPrimaryOwner = () => {
    const primaryOwner = data.teamMembers.find(m => m.role === 'You');
    if (primaryOwner) {
      return { name: primaryOwner.name, image: primaryOwner.image };
    }
    // Fallback to first team member or user profile
    if (data.teamMembers.length > 0) {
      return { name: data.teamMembers[0].name, image: data.teamMembers[0].image };
    }
    // Last fallback to user profile
    return { 
      name: `${data.userProfile.firstName} ${data.userProfile.lastName}`.trim() || 'You', 
      image: data.userProfile.image || '' 
    };
  };

  // Get single team member owner (if there's only 1 team member, use that one)
  const getSingleTeamMemberOwner = () => {
    if (data.teamMembers.length === 1) {
      const singleMember = data.teamMembers[0];
      return { name: singleMember.name, image: singleMember.image };
    }
    return null;
  };

  useEffect(() => {
    if (editId) {
      let existingItem;
      if (type === 'task') existingItem = data.tasks.find(t => t.id === editId);
      if (type === 'habit') {
        existingItem = data.habits.find(h => h.id === editId);
        if (existingItem) {
          setFormData({ ...existingItem });
          // Load schedule if exists
          if (existingItem.recurring) {
            setHabitSchedule({
              frequency: existingItem.recurring.frequency,
              daysOfWeek: existingItem.recurring.daysOfWeek,
              interval: 1
            });
          } else {
            setHabitSchedule(null);
          }
        }
      }
      if (type === 'friend') existingItem = data.friends.find(f => f.id === editId);
      if (type === 'objective') existingItem = data.objectives.find(o => o.id === editId);
      if (type === 'keyResult') {
        existingItem = data.keyResults.find(k => k.id === editId);
        if (existingItem) {
          // Migrate legacy unit field to measurementType if needed
          const migrated = { ...existingItem };
          if (!migrated.measurementType) {
            if (migrated.unit === '%' || migrated.unit === 'percentage') {
              migrated.measurementType = 'percentage';
            } else if (migrated.unit && ['$', '€', 'EUR', 'USD', 'GBP'].includes(migrated.unit)) {
              migrated.measurementType = 'currency';
              migrated.currency = migrated.unit === '€' || migrated.unit === 'EUR' ? 'EUR' : migrated.unit === '$' || migrated.unit === 'USD' ? 'USD' : 'EUR';
            } else {
              migrated.measurementType = 'number';
            }
            if (migrated.decimals === undefined) {
              migrated.decimals = migrated.measurementType === 'currency' ? 2 : 0;
            }
          }
          setFormData(migrated);
        }
      }
      if (type === 'place') existingItem = data.places.find(p => p.id === editId);
      if (type === 'lifeArea') existingItem = data.lifeAreas.find(l => l.id === editId);
      if (type === 'vision') existingItem = data.visions.find(v => v.id === editId);
      if (type === 'timeSlot') existingItem = data.timeSlots.find(ts => ts.id === editId);
      
      if (existingItem && type !== 'keyResult') setFormData({ ...existingItem });
    } else {
        // Defaults
        const primaryOwner = getPrimaryOwner();
        if (type === 'task') {
          const today = new Date().toISOString().split('T')[0];
          const defaultTime = '17:00';
          // Auto-determine dayPart based on time
          const autoDayPart = getDayPartFromTime(defaultTime, data.dayParts);
          setFormData({ 
            title: '', 
            tag: 'Work', 
            time: '', 
            priority: false, 
            friendId: '',
            keyResultId: '',
            objectiveId: '',
            lifeAreaId: '',
            scheduledDate: today,
            scheduledTime: defaultTime,
            dayPart: autoDayPart
          });
        }
        if (type === 'habit') {
          setFormData({ 
            name: '', 
            icon: 'star', 
            streak: 0, 
            time: 'Daily', 
            linkedKeyResultId: '',
            progressContribution: 1, // Default contribution value
            objectiveId: contextObjectiveId || '',
            lifeAreaId: contextLifeAreaId || '',
            targetFrequency: 7,
            category: 'Personal',
            color: '#8B5CF6',
            weeklyProgress: [false, false, false, false, false, false, false],
            createdAt: new Date().toISOString()
          });
          setHabitSchedule(null);
          setGenerateAsTasks(false);
        }
        if (type === 'friend') setFormData({ name: '', role: 'Friend', roleType: 'friend', location: '' });
        if (type === 'timeSlot') {
          const storedDate = localStorage.getItem('orbit_newTimeSlot_date');
          const today = storedDate || new Date().toISOString().split('T')[0];
          if (storedDate) localStorage.removeItem('orbit_newTimeSlot_date');
          setFormData({ 
            title: '', 
            date: today,
            startTime: '09:00',
            endTime: '10:00',
            type: 'deep-work',
            color: '#D95829'
          });
        }
        if (type === 'objective') {
          const storedLifeAreaId = localStorage.getItem('orbit_newObjective_lifeAreaId');
          const defaultLifeAreaId = storedLifeAreaId || contextLifeAreaId || (data.lifeAreas.length > 0 ? data.lifeAreas[0].id : '');
          if (storedLifeAreaId) localStorage.removeItem('orbit_newObjective_lifeAreaId');
          
          const selectedTemplateId = localStorage.getItem('orbit_selectedTemplateId');
          
          // Load template if: we're creating new (not editing) AND (fromTemplate is true OR there's a selectedTemplateId)
          // AND we haven't loaded a template yet (prevents double-loading in React Strict Mode)
          if (!editId && !loadedTemplateId && (fromTemplate || selectedTemplateId)) {
            const templateIdToLoad = selectedTemplateId;
            if (templateIdToLoad) {
              const allTemplates = getObjectiveTemplates(data.objectiveTemplates);
              const template = allTemplates.find(t => t.id === templateIdToLoad);
              if (template) {
                const objectiveFromTemplate = createObjectiveFromTemplateUtil(template, defaultLifeAreaId);
                setLoadedTemplateId(templateIdToLoad);
                // Check if template has keyResults (may be in different property names)
                const templateKRs = (template as any).keyResults || (template as any).key_results || [];
                if (templateKRs && templateKRs.length > 0) {
                  setTemplateKeyResults(templateKRs);
                } else {
                  setTemplateKeyResults([]);
                }
                // Don't remove template ID here - it will be removed when saving or closing
                // This prevents issues with React Strict Mode double-rendering
                setFormData({ 
                  ...objectiveFromTemplate,
                  lifeAreaId: defaultLifeAreaId || objectiveFromTemplate.lifeAreaId
                });
              } else {
          const today = new Date();
          const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
          setFormData({ 
            title: '', 
            description: '', 
            status: 'On Track', 
            category: 'professional', 
            owner: primaryOwner.name, 
            ownerImage: primaryOwner.image,
            startDate: today.toISOString().split('T')[0], 
            endDate: nextYear.toISOString().split('T')[0],
            progress: 0,
            lifeAreaId: defaultLifeAreaId
          });
                setTemplateKeyResults([]); // Reset if template not found
                setLoadedTemplateId(null);
                localStorage.removeItem('orbit_selectedTemplateId');
              }
            } else {
              // fromTemplate is true but no templateId found - this shouldn't happen
              const today = new Date();
              const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
              setFormData({ 
                title: '', 
                description: '', 
                status: 'On Track', 
                category: 'professional', 
                owner: primaryOwner.name, 
                ownerImage: primaryOwner.image,
                startDate: today.toISOString().split('T')[0], 
                endDate: nextYear.toISOString().split('T')[0],
                progress: 0,
                lifeAreaId: defaultLifeAreaId
              });
              setTemplateKeyResults([]);
              setLoadedTemplateId(null);
            }
          } else {
            // No template, use defaults
            const today = new Date();
            const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
            setFormData({ 
              title: '', 
              description: '', 
              status: 'On Track', 
              category: 'professional', 
              owner: primaryOwner.name, 
              ownerImage: primaryOwner.image,
              startDate: today.toISOString().split('T')[0], 
              endDate: nextYear.toISOString().split('T')[0],
              progress: 0,
              lifeAreaId: defaultLifeAreaId
            });
            setTemplateKeyResults([]); // Reset if no template
            if (selectedTemplateId) localStorage.removeItem('orbit_selectedTemplateId');
          }
        }
        if (type === 'keyResult') {
          const today = new Date();
          const nextYear = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
          const primaryOwner = getPrimaryOwner();
          // Als er een parent objective is, gebruik de owner daarvan, anders primary owner
          const parentObjective = parentId ? data.objectives.find(o => o.id === parentId) : null;
          setFormData({ 
            title: '', 
            objectiveId: parentId || '', 
            current: 0, 
            target: 100, 
            measurementType: 'percentage',
            currency: 'EUR',
            decimals: 0,
            status: 'On Track',
            startDate: today.toISOString().split('T')[0],
            endDate: nextYear.toISOString().split('T')[0],
            owner: parentObjective?.owner || primaryOwner?.name || '',
            ownerImage: parentObjective?.ownerImage || primaryOwner?.image || ''
          });
        }
        if (type === 'place') setFormData({ name: '', address: '', type: 'Coffee', rating: '5.0' });
        if (type === 'lifeArea') {
          const nextOrder = data.lifeAreas.length > 0 
            ? Math.max(...data.lifeAreas.map(la => la.order)) + 1 
            : 0;
          setFormData({ 
            name: '', 
            icon: 'category', 
            color: '#D95829', 
            description: '', 
            image: '', 
            order: nextOrder 
          });
        }
        if (type === 'vision') {
          const storedLifeAreaId = localStorage.getItem('orbit_newVision_lifeAreaId');
          const defaultLifeAreaId = storedLifeAreaId || (data.lifeAreas.length > 0 ? data.lifeAreas[0].id : '');
          if (storedLifeAreaId) localStorage.removeItem('orbit_newVision_lifeAreaId');
          setFormData({ 
            lifeAreaId: defaultLifeAreaId,
            statement: '',
            images: []
          });
          
          // If fromTemplate is true, show template selector immediately
          if (fromTemplate && !editId) {
            setTimeout(() => setShowObjectiveTemplateSelector(true), 100);
          }
        }
    }
  }, [editId, type, parentId, fromTemplate, data.teamMembers, data.userProfile, data.objectiveTemplates, contextLifeAreaId]);

  // Cleanup: remove template ID when Editor closes (only if not saved)
  useEffect(() => {
    return () => {
      // Clean up template ID when component unmounts (Editor closes without saving)
      // Only remove if we haven't saved yet (loadedTemplateId is still set)
      const selectedTemplateId = localStorage.getItem('orbit_selectedTemplateId');
      if (selectedTemplateId && loadedTemplateId) {
        localStorage.removeItem('orbit_selectedTemplateId');
      }
    };
  }, [loadedTemplateId]);

  const handleChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    handleEditorSave({
      type,
      formData,
      editId,
      parentId,
      loadedTemplateId,
      templateKeyResults,
      data,
      getSingleTeamMemberOwner,
      onClose,
      onNavigate,
      setLoadedTemplateId,
      setTemplateKeyResults,
    });
  };

  const handleDelete = () => {
    if (!editId) return;
    if (window.confirm("Are you sure you want to delete this item?")) {
        // Get entity data before deleting for navigation
        let lifeAreaId: string | undefined;
        let objectiveId: string | undefined;
    
    if (type === 'objective') {
          const objective = data.objectives.find(o => o.id === editId);
          lifeAreaId = objective?.lifeAreaId;
          data.deleteObjective(editId);
        } else if (type === 'keyResult') {
          const keyResult = data.keyResults.find(kr => kr.id === editId);
          objectiveId = keyResult?.objectiveId;
          // Get lifeAreaId from parent objective if available
          if (objectiveId) {
            const parentObjective = data.objectives.find(o => o.id === objectiveId);
            lifeAreaId = parentObjective?.lifeAreaId;
          }
          data.deleteKeyResult(editId);
        } else if (type === 'task') {
          data.deleteTask(editId);
        } else if (type === 'habit') {
          data.deleteHabit(editId);
        } else if (type === 'friend') {
          data.deleteFriend(editId);
        } else if (type === 'place') {
          data.deletePlace(editId);
        } else if (type === 'lifeArea') {
          data.deleteLifeArea(editId);
        } else if (type === 'timeSlot') {
          data.deleteTimeSlot(editId);
        } else if (type === 'vision') {
          data.deleteVision(editId);
        }
        
        onClose();
        
        // Navigate to appropriate view after deletion
        if (onNavigate) {
          if (type === 'objective') {
            // Navigate to Life Area detail if available, otherwise to Dashboard
            if (lifeAreaId) {
              setTimeout(() => {
                onNavigate(View.LIFE_AREA_DETAIL, undefined, lifeAreaId);
              }, 100);
      } else {
              setTimeout(() => {
                onNavigate(View.DASHBOARD);
              }, 100);
            }
          } else if (type === 'keyResult') {
            // Navigate back to Objective Detail if available, otherwise to Dashboard
            if (objectiveId) {
        setTimeout(() => {
                onNavigate(View.OBJECTIVE_DETAIL, objectiveId);
        }, 100);
            } else if (lifeAreaId) {
              setTimeout(() => {
                onNavigate(View.LIFE_AREA_DETAIL, undefined, lifeAreaId);
              }, 100);
            } else {
              setTimeout(() => {
                onNavigate(View.DASHBOARD);
              }, 100);
            }
      } else {
            // For other types, just navigate to Dashboard
            setTimeout(() => {
              onNavigate(View.DASHBOARD);
            }, 100);
          }
        }
    }
  };

  const renderTitle = () => getEditorTitle(type, editId);

  const isOKR = type === 'objective' || type === 'keyResult';

  return (
    <div className="fixed inset-0 z-[55] bg-background flex flex-col animate-fade-in">
      <header className={`px-6 py-4 flex items-center justify-between backdrop-blur-md border-b border-gray-100 ${isOKR ? 'bg-white' : 'bg-white/50'}`}>
        <button onClick={onClose} className="text-text-secondary font-medium hover:bg-gray-100 px-3 py-1 rounded-full transition-colors">Cancel</button>
        <h1 className="text-base font-bold text-text-main uppercase tracking-wider">{renderTitle()}</h1>
        <button onClick={handleSave} className="text-white bg-primary hover:bg-primary-soft px-5 py-2 rounded-full font-bold shadow-glow transition-all active:scale-95">Save</button>
      </header>
      
      <div className="flex-1 overflow-y-auto bg-gray-50/50 pb-32 lg:pb-8">
        <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        
        {/* TASK FORM */}
        {type === 'task' && (
          <TaskFormSection
            formData={formData}
            onFieldChange={handleChange}
            data={{
              keyResults: data.keyResults,
              objectives: data.objectives,
              lifeAreas: data.lifeAreas,
              friends: data.friends,
              timeSlots: data.timeSlots,
              dayParts: data.dayParts,
            }}
                            contextObjectiveId={contextObjectiveId}
            contextLifeAreaId={contextLifeAreaId}
            onEdit={onEdit}
                        />
        )}

        {/* HABIT FORM */}
        {type === 'habit' && (
          <HabitFormSection
            formData={formData}
            onFieldChange={handleChange}
            data={{
              keyResults: data.keyResults,
              objectives: data.objectives,
              lifeAreas: data.lifeAreas,
              formatKeyResultValue: data.formatKeyResultValue,
            }}
                          contextObjectiveId={contextObjectiveId}
            contextLifeAreaId={contextLifeAreaId}
            editId={editId}
            habitSchedule={habitSchedule}
            generateAsTasks={generateAsTasks}
            onScheduleClick={() => setShowScheduleSelector(true)}
            onTemplateClick={() => setShowTemplateSelector(true)}
            onGenerateTasksChange={setGenerateAsTasks}
            onEdit={onEdit}
          />
        )}

        {/* OBJECTIVE FORM */}
        {type === 'objective' && (
          <ObjectiveFormSection
            formData={formData}
            onFieldChange={handleChange}
            editId={editId}
            data={{
              lifeAreas: data.lifeAreas,
              teamMembers: data.teamMembers,
              keyResults: data.keyResults,
              showCategory: data.showCategory,
              formatKeyResultValue: data.formatKeyResultValue,
            }}
            showLifeAreaModal={showLifeAreaModal}
            setShowLifeAreaModal={setShowLifeAreaModal}
            showOwnerModal={showOwnerModal}
            setShowOwnerModal={setShowOwnerModal}
            showObjectiveTemplateSelector={showObjectiveTemplateSelector}
            setShowObjectiveTemplateSelector={setShowObjectiveTemplateSelector}
            loadedTemplateId={loadedTemplateId}
            templateKeyResults={templateKeyResults}
            setTemplateKeyResults={setTemplateKeyResults}
            getEffectiveStatus={getEffectiveStatus}
            onEdit={onEdit}
          />
        )}

        {/* KEY RESULT FORM */}
        {type === 'keyResult' && (
          <KeyResultFormSection
            formData={formData}
            onFieldChange={handleChange}
            editId={editId}
            parentId={parentId}
            data={{
              teamMembers: data.teamMembers,
            }}
            showOwnerModal={showOwnerModal}
            setShowOwnerModal={setShowOwnerModal}
          />
        )}

        {/* FRIEND FORM */}
        {type === 'friend' && (
            <div className="space-y-6">
                {/* VERPLICHT: Name */}
                <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100 flex flex-col items-center gap-4">
                    <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-1">Friend's Name <span className="text-red-500">*</span></label>
                     <div className="size-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                         <span className="material-symbols-outlined text-[40px] text-gray-300">person_add</span>
                     </div>
                     <input type="text" className="w-full text-center text-2xl font-bold bg-transparent outline-none placeholder:text-gray-300" 
                        value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} placeholder="New Friend's Name" autoFocus required />
                </div>

                <div className="space-y-4">
                     {/* OPTIONEEL: Relationship Type */}
                     <div className="bg-white p-4 rounded-2xl border border-slate-100">
                        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Relationship Type (Optional)</label>
                        <div className="flex flex-wrap gap-2">
                            {['friend', 'professional', 'family', 'mentor'].map(role => (
                                <button key={role} onClick={() => handleChange('roleType', role)} className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-colors ${formData.roleType === role ? 'bg-primary text-white' : 'bg-gray-50 text-text-secondary'}`}>
                                    {role}
                                </button>
                            ))}
                        </div>
                     </div>
                     {/* OPTIONEEL: Label */}
                     <div className="bg-white p-4 rounded-2xl border border-slate-100">
                        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Label (Optional)</label>
                        <input type="text" className="w-full bg-gray-50 p-3 rounded-xl outline-none font-medium" 
                            value={formData.role || ''} onChange={(e) => handleChange('role', e.target.value)} placeholder="e.g. Bestie, Gym Buddy" />
                     </div>
                     {/* OPTIONEEL: Location */}
                     <div className="bg-white p-4 rounded-2xl border border-slate-100">
                        <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Location (Optional)</label>
                        <input type="text" className="w-full bg-gray-50 p-3 rounded-xl outline-none font-medium" 
                            value={formData.location || ''} onChange={(e) => handleChange('location', e.target.value)} placeholder="e.g. San Francisco" />
                     </div>
                </div>
            </div>
        )}

         {/* LIFE AREA FORM */}
         {type === 'lifeArea' && (
            <div className="space-y-6 animate-fade-in-up">
                {/* Hero Card */}
                <div className="bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl shadow-soft border border-white">
                    <div className="flex items-center gap-4 mb-4">
                        {/* Icon Preview */}
                        <div 
                            className="relative size-20 rounded-2xl flex items-center justify-center shrink-0"
                            style={{ 
                                backgroundColor: formData.image ? 'transparent' : `${formData.color || '#D95829'}20`,
                                backgroundImage: formData.image ? `url("${formData.image}")` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center'
                            }}
                        >
                            {!formData.image && (
                                <span 
                                    className="material-symbols-outlined text-4xl"
                                    style={{ color: formData.color || '#D95829' }}
                                >
                                    {formData.icon || 'category'}
                                </span>
                            )}
                            <div 
                                className="absolute bottom-0 right-0 size-4 rounded-full border-2 border-white"
                                style={{ backgroundColor: formData.color || '#D95829' }}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-2">
                                Life Area Name
                            </label>
                            <input 
                                type="text" 
                                className="w-full text-2xl font-bold bg-transparent outline-none placeholder:text-gray-300" 
                                value={formData.name || ''} 
                                onChange={(e) => handleChange('name', e.target.value)} 
                                placeholder="e.g. Health, Career, Family" 
                                autoFocus 
                            />
                        </div>
                    </div>
                    <textarea 
                        className="w-full mt-4 text-base font-medium text-text-secondary bg-transparent outline-none placeholder:text-gray-400 resize-none"
                        rows={2}
                        value={formData.description || ''} 
                        onChange={(e) => handleChange('description', e.target.value)} 
                        placeholder="Add a description (optional)..." 
                    />
                </div>

                {/* OPTIONEEL: Icon Selection */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Icon (Optional)</label>
                    <div className="flex gap-2 mb-3">
                        <input 
                            type="text" 
                            className="flex-1 p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main" 
                            value={formData.icon || ''} 
                            onChange={(e) => handleChange('icon', e.target.value)} 
                            placeholder="e.g. fitness_center, work, family_restroom" 
                        />
                        <a 
                            href="https://fonts.google.com/icons" 
                            target="_blank" 
                            className="px-4 py-3 bg-gray-100 text-text-secondary rounded-xl font-medium hover:bg-gray-200 transition-colors"
                        >
                            Find
                        </a>
                    </div>
                    <div className="grid grid-cols-6 gap-2">
                        {['category', 'fitness_center', 'work', 'family_restroom', 'school', 'favorite', 'savings', 'travel', 'restaurant', 'home', 'spa', 'sports_soccer'].map(icon => (
                            <button
                                key={icon}
                                onClick={() => handleChange('icon', icon)}
                                className={`p-3 rounded-xl border-2 transition-all ${
                                    formData.icon === icon 
                                        ? 'border-primary bg-primary/10' 
                                        : 'border-gray-100 hover:border-gray-200'
                                }`}
                            >
                                <span 
                                    className="material-symbols-outlined text-2xl"
                                    style={{ color: formData.icon === icon ? formData.color || '#D95829' : '#9CA3AF' }}
                                >
                                    {icon}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* OPTIONEEL: Color Selection */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Color (Optional)</label>
                    
                    {/* Predefined Colors */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                        {[
                            '#D95829', '#3B82F6', '#10B981', '#8B5CF6', 
                            '#EC4899', '#14B8A6', '#F59E0B', '#EF4444'
                        ].map(color => (
                            <button
                                key={color}
                                onClick={() => handleChange('color', color)}
                                className={`size-12 rounded-xl border-2 transition-all flex items-center justify-center ${
                                    formData.color === color 
                                        ? 'border-gray-900 scale-110 shadow-lg' 
                                        : 'border-gray-200 hover:scale-105'
                                }`}
                                style={{ backgroundColor: color }}
                            >
                                {formData.color === color && (
                                    <span className="material-symbols-outlined text-white text-xl">check</span>
                                )}
                            </button>
                        ))}
                    </div>
                    
                    {/* Custom Color */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-text-secondary">Custom Color</span>
                        </div>
                        <div className="flex items-center gap-3">
                        <input 
                            type="color" 
                                className="size-12 rounded-xl cursor-pointer border-2 border-gray-200" 
                            value={formData.color || '#D95829'} 
                            onChange={(e) => handleChange('color', e.target.value)} 
                        />
                            <input
                                type="text"
                                className="flex-1 p-2 bg-gray-50 rounded-xl border border-gray-200 outline-none focus:border-primary text-sm font-mono"
                                value={(formData.color || '#D95829').toUpperCase()}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9A-F]/gi, '').slice(0, 6);
                                    if (value.length === 6) {
                                        handleChange('color', '#' + value);
                                    } else if (value.length === 0) {
                                        handleChange('color', '#D95829');
                                    }
                                }}
                                placeholder="#D95829"
                            />
                        </div>
                    </div>
                </div>

                {/* OPTIONEEL: Image URL */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                    <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">Image URL (Optional)</label>
                    <p className="text-xs text-text-tertiary mb-2">Add a custom image URL to replace the icon</p>
                    <input 
                        type="text" 
                        className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main" 
                        value={formData.image || ''} 
                        onChange={(e) => handleChange('image', e.target.value)} 
                        placeholder="https://..." 
                    />
                    <p className="text-xs text-text-tertiary mt-2">Add a custom image URL to replace the icon</p>
                </div>
            </div>
        )}

         {/* VISION FORM */}
         {type === 'vision' && (
            <div className="space-y-6 animate-fade-in-up">
                {/* VERPLICHT: Vision Statement */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">lightbulb</span>
                        Vision Statement <span className="text-red-500">*</span>
                    </label>
                    <textarea 
                        className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-text-main placeholder:text-gray-400 resize-none leading-relaxed" 
                        rows={6}
                        value={formData.statement || ''} 
                        onChange={(e) => handleChange('statement', e.target.value)} 
                        placeholder="Describe your vision for this Life Area. What does success look like? What do you want to achieve? How do you want to feel?" 
                        autoFocus 
                    />
                    <p className="text-xs text-text-tertiary mt-3">
                        This is your "Why" - the deeper purpose that drives your goals in this Life Area.
                    </p>
                </div>

                {/* VERPLICHT: Life Area Selection (only if creating new vision) */}
                {!editId && data.lifeAreas.length > 0 && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-2">Life Area <span className="text-red-500">*</span></label>
                        <select 
                            className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main appearance-none" 
                            value={formData.lifeAreaId || ''} 
                            onChange={(e) => handleChange('lifeAreaId', e.target.value)}
                        >
                            <option value="">Select Life Area</option>
                            {data.lifeAreas.map(la => (
                                <option key={la.id} value={la.id}>{la.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                {/* Vision Images (Optional) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-4">Vision Images (Optional)</label>
                    <p className="text-xs text-text-secondary mb-4">
                        Add images that represent your vision. These can be inspirational photos, goals, or visual reminders.
                    </p>
                    
                    {/* Image URLs List */}
                    <div className="space-y-3">
                        {(formData.images || []).map((img: string, index: number) => (
                            <div key={index} className="flex items-center gap-3">
                                <div className="size-20 rounded-xl bg-gray-100 bg-cover bg-center flex-shrink-0" style={{ backgroundImage: `url("${img}")` }}>
                                    {!img && (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <span className="material-symbols-outlined text-gray-400">image</span>
                                        </div>
                                    )}
                                </div>
                                <input 
                                    type="text" 
                                    className="flex-1 p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main text-sm" 
                                    value={img} 
                                    onChange={(e) => {
                                        const newImages = [...(formData.images || [])];
                                        newImages[index] = e.target.value;
                                        handleChange('images', newImages);
                                    }} 
                                    placeholder="Image URL..." 
                                />
                                <button
                                    onClick={() => {
                                        const newImages = (formData.images || []).filter((_: any, i: number) => i !== index);
                                        handleChange('images', newImages);
                                    }}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xl">delete</span>
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Add Image Button */}
                    <button
                        onClick={() => {
                            const newImages = [...(formData.images || []), ''];
                            handleChange('images', newImages);
                        }}
                        className="w-full mt-4 p-4 border-2 border-dashed border-gray-200 rounded-xl text-text-tertiary hover:border-primary/50 hover:text-primary transition-colors flex items-center justify-center gap-2"
                    >
                        <span className="material-symbols-outlined">add_photo_alternate</span>
                        <span className="text-sm font-medium">Add Image</span>
                    </button>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-600 text-xl">info</span>
                        <div>
                            <h4 className="text-sm font-bold text-blue-900 mb-1">Why Define a Vision?</h4>
                            <p className="text-xs text-blue-800 leading-relaxed">
                                Your vision is your North Star. It helps you stay focused on what truly matters and makes decision-making easier. When you're clear on your vision, every goal and task becomes purposeful.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )}

         {/* PLACE FORM */}
         {type === 'place' && (
            <div className="space-y-6">
                 {/* VERPLICHT: Name */}
                 <div className="bg-white p-6 rounded-3xl shadow-soft border border-slate-100">
                     <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Place Name <span className="text-red-500">*</span></label>
                     <div className="flex items-center gap-4 mb-4">
                         <div className="size-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                             <span className="material-symbols-outlined">storefront</span>
                         </div>
                         <input type="text" className="flex-1 text-xl font-bold outline-none placeholder:text-gray-300" 
                            value={formData.name || ''} onChange={(e) => handleChange('name', e.target.value)} placeholder="Place Name" autoFocus required />
                     </div>
                     {/* OPTIONEEL: Address */}
                     <input type="text" className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main mb-4" 
                        value={formData.address || ''} onChange={(e) => handleChange('address', e.target.value)} placeholder="Address or Area (optional)" />
                     {/* OPTIONEEL: Type */}
                     <label className="block text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2">Type (Optional)</label>
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

        {/* TIME SLOT FORM */}
        {type === 'timeSlot' && (
            <div className="space-y-6 animate-fade-in-up">
                {/* VERPLICHT: Title */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Title <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        className="w-full p-4 bg-gray-50 rounded-xl outline-none font-bold text-text-main placeholder:text-gray-400" 
                        value={formData.title || ''} 
                        onChange={(e) => handleChange('title', e.target.value)} 
                        placeholder="e.g. Deep Work Session" 
                        autoFocus 
                        required
                    />
                </div>

                {/* VERPLICHT: Date */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Date <span className="text-red-500">*</span></label>
                    <input 
                        type="date" 
                        className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-text-main" 
                        value={formData.date || ''} 
                        onChange={(e) => handleChange('date', e.target.value)} 
                        required
                    />
                </div>

                {/* VERPLICHT: Start & End Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Start Time <span className="text-red-500">*</span></label>
                        <input 
                            type="time" 
                            className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-text-main" 
                            value={formData.startTime || ''} 
                            onChange={(e) => handleChange('startTime', e.target.value)} 
                            required
                        />
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">End Time <span className="text-red-500">*</span></label>
                        <input 
                            type="time" 
                            className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-text-main" 
                            value={formData.endTime || ''} 
                            onChange={(e) => handleChange('endTime', e.target.value)} 
                            required
                        />
                    </div>
                </div>

                {/* OPTIONEEL: Type */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Type (Optional)</label>
                    <select 
                        className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-text-main" 
                        value={formData.type || 'deep-work'} 
                        onChange={(e) => handleChange('type', e.target.value)}
                    >
                        <option value="deep-work">Deep Work</option>
                        <option value="goal-work">Goal Work</option>
                        <option value="life-area">Life Area</option>
                        <option value="meeting">Meeting</option>
                        <option value="personal">Personal</option>
                    </select>
                </div>

                {/* OPTIONEEL: Color */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Color (Optional)</label>
                    <input 
                        type="color" 
                        className="w-full h-12 rounded-xl cursor-pointer" 
                        value={formData.color || '#D95829'} 
                        onChange={(e) => handleChange('color', e.target.value)} 
                    />
                </div>

                {/* OPTIONEEL: Link to Goals */}
                {data.objectives.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Link to Goals (Optional)</label>
                        <select 
                            className="w-full p-3 bg-gray-50 rounded-xl outline-none font-medium text-text-main appearance-none" 
                            value={formData.keyResultId || ''} 
                            onChange={(e) => {
                              const selectedKRId = e.target.value;
                              handleChange('keyResultId', selectedKRId);
                              
                              // Auto-set objectiveId and lifeAreaId from key result
                              if (selectedKRId) {
                                const selectedKR = data.keyResults.find(kr => kr.id === selectedKRId);
                                if (selectedKR) {
                                  handleChange('objectiveId', selectedKR.objectiveId);
                                  // Find the objective to get its lifeAreaId
                                  const parentObjective = data.objectives.find(obj => obj.id === selectedKR.objectiveId);
                                  if (parentObjective?.lifeAreaId) {
                                    handleChange('lifeAreaId', parentObjective.lifeAreaId);
                                  }
                                }
                              } else {
                                // If key result is cleared, clear objective and life area too
                                handleChange('objectiveId', '');
                                handleChange('lifeAreaId', '');
                              }
                            }}
                        >
                            <option value="">No Key Result</option>
                            {data.keyResults.map(kr => {
                              const parentObj = data.objectives.find(obj => obj.id === kr.objectiveId);
                              return (
                                <option key={kr.id} value={kr.id}>
                                  {kr.title} {parentObj ? `(${parentObj.title})` : ''}
                                </option>
                              );
                            })}
                        </select>
                        <p className="text-xs text-text-tertiary mt-2">Link to a Key Result to automatically connect to its Objective and Life Area</p>
                        
                        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3 mt-4">Link to Goal (Optional)</label>
                        <select 
                            className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-text-main disabled:opacity-50 disabled:cursor-not-allowed" 
                            value={formData.objectiveId || ''} 
                            onChange={(e) => {
                                const selectedObjId = e.target.value;
                                handleChange('objectiveId', selectedObjId);
                                
                                // Auto-set lifeAreaId if objective has one
                                const selectedObj = data.objectives.find(o => o.id === selectedObjId);
                                if (selectedObj?.lifeAreaId) {
                                    handleChange('lifeAreaId', selectedObj.lifeAreaId);
                                }
                                
                                // Clear keyResultId if objective changes (unless it's still valid)
                                if (selectedObjId) {
                                    const currentKR = formData.keyResultId ? data.keyResults.find(kr => kr.id === formData.keyResultId) : null;
                                    if (currentKR && currentKR.objectiveId !== selectedObjId) {
                                        handleChange('keyResultId', '');
                                    }
                                } else {
                                    // If objective is cleared, clear key result too
                                    handleChange('keyResultId', '');
                                }
                            }}
                            disabled={!!formData.keyResultId}
                        >
                            <option value="">No Goal</option>
                            {data.objectives.map(obj => (
                                <option key={obj.id} value={obj.id}>{obj.title}</option>
                            ))}
                        </select>
                        {formData.keyResultId && (
                            <p className="text-xs text-text-tertiary mt-1">Automatically set from Key Result</p>
                        )}
                    </div>
                )}

                {/* OPTIONEEL: Life Area Linkage - Tertiary, disabled if key result or objective is set */}
                {data.lifeAreas.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <label className="block text-xs font-bold text-text-tertiary uppercase tracking-widest mb-3">Link to Life Area (Optional)</label>
                        <p className="text-xs text-text-tertiary mb-2">Automatically set when linking to Key Result or Objective</p>
                        <select 
                            className="w-full p-4 bg-gray-50 rounded-xl outline-none font-medium text-text-main disabled:opacity-50 disabled:cursor-not-allowed" 
                            value={formData.lifeAreaId || ''} 
                            onChange={(e) => handleChange('lifeAreaId', e.target.value)}
                            disabled={!!formData.keyResultId || !!formData.objectiveId}
                        >
                            <option value="">No Life Area</option>
                            {data.lifeAreas.map(la => (
                                <option key={la.id} value={la.id}>{la.name}</option>
                            ))}
                        </select>
                        {(formData.keyResultId || formData.objectiveId) && (
                            <p className="text-xs text-text-tertiary mt-1">Automatically set from {formData.keyResultId ? 'Key Result' : 'Objective'}</p>
                        )}
                    </div>
                )}
            </div>
        )}

        {editId && (
            <button onClick={handleDelete} className="w-full py-4 rounded-2xl border border-red-100 text-red-500 font-bold bg-red-50 hover:bg-red-100 transition-colors mt-8">
                Delete This Item
            </button>
        )}

        </div>
      </div>

      {/* Owner Selection Modal */}
      {(showOwnerModal && (type === 'objective' || type === 'keyResult')) && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowOwnerModal(false)}></div>
          <div className="bg-white w-[90%] max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-fade-in-up">
            <h3 className="text-lg font-bold text-text-main mb-4">Select Owner</h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {/* Primary owner first */}
              {data.teamMembers
                .sort((a, b) => {
                  if (a.role === 'You') return -1;
                  if (b.role === 'You') return 1;
                  return 0;
                })
                .map(member => (
                <button 
                  key={member.id} 
                  onClick={() => {
                    handleChange('owner', member.name);
                    handleChange('ownerImage', member.image);
                    setShowOwnerModal(false);
                  }}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors ${
                    formData.owner === member.name ? 'bg-primary/5 border border-primary/20' : 'border border-transparent'
                  }`}
                >
                  <img src={member.image} alt={member.name} className="size-10 rounded-full" />
                  <div className="text-left flex-1">
                    <p className="font-semibold text-text-main text-sm">{member.name}</p>
                    <p className="text-xs text-text-tertiary">{member.role}</p>
                  </div>
                  {formData.owner === member.name && <span className="material-symbols-outlined text-primary ml-auto">check</span>}
                  {member.role === 'You' && (
                    <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold uppercase ml-2">Primary</span>
                  )}
                </button>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  // Close editor and navigate to team settings
                  // This would require passing a navigate callback, but for now just show message
                  setShowOwnerModal(false);
                  onClose();
                  alert("Go to Settings > Team Settings to add new team members");
                }}
                className="w-full p-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2 text-primary font-semibold text-sm"
              >
                <span className="material-symbols-outlined text-sm">group_add</span>
                <span>Add Team Member</span>
              </button>
              <p className="text-xs text-text-tertiary text-center mt-2">Manage team in Settings</p>
            </div>
          </div>
        </div>
      )}

      {/* Life Area Selection Modal */}
      {showLifeAreaModal && type === 'objective' && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLifeAreaModal(false)}></div>
          <div className="bg-white w-[90%] max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 animate-fade-in-up max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-bold text-text-main mb-4">Select Life Area</h3>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {/* Create New Button */}
              <button
                onClick={() => {
                  setShowLifeAreaModal(false);
                  // Open life area editor
                  onClose();
                  // We need to trigger a new editor for life area
                  // This is a bit tricky - we might need to pass a callback
                  // For now, just close and user can create separately
                  alert("Close this editor and create a new Life Area, then come back to link it.");
                }}
                className="w-full p-4 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-primary">add</span>
                <span className="font-semibold text-primary">Create New Life Area</span>
              </button>
              
              {/* Existing Life Areas */}
              {data.lifeAreas.length > 0 && (
                <>
                  <div className="mb-2">
                    <h4 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">Select Existing</h4>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        handleChange('lifeAreaId', '');
                        setShowLifeAreaModal(false);
                      }}
                      className={`w-full p-4 rounded-xl text-left transition-colors flex items-center gap-3 ${
                        !formData.lifeAreaId 
                          ? 'bg-primary/10 border-2 border-primary' 
                          : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl text-text-tertiary">close</span>
                      <span className="font-semibold text-text-main">No Life Area</span>
                      {!formData.lifeAreaId && (
                        <span className="material-symbols-outlined text-primary ml-auto">check</span>
                      )}
                    </button>
                    {data.lifeAreas.map(la => (
                      <button
                        key={la.id}
                        onClick={() => {
                          handleChange('lifeAreaId', la.id);
                          setShowLifeAreaModal(false);
                        }}
                        className={`w-full p-4 rounded-xl text-left transition-colors flex items-center gap-3 ${
                          formData.lifeAreaId === la.id 
                            ? 'bg-primary/10 border-2 border-primary' 
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        {la.icon && (
                          <span 
                            className="material-symbols-outlined text-xl"
                            style={{ color: la.color }}
                          >
                            {la.icon}
                          </span>
                        )}
                        <span className="font-semibold text-text-main flex-1">{la.name}</span>
                        {formData.lifeAreaId === la.id && (
                          <span className="material-symbols-outlined text-primary">check</span>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
            
            <button 
              onClick={() => setShowLifeAreaModal(false)}
              className="w-full mt-4 py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Link Key Results Modal */}
      {showLinkKeyResultModal && editId && type === 'objective' && (
        <div className="absolute inset-0 z-[80] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowLinkKeyResultModal(false)}></div>
          <div className="bg-white w-[90%] max-w-md rounded-3xl p-6 shadow-2xl relative z-10 animate-fade-in-up max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-bold text-text-main mb-4">Add Key Result</h3>
            
            <div className="flex-1 overflow-y-auto space-y-3">
              {/* Create New Button */}
              <button
                onClick={() => {
                  setShowLinkKeyResultModal(false);
                  onEdit && onEdit('keyResult', undefined, editId);
                }}
                className="w-full mb-4 p-4 rounded-xl bg-primary/10 border-2 border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-primary">add</span>
                <span className="font-semibold text-primary">Create New Key Result</span>
              </button>
              
              {/* Existing Key Results (not yet linked to this Objective) - same logic as ObjectiveDetail */}
              {data.keyResults.filter(kr => kr.objectiveId !== editId).length > 0 && (
                <>
                  <div className="mb-3">
                    <h4 className="text-sm font-bold text-text-tertiary uppercase tracking-wider">Select Existing Key Result</h4>
                  </div>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {data.keyResults.filter(kr => kr.objectiveId !== editId).map(kr => {
                      const percent = Math.min(Math.round((kr.current / kr.target) * 100), 100);
                      const parentObj = data.objectives.find(o => o.id === kr.objectiveId);
                      return (
                        <button
                          key={kr.id}
                          onClick={() => {
                            // Check: Een key result kan niet aan meerdere goals hangen
                            if (kr.objectiveId && kr.objectiveId !== editId) {
                              alert('Deze Key Result is al gekoppeld aan een ander Goal. Een Key Result kan niet aan meerdere Goals gekoppeld worden.');
                              return;
                            }
                            // Update key result to link to this objective
                            data.updateKeyResult({ ...kr, objectiveId: editId });
                            setShowLinkKeyResultModal(false);
                          }}
                          className="w-full p-4 rounded-xl bg-white border-2 border-slate-100 hover:border-primary/30 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <h5 className="font-semibold text-text-main mb-1">{kr.title}</h5>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs text-text-secondary">
                                  {data.formatKeyResultValue(kr, kr.current)} / {data.formatKeyResultValue(kr, kr.target)}
                                </span>
                                <span className="text-xs font-bold text-text-main">{percent}%</span>
                              </div>
                              {parentObj && (
                                <p className="text-[10px] text-text-tertiary">
                                  Currently linked to: {parentObj.title}
                                </p>
                              )}
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${getStatusBadge(getEffectiveStatus(kr.status, kr.id, true))}`}>
                              {getEffectiveStatus(kr.status, kr.id, true)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
              
              {data.keyResults.filter(kr => kr.objectiveId !== editId).length === 0 && (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-text-tertiary mb-2">target</span>
                  <p className="text-sm text-text-tertiary">No other key results available</p>
                  <p className="text-xs text-text-tertiary mt-1">Create a new key result to add it to this objective</p>
                </div>
              )}
            </div>
            
            <button 
              onClick={() => setShowLinkKeyResultModal(false)}
              className="w-full mt-4 py-3 bg-gray-100 text-text-main font-bold rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Template Selector Modal */}
      {/* Task Template Selector Modal */}
      {showTemplateSelector && type === 'task' && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-text-main">Selecteer Task Template</h3>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="text-text-tertiary hover:text-text-main"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getTaskTemplates(data.taskTemplates).map(template => (
                  <div
                    key={template.id}
                    onClick={() => {
                      const taskFromTemplate = createTaskFromTemplateUtil(template);
                      setFormData({ ...formData, ...taskFromTemplate, id: formData.id || taskFromTemplate.id });
                      setShowTemplateSelector(false);
                    }}
                    className="p-4 border border-gray-200 rounded-xl hover:border-primary hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {template.icon && (
                        <div className="size-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="material-symbols-outlined text-text-secondary">{template.icon}</span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h4 className="font-bold text-text-main">{template.name}</h4>
                        {template.description && (
                          <p className="text-xs text-text-tertiary mt-1">{template.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded text-text-secondary">{template.category}</span>
                      {template.usageCount > 0 && (
                        <span className="text-xs text-text-tertiary">{template.usageCount}x gebruikt</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Objective Template Selector Modal */}
      {showObjectiveTemplateSelector && type === 'objective' && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-text-main">Selecteer Goal Template</h3>
              <button
                onClick={() => setShowObjectiveTemplateSelector(false)}
                className="text-text-tertiary hover:text-text-main"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {/* Group by Life Area Category */}
              {['Work & Career', 'Sport & Health', 'Money & Finance', 'Personal Development', 'Fun & Relaxation', 'Education & Learning', 'Family & Friends', 'Love & Relationships', 'Spirituality'].map(category => {
                const categoryTemplates = getObjectiveTemplatesByCategory(category, data.objectiveTemplates);
                if (categoryTemplates.length === 0) return null;
                
                return (
                  <div key={category} className="mb-6">
                    <h4 className="text-sm font-bold text-text-tertiary uppercase tracking-wider mb-3">{category}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {categoryTemplates.map(template => (
                        <div
                          key={template.id}
                          onClick={() => {
                            const objectiveFromTemplate = createObjectiveFromTemplateUtil(template, formData.lifeAreaId);
                            setFormData({ ...formData, ...objectiveFromTemplate, id: formData.id || objectiveFromTemplate.id });
                            setShowObjectiveTemplateSelector(false);
                          }}
                          className="p-4 border border-gray-200 rounded-xl hover:border-primary hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="size-10 rounded-lg bg-gray-100 flex items-center justify-center">
                              <span className="material-symbols-outlined text-text-secondary">{template.icon}</span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-text-main text-sm">{template.name}</h4>
                              {template.description && (
                                <p className="text-xs text-text-tertiary mt-1 line-clamp-2">{template.description}</p>
                              )}
                            </div>
                          </div>
                          {template.usageCount > 0 && (
                            <span className="text-xs text-text-tertiary">{template.usageCount}x gebruikt</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showScheduleSelector && type === 'habit' && (
        <HabitScheduleSelector
          schedule={habitSchedule}
          onScheduleChange={(schedule) => {
            setHabitSchedule(schedule);
            setShowScheduleSelector(false);
          }}
          onClose={() => setShowScheduleSelector(false)}
        />
      )}

      {showScheduleSelector && type === 'habit' && (
        <HabitScheduleSelector
          schedule={habitSchedule}
          onScheduleChange={(schedule) => {
            setHabitSchedule(schedule);
            setShowScheduleSelector(false);
          }}
          onClose={() => setShowScheduleSelector(false)}
        />
      )}

      {showTemplateSelector && type === 'habit' && (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-text-main">Selecteer Template</h3>
              <button
                onClick={() => setShowTemplateSelector(false)}
                className="text-text-tertiary hover:text-text-main"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getAllTemplates().map(template => (
                  <div
                    key={template.id}
                    onClick={() => {
                      const habitFromTemplate = createHabitFromTemplate(template, {
                        objectiveId: contextObjectiveId || formData.objectiveId || '',
                        lifeAreaId: contextLifeAreaId || formData.lifeAreaId || '',
                      });
                      setFormData(habitFromTemplate);
                      setShowTemplateSelector(false);
                    }}
                    className="p-4 border border-gray-200 rounded-xl hover:border-primary hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div
                        className="size-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: template.color ? `${template.color}20` : '#f3f4f6' }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ color: template.color || '#6b7280' }}
                        >
                          {template.icon}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-text-main">{template.name}</h4>
                        <p className="text-xs text-text-tertiary">{template.category}</p>
                      </div>
                    </div>
                    {template.description && (
                      <p className="text-sm text-text-tertiary mt-2">{template.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};