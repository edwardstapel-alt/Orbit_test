// Action Plan Progress Utility
// Helper functions for tracking and managing action plan progress

import { Objective, Task, ObjectiveTemplate, ActionPlanProgress } from '../types';

/**
 * Calculate progress for a specific week in an action plan
 */
export const calculateWeekProgress = (
  weekNumber: number,
  objectiveId: string,
  objective: Objective,
  template: ObjectiveTemplate | undefined,
  tasks: Task[]
): number => {
  if (!template || !template.actionPlan) return 0;

  const week = template.actionPlan.weeks.find(w => w.weekNumber === weekNumber);
  if (!week) return 0;

  const weekTasks = week.tasks;
  const objectiveTasks = tasks.filter(t => t.objectiveId === objectiveId);
  
  let completedCount = 0;
  weekTasks.forEach(apt => {
    const matchingTask = objectiveTasks.find(t => {
      return t.title === apt.title || t.id.includes(apt.id);
    });
    if (matchingTask && matchingTask.completed) {
      completedCount++;
    }
  });

  return weekTasks.length > 0 ? (completedCount / weekTasks.length) * 100 : 0;
};

/**
 * Get all action plan tasks for an objective
 */
export const getActionPlanTasks = (
  objectiveId: string,
  objective: Objective,
  template: ObjectiveTemplate | undefined,
  tasks: Task[]
): Array<{ actionPlanTask: any; task?: Task; completed: boolean }> => {
  if (!template || !template.actionPlan) return [];

  const allActionPlanTasks: Array<{ actionPlanTask: any; task?: Task; completed: boolean }> = [];
  const objectiveTasks = tasks.filter(t => t.objectiveId === objectiveId);

  template.actionPlan.weeks.forEach(week => {
    week.tasks.forEach(apt => {
      const matchingTask = objectiveTasks.find(t => {
        return t.title === apt.title || t.id.includes(apt.id);
      });
      allActionPlanTasks.push({
        actionPlanTask: apt,
        task: matchingTask,
        completed: matchingTask ? matchingTask.completed : false
      });
    });
  });

  return allActionPlanTasks;
};

/**
 * Get upcoming action plan tasks
 */
export const getUpcomingActionPlanTasks = (
  objectiveId: string,
  objective: Objective,
  template: ObjectiveTemplate | undefined,
  tasks: Task[],
  days: number = 7
): Array<{ actionPlanTask: any; task?: Task; scheduledDate: string }> => {
  if (!template || !template.actionPlan) return [];

  const now = new Date();
  const futureDate = new Date(now);
  futureDate.setDate(now.getDate() + days);

  const upcoming: Array<{ actionPlanTask: any; task?: Task; scheduledDate: string }> = [];
  const objectiveTasks = tasks.filter(t => t.objectiveId === objectiveId);

  template.actionPlan.weeks.forEach(week => {
    week.tasks.forEach(apt => {
      if (apt.scheduledDate) {
        const taskDate = new Date(apt.scheduledDate);
        if (taskDate >= now && taskDate <= futureDate) {
          const matchingTask = objectiveTasks.find(t => {
            return t.title === apt.title || t.id.includes(apt.id);
          });
          upcoming.push({
            actionPlanTask: apt,
            task: matchingTask,
            scheduledDate: apt.scheduledDate
          });
        }
      }
    });
  });

  return upcoming.sort((a, b) => 
    new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()
  );
};

