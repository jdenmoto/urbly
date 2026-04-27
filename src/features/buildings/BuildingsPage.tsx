import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDoc, updateDocById, deleteDocById } from '@/lib/api/firestore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useList, useTenantServiceOrders } from '@/lib/api/queries';
import type { Building } from '@/core/models/building';
import type { Contract } from '@/core/models/contract';
import type { ManagementCompany } from '@/core/models/managementCompany';
import type { ServiceOrder } from '@/core/models/serviceOrder';
import PageHeader from '@/components/PageHeader';
import { MetricCard, StatusPill } from '@/components/premium';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Button from '@/components/Button';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import PlacesAutocomplete, { type PlaceResult } from '@/components/PlacesAutocomplete';
import { loadGoogleMaps } from '@/lib/googleMaps';
import { importBuildingsFile, type ImportResult } from '@/lib/api/functions';
import { groupPreviewRows, type GenericPreviewRow } from './importPreview';
import { validateImportRows } from './importValidation';
import type { ColumnDef } from '@tanstack/react-table';
import { useI18n } from '@/lib/i18n';
const BuildingsMap = lazy(() => import('@/components/BuildingsMap'));
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/app/Auth';
import { EditIcon, TrashIcon, PowerIcon, EyeIcon } from '@/components/ActionIcons';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

type PreviewRow = GenericPreviewRow;

const mapCsvRows = async (file: File) => {
  const Papa = (await import('papaparse')).default;
  return new Promise<PreviewRow[]>((resolve) => {
    Papa.parse<PreviewRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => resolve(results.data)
    });
  });
};

const mapSpreadsheetRows = async (file: File) => {
  const ExcelJS = (await import('exceljs')).default;
  const data = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(data);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

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

  return rows;
};

