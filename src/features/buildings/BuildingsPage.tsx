import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDoc, updateDocById, deleteDocById } from '@/lib/api/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useList } from '@/lib/api/queries';
import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import type { ManagementCompany } from '@/core/models/managementCompany';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Button from '@/components/Button';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import PlacesAutocomplete, { type PlaceResult } from '@/components/PlacesAutocomplete';
import { loadGoogleMaps } from '@/lib/googleMaps';
import { importBuildingsFile, type ImportResult } from '@/lib/api/functions';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import type { ColumnDef } from '@tanstack/react-table';
import { useI18n } from '@/lib/i18n';
import BuildingsMap from '@/components/BuildingsMap';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/app/Auth';
import { EditIcon, TrashIcon, PowerIcon } from '@/components/ActionIcons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

type PreviewRow = {
  building_name: string;
  address: string;
  porter_phone: string;
  management_name: string;
};

export default function BuildingsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { role } = useAuth();
  const canEdit = role === 'admin' || role === 'editor';
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const { data: contracts = [] } = useList<Contract>('contracts', 'contracts');
  const { data: groupSettings } = useQuery({
    queryKey: ['buildingGroups'],
    queryFn: async () => {
      const snapshot = await getDoc(doc(db, 'settings', 'building_groups'));
      return snapshot.exists()
        ? (snapshot.data() as { groups?: Array<{ id: string; name: string; color: string }> })
        : null;
    },
    staleTime: 60_000
  });
  const queryClient = useQueryClient();
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [editPlace, setEditPlace] = useState<PlaceResult | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const buildingGroups = useMemo(() => groupSettings?.groups ?? [], [groupSettings]);

  const schema = z.object({
    name: z.string().min(2, t('common.required')),
    group: z.string().min(1, t('common.required')),
    type: z.enum(['EDIFICIO', 'CONJUNTO_RESIDENCIAL', 'UNIDAD']),
    delegateName: z.string().min(2, t('common.required')),
    delegatePhone: z.string().min(7, t('common.required')),
    nit: z.string().regex(/^\d{6,12}-\d$/, t('management.nitFormat')),
    email: z.string().email(t('auth.errorEmail')),
    billingEmail: z.string().email(t('auth.errorEmail')),
    porterPhone: z.string().min(7, t('common.required')),
    managementCompanyId: z.string().min(1, t('buildings.managementRequired')),
    contractId: z.string().min(1, t('buildings.contractRequired'))
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const {
    register: editRegister,
    handleSubmit: handleEditSubmit,
    formState: { errors: editErrors, isSubmitting: editSubmitting },
    reset: resetEdit,
    watch: editWatch,
    setValue: setEditValue
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const selectedManagementId = watch('managementCompanyId');
  const selectedContractId = watch('contractId');
  const editManagementId = editWatch('managementCompanyId');
  const editContractId = editWatch('contractId');

  const [mapsReady, setMapsReady] = useState(false);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      loadGoogleMaps(apiKey)
        .then(() => setMapsReady(true))
        .catch(() => setMapsReady(false));
    }
  }, []);

  const columns = useMemo<ColumnDef<Building>[]>(() => {
    const base: ColumnDef<Building>[] = [
      { header: t('buildings.name'), accessorKey: 'name', enableSorting: true },
      { header: t('buildings.porterPhone'), accessorKey: 'porterPhone', enableSorting: false },
      { header: t('buildings.address'), accessorKey: 'addressText', enableSorting: true },
      {
        header: t('buildings.contract'),
        enableSorting: false,
        accessorFn: (row) => {
          const contract = contracts.find((item) => item.id === row.contractId);
          return contract?.name ?? t('buildings.noContract');
        }
      },
      {
        header: t('buildings.status'),
        accessorKey: 'active',
        enableSorting: true,
        cell: ({ row }) => (row.original.active === false ? t('buildings.disabled') : t('buildings.active'))
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
              className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-amber-600 hover:bg-amber-50"
              onClick={() => toggleActive(row.original)}
              title={row.original.active === false ? t('buildings.enable') : t('buildings.disable')}
              aria-label={row.original.active === false ? t('buildings.enable') : t('buildings.disable')}
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
    ];
  }, [t, canEdit, contracts]);

  const previewColumns = useMemo<ColumnDef<PreviewRow>[]>(
    () => [
      { header: t('buildings.name'), accessorKey: 'building_name', enableSorting: false },
      { header: t('buildings.address'), accessorKey: 'address', enableSorting: false },
      { header: t('buildings.porterPhone'), accessorKey: 'porter_phone', enableSorting: false },
      { header: t('buildings.managementCompany'), accessorKey: 'management_name', enableSorting: false }
    ],
    [t]
  );

  const errorColumns = useMemo<ColumnDef<{ row: number; message: string }>[]>( 
    () => [
      { header: t('buildings.errorRow'), accessorKey: 'row', enableSorting: false },
      { header: t('buildings.errorMessage'), accessorKey: 'message', enableSorting: false }
    ],
    [t]
  );

  const onSubmit = async (values: FormValues) => {
    if (!place) return;
    const contract = contracts.find((item) => item.id === values.contractId);
    if (!contract || contract.administrationId !== values.managementCompanyId) {
      toast(t('buildings.contractMismatch'), 'error');
      return;
    }
    try {
      await createDoc('buildings', {
        name: values.name,
        group: values.group,
        type: values.type,
        delegateName: values.delegateName,
        delegatePhone: values.delegatePhone,
        nit: values.nit,
        email: values.email,
        billingEmail: values.billingEmail,
        porterPhone: values.porterPhone,
        managementCompanyId: values.managementCompanyId,
        contractId: values.contractId,
        addressText: place.address,
        googlePlaceId: place.placeId,
        location: place.location,
        active: true
      });
      await queryClient.invalidateQueries({ queryKey: ['buildings'] });
      await queryClient.refetchQueries({ queryKey: ['buildings'] });
      reset();
      setPlace(null);
      toast(t('buildings.toastCreated'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    }
  };

  const startEdit = (building: Building) => {
    setEditingBuilding(building);
    setEditPlace({
      address: building.addressText,
      placeId: building.googlePlaceId,
      location: building.location
    });
    resetEdit({
      name: building.name,
      group: building.group ?? '',
      type: building.type ?? 'EDIFICIO',
      delegateName: building.delegateName ?? '',
      delegatePhone: building.delegatePhone ?? '',
      nit: building.nit ?? '',
      email: building.email ?? '',
      billingEmail: building.billingEmail ?? '',
      porterPhone: building.porterPhone,
      managementCompanyId: building.managementCompanyId,
      contractId: building.contractId ?? ''
    });
    setEditOpen(true);
  };

  const onEditSubmit = async (values: FormValues) => {
    if (!editingBuilding) return;
    const updatedPlace = editPlace ?? {
      address: editingBuilding.addressText,
      placeId: editingBuilding.googlePlaceId,
      location: editingBuilding.location
    };
    const contract = contracts.find((item) => item.id === values.contractId);
    if (!contract || contract.administrationId !== values.managementCompanyId) {
      toast(t('buildings.contractMismatch'), 'error');
      return;
    }
    try {
      await updateDocById('buildings', editingBuilding.id, {
        name: values.name,
        group: values.group,
        type: values.type,
        delegateName: values.delegateName,
        delegatePhone: values.delegatePhone,
        nit: values.nit,
        email: values.email,
        billingEmail: values.billingEmail,
        porterPhone: values.porterPhone,
        managementCompanyId: values.managementCompanyId,
        contractId: values.contractId,
        addressText: updatedPlace.address,
        googlePlaceId: updatedPlace.placeId,
        location: updatedPlace.location
      });
      await queryClient.invalidateQueries({ queryKey: ['buildings'] });
      setEditOpen(false);
      setEditingBuilding(null);
      toast(t('buildings.toastUpdated'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocById('buildings', deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast(t('buildings.toastDeleted'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const toggleActive = async (building: Building) => {
    const nextActive = building.active === false;
    try {
      await updateDocById('buildings', building.id, { active: nextActive });
      await queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast(nextActive ? t('buildings.toastEnabled') : t('buildings.toastDisabled'), 'success');
    } catch (error) {
      toast(t('common.actionError'), 'error');
    }
  };

  const handleFile = async (file: File) => {
    setImportResult(null);
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'csv') {
      Papa.parse<PreviewRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => setPreviewRows(results.data)
      });
      return;
    }
    if (extension === 'xlsx' || extension === 'xls') {
      const data = await file.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(data);
      const worksheet = workbook.worksheets[0];
      if (!worksheet) {
        setPreviewRows([]);
        return;
      }
      const headerRow = worksheet.getRow(1);
      const headers = Array.from({ length: headerRow.cellCount }, (_, index) => {
        const cell = headerRow.getCell(index + 1).value;
        return String(cell ?? '').trim();
      });
      const rows: PreviewRow[] = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return;
        const entry = {} as PreviewRow;
        headers.forEach((header, idx) => {
          if (!header) return;
          const value = row.getCell(idx + 1).value;
          entry[header as keyof PreviewRow] = value ? String(value) : '';
        });
        rows.push(entry);
      });
      setPreviewRows(rows);
    }
  };

  const handleImport = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await importBuildingsFile(file);
      setImportResult(result);
      await queryClient.invalidateQueries({ queryKey: ['buildings'] });
      await queryClient.refetchQueries({ queryKey: ['buildings'] });
      if (errorUrl) URL.revokeObjectURL(errorUrl);
      if (result.errors.length) {
        const csv = [
          t('buildings.errorFileHeader'),
          ...result.errors.map((err) => `${err.row},\"${err.message}\"`)
        ].join('\\n');
        setErrorUrl(URL.createObjectURL(new Blob([csv], { type: 'text/csv' })));
      } else {
        setErrorUrl(null);
      }
      toast(t('buildings.toastUpdated'), result.errors.length ? 'error' : 'success');
    } finally {
      setUploading(false);
    }
  };

  const startCreate = () => {
    setPlace(null);
    reset({
      name: '',
      group: '',
      type: 'EDIFICIO',
      delegateName: '',
      delegatePhone: '',
      nit: '',
      email: '',
      billingEmail: '',
      porterPhone: '',
      managementCompanyId: '',
      contractId: ''
    });
    setCreateOpen(true);
  };

  const contractOptions = useMemo(
    () => contracts.filter((item) => item.administrationId === selectedManagementId),
    [contracts, selectedManagementId]
  );
  const editContractOptions = useMemo(
    () => contracts.filter((item) => item.administrationId === editManagementId),
    [contracts, editManagementId]
  );

  useEffect(() => {
    if (selectedContractId) {
      const contract = contracts.find((item) => item.id === selectedContractId);
      if (!contract || contract.administrationId !== selectedManagementId) {
        setValue('contractId', '');
      }
    }
  }, [contracts, selectedContractId, selectedManagementId, setValue]);

  useEffect(() => {
    if (editContractId) {
      const contract = contracts.find((item) => item.id === editContractId);
      if (!contract || contract.administrationId !== editManagementId) {
        setEditValue('contractId', '');
      }
    }
  }, [contracts, editContractId, editManagementId, setEditValue]);

  return (
    <div className="space-y-8">
      <PageHeader
        title={t('buildings.title')}
        subtitle={t('buildings.subtitle')}
        actions={
          canEdit ? (
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                {t('buildings.bulkTitle')}
              </Button>
              <Button onClick={startCreate}>{t('common.add')}</Button>
            </div>
          ) : null
        }
      />
      <BuildingsMap buildings={buildings} ready={mapsReady} />
      {canEdit ? (
        <>
          <div className="space-y-4">
            <DataTable
              columns={columns}
              data={buildings}
              emptyState={<EmptyState title={t('buildings.emptyTitle')} description={t('buildings.emptySubtitle')} />}
            />
          </div>
          <Modal open={importOpen} title={t('buildings.bulkTitle')} onClose={() => setImportOpen(false)}>
            <div className="space-y-4">
              <p className="text-xs text-ink-500">{t('buildings.bulkHint')}</p>
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleFile(file);
                    void handleImport(file);
                  }
                }}
              />
              {uploading ? <p className="text-sm text-ink-600">{t('buildings.uploading')}</p> : null}
              {importResult ? (
                <div className="rounded-xl border border-fog-200 bg-fog-50 p-3 text-sm text-ink-700">
                  <p>
                    {t('buildings.created')}: {importResult.created}
                  </p>
                  <p>
                    {t('buildings.failed')}: {importResult.failed}
                  </p>
                </div>
              ) : null}
              {importResult?.errors.length ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-ink-800">{t('buildings.errorTableTitle')}</p>
                  <DataTable columns={errorColumns} data={importResult.errors} pageSize={5} />
                </div>
              ) : null}
              {errorUrl ? (
                <a
                  className="text-sm font-semibold text-ink-900 underline"
                  href={errorUrl}
                  download={t('buildings.errorsFileName')}
                >
                  {t('common.downloadErrors')}
                </a>
              ) : null}
              {previewRows.length ? <DataTable columns={previewColumns} data={previewRows.slice(0, 5)} /> : null}
            </div>
          </Modal>
          <Modal open={createOpen} title={t('buildings.newTitle')} onClose={() => setCreateOpen(false)}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input label={t('buildings.name')} error={errors.name?.message} required {...register('name')} />
              <Select label={t('buildings.group')} error={errors.group?.message} required {...register('group')}>
                <option value="">{t('common.select')}</option>
                {buildingGroups.map((group) => (
                  <option key={group.id} value={group.name}>
                    {group.name}
                  </option>
                ))}
              </Select>
              <Select label={t('buildings.type')} error={errors.type?.message} required {...register('type')}>
                <option value="EDIFICIO">{t('buildings.types.EDIFICIO')}</option>
                <option value="CONJUNTO_RESIDENCIAL">{t('buildings.types.CONJUNTO_RESIDENCIAL')}</option>
                <option value="UNIDAD">{t('buildings.types.UNIDAD')}</option>
              </Select>
              <Input
                label={t('buildings.delegateName')}
                error={errors.delegateName?.message}
                required
                {...register('delegateName')}
              />
              <Input
                label={t('buildings.delegatePhone')}
                error={errors.delegatePhone?.message}
                required
                {...register('delegatePhone')}
              />
              <Input label={t('buildings.nit')} error={errors.nit?.message} required {...register('nit')} />
              <Input label={t('buildings.email')} type="email" error={errors.email?.message} required {...register('email')} />
              <Input
                label={t('buildings.billingEmail')}
                type="email"
                error={errors.billingEmail?.message}
                required
                {...register('billingEmail')}
              />
              <Input
                label={t('buildings.porterPhone')}
                error={errors.porterPhone?.message}
                required
                {...register('porterPhone')}
              />
              <Select
                label={t('buildings.managementCompany')}
                error={errors.managementCompanyId?.message}
                required
                {...register('managementCompanyId')}
              >
                <option value="">{t('common.select')}</option>
                {managements.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Select>
              <Select
                label={t('buildings.contract')}
                error={errors.contractId?.message}
                required
                {...register('contractId')}
              >
                <option value="">{t('common.select')}</option>
                {contractOptions.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.name}
                  </option>
                ))}
              </Select>
              <PlacesAutocomplete
                label={t('buildings.address')}
                onSelect={(next) => setPlace(next)}
                ready={mapsReady}
                required
                error={place != null ? t('buildings.addressRequired') : undefined}
              />
              <Button type="submit" disabled={isSubmitting || !place} className="w-full">
                {isSubmitting ? t('buildings.saving') : t('buildings.create')}
              </Button>
            </form>
          </Modal>
          <Modal open={editOpen} title={t('buildings.editTitle')} onClose={() => setEditOpen(false)}>
            <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4" noValidate>
              <Input label={t('buildings.name')} error={editErrors.name?.message} required {...editRegister('name')} />
              <Select label={t('buildings.group')} error={editErrors.group?.message} required {...editRegister('group')}>
                <option value="">{t('common.select')}</option>
                {buildingGroups.map((group) => (
                  <option key={group.id} value={group.name}>
                    {group.name}
                  </option>
                ))}
                {buildingGroups.some((group) => group.name === editWatch('group')) ? null : editWatch('group') ? (
                  <option value={editWatch('group')}>{editWatch('group')}</option>
                ) : null}
              </Select>
              <Select label={t('buildings.type')} error={editErrors.type?.message} required {...editRegister('type')}>
                <option value="EDIFICIO">{t('buildings.types.EDIFICIO')}</option>
                <option value="CONJUNTO_RESIDENCIAL">{t('buildings.types.CONJUNTO_RESIDENCIAL')}</option>
                <option value="UNIDAD">{t('buildings.types.UNIDAD')}</option>
              </Select>
              <Input
                label={t('buildings.delegateName')}
                error={editErrors.delegateName?.message}
                required
                {...editRegister('delegateName')}
              />
              <Input
                label={t('buildings.delegatePhone')}
                error={editErrors.delegatePhone?.message}
                required
                {...editRegister('delegatePhone')}
              />
              <Input label={t('buildings.nit')} error={editErrors.nit?.message} required {...editRegister('nit')} />
              <Input
                label={t('buildings.email')}
                type="email"
                error={editErrors.email?.message}
                required
                {...editRegister('email')}
              />
              <Input
                label={t('buildings.billingEmail')}
                type="email"
                error={editErrors.billingEmail?.message}
                required
                {...editRegister('billingEmail')}
              />
              <Input
                label={t('buildings.porterPhone')}
                error={editErrors.porterPhone?.message}
                required
                {...editRegister('porterPhone')}
              />
              <Select
                label={t('buildings.managementCompany')}
                error={editErrors.managementCompanyId?.message}
                required
                {...editRegister('managementCompanyId')}
              >
                <option value="">{t('common.select')}</option>
                {managements.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Select>
              <Select
                label={t('buildings.contract')}
                error={editErrors.contractId?.message}
                required
                {...editRegister('contractId')}
              >
                <option value="">{t('common.select')}</option>
                {editContractOptions.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.name}
                  </option>
                ))}
              </Select>
              <PlacesAutocomplete
                label={t('buildings.address')}
                onSelect={(next) => setEditPlace(next)}
                ready={mapsReady}
                value={editPlace}
              />
              <Button type="submit" className="w-full" disabled={editSubmitting}>
                {editSubmitting ? t('buildings.saving') : t('buildings.update')}
              </Button>
            </form>
          </Modal>
          <ConfirmModal
            open={Boolean(deleteTarget)}
            title={t('buildings.deleteTitle')}
            description={t('buildings.deleteConfirm')}
            onConfirm={confirmDelete}
            onClose={() => setDeleteTarget(null)}
          />
        </>
      ) : (
        <DataTable
          columns={columns}
          data={buildings}
          emptyState={<EmptyState title={t('buildings.emptyTitle')} description={t('buildings.emptySubtitle')} />}
        />
      )}
    </div>
  );
}
