'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from '@/lib/i18n/routing';
import { Bell, Package, Truck, CreditCard, Info, Building2, Users, CheckCircle2, Loader2 } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  link?: string;
  icon?: string;
  data?: { entityType?: string; entityId?: string };
}

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);
  // Initial 0 so server and client match; set real time in useEffect to avoid hydration mismatch
  const [now, setNow] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/notifications?limit=10', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (response.status === 401) return false; // Non connecté : arrêter le polling
      const data = await response.json();
      if (response.ok) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
        return true;
      }
    } catch {
      // silently fail
    }
    return false;
  }, []);

  useEffect(() => {
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const run = async () => {
      const ok = await fetchNotifications();
      if (ok) intervalId = setInterval(() => fetchNotifications(), 30000);
    };
    run();
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [fetchNotifications]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node | null;
      if (ref.current && target && !ref.current.contains(target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = setTimeout(tick, 0);
    const t = setInterval(tick, 60000);
    return () => {
      clearTimeout(id);
      clearInterval(t);
    };
  }, []);

  const getIcon = (type: string, iconName?: string) => {
    if (iconName === 'Building2') return <Building2 className="w-4 h-4" />;
    if (iconName === 'Users') return <Users className="w-4 h-4" />;
    switch (type) {
      case 'load_available':
      case 'load_in_transit':
        return <Package className="w-4 h-4" />;
      case 'truck_available':
        return <Truck className="w-4 h-4" />;
      case 'payment':
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.read) {
      try {
        await fetch('/api/notifications', {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notificationId: notif.id }),
        });
        fetchNotifications();
      } catch { /* ignore */ }
    }
    if (notif.link) {
      setIsOpen(false);
      router.push(notif.link);
    }
  };

  const handleActivateEntity = async (e: React.MouseEvent, notif: Notification) => {
    e.stopPropagation();
    const entityType = notif.data?.entityType;
    const entityId = notif.data?.entityId;
    if (!entityType || !entityId || !['company', 'broker'].includes(entityType)) return;
    setActivatingId(notif.id);
    try {
      const res = await fetch('/api/admin/entity-status', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId, status: 'active' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        alert(data.error || 'Erreur lors de l\'activation');
        return;
      }
      await fetch('/api/notifications', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notif.id }),
      });
      fetchNotifications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setActivatingId(null);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const diff = now - new Date(dateString).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}j`;
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setIsOpen(false);
      fetchNotifications();
    } catch {
      /* ignore */
    }
  };

  return (
    <div ref={ref} className="relative z-[100]">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="true"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-gray-200 z-[200] overflow-hidden">
          <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs text-primary-600 font-medium">{unreadCount} non lues</span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                Aucune notification
              </div>
            ) : (
              notifications.map((notif) => {
                const canActivate = notif.data?.entityType && notif.data?.entityId && ['company', 'broker'].includes(notif.data.entityType);
                return (
                  <div
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notif.read ? 'bg-blue-50/50' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-0.5 p-1.5 rounded-lg flex-shrink-0 ${
                        !notif.read ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {getIcon(notif.type, notif.icon)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{notif.title}</p>
                          <span className="text-xs text-gray-400 flex-shrink-0">{getTimeAgo(notif.created_at)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        {canActivate && (
                          <button
                            type="button"
                            onClick={(e) => handleActivateEntity(e, notif)}
                            disabled={activatingId === notif.id}
                            className="mt-2 inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60 disabled:pointer-events-none"
                          >
                            {activatingId === notif.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3 h-3" />
                            )}
                            {activatingId === notif.id ? 'En cours…' : 'Valider'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2.5 border-t bg-gray-50 flex flex-col gap-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void handleMarkAllRead();
                }}
                className="w-full text-xs text-gray-600 font-medium hover:text-gray-900 py-1"
              >
                Tout marquer comme lu
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  router.push('/messages');
                }}
                className="w-full text-xs text-primary-600 font-medium hover:text-primary-700 py-1"
              >
                Voir les messages
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