export default function BuildingsPage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { role, administrationId } = useAuth();
  const canEdit = role === 'admin' || role === 'editor';
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const { data: contracts = [] } = useList<Contract>('contracts', 'contracts');
  const { data: serviceOrders = [] } = useTenantServiceOrders(administrationId, role);
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
  const [remoteValidation, setRemoteValidation] = useState<ImportResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [editingBuilding, setEditingBuilding] = useState<Building | null>(null);
  const [editPlace, setEditPlace] = useState<PlaceResult | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Building | null>(null);
  const [detailTarget, setDetailTarget] = useState<Building | null>(null);
  const [contractDetailOpen, setContractDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const buildingGroups = useMemo(() => groupSettings?.groups ?? [], [groupSettings]);
  const statusLabels = useMemo(
    () => ({
      programado: t('scheduling.statusProgrammed'),
      confirmado: t('scheduling.statusConfirmed'),
      completado: t('scheduling.statusCompleted'),
      cancelado: t('scheduling.statusCanceled')
    }),
    [t]
  );
  const formatDateTime = useCallback((value?: string | number | Date | null) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString('es-CO', {
      dateStyle: 'medium',
      timeStyle: 'short',
      hour12: true
    });
  }, []);

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
    const actionsColumn: ColumnDef<Building> = {
      header: t('common.actions'),
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-ink-700 hover:bg-fog-100"
            onClick={() => setDetailTarget(row.original)}
            title={t('common.view')}
            aria-label={t('common.view')}
          >
            <EyeIcon className="h-4 w-4" aria-hidden />
          </button>
          {canEdit ? (
            <>
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
            </>
          ) : null}
        </div>
      )
    };

    if (!canEdit) return [...base, actionsColumn];
    return [
      ...base,
      actionsColumn
    ];
  }, [t, canEdit, contracts]);

  const previewGroup = useMemo(() => groupPreviewRows(previewRows), [previewRows]);
  const validationSummary = useMemo(() => validateImportRows(previewRows), [previewRows]);

  const previewColumns = useMemo<ColumnDef<PreviewRow>[]>(
    () => previewGroup.headers.map((header) => ({ header, accessorKey: header, enableSorting: false })),
    [previewGroup.headers]
  );

  const errorColumns = useMemo<ColumnDef<{ row: number; message: string }>[]>( 
    () => [
      { header: t('buildings.errorRow'), accessorKey: 'row', enableSorting: false },
      { header: t('buildings.errorMessage'), accessorKey: 'message', enableSorting: false }
    ],
    [t]
  );
  const maintenanceColumns = useMemo<ColumnDef<ServiceOrder>[]>(
    () => [
      { header: t('scheduling.titleLabel'), accessorKey: 'title', enableSorting: false },
      {
        header: t('scheduling.startAt'),
        accessorKey: 'scheduledStartAt',
        enableSorting: false,
        cell: ({ row }) => formatDateTime(row.original.scheduledStartAt)
      },
      {
        header: t('scheduling.endAt'),
        accessorKey: 'scheduledEndAt',
        enableSorting: false,
        cell: ({ row }) => formatDateTime(row.original.scheduledEndAt)
      },
      {
        header: t('scheduling.status'),
        accessorKey: 'status',
        enableSorting: false,
        cell: ({ row }) => statusLabels[row.original.status === 'scheduled' ? 'programado' : row.original.status === 'confirmed' ? 'confirmado' : row.original.status === 'completed' ? 'completado' : 'cancelado'] ?? row.original.status
      }
    ],
    [statusLabels, t, formatDateTime]
  );

  const maintenanceAppointments = useMemo(() => {
    if (!detailTarget) return [];
    return serviceOrders
      .filter((serviceOrder) => serviceOrder.buildingId === detailTarget.id && serviceOrder.type === 'mantenimiento')
      .sort((a, b) => new Date(a.scheduledStartAt).getTime() - new Date(b.scheduledStartAt).getTime());
  }, [detailTarget, serviceOrders]);

  const detailServiceOrders = useMemo(() => {
    if (!detailTarget) return [];
    return serviceOrders
      .filter((serviceOrder) => serviceOrder.buildingId === detailTarget.id)
      .sort((a, b) => new Date(b.scheduledStartAt).getTime() - new Date(a.scheduledStartAt).getTime());
  }, [detailTarget, serviceOrders]);

  const recentServiceOrders = useMemo(() => detailServiceOrders.slice(0, 5), [detailServiceOrders]);

  const buildingOperationalMetrics = useMemo(() => {
    if (!detailTarget) return null;
    const completed = detailServiceOrders.filter((item) => item.status === 'completed').length;
    const pending = detailServiceOrders.filter((item) => ['draft', 'scheduled', 'confirmed', 'in_progress'].includes(item.status)).length;
    const incidents = detailServiceOrders.reduce((acc, item) => acc + (item.issues?.length ?? 0), 0);
    const lastService = detailServiceOrders[0] ?? null;
    return { completed, pending, incidents, lastService };
  }, [detailTarget, detailServiceOrders]);
  const detailContract = useMemo(() => {
    if (!detailTarget?.contractId) return null;
    return contracts.find((contract) => contract.id === detailTarget.contractId) ?? null;
  }, [contracts, detailTarget]);


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
    } catch {
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
    } catch {
      toast(t('common.actionError'), 'error');
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDocById('buildings', deleteTarget.id);
      await queryClient.invalidateQueries({ queryKey: ['buildings'] });
      toast(t('buildings.toastDeleted'), 'success');
    } catch {
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
    } catch {
      toast(t('common.actionError'), 'error');
    }
  };

  const handleFile = async (file: File) => {
    setImportFile(file);
    setImportResult(null);
    setRemoteValidation(null);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      setPreviewRows(await mapCsvRows(file));
      return;
    }

    if (extension === 'xlsx' || extension === 'xls') {
      setPreviewRows(await mapSpreadsheetRows(file));
      return;
    }

    setPreviewRows([]);
  };

  const handleImport = async (file: File | null = importFile) => {
    if (!file) return;
    const summary = validateImportRows(previewRows);
    if (summary.invalidRows > 0) {
      setImportResult({ created: 0, failed: summary.invalidRows, errors: summary.issues });
      toast('Corrige los errores del archivo antes de importar.', 'error');
      return;
    }
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
          ...result.errors.map((err) => `${err.row},"${err.message}"`)
        ].join('\\n');
        setErrorUrl(URL.createObjectURL(new Blob([csv], { type: 'text/csv' })));
      } else {
        setErrorUrl(null);
      }
      toast(result.summaryMessage ?? t('buildings.toastUpdated'), result.errors.length ? 'error' : 'success');
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
              <Link className="inline-flex items-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" to="/management">
                Ver administraciones y contratos
              </Link>
              <Button variant="secondary" onClick={() => setImportOpen(true)}>
                {t('buildings.bulkTitle')}
              </Button>
              <Button onClick={startCreate}>{t('common.add')}</Button>
            </div>
          ) : null
        }
      />
      <div className="flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        <span className="font-semibold text-slate-900">Flujo operativo:</span>
        <span>1. crear administración</span>
        <span>2. crear contrato</span>
        <span>3. registrar edificio</span>
        <Link className="font-semibold text-sky-700 underline" to="/management">
          Ir a administraciones y contratos
        </Link>
      </div>
      <Suspense fallback={<div className="rounded-3xl border border-fog-200 bg-white p-6 text-sm text-ink-600">{t('common.loading')}</div>}>
        <BuildingsMap buildings={buildings} ready={mapsReady} />
      </Suspense>
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
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void handleFile(file);
                  }
                }}
              />
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {t('buildings.importSelectFile')}
                </Button>
                <Button
                  type="button"
                  onClick={() => void handleImport(importFile)}
                  disabled={!importFile || uploading || validationSummary.invalidRows > 0}
                >
                  {t('buildings.importRun')}
                </Button>
              </div>
              {uploading ? <p className="text-sm text-ink-600">{t('buildings.uploading')}</p> : null}
              {previewRows.length ? (
                <div className="rounded-xl border border-fog-200 bg-fog-50 p-3 text-sm text-ink-700">
                  <p><span className="font-semibold text-ink-900">{t('buildings.importValidatedEntity')}:</span> {validationSummary.entity}</p>
                  <p><span className="font-semibold text-ink-900">{t('buildings.importValidRows')}:</span> {validationSummary.validRows}</p>
                  <p><span className="font-semibold text-ink-900">{t('buildings.importInvalidRows')}:</span> {validationSummary.invalidRows}</p>
                </div>
              ) : null}
              {remoteValidation ? (
                <div className="rounded-xl border border-fog-200 bg-white p-3 text-sm text-ink-700">
                  <p><span className="font-semibold text-ink-900">{t('buildings.importRemoteValidation')}:</span> {remoteValidation.dryRun ? t('buildings.importDryRunLabel') : t('buildings.importFinalLabel')}</p>
                  <p><span className="font-semibold text-ink-900">{t('buildings.importEntityLabel')}:</span> {remoteValidation.entity ?? validationSummary.entity}</p>
                  <p><span className="font-semibold text-ink-900">{t('buildings.importEvaluatedRows')}:</span> {remoteValidation.previewCount ?? previewRows.length}</p>
                  <p><span className="font-semibold text-ink-900">{t('buildings.importValidRows')}:</span> {remoteValidation.validRows ?? validationSummary.validRows}</p>
                  <p>{remoteValidation.summaryMessage ?? t('buildings.importNoRemoteSummary')}</p>
                </div>
              ) : null}
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
              {previewRows.length ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-fog-200 bg-fog-50 p-3 text-sm text-ink-700">
                    <p><span className="font-semibold text-ink-900">{t('buildings.importDetectedEntity')}:</span> {previewGroup.entity}</p>
                    <p><span className="font-semibold text-ink-900">Columnas:</span> {previewGroup.headers.join(', ')}</p>
                    <p><span className="font-semibold text-ink-900">Preview:</span> {previewRows.length} fila(s)</p>
                  </div>
                  <DataTable columns={previewColumns} data={previewRows.slice(0, 5)} />
                </div>
              ) : null}
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
              {!managements.length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Primero debes crear una administración en <Link className="font-semibold underline" to="/management">Administraciones y contratos</Link>.
                </div>
              ) : null}
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
              {selectedManagementId && !contractOptions.length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Esta administración todavía no tiene contratos operativos. Créalo en <Link className="font-semibold underline" to="/management">Administraciones y contratos</Link> antes de registrar el edificio.
                </div>
              ) : null}
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
              {editManagementId && !editContractOptions.length ? (
                <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  La administración seleccionada no tiene contratos disponibles. Revísalo en <Link className="font-semibold underline" to="/management">Administraciones y contratos</Link>.
                </div>
              ) : null}
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
          <Modal
            open={Boolean(detailTarget)}
            title={t('buildings.detailTitle')}
            onClose={() => {
              setDetailTarget(null);
              setContractDetailOpen(false);
            }}
          >
            {detailTarget ? (
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-4">
                  <MetricCard label="Servicios registrados" value={detailServiceOrders.length} hint="histórico total" />
                  <MetricCard label="Servicios completados" value={buildingOperationalMetrics?.completed ?? 0} hint="ejecución cerrada" />
                  <MetricCard label="Servicios pendientes" value={buildingOperationalMetrics?.pending ?? 0} hint="agenda activa" />
                  <MetricCard label="Novedades acumuladas" value={buildingOperationalMetrics?.incidents ?? 0} hint="issues registradas" />
                </div>
                <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                  <p className="text-xs uppercase tracking-wide text-sky-700">Siguiente paso operativo</p>
                  {buildingOperationalMetrics?.lastService ? (
                    <p className="mt-1 font-semibold">
                      Último servicio: {buildingOperationalMetrics.lastService.title} ({buildingOperationalMetrics.lastService.status}). Revisa su detalle o continúa la ejecución desde operación de servicios.
                    </p>
                  ) : (
                    <p className="mt-1 font-semibold">
                      Este edificio aún no tiene servicios registrados. El siguiente paso es continuar hacia operación de servicios y programar el primer servicio del edificio.
                    </p>
                  )}
                </div>
                <div className="rounded-xl border border-fog-200 bg-fog-50 p-4 text-sm text-ink-700">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase text-ink-400">Ficha operativa</p>
                      <p className="text-sm font-semibold text-ink-900">Datos maestros del edificio</p>
                    </div>
                    <StatusPill tone={detailTarget?.active === false ? 'warning' : 'success'}>
                      {detailTarget?.active === false ? t('buildings.disabled') : t('buildings.active')}
                    </StatusPill>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase text-ink-400">{t('buildings.name')}</p>
                      <p className="text-sm font-semibold text-ink-900">{detailTarget.name}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">{t('buildings.address')}</p>
                      <p className="text-sm font-semibold text-ink-900">{detailTarget.addressText}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">{t('buildings.managementCompany')}</p>
                      <p className="text-sm font-semibold text-ink-900">
                        {managements.find((company) => company.id === detailTarget.managementCompanyId)?.name ??
                          t('common.notAvailable')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">Tipo</p>
                      <p className="text-sm font-semibold text-ink-900">{detailTarget.type}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">Grupo</p>
                      <p className="text-sm font-semibold text-ink-900">{detailTarget.group || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">Delegado</p>
                      <p className="text-sm font-semibold text-ink-900">{detailTarget.delegateName || t('common.notAvailable')}</p>
                      <p className="text-xs text-ink-500">{detailTarget.delegatePhone || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">Portería</p>
                      <p className="text-sm font-semibold text-ink-900">{detailTarget.porterPhone || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">NIT</p>
                      <p className="text-sm font-semibold text-ink-900">{detailTarget.nit || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">Emails</p>
                      <p className="text-sm font-semibold text-ink-900">{detailTarget.email || t('common.notAvailable')}</p>
                      <p className="text-xs text-ink-500">Facturación: {detailTarget.billingEmail || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">{t('buildings.contract')}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-ink-900">
                          {contracts.find((contract) => contract.id === detailTarget.contractId)?.name ??
                            t('buildings.noContract')}
                        </p>
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-md border border-transparent p-1 text-ink-700 hover:bg-fog-100 disabled:cursor-not-allowed disabled:text-ink-300"
                          onClick={() => setContractDetailOpen(true)}
                          title={t('buildings.viewContract')}
                          aria-label={t('buildings.viewContract')}
                          disabled={!detailContract}
                        >
                          <EyeIcon className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-fog-200 bg-white p-4 text-sm text-ink-700">
                  <div className="mb-3">
                    <p className="text-xs uppercase text-ink-400">{t('buildings.technicalContextTitle')}</p>
                    <p className="text-sm font-semibold text-ink-900">{t('buildings.technicalContextSubtitle')}</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase text-ink-400">{t('buildings.technicalEquipmentLabel')}</p>
                      <p className="text-sm font-semibold text-ink-900">{detailTarget.technicalContext?.equipmentSummary || 'Sin contexto técnico cargado'}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">{t('buildings.technicalMechanicalRoomLabel')}</p>
                      <p className="text-sm font-semibold text-ink-900">{detailTarget.technicalContext?.mechanicalRoomNotes || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">{t('buildings.technicalElectricalLabel')}</p>
                      <p className="text-sm font-semibold text-ink-900">{detailTarget.technicalContext?.electricalSetup || t('common.notAvailable')}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">{t('buildings.technicalObservationsLabel')}</p>
                      <p className="text-sm font-semibold text-ink-900">{detailTarget.technicalContext?.criticalObservations || t('common.notAvailable')}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-ink-900">Últimos servicios</h3>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      onClick={() => {
                        const buildingId = detailTarget?.id;
                        setDetailTarget(null);
                        navigate(buildingId ? `/services?buildingId=${buildingId}` : '/services');
                      }}
                    >
                      Ir a operación de servicios
                    </button>
                  </div>
                  <DataTable
                    columns={maintenanceColumns}
                    data={recentServiceOrders}
                    pageSize={5}
                    emptyState={
                      <EmptyState
                        title="Sin servicios registrados"
                        description="Aún no hay ejecución operativa asociada a este edificio."
                      />
                    }
                  />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-ink-900">{t('buildings.maintenanceTitle')}</h3>
                  <DataTable
                    columns={maintenanceColumns}
                    data={maintenanceAppointments}
                    pageSize={5}
                    emptyState={
                      <EmptyState
                        title={t('buildings.maintenanceEmptyTitle')}
                        description={t('buildings.maintenanceEmptySubtitle')}
                      />
                    }
                  />
                </div>
              </div>
            ) : null}
          </Modal>
          <Modal
            open={contractDetailOpen}
            title={t('contracts.detailTitle')}
            onClose={() => setContractDetailOpen(false)}
            layer="confirm"
          >
            {detailContract ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-fog-200 bg-fog-50 p-4 text-sm text-ink-700">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase text-ink-400">Ficha operativa</p>
                      <p className="text-sm font-semibold text-ink-900">Datos maestros del edificio</p>
                    </div>
                    <StatusPill tone={detailTarget?.active === false ? 'warning' : 'success'}>
                      {detailTarget?.active === false ? t('buildings.disabled') : t('buildings.active')}
                    </StatusPill>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase text-ink-400">{t('contracts.name')}</p>
                      <p className="text-sm font-semibold text-ink-900">{detailContract.name}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">{t('contracts.status')}</p>
                      <p className="text-sm font-semibold text-ink-900">
                        {detailContract.status === 'inactivo' ? t('contracts.statusInactive') : t('contracts.statusActive')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">{t('contracts.startAt')}</p>
                      <p className="text-sm font-semibold text-ink-900">
                        {formatDateTime(detailContract.startAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">{t('contracts.endAt')}</p>
                      <p className="text-sm font-semibold text-ink-900">
                        {formatDateTime(detailContract.endAt)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">{t('contracts.maintenanceType')}</p>
                      <p className="text-sm font-semibold text-ink-900">
                        {detailContract.maintenanceTypeName ?? t('common.notAvailable')}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase text-ink-400">{t('contracts.labAnalysisType')}</p>
                      <p className="text-sm font-semibold text-ink-900">
                        {detailContract.labAnalysisTypeName ?? t('common.notAvailable')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState title={t('buildings.noContract')} description={t('buildings.contractRequired')} />
            )}
          </Modal>
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
