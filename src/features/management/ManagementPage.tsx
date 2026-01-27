import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Button from '@/components/Button';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import type { Contract } from '@/core/models/contract';
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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

type MaintenanceType = {
  id: string;
  name: string;
  prices: {
    valor_lavado_tanque_agua_potable_sem1: number;
    valor_lavado_tanque_agua_potable_sem2: number;
    valor_lavado_pozos_eyectores_aguas_lluvias: number;
    valor_lavado_pozos_eyectores_aguas_negras: number;
    valor_pruebas_hidraulias_red_contra_incendios: number;
    valor_limpieza_sistema_drenaje_sotanos: number;
    valor_lavado_tanque_red_contra_incendios: number;
    valor_contrato_mantenimiento: number;
  };
};

type LabAnalysisType = {
  id: string;
  name: string;
};

export default function ManagementPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'editor';
  const { data: companies = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: contracts = [] } = useList<Contract>('contracts', 'contracts');
  const { data: maintenanceSettings } = useQuery({
    queryKey: ['maintenanceContractTypes'],
    queryFn: async () => {
      const snapshot = await getDoc(doc(db, 'settings', 'maintenance_contract_types'));
      return snapshot.exists()
        ? (snapshot.data() as { types?: MaintenanceType[] })
        : { types: [] };
    },
    staleTime: 60_000
  });
  const { data: labSettings } = useQuery({
    queryKey: ['labAnalysisTypes'],
    queryFn: async () => {
      const snapshot = await getDoc(doc(db, 'settings', 'lab_analysis_types'));
      return snapshot.exists()
        ? (snapshot.data() as { types?: LabAnalysisType[] })
        : { types: [] };
    },
    staleTime: 60_000
  });
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'administrations' | 'contracts'>('administrations');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ManagementCompany | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<ManagementCompany | null>(null);
  const [mapsReady, setMapsReady] = useState(false);
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<string[]>([]);
  const [buildingSearch, setBuildingSearch] = useState('');
  const [buildingsError, setBuildingsError] = useState<string | null>(null);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [deleteContractTarget, setDeleteContractTarget] = useState<Contract | null>(null);

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
    billingEmail: z.string().email(t('auth.errorEmail')),
    legalRepresentative: z.string().min(2, t('common.required')),
    group: z.string().min(2, t('common.required')),
    type: z.enum(['EDIFICIO', 'CONJUNTO_RESIDENCIAL', 'UNIDAD']),
    delegateName: z.string().min(2, t('common.required')),
    delegatePhone: z.string().min(7, t('common.required')),
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

  const contractSchema = z
    .object({
      name: z.string().min(2, t('common.required')),
      administrationId: z.string().min(1, t('common.required')),
      maintenanceTypeId: z.string().min(1, t('common.required')),
      labAnalysisTypeId: z.string().min(1, t('common.required')),
      labAnalysisPrice: z.string().min(1, t('common.required')),
      startAt: z.string().min(1, t('common.required')),
      endAt: z.string().min(1, t('common.required')),
      status: z.enum(['activo', 'inactivo'])
    })
    .superRefine((values, ctx) => {
      if (values.endAt && values.startAt && values.endAt < values.startAt) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['endAt'],
          message: t('errors.invalidDateRange')
        });
      }
    });
  type ContractValues = z.infer<typeof contractSchema>;
  const {
    register: contractRegister,
    handleSubmit: handleContractSubmit,
    formState: { errors: contractErrors, isSubmitting: contractSubmitting },
    reset: resetContract,
    watch: contractWatch
  } = useForm<ContractValues>({ resolver: zodResolver(contractSchema) });

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      loadGoogleMaps(apiKey)
        .then(() => setMapsReady(true))
        .catch(() => setMapsReady(false));
    }
  }, []);

  const maintenanceTypes = maintenanceSettings?.types ?? [];
  const labTypes = labSettings?.types ?? [];
  const selectedMaintenanceId = contractWatch('maintenanceTypeId');
  const selectedMaintenanceType = maintenanceTypes.find((item) => item.id === selectedMaintenanceId);

  useEffect(() => {
    if (activeTab === 'contracts') {
      setSelectedCompany(null);
    }
  }, [activeTab]);

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

  const contractColumns = useMemo<ColumnDef<Contract>[]>(() => {
    const base: ColumnDef<Contract>[] = [
      { header: t('contracts.name'), accessorKey: 'name', enableSorting: true },
      {
        header: t('contracts.administration'),
        enableSorting: true,
        accessorFn: (row) =>
          companies.find((company) => company.id === row.administrationId)?.name ?? t('common.noData')
      },
      { header: t('contracts.startAt'), accessorKey: 'startAt', enableSorting: true },
      { header: t('contracts.endAt'), accessorKey: 'endAt', enableSorting: true },
      {
        header: t('contracts.status'),
        accessorKey: 'status',
        enableSorting: true,
        cell: ({ row }) =>
          row.original.status === 'activo' ? t('contracts.statusActive') : t('contracts.statusInactive')
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
              onClick={() => startEditContract(row.original)}
              title={t('common.edit')}
              aria-label={t('common.edit')}
            >
              <EditIcon className="h-4 w-4" aria-hidden />
            </button>
            <button
              className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-rose-600 hover:bg-rose-50"
              onClick={() => setDeleteContractTarget(row.original)}
              title={t('common.delete')}
              aria-label={t('common.delete')}
            >
              <TrashIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>
        )
      }
    ];
  }, [t, canEdit, companies]);

  const onSubmit = async (values: FormValues) => {
    clearErrors('nit');
    if (selectedBuildingIds.length === 0) {
      setBuildingsError(t('management.buildingsRequired'));
      return;
    }
    setBuildingsError(null);
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
      setBuildingsError(null);
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
    reset({
      name: '',
      contactPhone: '',
      email: '',
      billingEmail: '',
      legalRepresentative: '',
      group: '',
      type: 'EDIFICIO',
      delegateName: '',
      delegatePhone: '',
      nit: '',
      address: ''
    });
    setSelectedBuildingIds([]);
    setBuildingSearch('');
    setBuildingsError(null);
    setModalOpen(true);
  };

  const startEdit = (company: ManagementCompany) => {
    setEditingId(company.id);
    reset({
      name: company.name,
      contactPhone: company.contactPhone,
      email: company.email ?? '',
      billingEmail: company.billingEmail ?? '',
      legalRepresentative: company.legalRepresentative ?? '',
      group: company.group ?? '',
      type: company.type ?? 'EDIFICIO',
      delegateName: company.delegateName ?? '',
      delegatePhone: company.delegatePhone ?? '',
      nit: company.nit,
      address: company.address ?? ''
    });
    setSelectedBuildingIds(
      buildings.filter((building) => building.managementCompanyId === company.id).map((building) => building.id)
    );
    setBuildingSearch('');
    setBuildingsError(null);
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

  const onContractSubmit = async (values: ContractValues) => {
    const maintenanceType = (maintenanceSettings?.types ?? []).find(
      (item) => item.id === values.maintenanceTypeId
    );
    const labType = (labSettings?.types ?? []).find((item) => item.id === values.labAnalysisTypeId);
    if (!maintenanceType) {
      toast(t('contracts.maintenanceTypeRequired'), 'error');
      return;
    }
    if (!labType) {
      toast(t('contracts.labTypeRequired'), 'error');
      return;
    }
    const labAnalysisPrice = Number(values.labAnalysisPrice);
    if (Number.isNaN(labAnalysisPrice)) {
      toast(t('contracts.labPriceInvalid'), 'error');
      return;
    }
    const payload = {
      name: values.name,
      administrationId: values.administrationId,
      maintenanceTypeId: values.maintenanceTypeId,
      maintenanceTypeName: maintenanceType.name,
      labAnalysisTypeId: values.labAnalysisTypeId,
      labAnalysisTypeName: labType.name,
      labAnalysisPrice,
      maintenancePrices: maintenanceType.prices,
      startAt: values.startAt,
      endAt: values.endAt,
      status: values.status
    };
    try {
      if (editingContract) {
        await updateDocById('contracts', editingContract.id, payload);
        toast(t('contracts.toastUpdated'), 'success');
      } else {
        await createDoc('contracts', payload);
        toast(t('contracts.toastCreated'), 'success');
      }
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      resetContract({
        name: '',
        administrationId: '',
        maintenanceTypeId: '',
        labAnalysisTypeId: '',
        labAnalysisPrice: '',
        startAt: '',
        endAt: '',
        status: 'activo'
      });
      setEditingContract(null);
      setContractModalOpen(false);
    } catch (error) {
      toast(t('common.actionError'), 'error');
    }
  };

  const startCreateContract = () => {
    setEditingContract(null);
    resetContract({
      name: '',
      administrationId: '',
      maintenanceTypeId: '',
      labAnalysisTypeId: '',
      labAnalysisPrice: '',
      startAt: '',
      endAt: '',
      status: 'activo'
    });
    setContractModalOpen(true);
  };

  const startEditContract = (contract: Contract) => {
    setEditingContract(contract);
    resetContract({
      name: contract.name,
      administrationId: contract.administrationId,
      maintenanceTypeId: contract.maintenanceTypeId ?? '',
      labAnalysisTypeId: contract.labAnalysisTypeId ?? '',
      labAnalysisPrice: contract.labAnalysisPrice ? String(contract.labAnalysisPrice) : '',
      startAt: contract.startAt,
      endAt: contract.endAt,
      status: contract.status
    });
    setContractModalOpen(true);
  };

  const confirmDeleteContract = async () => {
    if (!deleteContractTarget) return;
    const inUse = buildings.some((building) => building.contractId === deleteContractTarget.id);
    if (inUse) {
      toast(t('contracts.deleteBlocked'), 'error');
      setDeleteContractTarget(null);
      return;
    }
    try {
      await deleteDocById('contracts', deleteContractTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast(t('contracts.toastDeleted'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setDeleteContractTarget(null);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t('management.title')} subtitle={t('management.subtitle')} />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={activeTab === 'administrations' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('administrations')}
        >
          {t('management.tabs.administrations')}
        </Button>
        <Button
          variant={activeTab === 'contracts' ? 'primary' : 'secondary'}
          onClick={() => setActiveTab('contracts')}
        >
          {t('management.tabs.contracts')}
        </Button>
      </div>
      {activeTab === 'administrations' && selectedCompany ? (
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
      {activeTab === 'administrations' && canEdit ? (
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
                label={t('management.billingEmail')}
                type="email"
                error={errors.billingEmail?.message}
                required
                {...register('billingEmail')}
              />
              <Input
                label={t('management.legalRepresentative')}
                error={errors.legalRepresentative?.message}
                required
                {...register('legalRepresentative')}
              />
              <Input label={t('management.group')} error={errors.group?.message} required {...register('group')} />
              <Select label={t('management.type')} error={errors.type?.message} required {...register('type')}>
                <option value="EDIFICIO">{t('management.types.EDIFICIO')}</option>
                <option value="CONJUNTO_RESIDENCIAL">{t('management.types.CONJUNTO_RESIDENCIAL')}</option>
                <option value="UNIDAD">{t('management.types.UNIDAD')}</option>
              </Select>
              <Input
                label={t('management.delegateName')}
                error={errors.delegateName?.message}
                required
                {...register('delegateName')}
              />
              <Input
                label={t('management.delegatePhone')}
                error={errors.delegatePhone?.message}
                required
                {...register('delegatePhone')}
              />
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
                {buildingsError ? <p className="text-xs text-red-500">{buildingsError}</p> : null}
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
      ) : null}
      {activeTab === 'administrations' && !canEdit ? (
        <DataTable
          columns={columns}
          data={companies}
          emptyState={<EmptyState title={t('management.emptyTitle')} description={t('management.emptySubtitle')} />}
        />
      ) : null}
      {activeTab === 'contracts' ? (
        <div className="space-y-3">
          {canEdit ? (
            <div className="flex items-center justify-end">
              <Button onClick={startCreateContract}>{t('common.add')}</Button>
            </div>
          ) : null}
          <DataTable
            columns={contractColumns}
            data={contracts}
            emptyState={<EmptyState title={t('contracts.emptyTitle')} description={t('contracts.emptySubtitle')} />}
          />
          <Modal
            open={contractModalOpen}
            title={editingContract ? t('contracts.editTitle') : t('contracts.newTitle')}
            onClose={() => {
              setContractModalOpen(false);
              setEditingContract(null);
            }}
          >
            <form onSubmit={handleContractSubmit(onContractSubmit)} className="space-y-4" noValidate>
              <Input
                label={t('contracts.name')}
                error={contractErrors.name?.message}
                required
                {...contractRegister('name')}
              />
              <Select
                label={t('contracts.administration')}
                error={contractErrors.administrationId?.message}
                required
                {...contractRegister('administrationId')}
              >
                <option value="">{t('common.select')}</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Select>
              <Select
                label={t('contracts.maintenanceType')}
                error={contractErrors.maintenanceTypeId?.message}
                required
                {...contractRegister('maintenanceTypeId')}
              >
                <option value="">{t('common.select')}</option>
                {maintenanceTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
              {selectedMaintenanceType ? (
                <div className="rounded-xl border border-fog-200 bg-fog-50 p-3 text-xs text-ink-700">
                  <p className="text-xs font-semibold text-ink-800">{t('contracts.pricesTitle')}</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <div>
                      <p className="font-semibold">{t('contracts.priceWaterTankSem1')}</p>
                      <p>{selectedMaintenanceType.prices.valor_lavado_tanque_agua_potable_sem1}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{t('contracts.priceWaterTankSem2')}</p>
                      <p>{selectedMaintenanceType.prices.valor_lavado_tanque_agua_potable_sem2}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{t('contracts.pricePozosLluvias')}</p>
                      <p>{selectedMaintenanceType.prices.valor_lavado_pozos_eyectores_aguas_lluvias}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{t('contracts.pricePozosNegras')}</p>
                      <p>{selectedMaintenanceType.prices.valor_lavado_pozos_eyectores_aguas_negras}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{t('contracts.priceHidraulicas')}</p>
                      <p>{selectedMaintenanceType.prices.valor_pruebas_hidraulias_red_contra_incendios}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{t('contracts.priceDrenaje')}</p>
                      <p>{selectedMaintenanceType.prices.valor_limpieza_sistema_drenaje_sotanos}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{t('contracts.priceTankRCI')}</p>
                      <p>{selectedMaintenanceType.prices.valor_lavado_tanque_red_contra_incendios}</p>
                    </div>
                    <div>
                      <p className="font-semibold">{t('contracts.priceMaintenance')}</p>
                      <p>{selectedMaintenanceType.prices.valor_contrato_mantenimiento}</p>
                    </div>
                  </div>
                </div>
              ) : null}
              <Select
                label={t('contracts.labAnalysisType')}
                error={contractErrors.labAnalysisTypeId?.message}
                required
                {...contractRegister('labAnalysisTypeId')}
              >
                <option value="">{t('common.select')}</option>
                {labTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
              <Input
                label={t('contracts.labAnalysisPrice')}
                error={contractErrors.labAnalysisPrice?.message}
                required
                type="number"
                {...contractRegister('labAnalysisPrice')}
              />
              <Input
                label={t('contracts.startAt')}
                type="date"
                error={contractErrors.startAt?.message}
                required
                {...contractRegister('startAt')}
              />
              <Input
                label={t('contracts.endAt')}
                type="date"
                error={contractErrors.endAt?.message}
                required
                {...contractRegister('endAt')}
              />
              <Select label={t('contracts.status')} error={contractErrors.status?.message} {...contractRegister('status')}>
                <option value="activo">{t('contracts.statusActive')}</option>
                <option value="inactivo">{t('contracts.statusInactive')}</option>
              </Select>
              <Button type="submit" className="w-full" disabled={contractSubmitting}>
                {contractSubmitting
                  ? t('contracts.saving')
                  : editingContract
                    ? t('contracts.update')
                    : t('contracts.create')}
              </Button>
            </form>
          </Modal>
          <ConfirmModal
            open={Boolean(deleteContractTarget)}
            title={t('contracts.deleteTitle')}
            description={t('contracts.deleteConfirm')}
            onConfirm={confirmDeleteContract}
            onClose={() => setDeleteContractTarget(null)}
          />
        </div>
      ) : null}
    </div>
  );
}
