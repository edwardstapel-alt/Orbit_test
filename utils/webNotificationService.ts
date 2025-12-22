/**
 * Web Notification Service
 * Handles browser notification permissions and displays notifications
 */

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string; // Voor het groeperen van notificaties
  requireInteraction?: boolean; // Blijft zichtbaar tot gebruiker actie onderneemt
  silent?: boolean;
  data?: any; // Extra data voor de notificatie
}

class WebNotificationService {
  private permission: NotificationPermission = 'default';
  private isSupported: boolean = false;

  constructor() {
    this.isSupported = 'Notification' in window;
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }

  /**
   * Vraag toestemming aan voor browser notifications
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported) {
      console.warn('Browser notifications worden niet ondersteund');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission is geweigerd door gebruiker');
      return 'denied';
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  /**
   * Check of notifications zijn toegestaan
   */
  hasPermission(): boolean {
    return this.isSupported && this.permission === 'granted';
  }

  /**
   * Check of notifications worden ondersteund
   */
  isNotificationSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Toon een browser notification
   */
  async showNotification(options: NotificationOptions): Promise<Notification | null> {
    if (!this.isSupported) {
      console.warn('Browser notifications worden niet ondersteund');
      return null;
    }

    // Vraag toestemming als dat nog niet is gebeurd
    if (this.permission === 'default') {
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.warn('Notification permission niet verleend');
        return null;
      }
    }

    if (this.permission !== 'granted') {
      console.warn('Notification permission niet verleend');
      return null;
    }

    try {
      const notificationOptions: NotificationOptions = {
        icon: options.icon || '/icon-192x192.png', // Default app icon
        badge: options.badge || '/icon-192x192.png',
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        data: options.data,
        ...options
      };

      const notification = new Notification(options.title, {
        body: options.body,
        icon: notificationOptions.icon,
        badge: notificationOptions.badge,
        tag: notificationOptions.tag,
        requireInteraction: notificationOptions.requireInteraction,
        silent: notificationOptions.silent,
        data: notificationOptions.data
      });

      // Auto-close na 5 seconden (tenzij requireInteraction true is)
      if (!notificationOptions.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }

  /**
   * Sluit alle actieve notificaties met een specifieke tag
   */
  closeNotificationsByTag(tag: string): void {
    if (!this.isSupported) return;

    // Browser API heeft geen directe manier om notificaties te sluiten
    // Dit moet worden afgehandeld door de notificatie zelf te sluiten
    // of door de service worker (als die wordt gebruikt)
    console.log(`Close notifications with tag: ${tag}`);
  }

  /**
   * Update permission status (voor als gebruiker handmatig toestemming geeft/weigert)
   */
  updatePermissionStatus(): void {
    if (this.isSupported) {
      this.permission = Notification.permission;
    }
  }
}

// Singleton instance
export const webNotificationService = new WebNotificationService();

