import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/app/Auth';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';

export default function LoginPage() {
  const { t } = useI18n();
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const schema = z.object({
    email: z.string().email(t('auth.errorEmail')),
    password: z.string().min(6, t('auth.errorPassword'))
  });
  type FormValues = z.infer<typeof schema>;
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
      setError(t('auth.error'));
    }
  };

  useEffect(() => {
    if (user) navigate('/');
  }, [user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">{t('auth.title')}</h1>
            <p className="text-sm text-ink-600">{t('auth.subtitle')}</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label={t('auth.email')} type="email" error={errors.email?.message} {...register('email')} />
            <Input
              label={t('auth.password')}
              type="password"
              error={errors.password?.message}
              {...register('password')}
            />
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
