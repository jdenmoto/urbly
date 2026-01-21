import { useEffect, useMemo, useState } from 'react';
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
import type { Building } from '@/core/models/building';
import { createDoc, listDocs, filters, updateDocById, deleteDocById } from '@/lib/api/firestore';
import { useList } from '@/lib/api/queries';
import type { ColumnDef } from '@tanstack/react-table';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/app/Auth';
import { loadGoogleMaps } from '@/lib/googleMaps';
import BuildingsMap from '@/components/BuildingsMap';
import { EditIcon, TrashIcon, EyeIcon } from '@/components/ActionIcons';

export default function ManagementPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { role } = useAuth();
  const canEdit = role !== 'view';
  const { data: companies = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagementCompany | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<ManagementCompany | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<string[]>([]);
  const [buildingSearch, setBuildingSearch] = useState('');

  const availableBuildings = useMemo(() => {
    return buildings.filter(
      (building) =>
        building.active !== false && (!building.managementCompanyId || building.managementCompanyId === editingId)
    );
  }, [buildings, editingId]);

  useEffect(() => {
    setSelectedBuildingIds((prev) =>
      prev.filter((id) => availableBuildings.some((building) => building.id === id))
    );
  }, [availableBuildings]);
  const schema = z.object({
    name: z.string().min(2, t('common.required')),
    contactPhone: z.string().min(7, t('common.required')),
    email: z.string().email(t('auth.errorEmail')),
    nit: z.string().regex(/^\d{6,12}-\d$/, t('management.nitFormat')),
    address: z.string().min(3, t('common.required'))
  });
  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      loadGoogleMaps(apiKey)
        .then(() => setMapsReady(true))
        .catch(() => setMapsReady(false));
    }
  }, []);

  const columns = useMemo<ColumnDef<ManagementCompany>[]>(() => {
    const base: ColumnDef<ManagementCompany>[] = [
      { header: t('management.name'), accessorKey: 'name', enableSorting: true },
      { header: t('management.contactPhone'), accessorKey: 'contactPhone', enableSorting: false },
      { header: t('management.email'), accessorKey: 'email', enableSorting: false },
      { header: t('management.nit'), accessorKey: 'nit', enableSorting: false },
      { header: t('management.address'), accessorKey: 'address', enableSorting: true },
      {
        header: t('management.viewBuildings'),
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-ink-700 hover:bg-fog-100"
            onClick={() => setSelectedCompany(row.original)}
            title={t('management.viewBuildings')}
            aria-label={t('management.viewBuildings')}
          >
            <EyeIcon className="h-4 w-4" aria-hidden />
          </button>
        )
      }
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
    clearErrors('nit');
    try {
      const existing = await listDocs<ManagementCompany>('management_companies', [
        filters().where('nit', '==', values.nit)
      ]);
      const hasConflict = existing.some((item) => (editingId ? item.id !== editingId : true));
      if (hasConflict) {
        setError('nit', { message: t('management.nitUnique') });
        return;
      }
      if (editingId) {
        await updateDocById('management_companies', editingId, values);
        await syncBuildings(editingId);
        toast(t('management.toastUpdated'), 'success');
      } else {
        const created = await createDoc('management_companies', values);
        await syncBuildings(created.id);
        toast(t('management.toastCreated'), 'success');
      }
      await queryClient.invalidateQueries({ queryKey: ['managements'] });
      await queryClient.invalidateQueries({ queryKey: ['buildings'] });
      reset();
      setEditingId(null);
      setSelectedBuildingIds([]);
      setBuildingSearch('');
      setModalOpen(false);
    } catch (error) {
      toast(t('common.actionError'), 'error');
    }
  };

  const syncBuildings = async (companyId: string) => {
    const current = buildings.filter((building) => building.managementCompanyId === companyId);
    const currentIds = new Set(current.map((item) => item.id));
    const nextIds = new Set(
      selectedBuildingIds.filter((id) =>
        availableBuildings.some((building) => building.id === id)
      )
    );

    const toRemove = current.filter((item) => !nextIds.has(item.id));
    const toAdd = buildings.filter((item) => nextIds.has(item.id) && item.managementCompanyId !== companyId);

    await Promise.all([
      ...toRemove.map((item) => updateDocById('buildings', item.id, { managementCompanyId: null })),
      ...toAdd.map((item) => updateDocById('buildings', item.id, { managementCompanyId: companyId }))
    ]);
  };

  const startCreate = () => {
    setEditingId(null);
    reset({ name: '', contactPhone: '', email: '', nit: '', address: '' });
    setSelectedBuildingIds([]);
    setBuildingSearch('');
    setModalOpen(true);
  };

  const startEdit = (company: ManagementCompany) => {
    setEditingId(company.id);
    reset({
      name: company.name,
      contactPhone: company.contactPhone,
      email: company.email,
      nit: company.nit,
      address: company.address
    });
    setSelectedBuildingIds(
      buildings.filter((building) => building.managementCompanyId === company.id).map((building) => building.id)
    );
    setBuildingSearch('');
    setModalOpen(true);
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
      {selectedCompany ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-ink-900">{selectedCompany.name}</p>
              <p className="text-xs text-ink-500">{t('management.buildingsTitle')}</p>
            </div>
            <button
              className="text-xs font-semibold text-ink-600 underline"
              onClick={() => setSelectedCompany(null)}
            >
              {t('common.close')}
            </button>
          </div>
          <BuildingsMap
            buildings={buildings.filter((building) => building.managementCompanyId === selectedCompany.id)}
            ready={mapsReady}
          />
          <DataTable
            columns={[
              { header: t('buildings.name'), accessorKey: 'name', enableSorting: true },
              { header: t('buildings.address'), accessorKey: 'addressText', enableSorting: true },
              { header: t('buildings.porterPhone'), accessorKey: 'porterPhone', enableSorting: false }
            ]}
            data={buildings.filter((building) => building.managementCompanyId === selectedCompany.id)}
            emptyState={
              <EmptyState
                title={t('management.buildingsEmptyTitle')}
                description={t('management.buildingsEmptySubtitle')}
              />
            }
            pageSize={5}
          />
        </div>
      ) : null}
      {canEdit ? (
        <>
          <div className="space-y-3">
            <div className="flex items-center justify-end">
              <Button onClick={startCreate}>{t('common.add')}</Button>
            </div>
            <DataTable
              columns={columns}
              data={companies}
              emptyState={<EmptyState title={t('management.emptyTitle')} description={t('management.emptySubtitle')} />}
            />
          </div>
          <Modal
            open={modalOpen}
            title={editingId ? t('management.editTitle') : t('management.newTitle')}
            onClose={() => {
              setModalOpen(false);
              setEditingId(null);
            }}
          >
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input label={t('management.name')} error={errors.name?.message} required {...register('name')} />
              <Input
                label={t('management.contactPhone')}
                error={errors.contactPhone?.message}
                required
                {...register('contactPhone')}
              />
              <Input label={t('management.email')} type="email" error={errors.email?.message} required {...register('email')} />
              <Input
                label={t('management.nit')}
                placeholder={t('management.nitPlaceholder')}
                pattern="^\\d{6,12}-\\d$"
                error={errors.nit?.message}
                required
                {...register('nit')}
              />
              <Input label={t('management.address')} error={errors.address?.message} required {...register('address')} />
              <div className="space-y-2">
                <p className="text-sm font-medium text-ink-800">{t('management.buildingsSelect')}</p>
                <Input
                  label={t('management.searchBuildings')}
                  value={buildingSearch}
                  onChange={(event) => setBuildingSearch(event.target.value)}
                />
                <div className="flex items-center justify-between text-xs text-ink-600">
                  <span>{t('management.availableBuildings')}</span>
                  <button
                    type="button"
                    className="font-semibold text-ink-700 hover:text-ink-900"
                    onClick={() => {
                      const availableIds = availableBuildings
                        .filter((building) => !selectedBuildingIds.includes(building.id))
                        .map((building) => building.id);
                      const next = Array.from(new Set([...selectedBuildingIds, ...availableIds]));
                      setSelectedBuildingIds(next);
                    }}
                  >
                    {t('management.selectAll')}
                  </button>
                </div>
                <div className="max-h-40 overflow-y-auto rounded-lg border border-fog-200 bg-white p-2 text-sm text-ink-700">
                  {availableBuildings
                    .filter((building) => !selectedBuildingIds.includes(building.id))
                    .filter((building) =>
                      building.name.toLowerCase().includes(buildingSearch.toLowerCase())
                    )
                    .map((building) => (
                      <button
                        key={building.id}
                        type="button"
                        className="flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm text-ink-700 hover:bg-fog-100"
                        onClick={() => setSelectedBuildingIds([...selectedBuildingIds, building.id])}
                      >
                        <span>{building.name}</span>
                        <span className="text-xs text-ink-400">+</span>
                      </button>
                    ))}
                  {!availableBuildings
                    .filter((building) => !selectedBuildingIds.includes(building.id))
                    .filter((building) =>
                      building.name.toLowerCase().includes(buildingSearch.toLowerCase())
                    ).length ? (
                    <p className="text-xs text-ink-500">{t('management.buildingsEmpty')}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-ink-600">{t('management.selectedBuildings')}</p>
                  <DataTable
                    columns={[
                      { header: t('buildings.name'), accessorKey: 'name', enableSorting: true },
                      {
                        header: t('common.actions'),
                        enableSorting: false,
                        cell: ({ row }) => (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-rose-600 hover:bg-rose-50"
                            onClick={() =>
                              setSelectedBuildingIds(selectedBuildingIds.filter((id) => id !== row.original.id))
                            }
                            title={t('common.delete')}
                            aria-label={t('common.delete')}
                          >
                            <TrashIcon className="h-4 w-4" aria-hidden />
                          </button>
                        )
                      }
                    ]}
                    data={buildings.filter((building) => selectedBuildingIds.includes(building.id))}
                    emptyState={<EmptyState title={t('management.selectedEmptyTitle')} description={t('management.selectedEmptySubtitle')} />}
                    pageSize={5}
                  />
                </div>
                <p className="text-xs text-ink-500">{t('management.buildingsOptional')}</p>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? t('management.saving') : editingId ? t('management.update') : t('management.create')}
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
