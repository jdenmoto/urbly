import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Button from '@/components/Button';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import type { Employee } from '@/core/models/employee';
import type { Building } from '@/core/models/building';
import { createDoc, updateDocById, deleteDocById } from '@/lib/api/firestore';
import { useList } from '@/lib/api/queries';
import type { ColumnDef } from '@tanstack/react-table';
import { useI18n } from '@/lib/i18n';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/app/Auth';
import { EditIcon, TrashIcon } from '@/components/ActionIcons';

export default function EmployeesPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { role } = useAuth();
  const canEdit = role !== 'view';
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const queryClient = useQueryClient();
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const schema = z.object({
    fullName: z.string().min(2, t('common.required')),
    phone: z.string().min(7, t('common.required')),
    email: z.string().email(t('auth.errorEmail')),
    role: z.string().min(2, t('common.required')),
    active: z.string().min(1, t('common.required')),
    buildingId: z.string().optional()
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors, isSubmitting: editSubmitting },
    reset: resetEdit
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const columns = useMemo<ColumnDef<Employee>[]>(() => {
    const base: ColumnDef<Employee>[] = [
      { header: t('employees.fullName'), accessorKey: 'fullName', enableSorting: true },
      { header: t('employees.role'), accessorKey: 'role', enableSorting: false },
      { header: t('employees.phone'), accessorKey: 'phone', enableSorting: false },
      { header: t('employees.active'), accessorKey: 'active', enableSorting: true }
    ];
    if (!canEdit) return base;
    return [
      ...base,
      {
        header: t('common.actions'),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <button
              className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-ink-700 hover:bg-fog-100"
              onClick={() => startEdit(row.original)}
              title={t('common.edit')}
              aria-label={t('common.edit')}
            >
              <EditIcon className="h-4 w-4" aria-hidden />
            </button>
            <button
              className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-rose-600 hover:bg-rose-50"
              onClick={() => setDeleteTarget(row.original)}
              title={t('common.delete')}
              aria-label={t('common.delete')}
            >
              <TrashIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )
      }
    ];
  }, [t, canEdit]);

  const onSubmit = async (values: FormValues) => {
    try {
      await createDoc('employees', {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        role: values.role,
        active: values.active === 'true',
        buildingId: values.buildingId || null
      });
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      reset();
      toast(t('employees.toastCreated'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    }
  };

  const startEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    resetEdit({
      fullName: employee.fullName,
      phone: employee.phone,
      email: employee.email,
      role: employee.role,
      active: employee.active ? 'true' : 'false',
      buildingId: employee.buildingId ?? ''
    });
    setEditOpen(true);
  };

  const startCreate = () => {
    reset({
      fullName: '',
      phone: '',
      email: '',
      role: '',
      active: 'true',
      buildingId: ''
    });
    setCreateOpen(true);
  };

  const onEditSubmit = async (values: FormValues) => {
    if (!editingEmployee) return;
    try {
      await updateDocById('employees', editingEmployee.id, {
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        role: values.role,
        active: values.active === 'true',
        buildingId: values.buildingId || null
      });
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      setEditOpen(false);
      setEditingEmployee(null);
      toast(t('employees.toastUpdated'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocById('employees', deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast(t('employees.toastDeleted'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('employees.title')}
        subtitle={t('employees.subtitle')}
        actions={canEdit ? <Button onClick={startCreate}>{t('common.add')}</Button> : null}
      />
      {canEdit ? (
        <>
          <DataTable
            columns={columns}
            data={employees}
            emptyState={<EmptyState title={t('employees.emptyTitle')} description={t('employees.emptySubtitle')} />}
          />
          <Modal open={createOpen} title={t('employees.newTitle')} onClose={() => setCreateOpen(false)}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input label={t('employees.fullName')} error={errors.fullName?.message} required {...register('fullName')} />
              <Input label={t('employees.phone')} error={errors.phone?.message} required {...register('phone')} />
              <Input label={t('employees.email')} type="email" error={errors.email?.message} required {...register('email')} />
              <Select label={t('employees.role')} error={errors.role?.message} required {...register('role')}>
                <option value="">{t('common.select')}</option>
                <option value={t('employees.roles.admin')}>{t('employees.roles.admin')}</option>
                <option value={t('employees.roles.tech')}>{t('employees.roles.tech')}</option>
                <option value={t('employees.roles.user')}>{t('employees.roles.user')}</option>
              </Select>
              <Select label={t('employees.active')} error={errors.active?.message} required {...register('active')}>
                <option value="true">{t('common.yes')}</option>
                <option value="false">{t('common.no')}</option>
              </Select>
              <Select label={`${t('employees.building')} (${t('common.optional')})`} {...register('buildingId')}>
                <option value="">{t('common.unassigned')}</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('employees.saving') : t('employees.create')}
              </Button>
            </form>
          </Modal>
          <Modal open={editOpen} title={t('employees.editTitle')} onClose={() => setEditOpen(false)}>
            <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4" noValidate>
              <Input label={t('employees.fullName')} error={editErrors.fullName?.message} required {...editRegister('fullName')} />
              <Input label={t('employees.phone')} error={editErrors.phone?.message} required {...editRegister('phone')} />
              <Input label={t('employees.email')} type="email" error={editErrors.email?.message} required {...editRegister('email')} />
              <Select label={t('employees.role')} error={editErrors.role?.message} required {...editRegister('role')}>
                <option value="">{t('common.select')}</option>
                <option value={t('employees.roles.admin')}>{t('employees.roles.admin')}</option>
                <option value={t('employees.roles.tech')}>{t('employees.roles.tech')}</option>
                <option value={t('employees.roles.user')}>{t('employees.roles.user')}</option>
              </Select>
              <Select label={t('employees.active')} error={editErrors.active?.message} required {...editRegister('active')}>
                <option value="true">{t('common.yes')}</option>
                <option value="false">{t('common.no')}</option>
              </Select>
              <Select label={`${t('employees.building')} (${t('common.optional')})`} {...editRegister('buildingId')}>
                <option value="">{t('common.unassigned')}</option>
                {buildings.map((building) => (
                  <option key={building.id} value={building.id}>
                    {building.name}
                  </option>
                ))}
              </Select>
              <Button type="submit" className="w-full" disabled={editSubmitting}>
                {editSubmitting ? t('employees.saving') : t('employees.update')}
              </Button>
            </form>
          </Modal>
          <ConfirmModal
            open={Boolean(deleteTarget)}
            title={t('employees.deleteTitle')}
            description={t('employees.deleteConfirm')}
            onConfirm={confirmDelete}
            onClose={() => setDeleteTarget(null)}
          />
        </>
      ) : (
        <DataTable
          columns={columns}
          data={employees}
          emptyState={<EmptyState title={t('employees.emptyTitle')} description={t('employees.emptySubtitle')} />}
        />
      )}
    </div>
  );
}
