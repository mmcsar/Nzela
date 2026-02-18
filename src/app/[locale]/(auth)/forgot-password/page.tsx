'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/lib/i18n/routing';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setIsLoading(true);

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const locale = typeof window !== 'undefined' ? window.location.pathname.split('/')[1] || 'fr' : 'fr';
      const redirectTo = `${origin}/auth/callback?next=/${locale}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('forgotPasswordTitle')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {t('forgotPasswordHint')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
              {t('resetEmailSent')}
            </div>
          )}
          <Input
            label={t('email')}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={success}
          />
          <div className="flex flex-col gap-3">
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading || success}
            >
              {isLoading ? tCommon('loading') : t('sendResetLink')}
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
