import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Button from '@/components/Button';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/app/Auth';
import { useList } from '@/lib/api/queries';
import type { AppUser, AppUserRole } from '@/core/models/appUser';
import type { ManagementCompany } from '@/core/models/managementCompany';
import type { ColumnDef } from '@tanstack/react-table';
import { createAppUser, updateAppUser, setAppUserDisabled, deleteAppUser } from '@/lib/api/functions';
import { useToast } from '@/components/ToastProvider';
import { EditIcon, TrashIcon, PowerIcon } from '@/components/ActionIcons';

const roleOptions = ['view', 'editor', 'admin', 'owner', 'building_admin', 'technician', 'emergency_scheduler', 'supervisor', 'scheduler', 'operator', 'auditoria', 'client'] as const satisfies readonly AppUserRole[];

type FormValues = {
  email: string;
  role: AppUserRole;
  administrationId?: string;
};

export default function UsersPage() {
  const { t } = useI18n();
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AppUser | null>(null);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const { data: users = [] } = useList<AppUser>('users', 'users');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');

  const schema = z
    .object({
      email: z.string().email(t('auth.error.email')),
      role: z.enum(roleOptions, {
        errorMap: () => ({ message: t('common.required') })
      }),
      administrationId: z.string().optional()
    })
    .superRefine((values, ctx) => {
      if ((values.role === 'building_admin' || values.role === 'client') && !values.administrationId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['administrationId'],
          message: t('common.required')
        });
      }
    });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    resetField,
    watch
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'view', administrationId: '' }
  });

  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors, isSubmitting: editSubmitting },
    reset: resetEdit,
    resetField: resetEditField,
    watch: editWatch
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'view', administrationId: '' }
  });

  const roleValue = watch('role');
  const editRoleValue = editWatch('role');

  useEffect(() => {
    if (roleValue !== 'building_admin' && roleValue !== 'client') {
      resetField('administrationId');
    }
  }, [roleValue, resetField]);

  useEffect(() => {
    if (editRoleValue !== 'building_admin' && editRoleValue !== 'client') {
      resetEditField('administrationId');
    }
  }, [editRoleValue, resetEditField]);

  const columns = useMemo<ColumnDef<AppUser>[]>(
    () => [
      { header: t('users.email'), accessorKey: 'email', enableSorting: false },
      {
        header: t('users.role'),
        accessorKey: 'role',
        enableSorting: false,
        cell: ({ row }) => t(`users.roles.${row.original.role}`) ?? row.original.role
      },
      {
        header: t('users.status'),
        accessorKey: 'active',
        enableSorting: true,
        cell: ({ row }) => (row.original.active ? t('users.active') : t('users.disabled'))
      },
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
              className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-amber-600 hover:bg-amber-50"
              onClick={() => toggleDisabled(row.original)}
              title={row.original.active ? t('users.disable') : t('users.enable')}
              aria-label={row.original.active ? t('users.disable') : t('users.enable')}
            >
              <PowerIcon className="h-4 w-4" aria-hidden />
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
    ],
    [t]
  );

  const openInvite = searchParams.get('invite') === '1';
  useEffect(() => {
    if (openInvite && !createOpen) {
      setCreateOpen(true);
      setSearchParams({});
    }
  }, [openInvite, createOpen, setSearchParams]);

  if (role !== 'admin') {
    return (
      <Card>
        <p className="text-sm text-ink-600">{t('users.unauthorized')}</p>
      </Card>
    );
  }

  const onCreate = async (values: FormValues) => {
    try {
      const result = await createAppUser(values.email, values.role, values.administrationId || null);
      setGeneratedPassword(result.password);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast(t('users.toast.created'), 'success');
      reset({ email: '', role: 'view', administrationId: '' });
    } catch {
      toast(t('common.action.error'), 'error');
    }
  };

  const startEdit = (user: AppUser) => {
    setEditingUser(user);
    resetEdit({
      email: user.email,
      role: user.role,
      administrationId: user.administrationId ?? ''
    });
    setEditOpen(true);
  };

  const onEdit = async (values: FormValues) => {
    if (!editingUser) return;
    try {
      await updateAppUser(editingUser.id, {
        email: values.email,
        role: values.role,
        administrationId: values.administrationId || null
      });
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast(t('users.toast.updated'), 'success');
      setEditOpen(false);
      setEditingUser(null);
    } catch {
      toast(t('common.action.error'), 'error');
    }
  };

  const toggleDisabled = async (user: AppUser) => {
    try {
      await setAppUserDisabled(user.id, user.active);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast(user.active ? t('users.toast.disabled') : t('users.toast.enabled'), 'success');
    } catch {
      toast(t('common.action.error'), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteAppUser(deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['users'] });
      toast(t('users.toast.deleted'), 'success');
    } catch {
      toast(t('common.action.error'), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('users.title')}
        subtitle={t('users.subtitle')}
        actions={<Button onClick={() => setCreateOpen(true)}>{t('users.add')}</Button>}
      />
      <DataTable
        columns={columns}
        data={users}
        emptyState={<EmptyState title={t('users.empty.title')} description={t('users.empty.subtitle')} />}
      />

      <Modal
        open={createOpen}
        title={t('users.create.title')}
        onClose={() => {
          setCreateOpen(false);
          setGeneratedPassword(null);
        }}
      >
        <form onSubmit={handleSubmit(onCreate)} className="space-y-4" noValidate>
          <Input label={t('users.email')} type="email" error={errors.email?.message} required {...register('email')} />
          <Select label={t('users.role')} error={errors.role?.message} required {...register('role')}>
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {t(`users.roles.${option}`)}
              </option>
            ))}
          </Select>
          {roleValue === 'building_admin' || roleValue === 'client' ? (
            <Select
              label={t('users.administration')}
              error={errors.administrationId?.message}
              required
              {...register('administrationId')}
            >
              <option value="">{t('common.select')}</option>
              {managements.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
          ) : null}
          {generatedPassword ? (
            <div className="rounded-xl border border-fog-200 bg-fog-50 p-3 text-sm text-ink-700">
              <p className="font-semibold text-ink-900">{t('users.generated.password.title')}</p>
              <p className="break-all font-mono text-xs">{generatedPassword}</p>
            </div>
          ) : null}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? t('users.creating') : t('users.create.default')}
          </Button>
        </form>
      </Modal>

      <Modal
        open={editOpen}
        title={t('users.edit.title')}
        onClose={() => {
          setEditOpen(false);
          setEditingUser(null);
        }}
      >
        <form onSubmit={handleEditSubmit(onEdit)} className="space-y-4" noValidate>
          <Input label={t('users.email')} type="email" error={editErrors.email?.message} required {...editRegister('email')} />
          <Select label={t('users.role')} error={editErrors.role?.message} required {...editRegister('role')}>
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {t(`users.roles.${option}`)}
              </option>
            ))}
          </Select>
          {editRoleValue === 'building_admin' || editRoleValue === 'client' ? (
            <Select
              label={t('users.administration')}
              error={editErrors.administrationId?.message}
              required
              {...editRegister('administrationId')}
            >
              <option value="">{t('common.select')}</option>
              {managements.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
          ) : null}
          <Button type="submit" className="w-full" disabled={editSubmitting}>
            {editSubmitting ? t('users.saving') : t('users.update')}
          </Button>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title={t('users.delete.title')}
        description={t('users.delete.confirm')}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </div>
  );
}
