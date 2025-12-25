import { EntityType, KeyResult } from '../../types';

export const getStatusBadge = (status: string) => {
  if (status === 'On Track') return 'bg-green-100 text-green-700';
  if (status === 'At Risk') return 'bg-amber-100 text-amber-700';
  if (status === 'No status') return 'bg-gray-100 text-gray-600';
  return 'bg-red-100 text-red-700';
};

export const getStatusColor = (status: string) => {
  if (status === 'On Track') return 'bg-green-400';
  if (status === 'At Risk') return 'bg-amber-400';
  if (status === 'No status') return 'bg-gray-400';
  return 'bg-red-400';
};

export const getDayPartFromTime = (time: string, dayParts: any[]): string => {
  if (!time) return '';
  
  const [hours, minutes] = time.split(':').map(Number);
  const timeInMinutes = hours * 60 + minutes;
  
  const sortedParts = [...dayParts].sort((a, b) => a.order - b.order).filter(p => p.startTime && p.endTime);
  
  for (const part of sortedParts) {
    const [startHours, startMinutes] = part.startTime.split(':').map(Number);
    const [endHours, endMinutes] = part.endTime.split(':').map(Number);
    const startInMinutes = startHours * 60 + startMinutes;
    const endInMinutes = endHours * 60 + endMinutes;
    
    if (timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes) {
      return part.name;
    }
    if (timeInMinutes === endInMinutes && part === sortedParts[sortedParts.length - 1]) {
      return part.name;
    }
  }
  
  return '';
};

export const getEditorTitle = (type: EntityType, editId?: string): string => {
  const titles: Record<EntityType, { new: string; edit: string }> = {
    task: { new: 'New Focus Point', edit: 'Edit Focus Point' },
    habit: { new: 'New Habit', edit: 'Edit Habit' },
    friend: { new: 'New Connection', edit: 'Edit Connection' },
    objective: { new: 'New Objective', edit: 'Edit Objective' },
    keyResult: { new: 'New Key Result', edit: 'Edit Key Result' },
    place: { new: 'Add Place', edit: 'Add Place' },
    lifeArea: { new: 'New Life Area', edit: 'Edit Life Area' },
    vision: { new: 'Define Vision', edit: 'Edit Vision' },
    timeSlot: { new: 'New Time Block', edit: 'Edit Time Block' },
  };
  
  return editId ? titles[type].edit : titles[type].new;
};

export const migrateKeyResultData = (kr: KeyResult): KeyResult => {
  const migrated = { ...kr };
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
  return migrated;
};


