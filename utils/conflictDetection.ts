// Conflict Detection Engine
// Detecteert conflicten tussen app entiteiten en externe services

import { Conflict, FieldDifference, SyncMetadata, Task, TimeSlot, Objective } from '../types';

export class ConflictDetectionEngine {
  /**
   * Detecteert conflicten tussen app entiteit en externe service
   */
  detectConflict(
    entity: Task | TimeSlot | Objective,
    externalData: any,
    syncMetadata: SyncMetadata
  ): Conflict | null {
    // Check of beide versies zijn gewijzigd sinds laatste sync
    if (!this.hasBothBeenModified(entity, externalData, syncMetadata)) {
      return null; // Geen conflict
    }

    // Vergelijk velden en detecteer verschillen
    const differences = this.compareFields(entity, externalData, syncMetadata.externalService);
    
    if (differences.length === 0) {
      return null; // Geen verschillen gevonden
    }

    // Maak conflict object
    return {
      id: `conflict-${entity.id}-${Date.now()}`,
      entityType: this.getEntityType(entity),
      entityId: entity.id,
      service: syncMetadata.externalService,
      appValue: entity,
      externalValue: externalData,
      conflictFields: differences,
      appLastModified: syncMetadata.appLastModified || new Date().toISOString(),
      externalLastModified: syncMetadata.externalLastModified || new Date().toISOString(),
      detectedAt: new Date().toISOString(),
      priority: this.calculatePriority(differences, entity),
    };
  }

  /**
   * Check of beide versies zijn gewijzigd sinds laatste sync
   */
  private hasBothBeenModified(
    entity: Task | TimeSlot | Objective,
    externalData: any,
    syncMetadata: SyncMetadata
  ): boolean {
    if (!syncMetadata.lastSyncedAt) {
      return false; // Nog nooit gesynced, geen conflict mogelijk
    }

    const lastSync = new Date(syncMetadata.lastSyncedAt);
    const appModified = syncMetadata.appLastModified 
      ? new Date(syncMetadata.appLastModified) > lastSync
      : false;
    const externalModified = syncMetadata.externalLastModified
      ? new Date(syncMetadata.externalLastModified) > lastSync
      : false;

    return appModified && externalModified;
  }

  /**
   * Vergelijk velden tussen app en externe versie
   */
  private compareFields(
    appEntity: Task | TimeSlot | Objective,
    externalEntity: any,
    service: string
  ): FieldDifference[] {
    const differences: FieldDifference[] = [];
    const fieldMappings = this.getFieldMappings(service);

    for (const [appField, externalField] of Object.entries(fieldMappings)) {
      const appValue = (appEntity as any)[appField];
      const externalValue = this.getNestedValue(externalEntity, externalField);

      if (!this.valuesEqual(appValue, externalValue)) {
        differences.push({
          field: appField,
          appValue,
          externalValue,
          fieldType: this.getFieldType(appValue),
          canMerge: this.canMergeField(appField, appValue, externalValue),
        });
      }
    }

    return differences;
  }

  /**
   * Haal geneste waarde op uit object (bijv. "start.dateTime")
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Field mappings per service
   */
  private getFieldMappings(service: string): { [appField: string]: string } {
    if (service === 'google_tasks') {
      return {
        title: 'title',
        completed: 'status',
        scheduledDate: 'due',
        // Meer mappings kunnen worden toegevoegd
      };
    }
    if (service === 'google_calendar') {
      return {
        title: 'summary',
        startTime: 'start.dateTime',
        endTime: 'end.dateTime',
        date: 'start.date',
        // Meer mappings kunnen worden toegevoegd
      };
    }
    return {};
  }

  /**
   * Check of waarden gelijk zijn
   */
  private valuesEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    
    // Date comparison
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    
    // String date comparison (YYYY-MM-DD)
    if (typeof a === 'string' && typeof b === 'string') {
      // Check if they're date strings
      if (/^\d{4}-\d{2}-\d{2}/.test(a) && /^\d{4}-\d{2}-\d{2}/.test(b)) {
        return a === b;
      }
    }
    
    // Object comparison
    if (typeof a === 'object' && typeof b === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }
    
    return false;
  }

  /**
   * Bepaal field type
   */
  private getFieldType(value: any): FieldDifference['fieldType'] {
    if (value instanceof Date) return 'date';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object' && value !== null) return 'object';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    return 'string';
  }

  /**
   * Check of veld kan worden gemerged
   */
  private canMergeField(field: string, appValue: any, externalValue: any): boolean {
    // Sommige velden kunnen niet worden gemerged (bijv. completed status)
    const nonMergeableFields = ['completed', 'id', 'syncMetadata', 'status'];
    if (nonMergeableFields.includes(field)) {
      return false;
    }
    
    // Arrays kunnen soms worden gemerged
    if (Array.isArray(appValue) && Array.isArray(externalValue)) {
      return true;
    }
    
    // Strings kunnen worden gemerged (bijv. descriptions)
    if (typeof appValue === 'string' && typeof externalValue === 'string') {
      return field.includes('description') || field.includes('notes') || field.includes('title');
    }
    
    return false;
  }

  /**
   * Bepaal entity type
   */
  private getEntityType(entity: Task | TimeSlot | Objective): Conflict['entityType'] {
    if ('scheduledDate' in entity || 'title' in entity && 'tag' in entity) return 'task';
    if ('startTime' in entity) return 'timeSlot';
    return 'objective';
  }

  /**
   * Bereken conflict prioriteit
   */
  private calculatePriority(
    differences: FieldDifference[],
    entity: Task | TimeSlot | Objective
  ): Conflict['priority'] {
    // High priority conflicts: critical fields changed
    const criticalFields = ['title', 'completed', 'scheduledDate', 'startTime', 'endTime', 'status'];
    if (differences.some(d => criticalFields.includes(d.field))) {
      return 'high';
    }
    
    // Medium priority: important fields
    const importantFields = ['description', 'tag', 'priority'];
    if (differences.some(d => importantFields.includes(d.field))) {
      return 'medium';
    }
    
    return 'low';
  }

  /**
   * Batch conflict detection voor meerdere entiteiten
   */
  detectConflicts(
    entities: (Task | TimeSlot | Objective)[],
    externalDataMap: Map<string, any>,
    syncMetadataMap: Map<string, SyncMetadata>
  ): Conflict[] {
    const conflicts: Conflict[] = [];

    for (const entity of entities) {
      const syncMetadata = syncMetadataMap.get(entity.id);
      if (!syncMetadata || !syncMetadata.externalId) continue;

      const externalData = externalDataMap.get(syncMetadata.externalId);
      if (!externalData) continue;

      const conflict = this.detectConflict(entity, externalData, syncMetadata);
      if (conflict) {
        conflicts.push(conflict);
      }
    }

    return conflicts;
  }
}
