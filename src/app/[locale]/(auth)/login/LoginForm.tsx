'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/lib/i18n/routing';

type SyncProfileResponse = {
  role?: string;
  error?: string;
};

function resolveRole(
  profileRole: string | null | undefined,
  syncRole: string | undefined,
  metadataRole: string | undefined,
): string | null {
  const candidates = [profileRole, syncRole, metadataRole];
  for (const value of candidates) {
    if (value && ['admin', 'company', 'broker'].includes(value)) return value;
  }
  return null;
}

export default function LoginForm() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    const urlError = searchParams.get('error');
    if (urlError === 'config') {
      setError('Configuration Supabase manquante sur le serveur. Contactez le support.');
    } else if (urlError === 'auth_failed' || urlError === 'no_code') {
      setError(t('invalidOrExpiredLink'));
    }
  }, [searchParams, t]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowResendButton(false);
    setIsLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Email not confirmed') || signInError.message.includes('email_not_confirmed')) {
          setError(t('emailNotConfirmedMessage'));
          setShowResendButton(true);
        } else if (
          signInError.message.includes('Invalid login credentials') ||
          signInError.message.includes('invalid_credentials')
        ) {
          setError(t('invalidCredentials'));
        } else {
          setError(signInError.message || tCommon('error'));
        }
        return;
      }

      if (!data.user) return;

      let syncRole: string | undefined;
      try {
        const syncRes = await fetch('/api/auth/sync-profile', { method: 'POST' });
        const syncBody = (await syncRes.json()) as SyncProfileResponse;
        if (!syncRes.ok) {
          console.warn('[login] sync-profile:', syncBody.error);
        } else {
          syncRole = syncBody.role;
        }
      } catch (syncErr) {
        console.warn('[login] sync-profile failed:', syncErr);
      }

      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle();

      const metadataRole = (data.user.app_metadata as { role?: string } | undefined)?.role;
      const role = resolveRole(profile?.role, syncRole, metadataRole);

      if (profileError && !role) {
        await supabase.auth.signOut();
        setError(profileError.message || tCommon('error'));
        return;
      }

      if (!role) {
        await supabase.auth.signOut();
        setError(t('profileIncomplete'));
        return;
      }

      window.location.assign(`/${locale}/dashboard`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setError('');
    setSuccess('');
    setIsResending(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
      });

      if (resendError) throw resendError;

      setSuccess(t('confirmationEmailSent'));
      setShowResendButton(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon('error'));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {t('login')}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-500">
            {t('loginRccmNote')}
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {showResendButton ? (
                <>
                  <p className="font-medium">{t('emailNotConfirmed')}</p>
                  <p className="text-sm mt-1">{error}</p>
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={isResending}
                    className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 underline disabled:opacity-50"
                  >
                    {isResending ? tCommon('loading') : t('resendConfirmation')}
                  </button>
                </>
              ) : (
                <p className="text-sm">{error}</p>
              )}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              {success}
            </div>
          )}
          <div className="space-y-4">
            <Input
              label={t('email')}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <Input
              label={t('password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <Link
                href="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {t('register')}
              </Link>
            </div>
            <div className="text-sm">
              <Link
                href="/forgot-password"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                {t('forgotPassword')}
              </Link>
            </div>
          </div>
          <div>
            <Button
              type="submit"
              className="w-full"
              isLoading={isLoading}
              disabled={isLoading}
            >
              {isLoading ? tCommon('loading') : t('login')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
