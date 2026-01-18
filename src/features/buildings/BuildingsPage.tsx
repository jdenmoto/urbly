import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { createDoc } from '@/lib/api/firestore';
import { useQueryClient } from '@tanstack/react-query';
import { useList } from '@/lib/api/queries';
import type { Building, ManagementCompany } from '@/core/models';
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

const schema = z.object({
  name: z.string().min(2, 'Requerido'),
  porterPhone: z.string().min(7, 'Requerido'),
  managementCompanyId: z.string().min(1, 'Selecciona una administracion')
});

type FormValues = z.infer<typeof schema>;

type PreviewRow = {
  building_name: string;
  address: string;
  porter_phone: string;
  management_name: string;
};

export default function BuildingsPage() {
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');
  const { data: managements = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const queryClient = useQueryClient();
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (apiKey) {
      loadGoogleMaps(apiKey).catch(() => undefined);
    }
  }, []);

  const columns = useMemo<ColumnDef<Building>[]>(
    () => [
      { header: 'Nombre', accessorKey: 'name' },
      { header: 'Porteria', accessorKey: 'porterPhone' },
      { header: 'Direccion', accessorKey: 'addressText' }
    ],
    []
  );

  const previewColumns = useMemo<ColumnDef<PreviewRow>[]>(
    () => [
      { header: 'Edificio', accessorKey: 'building_name' },
      { header: 'Direccion', accessorKey: 'address' },
      { header: 'Porteria', accessorKey: 'porter_phone' },
      { header: 'Administracion', accessorKey: 'management_name' }
    ],
    []
  );

  const onSubmit = async (values: FormValues) => {
    if (!place) return;
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
        const csv = ['row,message', ...result.errors.map((err) => `${err.row},\"${err.message}\"`)].join('\\n');
        setErrorUrl(URL.createObjectURL(new Blob([csv], { type: 'text/csv' })));
      } else {
        setErrorUrl(null);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Edificios"
        subtitle="Gestiona tu portafolio de edificios"
      />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <h3 className="text-sm font-semibold text-ink-800">Nuevo edificio</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <Input label="Nombre" error={errors.name?.message} {...register('name')} />
            <Input label="Telefono porteria" error={errors.porterPhone?.message} {...register('porterPhone')} />
            <Select label="Administracion" error={errors.managementCompanyId?.message} {...register('managementCompanyId')}>
              <option value="">Selecciona</option>
              {managements.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </Select>
            <PlacesAutocomplete
              label="Direccion (Google Maps)"
              onSelect={(next) => setPlace(next)}
              error={!place ? 'Selecciona una direccion valida' : undefined}
            />
            <Button type="submit" disabled={isSubmitting || !place} className="w-full">
              {isSubmitting ? 'Guardando...' : 'Crear edificio'}
            </Button>
          </form>
        </Card>
        <div className="lg:col-span-2 space-y-4">
          <DataTable
            columns={columns}
            data={buildings}
            emptyState={<EmptyState title="Sin edificios" description="Crea el primer edificio para empezar." />}
          />
          <Card>
            <h3 className="text-sm font-semibold text-ink-800">Importacion masiva</h3>
            <p className="text-xs text-ink-500">CSV o XLSX con columnas building_name, address, porter_phone, management_name.</p>
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
              {uploading ? <p className="text-sm text-ink-600">Subiendo...</p> : null}
              {importResult ? (
                <div className="rounded-xl border border-fog-200 bg-fog-50 p-3 text-sm text-ink-700">
                  <p>Creado: {importResult.created}</p>
                  <p>Fallidos: {importResult.failed}</p>
                </div>
              ) : null}
              {errorUrl ? (
                <a className="text-sm font-semibold text-ink-900 underline" href={errorUrl} download="import-errors.csv">
                  Descargar errores
                </a>
              ) : null}
              {previewRows.length ? (
                <DataTable columns={previewColumns} data={previewRows.slice(0, 5)} />
              ) : null}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
