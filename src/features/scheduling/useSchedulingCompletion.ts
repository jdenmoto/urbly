import { useMemo, useState } from 'react';
import { updateDocById } from '@/lib/api/firestore';
import type { SchedulingItem } from './schedulingItem';
import {
  buildCompletionPayload,
  buildNormalizedChecklist,
  hasMinTwoPhotos,
  validateCompletion,
  type CompletionReport,
  type IssueDraft
} from './schedulingCompletion';

export default function useSchedulingCompletion({
  t,
  toast,
  invalidateScheduling,
  selected,
  setSelected
}: {
  t: (key: string) => string;
  toast: (message: string, type: 'success' | 'error') => void;
  invalidateScheduling: () => Promise<unknown> | unknown;
  selected: SchedulingItem | null;
  setSelected: React.Dispatch<React.SetStateAction<SchedulingItem | null>>;
}) {
  const [completeTarget, setCompleteTarget] = useState<SchedulingItem | null>(null);
  const [hasIssues, setHasIssues] = useState<'yes' | 'no' | ''>('');
  const [issues, setIssues] = useState<IssueDraft[]>([]);
  const [issueDraft, setIssueDraft] = useState<IssueDraft>({
    id: '',
    type: '',
    category: '',
    description: '',
    photos: []
  });
  const [issueError, setIssueError] = useState<string | null>(null);
  const [completeSubmitting, setCompleteSubmitting] = useState(false);
  const [completionPhotos, setCompletionPhotos] = useState<File[]>([]);
  const [completionReport, setCompletionReport] = useState<CompletionReport>({
    entryHour: '',
    exitHour: '',
    observations: '',
    checklist: {}
  });
  const [group1Units, setGroup1Units] = useState<number[]>([1]);
  const [groupPanelsOpen, setGroupPanelsOpen] = useState({ grupo1: false, grupo2: false, grupo3: false });
  const [bombaPanelsOpen, setBombaPanelsOpen] = useState<Record<number, boolean>>({ 1: true });

  const timeHourOptions = useMemo(() => Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0')), []);
  const timeMinuteOptions = useMemo(() => Array.from({ length: 12 }, (_, index) => String(index * 5).padStart(2, '0')), []);

  const completionChecklistGroups = useMemo(
    () => ({
      grupo2: [
        'bornera_control',
        'bornera_fuerza',
        'breaker_totalizador',
        'coraza_cableado_control',
        'coraza_cableado_motores',
        'tablero_control'
      ],
      grupo3: [
        'valvula_flotadora',
        'diametro',
        'alarma',
        'demarcacion_registros',
        'instalacion_hidraulica',
        'instruciones_manejo',
        'pintura'
      ]
    }) as const,
    []
  );

  const completionChecklistItems = useMemo(
    () => [
      'alternador_contactos_auxiliares',
      'anclaje_base_estructural',
      'cargador_automatico_aire',
      'contactor_consumo_motor',
      'guardamotor_calibracion',
      'lampara_senalizacion',
      'manometros',
      'membrana',
      'transductor',
      'diafragma',
      'organizacion_cableado_tanque',
      'presostatos',
      'regulador_nivel',
      'rele_bimetalico_calibracion',
      'rodamientos',
      'selector',
      'sello_mecanico',
      'tanque_hidroacumulador',
      'temporizador',
      'terminales_bornera_motor',
      'tornilleria_base_motor',
      'variador',
      'voltaje',
      ...completionChecklistGroups.grupo2,
      ...completionChecklistGroups.grupo3
    ],
    [completionChecklistGroups]
  );

  const completionChecklistGroup1 = useMemo(
    () =>
      completionChecklistItems.filter(
        (item) =>
          !completionChecklistGroups.grupo2.includes(item as (typeof completionChecklistGroups.grupo2)[number]) &&
          !completionChecklistGroups.grupo3.includes(item as (typeof completionChecklistGroups.grupo3)[number])
      ),
    [completionChecklistGroups, completionChecklistItems]
  );

  const getTimeParts = (value: string) => {
    const [hour = '', minute = ''] = value.split(':');
    return { hour, minute };
  };

  const setReportTimePart = (field: 'entryHour' | 'exitHour', part: 'hour' | 'minute', nextValue: string) => {
    setCompletionReport((prev) => {
      const current = getTimeParts(prev[field]);
      const hour = part === 'hour' ? nextValue : current.hour;
      const minute = part === 'minute' ? nextValue : current.minute;
      return {
        ...prev,
        [field]: hour || minute ? `${hour}:${minute}` : ''
      };
    });
  };

  const makeGroup1Key = (unit: number, item: string) => `bomba_${unit}__${item}`;
  const makeGroup1RedKey = (unit: number, item: string) => `${makeGroup1Key(unit, item)}__red_distribucion`;
  const formatChecklistLabel = (value: string) =>
    value
      .split('_')
      .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
      .join(' ');

  const startComplete = (appointment: SchedulingItem) => {
    setCompleteTarget(appointment);
    setHasIssues('');
    setIssues([]);
    setIssueDraft({ id: '', type: '', category: '', description: '', photos: [] });
    setIssueError(null);
    setCompletionPhotos([]);
    setCompletionReport({ entryHour: '', exitHour: '', observations: '', checklist: {} });
    setGroup1Units([1]);
    setGroupPanelsOpen({ grupo1: false, grupo2: false, grupo3: false });
    setBombaPanelsOpen({ 1: true });
  };

  const addIssue = () => {
    setIssueError(null);
    if (!issueDraft.type || !issueDraft.category) {
      setIssueError(t('scheduling.issueRequired'));
      return;
    }
    if (!hasMinTwoPhotos(issueDraft.photos)) {
      setIssueError('Debes agregar mínimo 2 fotos en la novedad.');
      return;
    }
    const id = issueDraft.id || (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}`);
    setIssues((prev) => [...prev, { ...issueDraft, id }]);
    setIssueDraft({ id: '', type: '', category: '', description: '', photos: [] });
  };

  const removeIssue = (id: string) => {
    setIssues((prev) => prev.filter((item) => item.id !== id));
  };

  const completeService = async () => {
    if (!completeTarget) return;
    const completionError = validateCompletion({ t, hasIssues, issues, completionPhotos, completionReport });
    if (completionError) {
      setIssueError(completionError);
      return;
    }

    const normalizedChecklist = buildNormalizedChecklist({
      completionReport,
      completionChecklistItems,
      completionChecklistGroup1: [...completionChecklistGroup1],
      group1Units,
      makeGroup1Key,
      makeGroup1RedKey
    });

    setCompleteSubmitting(true);
    try {
      const payload = await buildCompletionPayload({
        schedulingItemId: completeTarget.id,
        hasIssues,
        issues,
        completionPhotos,
        completionReport,
        normalizedChecklist
      });
      await updateDocById('service_orders', completeTarget.id, payload);
      await invalidateScheduling();
      toast(t('scheduling.toastCompleted'), 'success');
      if (selected?.id === completeTarget.id) {
        setSelected((prev) => {
          if (!prev || prev.id !== completeTarget.id) return prev;
          return {
            ...prev,
            status: 'completado',
            completedAt: payload.completedAt as string,
            issues: payload.issues as SchedulingItem['issues'],
            completionPhotos: payload.completionPhotos as SchedulingItem['completionPhotos'],
            completionReport: payload.report as SchedulingItem['completionReport']
          };
        });
      }
      setCompleteTarget(null);
    } catch (error) {
      const firebaseMessage =
        typeof error === 'object' && error !== null && 'code' in error
          ? `Firebase Storage (${String((error as { code?: unknown }).code)})`
          : '';
      const detail = error instanceof Error ? error.message : '';
      const message = [firebaseMessage, detail].filter(Boolean).join(': ');
      toast(message || t('common.actionError'), 'error');
    } finally {
      setCompleteSubmitting(false);
    }
  };

  return {
    completeTarget,
    setCompleteTarget,
    hasIssues,
    setHasIssues,
    issues,
    issueDraft,
    setIssueDraft,
    issueError,
    setIssueError,
    completeSubmitting,
    completionPhotos,
    setCompletionPhotos,
    completionReport,
    setCompletionReport,
    timeHourOptions,
    timeMinuteOptions,
    getTimeParts,
    setReportTimePart,
    group1Units,
    setGroup1Units,
    groupPanelsOpen,
    setGroupPanelsOpen,
    bombaPanelsOpen,
    setBombaPanelsOpen,
    completionChecklistGroups,
    completionChecklistItems,
    completionChecklistGroup1,
    makeGroup1Key,
    makeGroup1RedKey,
    formatChecklistLabel,
    startComplete,
    addIssue,
    removeIssue,
    completeService
  };
}
