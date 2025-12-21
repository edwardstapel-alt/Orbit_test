// Google Sync Service
// Handles bi-directional sync with Google Calendar, Tasks, and Contacts

export interface SyncConfig {
  id: string;
  service: 'google_calendar' | 'google_tasks' | 'google_contacts';
  enabled: boolean;
  direction: 'import' | 'export' | 'bidirectional';
  autoSync: boolean;
  syncInterval?: number; // minutes
  filters?: {
    calendars?: string[]; // For Google Calendar
    taskLists?: string[]; // For Google Tasks
  };
  conflictResolution: 'app_wins' | 'external_wins' | 'last_write_wins' | 'manual';
}

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsDeleted: number;
  conflicts: Conflict[];
  errors: SyncError[];
  timestamp: string;
}

export interface Conflict {
  id: string;
  entityType: 'task' | 'timeSlot' | 'friend' | 'objective';
  entityId: string;
  appValue: any;
  externalValue: any;
  differences: FieldDifference[];
  service: 'google_calendar' | 'google_tasks' | 'google_contacts';
}

export interface FieldDifference {
  field: string;
  appValue: any;
  externalValue: any;
}

export interface SyncError {
  entityId?: string;
  entityType?: string;
  message: string;
  service: 'google_calendar' | 'google_tasks' | 'google_contacts';
}

// Get access token from localStorage
export const getAccessToken = (): string | null => {
  const token = localStorage.getItem('orbit_google_token');
  const expiry = localStorage.getItem('orbit_google_token_expiry');
  
  if (!token || !expiry) return null;
  
  // Check if token is expired
  if (Date.now() > parseInt(expiry)) {
    // Token expired, need to refresh
    return null;
  }
  
  return token;
};

// Check if Google is connected
export const isGoogleConnected = (): boolean => {
  return localStorage.getItem('orbit_google_sync') === 'true' && getAccessToken() !== null;
};

// Google Calendar Sync Functions

/**
 * Export Time Slot to Google Calendar Event
 */
export const exportTimeSlotToCalendar = async (
  timeSlot: any,
  accessToken: string,
  calendarId: string = 'primary'
): Promise<{ success: boolean; eventId?: string; error?: string }> => {
  try {
    const startDateTime = new Date(`${timeSlot.date}T${timeSlot.startTime}`);
    const endDateTime = new Date(`${timeSlot.date}T${timeSlot.endTime}`);
    
    // Build description with links to Goals/Life Areas
    let description = '';
    if (timeSlot.objectiveId) {
      description += `Goal: ${timeSlot.objectiveId}\n`;
    }
    if (timeSlot.lifeAreaId) {
      description += `Life Area: ${timeSlot.lifeAreaId}\n`;
    }
    
    const event = {
      summary: timeSlot.title,
      description: description.trim() || undefined,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      colorId: getColorIdForTimeSlotType(timeSlot.type),
      // Recurring event support
      ...(timeSlot.recurring && {
        recurrence: [buildRecurrenceRule(timeSlot.recurring)],
      }),
    };

    const url = timeSlot.googleCalendarEventId
      ? `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${timeSlot.googleCalendarEventId}`
      : `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

    const method = timeSlot.googleCalendarEventId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, eventId: data.id };
  } catch (error: any) {
    console.error('Error exporting Time Slot to Calendar:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export Task to Google Calendar Event (optional)
 */
export const exportTaskToCalendar = async (
  task: any,
  accessToken: string,
  calendarId: string = 'primary'
): Promise<{ success: boolean; eventId?: string; error?: string }> => {
  try {
    if (!task.scheduledDate) {
      return { success: false, error: 'Task has no scheduled date' };
    }

    const isAllDay = task.allDay || !task.scheduledTime;
    
    let startDateTime: Date;
    let endDateTime: Date;

    if (isAllDay) {
      startDateTime = new Date(task.scheduledDate);
      endDateTime = new Date(task.scheduledDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
    } else {
      const timeStr = task.scheduledTime || '09:00';
      startDateTime = new Date(`${task.scheduledDate}T${timeStr}`);
      endDateTime = new Date(startDateTime);
      endDateTime.setMinutes(endDateTime.getMinutes() + (task.duration || 60));
    }

    // Build description
    let description = '';
    if (task.description) description += `${task.description}\n\n`;
    if (task.objectiveId) description += `Goal: ${task.objectiveId}\n`;
    if (task.lifeAreaId) description += `Life Area: ${task.lifeAreaId}\n`;
    if (task.keyResultId) description += `Key Result: ${task.keyResultId}\n`;

    const event: any = {
      summary: task.title,
      description: description.trim() || undefined,
    };

    if (isAllDay) {
      event.start = { date: task.scheduledDate };
      event.end = { date: task.scheduledDate };
    } else {
      event.start = {
        dateTime: startDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
      event.end = {
        dateTime: endDateTime.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      };
    }

    const url = task.calendarEventId
      ? `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${task.calendarEventId}`
      : `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

    const method = task.calendarEventId ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, eventId: data.id };
  } catch (error: any) {
    console.error('Error exporting Task to Calendar:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Export Goal Deadline to Google Calendar
 */
export const exportGoalDeadlineToCalendar = async (
  objective: any,
  accessToken: string,
  calendarId: string = 'primary'
): Promise<{ success: boolean; eventId?: string; error?: string }> => {
  try {
    if (!objective.endDate) {
      return { success: false, error: 'Goal has no end date' };
    }

    const deadlineDate = new Date(objective.endDate);
    deadlineDate.setHours(9, 0, 0, 0); // Set to 9 AM

    const event = {
      summary: `Deadline: ${objective.title}`,
      description: `Goal deadline for: ${objective.title}\n${objective.description || ''}`,
      start: {
        dateTime: deadlineDate.toISOString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: new Date(deadlineDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 day before
          { method: 'popup', minutes: 60 }, // 1 hour before
        ],
      },
    };

    const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `Calendar API error: ${response.status}`);
    }

    const data = await response.json();
    return { success: true, eventId: data.id };
  } catch (error: any) {
    console.error('Error exporting Goal Deadline to Calendar:', error);
    return { success: false, error: error.message };
  }
};

