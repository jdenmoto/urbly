import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react';
import type { Building } from '@/core/models/building';
import { formatLocalInput } from './schedulingUtils';
import type { SchedulingFormValues } from './schedulingSeries';
import type { SchedulingItem } from './schedulingItem';
import type { UseFormReset, UseFormSetValue, UseFormTrigger } from 'react-hook-form';

export default function useSchedulingFormFlow({
  t,
  filters,
  activeBuildings,
  buildings,
  selectedType,
  reset,
  setValue,
  trigger,
  setSelected
}: {
  t: (key: string) => string;
  filters: { buildingId: string; from: string; to: string };
  activeBuildings: Building[];
  buildings: Building[];
  selectedType: string;
  reset: UseFormReset<SchedulingFormValues>;
  setValue: UseFormSetValue<SchedulingFormValues>;
  trigger: UseFormTrigger<SchedulingFormValues>;
  setSelected: Dispatch<SetStateAction<SchedulingItem | null>>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [buildingSearch, setBuildingSearch] = useState('');
  const [buildingDropdownOpen, setBuildingDropdownOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (selectedType === 'emergencia') {
      setValue('recurrence', '');
    }
  }, [selectedType, setValue]);

  const wizardSteps = useMemo(
    () => [
      { id: 1 as const, title: editingId ? t('scheduling.wizardStepServiceContext') : t('scheduling.wizardStepCreateService') },
      { id: 2 as const, title: 'Agenda y asignación' },
      { id: 3 as const, title: editingId ? 'Revisar reprogramación' : 'Revisar creación' }
    ],
    [editingId, t]
  );

  const startCreate = () => {
    const buildingId = filters.buildingId;
    const buildingName = activeBuildings.find((building) => building.id === buildingId)?.name ?? '';
    setWizardStep(1);
    setEditingId(null);
    reset({
      buildingId,
      title: '',
      description: '',
      startAt: '',
      endAt: '',
      status: 'programado',
      recurrence: '',
      type: '',
      employeeId: ''
    });
    setBuildingSearch(buildingName);
    setModalOpen(true);
  };

  const startCreateAt = (start: Date) => {
    const buildingId = filters.buildingId;
    const buildingName = activeBuildings.find((building) => building.id === buildingId)?.name ?? '';
    setWizardStep(1);
    const end = new Date(start);
    end.setHours(start.getHours() + 1);
    setEditingId(null);
    reset({
      buildingId,
      title: '',
      description: '',
      startAt: formatLocalInput(start),
      endAt: formatLocalInput(end),
      status: 'programado',
      recurrence: '',
      type: '',
      employeeId: ''
    });
    setBuildingSearch(buildingName);
    setModalOpen(true);
  };

  const startEdit = (appointment: SchedulingItem) => {
    setWizardStep(1);
    setEditingId(appointment.id);
    setValue('buildingId', appointment.buildingId);
    setValue('title', appointment.title);
    setValue('description', appointment.description ?? '');
    setValue('startAt', appointment.startAt.slice(0, 16));
    setValue('endAt', appointment.endAt.slice(0, 16));
    setValue('status', appointment.status);
    setValue('recurrence', appointment.recurrence ?? '');
    setValue('type', appointment.type ?? '');
    if (appointment.type === 'emergencia') {
      setValue('recurrence', '');
    }
    setValue('employeeId', appointment.employeeId ?? '');
    const buildingName = buildings.find((building) => building.id === appointment.buildingId)?.name ?? '';
    setBuildingSearch(buildingName);
    setSelected(null);
    setModalOpen(true);
  };

  const nextWizardStep = async () => {
    const fieldsByStep: Record<1 | 2 | 3, Array<keyof SchedulingFormValues>> = {
      1: ['buildingId', 'title', 'description', 'type'],
      2: ['startAt', 'endAt', 'status', 'employeeId', 'recurrence'],
      3: []
    };
    const fields = fieldsByStep[wizardStep] ?? [];
    if (fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setWizardStep((prev) => (prev === 3 ? 3 : ((prev + 1) as 1 | 2 | 3)));
  };

  const prevWizardStep = () => setWizardStep((prev) => (prev === 1 ? 1 : ((prev - 1) as 1 | 2 | 3)));

  return {
    editingId,
    setEditingId,
    modalOpen,
    setModalOpen,
    buildingSearch,
    setBuildingSearch,
    buildingDropdownOpen,
    setBuildingDropdownOpen,
    wizardStep,
    setWizardStep,
    wizardSteps,
    startCreate,
    startCreateAt,
    startEdit,
    nextWizardStep,
    prevWizardStep
  };
}
