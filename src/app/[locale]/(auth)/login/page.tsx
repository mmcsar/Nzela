'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/routing';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { Link } from '@/lib/i18n/routing';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [showResendButton, setShowResendButton] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setShowResendButton(false);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Détecter l'erreur d'email non confirmé
        if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
          setError(t('emailNotConfirmedMessage'));
          setShowResendButton(true);
        } else if (error.message.includes('Invalid login credentials') || error.message.includes('invalid_credentials')) {
          setError(t('invalidCredentials'));
        } else {
          setError(error.message || tCommon('error'));
        }
        return;
      }

      if (data.user) {
        // Utiliser le router de next-intl pour préserver la locale
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error: any) {
      // Utiliser les traductions pour les messages d'erreur
      setError(error.message || tCommon('error'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    setError('');
    setSuccess('');
    setIsResending(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      });

      if (error) throw error;

      setSuccess(t('confirmationEmailSent'));
      setShowResendButton(false);
    } catch (error: any) {
      setError(error.message || tCommon('error'));
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
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              <p className="font-medium">{t('emailNotConfirmed')}</p>
              <p className="text-sm mt-1">{error}</p>
              {showResendButton && (
                <button
                  type="button"
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  className="mt-3 text-sm font-medium text-red-700 hover:text-red-800 underline disabled:opacity-50"
                >
                  {isResending ? tCommon('loading') : t('resendConfirmation')}
                </button>
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
              required
            />
            <Input
              label={t('password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            {t('forgotPassword') && (
              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-primary-600 hover:text-primary-500"
                >
                  {t('forgotPassword')}
                </a>
              </div>
            )}
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