// Google Tasks Sync Functions

/**
 * Get available task lists from Google Tasks
 */
export const getGoogleTaskLists = async (
  accessToken: string
): Promise<{ success: boolean; taskLists?: any[]; error?: string }> => {
  try {
    const response = await fetch('https://tasks.googleapis.com/tasks/v1/users/@me/lists', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Tasks API error: ${response.status}`;
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.error?.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return { success: true, taskLists: data.items || [] };
  } catch (error: any) {
    console.error('Error fetching Google Task Lists:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

/**
 * Export Task to Google Tasks
 */
export const exportTaskToGoogleTasks = async (
  task: any,
  accessToken: string,
  taskListId: string = '@default'
): Promise<{ success: boolean; taskId?: string; error?: string }> => {
  try {
    console.log('Exporting task to Google Tasks:', task);
    
    // Google Tasks API requires specific format
    const googleTask: any = {
      title: task.title || 'Untitled Task',
      status: task.completed ? 'completed' : 'needsAction',
    };

    // Add notes/description if available (field name is 'notes' not 'description')
    if (task.description) {
      googleTask.notes = task.description;
    }

    // Add due date if scheduled
    // Google Tasks API expects due date in RFC3339 format: YYYY-MM-DDTHH:MM:SS.000Z
    // OR just the date part: YYYY-MM-DD
    if (task.scheduledDate) {
      // Use just the date part (YYYY-MM-DD) for simplicity
      // Google Tasks will interpret this as midnight UTC
      googleTask.due = `${task.scheduledDate}T00:00:00.000Z`;
    }

    const url = task.googleTaskId
      ? `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${task.googleTaskId}`
      : `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`;

    const method = task.googleTaskId ? 'PUT' : 'POST';

    console.log('Google Tasks API Request:', {
      method,
      url,
      body: googleTask,
      taskListId
    });

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(googleTask),
    });

    const responseText = await response.text();
    console.log('Google Tasks API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      responseText: responseText
    });

    if (!response.ok) {
      console.error('Google Tasks API Error Response:', responseText);
      let errorMessage = `Tasks API error: ${response.status}`;
      try {
        const error = JSON.parse(responseText);
        errorMessage = error.error?.message || errorMessage;
        console.error('Parsed error:', error);
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Google Tasks API Success Response (parsed):', data);
      console.log('Task ID from response:', data.id);
      console.log('Full response data:', JSON.stringify(data, null, 2));
      
      // Log all fields in the response
      console.log('Response fields:', Object.keys(data));
      console.log('Response title:', data.title);
      console.log('Response status:', data.status);
    } catch (e) {
      console.error('Failed to parse response as JSON:', responseText);
      throw new Error('Invalid JSON response from Google Tasks API');
    }

    // Google Tasks API returns the task with an 'id' field
    // But sometimes it might be in a different format
    const taskId = data.id || data.taskId || null;
    
    if (!taskId) {
      console.error('⚠️ WARNING: No task ID in response!', data);
      console.error('Response structure:', JSON.stringify(data, null, 2));
      
      // Even if no ID, the task might have been created
      // Return success but log a warning
      return { 
        success: false, 
        error: 'No task ID returned from Google Tasks API. Response: ' + JSON.stringify(data) 
      };
    }

    console.log('✅ Task successfully created with ID:', taskId);
    return { success: true, taskId: taskId };
  } catch (error: any) {
    console.error('Error exporting Task to Google Tasks:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

// Google Contacts Sync Functions

/**
 * Export Friend to Google Contacts
 */
export const exportFriendToGoogleContacts = async (
  friend: any,
  accessToken: string
): Promise<{ success: boolean; contactId?: string; error?: string }> => {
  try {
    const contact = {
      names: [
        {
          givenName: friend.name.split(' ')[0] || friend.name,
          familyName: friend.name.split(' ').slice(1).join(' ') || '',
        },
      ],
      photos: friend.image
        ? [
            {
              url: friend.image,
            },
          ]
        : [],
      emailAddresses: friend.email
        ? [
            {
              value: friend.email,
            },
          ]
        : [],
      phoneNumbers: friend.phone
        ? [
            {
              value: friend.phone,
            },
          ]
        : [],
      biographies: friend.role
        ? [
            {
              value: friend.role,
            },
          ]
        : [],
    };

    const url = friend.googleContactId
      ? `https://people.googleapis.com/v1/${friend.googleContactId}:updateContact`
      : 'https://people.googleapis.com/v1/people:createContact';

    const method = friend.googleContactId ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contact),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `People API error: ${response.status}`);
    }

    const data = await response.json();
    const contactId = data.resourceName || friend.googleContactId;
    return { success: true, contactId };
  } catch (error: any) {
    console.error('Error exporting Friend to Google Contacts:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Import Google Contacts
 */
export const importGoogleContacts = async (
  accessToken: string
): Promise<{ success: boolean; contacts?: any[]; error?: string }> => {
  try {
    // First, try to get contacts with pagination
    let allContacts: any[] = [];
    let nextPageToken: string | undefined = undefined;
    
    do {
      let url = 'https://people.googleapis.com/v1/people/me/connections?personFields=names,photos,emailAddresses,phoneNumbers,addresses,biographies&pageSize=100';
      if (nextPageToken) {
        url += `&pageToken=${nextPageToken}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `People API error: ${response.status}`;
        try {
          const error = JSON.parse(errorText);
          errorMessage = error.error?.message || errorMessage;
        } catch (e) {
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (data.connections) {
        allContacts = allContacts.concat(data.connections);
      }
      nextPageToken = data.nextPageToken;
    } while (nextPageToken);
    
    return { success: true, contacts: allContacts };
  } catch (error: any) {
    console.error('Error importing Google Contacts:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
};

// Helper Functions

const getColorIdForTimeSlotType = (type: string): string => {
  const colorMap: { [key: string]: string } = {
    'deep-work': '9', // Blue
    'goal-work': '10', // Green
    'life-area': '11', // Yellow
    'meeting': '6', // Orange
    'personal': '3', // Purple
  };
  return colorMap[type] || '1';
};

const buildRecurrenceRule = (recurring: any): string => {
  const frequency = recurring.frequency.toUpperCase();
  const endDate = recurring.endDate
    ? `;UNTIL=${recurring.endDate.replace(/-/g, '')}`
    : '';
  return `RRULE:FREQ=${frequency}${endDate}`;
};

