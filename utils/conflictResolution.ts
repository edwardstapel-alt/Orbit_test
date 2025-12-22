// Conflict Resolution Engine
// Lost conflicten op volgens geconfigureerde strategie

import { Conflict, ConflictResolution, ConflictResolutionConfig, Task, TimeSlot, Objective } from '../types';

export class ConflictResolutionEngine {
  private config: ConflictResolutionConfig;

  constructor(config: ConflictResolutionConfig) {
    this.config = config;
  }

  /**
   * Los conflict op volgens geconfigureerde strategie
   */
  async resolveConflict(
    conflict: Conflict,
    strategy?: ConflictResolution['strategy']
  ): Promise<ConflictResolution> {
    const resolutionStrategy = strategy || this.getStrategyForConflict(conflict);
    
    let resolution: ConflictResolution;

    switch (resolutionStrategy) {
      case 'app_wins':
        resolution = this.resolveAppWins(conflict);
        break;
      case 'external_wins':
        resolution = this.resolveExternalWins(conflict);
        break;
      case 'last_write_wins':
        resolution = this.resolveLastWriteWins(conflict);
        break;
      case 'merge':
        resolution = this.resolveMerge(conflict);
        break;
      case 'manual':
        // Manual resolution vereist user input
        throw new Error('Manual resolution requires user interaction');
      default:
        throw new Error(`Unknown resolution strategy: ${resolutionStrategy}`);
    }

    return resolution;
  }

  /**
   * App versie wint
   */
  private resolveAppWins(conflict: Conflict): ConflictResolution {
    return {
      strategy: 'app_wins',
      resolvedBy: 'system',
      resolvedAt: new Date().toISOString(),
      finalValue: conflict.appValue,
    };
  }

  /**
   * Externe versie wint
   */
  private resolveExternalWins(conflict: Conflict): ConflictResolution {
    return {
      strategy: 'external_wins',
      resolvedBy: 'system',
      resolvedAt: new Date().toISOString(),
      finalValue: conflict.externalValue,
    };
  }

  /**
   * Laatste wijziging wint
   */
  private resolveLastWriteWins(conflict: Conflict): ConflictResolution {
    const appModified = new Date(conflict.appLastModified);
    const externalModified = new Date(conflict.externalLastModified);

    if (appModified > externalModified) {
      return this.resolveAppWins(conflict);
    } else {
      return this.resolveExternalWins(conflict);
    }
  }

  /**
   * Merge beide versies
   */
  private resolveMerge(conflict: Conflict): ConflictResolution {
    const mergedFields: { [field: string]: any } = {};
    const finalValue = { ...conflict.appValue };

    for (const diff of conflict.conflictFields) {
      if (diff.canMerge) {
        // Merge logica per field type
        if (diff.fieldType === 'array') {
          // Combineer arrays en verwijder duplicates
          const appArray = diff.appValue as any[];
          const externalArray = diff.externalValue as any[];
          mergedFields[diff.field] = [...new Set([...appArray, ...externalArray])];
        } else if (diff.fieldType === 'string' && (diff.field.includes('description') || diff.field.includes('notes'))) {
          // Combineer descriptions
          mergedFields[diff.field] = `${diff.appValue}\n\n---\n\n${diff.externalValue}`;
        } else if (diff.fieldType === 'string' && diff.field.includes('title')) {
          // Voor titles: gebruik app versie (meestal accurater)
          mergedFields[diff.field] = diff.appValue;
        } else {
          // Default: gebruik app waarde
          mergedFields[diff.field] = diff.appValue;
        }
      } else {
        // Niet mergeable: gebruik app waarde
        mergedFields[diff.field] = diff.appValue;
      }
    }

    // Pas merged fields toe
    Object.assign(finalValue, mergedFields);

    return {
      strategy: 'merge',
      resolvedBy: 'system',
      resolvedAt: new Date().toISOString(),
      finalValue,
      mergedFields,
    };
  }

  /**
   * Bepaal strategie voor specifiek conflict
   */
  private getStrategyForConflict(conflict: Conflict): ConflictResolution['strategy'] {
    // Check per-service strategie
    if (this.config.perServiceStrategy?.[conflict.service]) {
      return this.config.perServiceStrategy[conflict.service];
    }
    
    return this.config.defaultStrategy;
  }

  /**
   * Update configuratie
   */
  updateConfig(config: Partial<ConflictResolutionConfig>) {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get huidige configuratie
   */
  getConfig(): ConflictResolutionConfig {
    return { ...this.config };
  }
}
