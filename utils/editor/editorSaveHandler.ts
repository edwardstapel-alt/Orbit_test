import { EntityType, Task, Habit, Friend, Objective, KeyResult, LifeArea, Vision, TimeSlot, View } from '../../types';
import { DataContextType } from '../../context/DataContext';
import { getObjectiveTemplates } from '../objectiveTemplates';

interface SaveHandlerParams {
  type: EntityType;
  formData: any;
  editId?: string;
  parentId?: string;
  loadedTemplateId: string | null;
  templateKeyResults: Partial<KeyResult>[];
  data: DataContextType;
  getSingleTeamMemberOwner: () => { name: string; image: string } | null;
  onClose: () => void;
  onNavigate?: (view: View, objectiveId?: string, lifeAreaId?: string) => void;
  setLoadedTemplateId: (id: string | null) => void;
  setTemplateKeyResults: (krs: Partial<KeyResult>[]) => void;
}

export const handleEditorSave = ({
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
}: SaveHandlerParams) => {
  const id = editId || Math.random().toString(36).substr(2, 9);
  const newItem = { ...formData, id };

  // Basic Validation
  if (
    (type === 'task' && !newItem.title) ||
    (type === 'habit' && !newItem.name) ||
    (type === 'friend' && !newItem.name) ||
    (type === 'objective' && !newItem.title) ||
    (type === 'keyResult' && !newItem.title) ||
    (type === 'lifeArea' && !newItem.name) ||
    (type === 'vision' && !newItem.statement) ||
    (type === 'timeSlot' && !newItem.title)
  ) {
    alert("Please fill in the required field.");
    return;
  }

  // Handle each entity type
  if (type === 'task') {
    editId ? data.updateTask(newItem as Task) : data.addTask(newItem as Task);
  }

  if (type === 'habit') {
    editId ? data.updateHabit(newItem as Habit) : data.addHabit(newItem as Habit);
  }

  if (type === 'friend') {
    editId
      ? data.updateFriend({ ...newItem, image: 'https://picsum.photos/200' } as Friend)
      : data.addFriend({ ...newItem, image: 'https://picsum.photos/200', lastSeen: 'Just now' } as Friend);
  }

  if (type === 'timeSlot') {
    editId ? data.updateTimeSlot(newItem as TimeSlot) : data.addTimeSlot(newItem as TimeSlot);
  }

  if (type === 'objective') {
    // If there's only 1 team member, automatically set them as owner
    const singleOwner = getSingleTeamMemberOwner();
    if (singleOwner) {
      newItem.owner = singleOwner.name;
      newItem.ownerImage = singleOwner.image;
    }

    // Remove undefined values to prevent Firebase errors
    const cleanObjective = { ...newItem, ownerImage: newItem.ownerImage || 'https://picsum.photos/id/64/200/200' };
    // Remove undefined fields (Firebase doesn't accept undefined)
    Object.keys(cleanObjective).forEach(key => {
      if (cleanObjective[key] === undefined) {
        delete cleanObjective[key];
      }
    });
    editId ? data.updateObjective(cleanObjective as Objective) : data.addObjective(cleanObjective as Objective);

    // If creating from template, add key results and tasks
    if (!editId && loadedTemplateId) {
      const allTemplates = getObjectiveTemplates(data.objectiveTemplates);
      const template = allTemplates.find(t => t.id === loadedTemplateId);
      const newObjectiveId = newItem.id;

      // Create key results from templateKeyResults state (user may have edited them)
      if (templateKeyResults && templateKeyResults.length > 0) {
        templateKeyResults.forEach((krTemplate, index) => {
          if (!krTemplate.title || krTemplate.title.trim() === '') {
            return;
          }
          // If there's only 1 team member, automatically set them as owner
          const singleOwner = getSingleTeamMemberOwner();
          const keyResultOwner = singleOwner
            ? singleOwner.name
            : (krTemplate.owner || newItem.owner || '');
          const keyResultOwnerImage = singleOwner
            ? singleOwner.image
            : (krTemplate.ownerImage || newItem.ownerImage || 'https://picsum.photos/id/64/200/200');

          const keyResult: KeyResult = {
            id: `${newObjectiveId}-kr-${index}`,
            title: krTemplate.title || `Key Result ${index + 1}`,
            objectiveId: newObjectiveId,
            current: krTemplate.current || 0,
            target: krTemplate.target || 100,
            measurementType: krTemplate.measurementType || 'percentage',
            currency: krTemplate.currency || 'EUR',
            decimals: krTemplate.decimals !== undefined ? krTemplate.decimals : (krTemplate.measurementType === 'currency' ? 2 : 0),
            status: krTemplate.status || 'On Track',
            startDate: krTemplate.startDate || newItem.startDate,
            endDate: krTemplate.endDate || newItem.endDate,
            owner: keyResultOwner,
            ownerImage: keyResultOwnerImage,
            // Only include customUnit if it has a value (Firebase doesn't accept undefined)
            ...(krTemplate.customUnit ? { customUnit: krTemplate.customUnit } : {}),
          };
          data.addKeyResult(keyResult);
        });
      }

      // Create action plan tasks
      if (template?.actionPlan?.weeks) {
        template.actionPlan.weeks.forEach(week => {
          week.tasks.forEach(task => {
            const taskObj = {
              id: `${newObjectiveId}-task-${task.id}`,
              title: task.title,
              tag: template.category,
              completed: false,
              priority: false,
              scheduledDate: task.scheduledDate,
              objectiveId: newObjectiveId,
              lifeAreaId: newItem.lifeAreaId || '',
            };
            data.addTask(taskObj);
          });
        });
      }

      setLoadedTemplateId(null);
      setTemplateKeyResults([]); // Reset template key results after saving
      localStorage.removeItem('orbit_selectedTemplateId'); // Clean up template ID after saving

      if (onNavigate) {
        onClose();
        setTimeout(() => {
          onNavigate(View.OBJECTIVE_DETAIL, newObjectiveId);
        }, 100);
        return;
      }
    } else if (!editId && onNavigate) {
      // If creating a new Objective (not from template), navigate to detail view where user can add key results
      const newObjectiveId = newItem.id;
      onClose();
      setTimeout(() => {
        onNavigate(View.OBJECTIVE_DETAIL, newObjectiveId);
      }, 100);
      return;
    }
  }

  if (type === 'keyResult') {
    const krItem = newItem as KeyResult;

    // Check: Een key result kan niet aan meerdere goals hangen
    if (editId) {
      const existingKR = data.keyResults.find(kr => kr.id === editId);
      if (existingKR && existingKR.objectiveId) {
        // Als de key result al een objectiveId heeft, mag deze niet veranderen
        // Gebruik altijd de bestaande objectiveId
        krItem.objectiveId = existingKR.objectiveId;

        // Als er een parentId is meegegeven die anders is, waarschuw de gebruiker
        if (parentId && parentId !== existingKR.objectiveId) {
          alert('Een Key Result kan niet aan meerdere Goals gekoppeld worden. Deze Key Result is al gekoppeld aan een ander Goal.');
          return;
        }
      } else if (parentId) {
        // Als er geen bestaande objectiveId is, gebruik de parentId
        krItem.objectiveId = parentId;
      }
    } else {
      // Bij nieuwe key result, gebruik parentId
      if (parentId) {
        krItem.objectiveId = parentId;
      }
    }

    // If there's only 1 team member, automatically set them as owner
    const singleOwner = getSingleTeamMemberOwner();
    if (singleOwner) {
      krItem.owner = singleOwner.name;
      krItem.ownerImage = singleOwner.image;
    } else {
      // Als er geen owner is ingesteld, gebruik de owner van de parent objective
      if (!krItem.owner && krItem.objectiveId) {
        const parentObj = data.objectives.find(o => o.id === krItem.objectiveId);
        if (parentObj) {
          krItem.owner = parentObj.owner;
          krItem.ownerImage = parentObj.ownerImage;
        }
      }
    }
    editId ? data.updateKeyResult(krItem) : data.addKeyResult(krItem);
  }

  if (type === 'place') {
    editId ? alert("Places cannot be edited yet") : data.addPlace(newItem as any);
  }

  if (type === 'lifeArea') {
    const now = new Date().toISOString();
    const lifeAreaData: LifeArea = {
      ...newItem,
      createdAt: editId ? (data.lifeAreas.find(la => la.id === editId)?.createdAt || now) : now,
      updatedAt: now
    };
    editId ? data.updateLifeArea(lifeAreaData) : data.addLifeArea(lifeAreaData);

    // If creating a new Life Area, navigate to detail view where user can add goals/key results
    if (!editId && onNavigate) {
      const newLifeAreaId = lifeAreaData.id;
      onClose();
      setTimeout(() => {
        onNavigate(View.LIFE_AREA_DETAIL, undefined, newLifeAreaId);
      }, 100);
      return;
    }
  }

  if (type === 'vision') {
    const now = new Date().toISOString();
    const visionData: Vision = {
      ...newItem,
      images: newItem.images || [],
      createdAt: editId ? (data.visions.find(v => v.id === editId)?.createdAt || now) : now,
      updatedAt: now
    };
    // Check if vision already exists for this life area
    const existingVision = data.visions.find(v => v.lifeAreaId === visionData.lifeAreaId);
    if (existingVision && !editId) {
      // Update existing vision instead of creating new one
      data.updateVision({ ...visionData, id: existingVision.id });
    } else {
      editId ? data.updateVision(visionData) : data.addVision(visionData);
    }
  }

  onClose();
};



