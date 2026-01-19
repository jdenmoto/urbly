import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDoc, updateDocById, deleteDocById } from '@/lib/api/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { useList } from '@/lib/api/queries';
import type { Building } from '@/core/models/building';
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
import * as XLSX from 'xlsx';
import type { ColumnDef } from '@tanstack/react-table';
import { useI18n } from '@/lib/i18n';
import BuildingsMap from '@/components/BuildingsMap';
import Modal from '@/components/Modal';
import ConfirmModal from '@/components/ConfirmModal';
import { useToast } from '@/components/ToastProvider';
import { useAuth } from '@/app/Auth';

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
  const canEdit = role !== 'view';
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');
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

  const schema = z.object({
    name: z.string().min(2, t('common.required')),
    porterPhone: z.string().min(7, t('common.required')),
    managementCompanyId: z.string().min(1, t('buildings.managementRequired'))
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
      { header: t('buildings.name'), accessorKey: 'name' },
      { header: t('buildings.porterPhone'), accessorKey: 'porterPhone' },
      { header: t('buildings.address'), accessorKey: 'addressText' }
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

  const previewColumns = useMemo<ColumnDef<PreviewRow>[]>(
    () => [
      { header: t('buildings.name'), accessorKey: 'building_name' },
      { header: t('buildings.address'), accessorKey: 'address' },
      { header: t('buildings.porterPhone'), accessorKey: 'porter_phone' },
      { header: t('buildings.managementCompany'), accessorKey: 'management_name' }
    ],
    [t]
  );

  const errorColumns = useMemo<ColumnDef<{ row: number; message: string }>[]>( 
    () => [
      { header: t('buildings.errorRow'), accessorKey: 'row' },
      { header: t('buildings.errorMessage'), accessorKey: 'message' }
    ],
    [t]
  );

  const onSubmit = async (values: FormValues) => {
    if (!place) return;
    try {
      await createDoc('buildings', {
        name: values.name,
        porterPhone: values.porterPhone,
        managementCompanyId: values.managementCompanyId,
        addressText: place.address,
        googlePlaceId: place.placeId,
        location: place.location
      });
      await queryClient.invalidateQueries({ queryKey: ['buildings'] });
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
      porterPhone: building.porterPhone,
      managementCompanyId: building.managementCompanyId
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
    try {
      await updateDocById('buildings', editingBuilding.id, {
        name: values.name,
        porterPhone: values.porterPhone,
        managementCompanyId: values.managementCompanyId,
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
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<PreviewRow>(sheet);
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

  return (
    <div className="space-y-8">
      <PageHeader title={t('buildings.title')} subtitle={t('buildings.subtitle')} />
      <BuildingsMap buildings={buildings} ready={mapsReady} />
      {canEdit ? (
        <>
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <h3 className="text-sm font-semibold text-ink-800">{t('buildings.newTitle')}</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
                <Input label={t('buildings.name')} error={errors.name?.message} required {...register('name')} />
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
            </Card>
            <div className="lg:col-span-2 space-y-4">
              <DataTable
                columns={columns}
                data={buildings}
                emptyState={<EmptyState title={t('buildings.emptyTitle')} description={t('buildings.emptySubtitle')} />}
              />
              <Card>
                <h3 className="text-sm font-semibold text-ink-800">{t('buildings.bulkTitle')}</h3>
                <p className="text-xs text-ink-500">{t('buildings.bulkHint')}</p>
                <div className="mt-4 flex flex-col gap-4">
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
              </Card>
            </div>
          </div>
          <Modal open={editOpen} title={t('buildings.editTitle')} onClose={() => setEditOpen(false)}>
            <form onSubmit={handleEditSubmit(onEditSubmit)} className="space-y-4">
              <Input label={t('buildings.name')} error={editErrors.name?.message} required {...editRegister('name')} />
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
              <PlacesAutocomplete label={t('buildings.address')} onSelect={(next) => setEditPlace(next)} ready={mapsReady} />
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
