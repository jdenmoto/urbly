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
import { useI18n } from '@/lib/i18n';
import { listServiceTypes } from '@/lib/serviceTypes';
import {
  buildFastCreateServiceOrderSchema,
  buildFastCreateServiceOrderDraft,
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
  const { t } = useI18n();
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
    resolver: zodResolver(buildFastCreateServiceOrderSchema(t)),
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
          buildTimelineEvent('created', t('scheduling.quick.timeline.created')),
          buildTimelineEvent(
            'scheduled',
            draft.status === 'scheduled'
              ? t('scheduling.quick.timeline.scheduled')
              : t('scheduling.quick.timeline.unassigned'),
          ),
        ],
      });
      await queryClient.invalidateQueries({ queryKey: ['serviceOrders'] });
      toast(
        draft.status === 'scheduled'
          ? t('scheduling.quick.toast.scheduled')
          : t('scheduling.quick.toast.unassigned'),
        'success',
      );
      onClose();
      reset();
    } catch {
      toast(t('scheduling.quick.toast.error'), 'error');
    }
  };

  return (
    <Modal open={open} title={t('scheduling.quick.create')} onClose={onClose}>
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-700">
          {t('scheduling.quick.description')}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Select label={t('scheduling.filters.building')} required error={errors.buildingId?.message} {...register('buildingId')}>
            <option value="">{t('scheduling.quick.select.building')}</option>
            {buildings.map((building) => (
              <option key={building.id} value={building.id}>
                {building.name}
              </option>
            ))}
          </Select>

          <Select label={t('scheduling.quick.service.type')} required error={errors.type?.message} {...register('type')}>
            <option value="">{t('scheduling.quick.select.type')}</option>
            {serviceTypeOptions.map((type) => (
              <option key={type.code} value={type.code}>
                {type.name}
              </option>
            ))}
          </Select>

          <Input label={t('scheduling.quick.start.at')} type="datetime-local" required error={errors.scheduledStartAt?.message} {...register('scheduledStartAt')} />

          <Input
            label={t('scheduling.quick.duration')}
            type="number"
            min={15}
            step={15}
            required
            error={errors.estimatedDurationMinutes?.message}
            {...register('estimatedDurationMinutes', { valueAsNumber: true })}
          />

          <Select label={t('scheduling.filters.technician')} error={errors.assignedTechnicianId?.message} {...register('assignedTechnicianId')}>
            <option value="">{t('services.status.unassigned')}</option>
            {technicians.map((technician) => (
              <option key={technician.id} value={technician.id}>
                {technician.fullName}
              </option>
            ))}
          </Select>
        </div>

        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          {t('scheduling.quick.resulting.status')} <span className="font-semibold">{computedStatus === 'scheduled' ? t('services.status.scheduled') : t('services.status.unassigned')}</span>
          <p className="mt-1 text-xs text-sky-700">
            {t('scheduling.quick.status.hint')}
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-4 md:flex-row md:items-center md:justify-between">
          <Link to="/scheduling" className="text-sm font-semibold text-sky-700 transition hover:text-sky-800">
            {t('scheduling.quick.full.edit')}
          </Link>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>{t('common.cancel')}</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? t('scheduling.quick.creating') : t('scheduling.quick.submit')}</Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
