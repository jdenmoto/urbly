import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/app/Auth';

const schema = z.object({
  email: z.string().email('Email invalido'),
  password: z.string().min(6, 'Minimo 6 caracteres')
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      await login(values.email, values.password);
    } catch (err) {
      setError('No fue posible iniciar sesion.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">Bienvenido a Urbly</h1>
            <p className="text-sm text-ink-600">Ingresa con tu cuenta de administrador.</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" error={errors.password?.message} {...register('password')} />
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
