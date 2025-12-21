import { Task, Habit, Objective, KeyResult, LifeArea, TimeSlot } from '../types';

export interface LinkingSuggestion {
  type: 'lifeArea' | 'objective' | 'keyResult';
  id: string;
  title: string;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface AutoLinkingContext {
  entityType: 'task' | 'habit' | 'timeSlot';
  entityTitle?: string;
  entityDescription?: string;
  entityDate?: string;
  entityTime?: string;
  existingLinks?: {
    lifeAreaId?: string;
    objectiveId?: string;
    keyResultId?: string;
  };
  contextLifeAreaId?: string;
  contextObjectiveId?: string;
}

/**
 * Generate automatic linking suggestions based on context
 */
export function generateLinkingSuggestions(
  context: AutoLinkingContext,
  availableData: {
    lifeAreas: LifeArea[];
    objectives: Objective[];
    keyResults: KeyResult[];
    tasks?: Task[];
    habits?: Habit[];
  }
): LinkingSuggestion[] {
  const suggestions: LinkingSuggestion[] = [];

  // 1. Context-based suggestions (highest priority)
  if (context.contextLifeAreaId) {
    const lifeArea = availableData.lifeAreas.find(la => la.id === context.contextLifeAreaId);
    if (lifeArea) {
      suggestions.push({
        type: 'lifeArea',
        id: lifeArea.id,
        title: lifeArea.name,
        reason: 'Je bent bezig in deze Life Area',
        confidence: 'high'
      });

      // Suggest objectives in this life area
      const areaObjectives = availableData.objectives.filter(obj => obj.lifeAreaId === context.contextLifeAreaId);
      areaObjectives.forEach(obj => {
        suggestions.push({
          type: 'objective',
          id: obj.id,
          title: obj.title,
          reason: `Goal in "${lifeArea.name}"`,
          confidence: 'high'
        });
      });
    }
  }

  if (context.contextObjectiveId) {
    const objective = availableData.objectives.find(obj => obj.id === context.contextObjectiveId);
    if (objective) {
      suggestions.push({
        type: 'objective',
        id: objective.id,
        title: objective.title,
        reason: 'Je bent bezig met dit Goal',
        confidence: 'high'
      });

      // Suggest key results for this objective
      const objKeyResults = availableData.keyResults.filter(kr => kr.objectiveId === context.contextObjectiveId);
      objKeyResults.forEach(kr => {
        suggestions.push({
          type: 'keyResult',
          id: kr.id,
          title: kr.title,
          reason: `Key Result van "${objective.title}"`,
          confidence: 'high'
        });
      });

      // Suggest life area if objective has one
      if (objective.lifeAreaId) {
        const lifeArea = availableData.lifeAreas.find(la => la.id === objective.lifeAreaId);
        if (lifeArea) {
          suggestions.push({
            type: 'lifeArea',
            id: lifeArea.id,
            title: lifeArea.name,
            reason: `Life Area van "${objective.title}"`,
            confidence: 'high'
          });
        }
      }
    }
  }

  // 2. Title/Description matching (medium priority)
  if (context.entityTitle || context.entityDescription) {
    const searchText = `${context.entityTitle || ''} ${context.entityDescription || ''}`.toLowerCase();
    
    // Match with Life Areas
    availableData.lifeAreas.forEach(la => {
      if (la.name.toLowerCase().includes(searchText) || searchText.includes(la.name.toLowerCase())) {
        if (!suggestions.find(s => s.type === 'lifeArea' && s.id === la.id)) {
          suggestions.push({
            type: 'lifeArea',
            id: la.id,
            title: la.name,
            reason: 'Naam komt overeen',
            confidence: 'medium'
          });
        }
      }
    });

    // Match with Objectives
    availableData.objectives.forEach(obj => {
      const objText = `${obj.title} ${obj.description || ''}`.toLowerCase();
      if (objText.includes(searchText) || searchText.includes(obj.title.toLowerCase())) {
        if (!suggestions.find(s => s.type === 'objective' && s.id === obj.id)) {
          suggestions.push({
            type: 'objective',
            id: obj.id,
            title: obj.title,
            reason: 'Naam komt overeen met Goal',
            confidence: 'medium'
          });
        }
      }
    });

    // Match with Key Results
    availableData.keyResults.forEach(kr => {
      if (kr.title.toLowerCase().includes(searchText) || searchText.includes(kr.title.toLowerCase())) {
        if (!suggestions.find(s => s.type === 'keyResult' && s.id === kr.id)) {
          suggestions.push({
            type: 'keyResult',
            id: kr.id,
            title: kr.title,
            reason: 'Naam komt overeen met Key Result',
            confidence: 'medium'
          });
        }
      }
    });
  }

  // 3. Date/time-based suggestions (for tasks and time slots)
  if (context.entityDate && (context.entityType === 'task' || context.entityType === 'timeSlot')) {
    const entityDate = new Date(context.entityDate);
    
    // Find objectives with deadlines around this date
    availableData.objectives.forEach(obj => {
      if (obj.endDate) {
        const endDate = new Date(obj.endDate);
        const daysDiff = Math.abs((entityDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 7) { // Within 7 days
          if (!suggestions.find(s => s.type === 'objective' && s.id === obj.id)) {
            suggestions.push({
              type: 'objective',
              id: obj.id,
              title: obj.title,
              reason: `Deadline binnen ${Math.round(daysDiff)} dagen`,
              confidence: daysDiff <= 3 ? 'high' : 'medium'
            });
          }
        }
      }
    });

    // Find key results with deadlines around this date
    availableData.keyResults.forEach(kr => {
      if (kr.endDate) {
        const endDate = new Date(kr.endDate);
        const daysDiff = Math.abs((entityDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff <= 7) {
          if (!suggestions.find(s => s.type === 'keyResult' && s.id === kr.id)) {
            suggestions.push({
              type: 'keyResult',
              id: kr.id,
              title: kr.title,
              reason: `Deadline binnen ${Math.round(daysDiff)} dagen`,
              confidence: daysDiff <= 3 ? 'high' : 'medium'
            });
          }
        }
      }
    });
  }

  // 4. Related entity suggestions (if entity is linked to similar entities)
  if (context.existingLinks) {
    // If linked to a life area, suggest other active objectives in that area
    if (context.existingLinks.lifeAreaId) {
      const areaObjectives = availableData.objectives.filter(
        obj => obj.lifeAreaId === context.existingLinks!.lifeAreaId && obj.status !== 'Off Track'
      );
      areaObjectives.forEach(obj => {
        if (!suggestions.find(s => s.type === 'objective' && s.id === obj.id)) {
          suggestions.push({
            type: 'objective',
            id: obj.id,
            title: obj.title,
            reason: 'Actief Goal in dezelfde Life Area',
            confidence: 'medium'
          });
        }
      });
    }

    // If linked to an objective, suggest other key results
    if (context.existingLinks.objectiveId) {
      const objKeyResults = availableData.keyResults.filter(
        kr => kr.objectiveId === context.existingLinks!.objectiveId
      );
      objKeyResults.forEach(kr => {
        if (!suggestions.find(s => s.type === 'keyResult' && s.id === kr.id)) {
          suggestions.push({
            type: 'keyResult',
            id: kr.id,
            title: kr.title,
            reason: 'Andere Key Result van hetzelfde Goal',
            confidence: 'low'
          });
        }
      });
    }
  }

  // 5. Recent activity suggestions (if tasks/habits data available)
  if (availableData.tasks && context.entityType === 'task') {
    // Find tasks with similar titles and their links
    const similarTasks = availableData.tasks.filter(task => {
      if (!context.entityTitle) return false;
      const taskTitle = task.title.toLowerCase();
      const entityTitle = context.entityTitle.toLowerCase();
      return taskTitle.includes(entityTitle) || entityTitle.includes(taskTitle);
    });

    similarTasks.forEach(task => {
      if (task.objectiveId) {
        const obj = availableData.objectives.find(o => o.id === task.objectiveId);
        if (obj && !suggestions.find(s => s.type === 'objective' && s.id === obj.id)) {
          suggestions.push({
            type: 'objective',
            id: obj.id,
            title: obj.title,
            reason: 'Gelinkt aan vergelijkbare task',
            confidence: 'low'
          });
        }
      }
      if (task.lifeAreaId) {
        const la = availableData.lifeAreas.find(l => l.id === task.lifeAreaId);
        if (la && !suggestions.find(s => s.type === 'lifeArea' && s.id === la.id)) {
          suggestions.push({
            type: 'lifeArea',
            id: la.id,
            title: la.name,
            reason: 'Gelinkt aan vergelijkbare task',
            confidence: 'low'
          });
        }
      }
    });
  }

  // Remove duplicates and sort by confidence
  const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
    index === self.findIndex(s => s.type === suggestion.type && s.id === suggestion.id)
  );

  // Sort: high confidence first, then by type (lifeArea > objective > keyResult)
  const confidenceOrder = { high: 0, medium: 1, low: 2 };
  const typeOrder = { lifeArea: 0, objective: 1, keyResult: 2 };

  return uniqueSuggestions.sort((a, b) => {
    const confidenceDiff = confidenceOrder[a.confidence] - confidenceOrder[b.confidence];
    if (confidenceDiff !== 0) return confidenceDiff;
    return typeOrder[a.type] - typeOrder[b.type];
  });
}

/**
 * Get the best single suggestion (highest confidence)
 */
export function getBestSuggestion(suggestions: LinkingSuggestion[]): LinkingSuggestion | null {
  if (suggestions.length === 0) return null;
  
  // Return first high confidence suggestion, or first suggestion if none
  return suggestions.find(s => s.confidence === 'high') || suggestions[0];
}

