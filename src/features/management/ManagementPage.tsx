import { useMemo } from 'react';
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
import type { ManagementCompany } from '@/core/models';
import { createDoc, listDocs, filters } from '@/lib/api/firestore';
import { useList } from '@/lib/api/queries';
import type { ColumnDef } from '@tanstack/react-table';

const schema = z.object({
  name: z.string().min(2, 'Requerido'),
  contactPhone: z.string().min(7, 'Requerido'),
  email: z.string().email('Email invalido'),
  nit: z.string().regex(/^\d{6,12}-\d$/, 'Formato NIT invalido (ej: 900123456-7)'),
  address: z.string().min(3, 'Requerido')
});

type FormValues = z.infer<typeof schema>;

export default function ManagementPage() {
  const { data: companies = [] } = useList<ManagementCompany>('managements', 'management_companies');
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setError,
    clearErrors
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const columns = useMemo<ColumnDef<ManagementCompany>[]>(
    () => [
      { header: 'Nombre', accessorKey: 'name' },
      { header: 'Telefono', accessorKey: 'contactPhone' },
      { header: 'Email', accessorKey: 'email' },
      { header: 'NIT', accessorKey: 'nit' }
    ],
    []
  );

  const onSubmit = async (values: FormValues) => {
    clearErrors('nit');
    const existing = await listDocs<ManagementCompany>('management_companies', [
      filters().where('nit', '==', values.nit)
    ]);
    if (existing.length) {
      setError('nit', { message: 'El NIT ya existe' });
      return;
    }
    await createDoc('management_companies', values);
    await queryClient.invalidateQueries({ queryKey: ['managements'] });
    reset();
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Administraciones" subtitle="Empresas administradoras registradas" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="text-sm font-semibold text-ink-800">Nueva administracion</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <Input label="Nombre" error={errors.name?.message} {...register('name')} />
            <Input label="Telefono" error={errors.contactPhone?.message} {...register('contactPhone')} />
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Input
              label="NIT"
              placeholder="900123456-7"
              pattern="^\\d{6,12}-\\d$"
              error={errors.nit?.message}
              {...register('nit')}
            />
            <Input label="Direccion" error={errors.address?.message} {...register('address')} />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Crear administracion'}
            </Button>
          </form>
        </Card>
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={companies}
            emptyState={<EmptyState title="Sin administraciones" description="Registra tu primera empresa." />}
          />
        </div>
      </div>
    </div>
  );
}
