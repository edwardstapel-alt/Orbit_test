/**
 * Notification Scheduler
 * Controleert regelmatig of reminders moeten worden getoond en triggert notificaties
 */

import { Reminder, Notification, EntityType, Task, Habit, Objective, TimeSlot } from '../types';
import { reminderEngine, ReminderCalculation } from './reminderEngine';
import { webNotificationService, NotificationOptions } from './webNotificationService';

export type NotificationCallback = (notification: Notification) => void;
export type EntityGetter = (entityType: EntityType, entityId: string) => Task | Habit | Objective | TimeSlot | null;

class NotificationScheduler {
  private checkInterval: number = 60000; // Check elke minuut (60 seconden)
  private intervalId: number | null = null;
  private entityGetter: EntityGetter | null = null;
  private notificationCallback: NotificationCallback | null = null;
  private processedReminderIds: Set<string> = new Set(); // Track welke reminders al zijn verwerkt

  /**
   * Start de scheduler
   */
  start(
    reminders: Reminder[],
    entityGetter: EntityGetter,
    notificationCallback: NotificationCallback
  ): void {
    this.entityGetter = entityGetter;
    this.notificationCallback = notificationCallback;

    // Stop bestaande interval als die er is
    if (this.intervalId !== null) {
      this.stop();
    }

    // Check direct
    this.checkReminders(reminders);

    // Start interval
    this.intervalId = window.setInterval(() => {
      this.checkReminders(reminders);
    }, this.checkInterval);
  }

  /**
   * Stop de scheduler
   */
  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.processedReminderIds.clear();
  }

  /**
   * Check alle reminders en toon notificaties waar nodig
   */
  private async checkReminders(reminders: Reminder[]): Promise<void> {
    if (!this.entityGetter || !this.notificationCallback) {
      return;
    }

    // Build entity map voor efficiente lookup
    const entityMap = new Map<string, Task | Habit | Objective | TimeSlot>();
    for (const reminder of reminders) {
      if (!entityMap.has(reminder.entityId)) {
        const entity = this.entityGetter(reminder.entityType, reminder.entityId);
        if (entity) {
          entityMap.set(reminder.entityId, entity);
        }
      }
    }

    // Get reminders die nu getoond moeten worden
    const remindersToShow = reminderEngine.getRemindersToShow(reminders, entityMap);

    for (const calculation of remindersToShow) {
      const reminder = calculation.reminder;

      // Skip als deze reminder al is verwerkt
      if (this.processedReminderIds.has(reminder.id)) {
        continue;
      }

      // Mark als verwerkt
      this.processedReminderIds.add(reminder.id);

      // Get entity voor notificatie details
      const entity = entityMap.get(reminder.entityId);
      if (!entity) continue;

      // Create notification
      const notification = this.createNotificationFromReminder(reminder, entity, calculation);
      
      // Call callback om notification toe te voegen aan DataContext
      this.notificationCallback(notification);

      // Show browser notification
      await this.showBrowserNotification(notification, reminder);
    }

    // Cleanup processed reminders die al completed zijn
    for (const reminder of reminders) {
      if (reminder.completed && this.processedReminderIds.has(reminder.id)) {
        this.processedReminderIds.delete(reminder.id);
      }
    }
  }

  /**
   * Maak een Notification object van een Reminder
   */
  private createNotificationFromReminder(
    reminder: Reminder,
    entity: Task | Habit | Objective | TimeSlot,
    calculation: ReminderCalculation
  ): Notification {
    let title = '';
    let message = '';
    let icon = 'notifications';
    let color = '#8B5CF6'; // Default primary color

    switch (reminder.entityType) {
      case 'task': {
        const task = entity as Task;
        title = 'Taak herinnering';
        message = `${task.title}${task.scheduledTime ? ` om ${task.scheduledTime}` : ''}`;
        icon = 'task';
        color = '#3B82F6'; // Blue
        break;
      }
      case 'habit': {
        const habit = entity as Habit;
        title = 'Habit herinnering';
        message = `Tijd voor: ${habit.name}`;
        icon = 'repeat';
        color = '#10B981'; // Green
        break;
      }
      case 'objective': {
        const objective = entity as Objective;
        title = 'Goal deadline herinnering';
        message = `${objective.title} deadline nadert`;
        icon = 'flag';
        color = '#F59E0B'; // Amber
        break;
      }
      case 'timeSlot': {
        const timeSlot = entity as TimeSlot;
        title = 'Afspraak herinnering';
        message = `${timeSlot.title} begint${timeSlot.startTime ? ` om ${timeSlot.startTime}` : ''}`;
        icon = 'event';
        color = '#8B5CF6'; // Purple
        break;
      }
    }

    return {
      id: `notif-${Date.now()}-${reminder.id}`,
      type: 'reminder',
      title,
      message,
      icon,
      color,
      read: false,
      createdAt: new Date().toISOString(),
      entityType: reminder.entityType,
      entityId: reminder.entityId,
      reminderId: reminder.id
    };
  }

  /**
   * Toon browser notification
   */
  private async showBrowserNotification(
    notification: Notification,
    reminder: Reminder
  ): Promise<void> {
    if (!webNotificationService.hasPermission()) {
      // Probeer toestemming te vragen (alleen eerste keer)
      await webNotificationService.requestPermission();
    }

    if (!webNotificationService.hasPermission()) {
      return; // Geen toestemming, skip browser notification
    }

    const options: NotificationOptions = {
      title: notification.title,
      body: notification.message,
      icon: `/icon-192x192.png`, // App icon
      badge: `/icon-192x192.png`,
      tag: `reminder-${reminder.id}`, // Voor groepering
      requireInteraction: false,
      silent: false,
      data: {
        notificationId: notification.id,
        reminderId: reminder.id,
        entityType: reminder.entityType,
        entityId: reminder.entityId
      }
    };

    await webNotificationService.showNotification(options);
  }

  /**
   * Update de lijst van reminders (voor als reminders worden toegevoegd/verwijderd)
   */
  updateReminders(reminders: Reminder[]): void {
    // Cleanup processed reminders die niet meer bestaan
    const reminderIds = new Set(reminders.map(r => r.id));
    for (const processedId of this.processedReminderIds) {
      if (!reminderIds.has(processedId)) {
        this.processedReminderIds.delete(processedId);
      }
    }
  }
}

// Singleton instance
export const notificationScheduler = new NotificationScheduler();

