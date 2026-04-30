import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { sendPasswordResetEmail } from 'firebase/auth';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { useAuth } from '@/app/Auth';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/components/ToastProvider';
import { auth } from '@/lib/firebase/client';
import { getQaLogin } from '@/lib/api/functions';

export default function LoginPage() {
  const { t } = useI18n();
  const { login, user, qaRole, isQaMode, role } = useAuth();
  const qaEnabled = import.meta.env.DEV && typeof window !== 'undefined' && ['127.0.0.1', 'localhost'].includes(window.location.hostname);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const schema = z.object({
    email: z.string().email(t('auth.error.email')),
    password: z.string().min(6, t('auth.error.password'))
  });
  type FormValues = z.infer<typeof schema>;
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const resetSchema = z.object({
    email: z.string().email(t('auth.error.email'))
  });
  type ResetValues = z.infer<typeof resetSchema>;
  const {
    register: resetRegister,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors, isSubmitting: resetSubmitting },
    reset: resetForm
  } = useForm<ResetValues>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async (values: FormValues) => {
    setError('');
    try {
      await login(values.email, values.password);
    } catch {
      setError(t('auth.error.default'));
    }
  };

  const onReset = async (values: ResetValues) => {
    try {
      await sendPasswordResetEmail(auth, values.email);
      toast(t('auth.reset.sent'), 'success');
      resetForm();
      setResetOpen(false);
    } catch {
      toast(t('auth.reset.error'), 'error');
    }
  };

  useEffect(() => {
    if (!user) return;
    if (!isQaMode) {
      navigate('/');
      return;
    }
    if (qaRole && role === qaRole) {
      navigate('/');
    }
  }, [user, navigate, isQaMode, qaRole, role]);

  useEffect(() => {
    if (!qaEnabled || !qaRole) return;

    let cancelled = false;
    setError('');
    (async () => {
      try {
        const credentials = await getQaLogin(qaRole);
        if (cancelled) return;
        await login(credentials.email, credentials.password);
      } catch {
        if (!cancelled) {
          setError(t('auth.qa.error'));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [qaEnabled, qaRole, login, t]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-ink-900">{t('auth.title')}</h1>
            <p className="text-sm text-ink-600">{t('auth.subtitle')}</p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <Input label={t('auth.email')} type="email" error={errors.email?.message} required {...register('email')} />
            <Input
              label={t('auth.password')}
              type="password"
              error={errors.password?.message}
              required
              {...register('password')}
            />
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? t('auth.signing.in') : t('auth.sign.in')}
            </Button>
          </form>
          <button
            className="text-xs font-semibold text-ink-600 underline"
            type="button"
            onClick={() => setResetOpen((prev) => !prev)}
          >
            {t('auth.reset.password')}
          </button>
          {resetOpen ? (
            <form onSubmit={handleResetSubmit(onReset)} className="space-y-3" noValidate>
              <Input
                label={t('auth.reset.email')}
                type="email"
                error={resetErrors.email?.message}
                required
                {...resetRegister('email')}
              />
              <Button type="submit" className="w-full" disabled={resetSubmitting}>
                {resetSubmitting ? t('auth.sending.reset') : t('auth.send.reset')}
              </Button>
            </form>
          ) : null}
          {qaEnabled ? (
            <div className="rounded-lg border border-dashed border-sky-200 bg-sky-50 px-3 py-3 text-xs text-sky-900">
              <p className="font-semibold">QA local habilitado</p>
              <p className="mt-1">Usa `/__qa__/admin` o `?qa=1&role=admin` y cambia `admin` por el actor que quieras probar.</p>
              <p className="mt-1">Si la ruta QA está activa, el login usa un usuario demo real para cumplir reglas de Firestore.</p>
            </div>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
