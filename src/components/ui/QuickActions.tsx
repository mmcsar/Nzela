'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface QuickAction {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  description?: string;
}

interface QuickActionsProps {
  actions: QuickAction[];
  title?: string;
  className?: string;
  columns?: 2 | 3 | 4;
}

export function QuickActions({
  actions,
  title = 'Actions rapides',
  className = '',
  columns = 3,
}: QuickActionsProps) {
  const gridCols = {
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.id} href={action.href}>
              <div className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-all cursor-pointer group">
                <div className="mb-3 p-3 bg-primary-100 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <p className="text-sm font-medium text-gray-900 text-center">
                  {action.label}
                </p>
                {action.description && (
                  <p className="text-xs text-gray-500 text-center mt-1">
                    {action.description}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

