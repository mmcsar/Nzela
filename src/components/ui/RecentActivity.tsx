'use client';

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale/fr';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

export interface ActivityItem {
  id: string;
  type: 'load' | 'truck' | 'bol' | 'payment' | 'subscription';
  title: string;
  description?: string;
  timestamp: Date | string;
  link?: string;
  icon?: LucideIcon;
  status?: 'success' | 'warning' | 'error' | 'info';
}

interface RecentActivityProps {
  activities: ActivityItem[];
  title?: string;
  maxItems?: number;
  className?: string;
}

export function RecentActivity({
  activities,
  title = 'Activité récente',
  maxItems = 5,
  className = '',
}: RecentActivityProps) {
  const displayActivities = activities.slice(0, maxItems);

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'info':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  if (displayActivities.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
        <p className="text-sm text-gray-500 text-center py-4">
          Aucune activité récente
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 border border-gray-200 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-4">
        {displayActivities.map((activity) => {
          const Icon = activity.icon;
          const content = (
            <div
              className={`flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors ${
                activity.link ? 'cursor-pointer' : ''
              }`}
            >
              {Icon && (
                <div className="flex-shrink-0 mt-1">
                  <Icon className="w-5 h-5 text-gray-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  {activity.status && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        activity.status
                      )}`}
                    >
                      {activity.status}
                    </span>
                  )}
                </div>
                {activity.description && (
                  <p className="text-sm text-gray-600 mb-1">
                    {activity.description}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  {formatTimestamp(activity.timestamp)}
                </p>
              </div>
            </div>
          );

          if (activity.link) {
            return (
              <Link key={activity.id} href={activity.link}>
                {content}
              </Link>
            );
          }

          return <div key={activity.id}>{content}</div>;
        })}
      </div>
    </div>
  );
}

