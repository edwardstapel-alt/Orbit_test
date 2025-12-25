import { EntityType, Task, Habit, KeyResult } from '../../types';

export const getDefaultFormData = (
  type: EntityType,
  dayParts: any[],
  contextObjectiveId?: string,
  contextLifeAreaId?: string
): any => {
  const today = new Date().toISOString().split('T')[0];
  const defaultTime = '17:00';
  const autoDayPart = getDayPartFromTime(defaultTime, dayParts);

  switch (type) {
    case 'task':
      return {
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
        dayPart: autoDayPart,
      };

    case 'habit':
      return {
        name: '',
        icon: 'star',
        streak: 0,
        time: 'Daily',
        linkedKeyResultId: '',
        progressContribution: 1,
        objectiveId: contextObjectiveId || '',
        lifeAreaId: contextLifeAreaId || '',
        targetFrequency: 7,
        category: 'Personal',
        color: '#8B5CF6',
        weeklyProgress: [false, false, false, false, false, false, false],
        createdAt: new Date().toISOString(),
      };

    case 'friend':
      return { name: '', role: 'Friend', roleType: 'friend', location: '' };

    case 'timeSlot':
      const storedDate = localStorage.getItem('orbit_newTimeSlot_date');
      const timeSlotDate = storedDate || today;
      if (storedDate) localStorage.removeItem('orbit_newTimeSlot_date');
      return {
        title: '',
        date: timeSlotDate,
        startTime: '09:00',
        endTime: '17:00',
        description: '',
      };

    case 'objective':
      return {
        title: '',
        description: '',
        category: '',
        status: 'On Track',
        startDate: today,
        endDate: '',
        timelineColor: '#D95829',
        lifeAreaId: '',
        owner: '',
        ownerImage: '',
      };

    case 'keyResult':
      return {
        title: '',
        current: 0,
        target: 100,
        measurementType: 'percentage',
        currency: 'EUR',
        decimals: 0,
        status: 'On Track',
        startDate: today,
        endDate: '',
        owner: '',
        ownerImage: '',
      };

    case 'place':
      return { name: '', address: '', type: 'Coffee', rating: '5.0' };

    case 'lifeArea':
      return {
        name: '',
        icon: 'star',
        color: '#D95829',
        description: '',
      };

    case 'vision':
      return {
        title: '',
        description: '',
        timeframe: 'Long-term',
      };

    default:
      return {};
  }
};

const getDayPartFromTime = (time: string, dayParts: any[]): string => {
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


