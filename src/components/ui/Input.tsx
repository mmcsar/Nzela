'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  showPasswordToggle?: boolean;
}

export function Input({
  label,
  error,
  className = '',
  type,
  showPasswordToggle = true,
  ...props
}: InputProps) {
  const isPassword = type === 'password';
  const [visible, setVisible] = useState(false);
  const inputType = isPassword && showPasswordToggle ? (visible ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          suppressHydrationWarning
          {...props}
          type={inputType}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10 ${
            error ? 'border-red-500' : 'border-gray-300'
          } ${className}`}
        />
        {isPassword && showPasswordToggle && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            tabIndex={-1}
            aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          >
            {visible ? (
              <EyeOff className="w-5 h-5" aria-hidden />
            ) : (
              <Eye className="w-5 h-5" aria-hidden />
            )}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
