import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import PageHeader from '@/components/PageHeader';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Select from '@/components/Select';
import Button from '@/components/Button';
import DataTable from '@/components/DataTable';
import EmptyState from '@/components/EmptyState';
import type { Employee, Building } from '@/core/models';
import { createDoc } from '@/lib/api/firestore';
import { useList } from '@/lib/api/queries';
import type { ColumnDef } from '@tanstack/react-table';

const schema = z.object({
  fullName: z.string().min(2, 'Requerido'),
  phone: z.string().min(7, 'Requerido'),
  email: z.string().email('Email invalido'),
  role: z.string().min(2, 'Requerido'),
  active: z.string(),
  buildingId: z.string().optional()
});

type FormValues = z.infer<typeof schema>;

export default function EmployeesPage() {
  const { data: employees = [] } = useList<Employee>('employees', 'employees');
  const { data: buildings = [] } = useList<Building>('buildings', 'buildings');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      { header: 'Nombre', accessorKey: 'fullName' },
      { header: 'Rol', accessorKey: 'role' },
      { header: 'Telefono', accessorKey: 'phone' },
      { header: 'Activo', accessorKey: 'active' }
    ],
    []
  );

  const onSubmit = async (values: FormValues) => {
    await createDoc('employees', {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      role: values.role,
      active: values.active === 'true',
      buildingId: values.buildingId || null
    });
    reset();
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Empleados" subtitle="Equipo operativo" />
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h3 className="text-sm font-semibold text-ink-800">Nuevo empleado</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <Input label="Nombre completo" error={errors.fullName?.message} {...register('fullName')} />
            <Input label="Telefono" error={errors.phone?.message} {...register('phone')} />
            <Input label="Email" error={errors.email?.message} {...register('email')} />
            <Input label="Rol" error={errors.role?.message} {...register('role')} />
            <Select label="Activo" error={errors.active?.message} {...register('active')}>
              <option value="true">Si</option>
              <option value="false">No</option>
            </Select>
            <Select label="Edificio (opcional)" {...register('buildingId')}>
              <option value="">Sin asignar</option>
              {buildings.map((building) => (
                <option key={building.id} value={building.id}>
                  {building.name}
                </option>
              ))}
            </Select>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando...' : 'Crear empleado'}
            </Button>
          </form>
        </Card>
        <div className="lg:col-span-2">
          <DataTable
            columns={columns}
            data={employees}
            emptyState={<EmptyState title="Sin empleados" description="Agrega el equipo operativo." />}
          />
        </div>
      </div>
    </div>
  );
}
