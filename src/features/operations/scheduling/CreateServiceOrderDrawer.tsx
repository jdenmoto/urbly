import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';

import Button from '@/components/Button';
import Input from '@/components/Input';
import Modal from '@/components/Modal';
import Select from '@/components/Select';
import { useToast } from '@/components/ToastProvider';
import { createDoc } from '@/lib/api/firestore';
import { buildServiceOrderPayload } from '@/lib/api/serviceOrders';
import { listServiceTypes } from '@/lib/serviceTypes';
import {
  buildFastCreateServiceOrderDraft,
  fastCreateServiceOrderSchema,
  type FastCreateServiceOrderValues,
} from './schedulingSchemas';

type Props = {
  open: boolean;
  onClose: () => void;
  buildings: Array<{ id: string; name: string }>;
  technicians: Array<{ id: string; fullName: string }>;
  prefill?: Partial<FastCreateServiceOrderValues>;
};

function buildTimelineEvent(type: 'created' | 'scheduled', summary: string) {
  return {
    id: crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    type,
    createdAt: new Date().toISOString(),
    actorRole: 'company' as const,
    summary,
  };
}

export default function CreateServiceOrderDrawer({ open, onClose, buildings, technicians, prefill }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [serviceTypeOptions, setServiceTypeOptions] = useState<Array<{ code: string; name: string }>>([]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<FastCreateServiceOrderValues>({
    resolver: zodResolver(fastCreateServiceOrderSchema),
    defaultValues: {
      buildingId: '',
      type: '',
      scheduledStartAt: '',
      estimatedDurationMinutes: 60,
      assignedTechnicianId: '',
      ...prefill,
    },
  });

  useEffect(() => {
    if (!open) return;
    reset({
      buildingId: '',
      type: '',
      scheduledStartAt: '',
      estimatedDurationMinutes: 60,
      assignedTechnicianId: '',
      ...prefill,
    });
  }, [open, prefill, reset]);

  useEffect(() => {
    let mounted = true;
    const loadServiceTypes = async () => {
      const items = await listServiceTypes();
      if (!mounted) return;
      setServiceTypeOptions(items.map((item) => ({ code: item.code, name: item.name })));
    };
    void loadServiceTypes();
    return () => {
      mounted = false;
    };
  }, []);

  const assignedTechnicianId = watch('assignedTechnicianId');
  const computedStatus = assignedTechnicianId ? 'scheduled' : 'unassigned';

  const onSubmit = async (values: FastCreateServiceOrderValues) => {
    try {
      const draft = buildFastCreateServiceOrderDraft(values);
      await createDoc('service_orders', {
        ...buildServiceOrderPayload({
          buildingId: draft.buildingId,
          title: draft.title,
          description: draft.description,
          scheduledStartAt: draft.scheduledStartAt,
          scheduledEndAt: draft.scheduledEndAt,
          status: draft.status,
          recurrence: null,
          type: draft.type,
          assignedTechnicianId: draft.assignedTechnicianId,
          seriesId: null,
        }),
        timeline: [
          buildTimelineEvent('created', 'Service order creada desde creación rápida'),
          buildTimelineEvent(
            'scheduled',
            draft.status === 'scheduled'
              ? 'Servicio programado con técnico desde creación rápida'
              : 'Servicio creado sin técnico desde creación rápida',
          ),
        ],
      });
      await queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      toast(
        draft.status === 'scheduled'
          ? 'Servicio creado y programado.'
          : 'Servicio creado sin técnico. Quedó listo para asignación.',
        'success',
      );
      onClose();
      reset();
    } catch {
      toast('No fue posible crear el service order.', 'error');
    }
  };

  return (
    <Modal open={open} title="Crear servicio rápido" onClose={onClose}>
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          Flujo rápido para agenda diaria. Si el caso requiere más contexto, recurrencia o notas operativas, escálalo a la edición completa.
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select label="Edificio" required error={errors.buildingId?.message} {...register('buildingId')}>
            <option value="">Selecciona un edificio</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </Select>

          <Select label="Tipo de servicio" required error={errors.type?.message} {...register('type')}>
            <option value="">Selecciona un tipo</option>
            {serviceTypeOptions.map((type) => (
              <option key={type.code} value={type.code}>
                {type.name}
              </option>
            ))}
          </Select>

          <Input label="Fecha y hora inicial" type="datetime-local" required error={errors.scheduledStartAt?.message} {...register('scheduledStartAt')} />

          <Input
            label="Duración estimada (min)"
            type="number"
            min={15}
            step={15}
            required
            error={errors.estimatedDurationMinutes?.message}
            {...register('estimatedDurationMinutes', { valueAsNumber: true })}
          />

          <Select label="Técnico" error={errors.assignedTechnicianId?.message} {...register('assignedTechnicianId')}>
            <option value="">Sin técnico</option>
            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.fullName}
              </option>
            ))}
          </Select>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          Estado resultante: <span className="font-semibold">{computedStatus === 'scheduled' ? 'Programado' : 'Sin técnico'}</span>
          <p className="mt-1 text-xs text-sky-700">
            Con técnico asignado queda programado. Sin técnico queda visible para asignación desde la agenda.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
          <Link to="/scheduling" className="text-sm font-semibold text-sky-700 transition hover:text-sky-800">
            Ir a edición completa
          </Link>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear servicio'}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
