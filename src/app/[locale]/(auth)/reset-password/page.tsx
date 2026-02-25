'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/routing';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/lib/i18n/routing';

export default function ResetPasswordPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('passwordMinLength'));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (hasSession === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">{tCommon('loading')}</p>
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="max-w-md w-full text-center space-y-4">
          <p className="text-gray-600">{t('invalidOrExpiredLink')}</p>
          <Link
            href="/forgot-password"
            className="inline-block font-medium text-primary-600 hover:text-primary-500"
          >
            {t('forgotPasswordTitle')}
          </Link>
          <br />
          <Link
            href="/login"
            className="inline-block font-medium text-primary-600 hover:text-primary-500"
          >
            {t('backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('resetPasswordTitle')}
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              {t('resetPasswordSuccess')}
            </div>
          )}
          <Input
            label={t('newPassword')}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            disabled={success}
          />
          <Input
            label={t('confirmPassword')}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            disabled={success}
          />
          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading || success}
            >
              {isLoading ? tCommon('loading') : t('resetPassword')}
            </Button>
            <Link
              href="/login"
              className="text-center text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              {t('backToLogin')}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
