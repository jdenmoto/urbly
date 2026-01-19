import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import type { ManagementCompany } from '@/core/models/managementCompany';
import { createDoc, listDocs, filters, updateDocById, deleteDocById } from '@/lib/api/firestore';
import { useList } from '@/lib/api/queries';
import type { ColumnDef } from '@tanstack/react-table';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/app/Auth';

export default function ManagementPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { role } = useAuth();
  const canEdit = role !== 'view';
  const { data: companies = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagementCompany | null>(null);
  const schema = z.object({
    name: z.string().min(2, t('common.required')),
    contactPhone: z.string().min(7, t('common.required')),
    email: z.string().email(t('auth.errorEmail')),
    nit: z.string().regex(/^\d{6,12}-\d$/, t('management.nitFormat')),
    address: z.string().min(3, t('common.required'))
  });
  type FormValues = z.infer<typeof schema>;
  type EditFormValues = FormValues;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors, isSubmitting: editSubmitting },
    reset: resetEdit,
    setError: setEditError,
    clearErrors: clearEditErrors
  } = useForm<EditFormValues>({ resolver: zodResolver(schema) });

  const columns = useMemo<ColumnDef<ManagementCompany>[]>(() => {
    const base: ColumnDef<ManagementCompany>[] = [
      { header: t('management.name'), accessorKey: 'name' },
      { header: t('management.contactPhone'), accessorKey: 'contactPhone' },
      { header: t('management.email'), accessorKey: 'email' },
      { header: t('management.nit'), accessorKey: 'nit' }
    ];
    if (!canEdit) return base;
    return [
      ...base,
      {
        header: t('common.actions'),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button className="text-xs font-semibold text-ink-700" onClick={() => startEdit(row.original)}>
              {t('common.edit')}
            </button>
            <button className="text-xs font-semibold text-rose-600" onClick={() => setDeleteTarget(row.original)}>
              {t('common.delete')}
            </button>
          </div>
        )
      }
    ];
  }, [t, canEdit]);

  const onSubmit = async (values: FormValues) => {
    clearErrors('nit');
    try {
      const existing = await listDocs<ManagementCompany>('management_companies', [
        filters().where('nit', '==', values.nit)
      ]);
      if (existing.length) {
        setError('nit', { message: t('management.nitUnique') });
        return;
      }
      await createDoc('management_companies', values);
      await queryClient.invalidateQueries({ queryKey: ['managements'] });
      reset();
      toast(t('management.toastCreated'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    }
  };

  const startEdit = (company: ManagementCompany) => {
    setEditingId(company.id);
    resetEdit({
      name: company.name,
      contactPhone: company.contactPhone,
      email: company.email,
      nit: company.nit,
      address: company.address
    });
    setEditOpen(true);
  };

  const onEditSubmit = async (values: EditFormValues) => {
    if (!editingId) return;
    clearEditErrors('nit');
    try {
      const existing = await listDocs<ManagementCompany>('management_companies', [
        filters().where('nit', '==', values.nit)
      ]);
      if (existing.some((item) => item.id !== editingId)) {
        setEditError('nit', { message: t('management.nitUnique') });
        return;
      }
      await updateDocById('management_companies', editingId, values);
      await queryClient.invalidateQueries({ queryKey: ['managements'] });
      setEditOpen(false);
      setEditingId(null);
      toast(t('management.toastUpdated'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocById('management_companies', deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['managements'] });
      toast(t('management.toastDeleted'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t('management.title')} subtitle={t('management.subtitle')} />
      {canEdit ? (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <h3 className="text-sm font-semibold text-ink-800">{t('management.newTitle')}</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <Input label={t('management.name')} error={errors.name?.message} {...register('name')} />
                <Input
                  label={t('management.contactPhone')}
                  error={errors.contactPhone?.message}
                  {...register('contactPhone')}
                />
                <Input label={t('management.email')} type="email" error={errors.email?.message} {...register('email')} />
                <Input
                  label={t('management.nit')}
                  placeholder={t('management.nitPlaceholder')}
                  pattern="^\\d{6,12}-\\d$"
                  error={errors.nit?.message}
                  {...register('nit')}
                />
                <Input label={t('management.address')} error={errors.address?.message} {...register('address')} />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? t('management.saving') : t('management.create')}
                </Button>
              </form>
            </Card>
            <div className="lg:col-span-2">
              <DataTable
                columns={columns}
                data={companies}
                emptyState={<EmptyState title={t('management.emptyTitle')} description={t('management.emptySubtitle')} />}
              />
            </div>
          </div>
          <Modal open={editOpen} title={t('management.editTitle')} onClose={() => setEditOpen(false)}>
            <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
              <Input label={t('management.name')} error={editErrors.name?.message} {...editRegister('name')} />
              <Input
                label={t('management.contactPhone')}
                error={editErrors.contactPhone?.message}
                {...editRegister('contactPhone')}
              />
              <Input
                label={t('management.email')}
                type="email"
                error={editErrors.email?.message}
                {...editRegister('email')}
              />
              <Input
                label={t('management.nit')}
                placeholder={t('management.nitPlaceholder')}
                pattern="^\\d{6,12}-\\d$"
                error={editErrors.nit?.message}
                {...editRegister('nit')}
              />
              <Input label={t('management.address')} error={editErrors.address?.message} {...editRegister('address')} />
              <Button type="submit" className="w-full" disabled={editSubmitting}>
                {editSubmitting ? t('management.saving') : t('management.update')}
              </Button>
            </form>
          </Modal>
          <ConfirmModal
            open={Boolean(deleteTarget)}
            title={t('management.deleteTitle')}
            description={t('management.deleteConfirm')}
            onConfirm={confirmDelete}
            onClose={() => setDeleteTarget(null)}
          />
        </>
      ) : (
        <DataTable
          columns={columns}
          data={companies}
          emptyState={<EmptyState title={t('management.emptyTitle')} description={t('management.emptySubtitle')} />}
        />
      )}
    </div>
  );
}
