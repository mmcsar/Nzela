/**
 * Utilitaires de formatage pour la plateforme Nzela
 */

const INVALID_DATE_LABEL: Record<string, string> = {
  'fr-CD': 'Date invalide',
  'fr-FR': 'Date invalide',
  'en-GB': 'Invalid date',
  'en-US': 'Invalid date',
};

/** Map next-intl locale (`fr` / `en`) to BCP 47 tag for dates. */
export function resolveDateLocale(locale?: string): string {
  return locale === 'en' ? 'en-GB' : 'fr-CD';
}

/** Parse YYYY-MM-DD at local noon to avoid timezone day shifts. */
export function parseDateInput(date: Date | string): Date {
  if (date instanceof Date) return date;
  const trimmed = date.trim();
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(trimmed) ? `${trimmed}T12:00:00` : trimmed;
  return new Date(normalized);
}

/**
 * Formater une date
 */
export function formatDate(
  date: Date | string,
  style: 'short' | 'long' | 'medium' | 'relative' = 'short',
  locale: string = 'fr-CD',
): string {
  const d = parseDateInput(date);
  const dateLocale = locale in INVALID_DATE_LABEL ? locale : resolveDateLocale(locale);

  if (isNaN(d.getTime())) {
    return INVALID_DATE_LABEL[dateLocale] ?? INVALID_DATE_LABEL['fr-CD'];
  }

  if (style === 'relative') {
    return getRelativeTime(d, dateLocale);
  }

  if (style === 'long') {
    return d.toLocaleDateString(dateLocale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  if (style === 'medium') {
    return d.toLocaleDateString(dateLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  return d.toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/**
 * Formater une date et heure
 */
export function formatDateTime(date: Date | string, locale: string = 'fr-CD'): string {
  const d = parseDateInput(date);
  const dateLocale = locale in INVALID_DATE_LABEL ? locale : resolveDateLocale(locale);
  if (isNaN(d.getTime())) {
    return INVALID_DATE_LABEL[dateLocale] ?? INVALID_DATE_LABEL['fr-CD'];
  }

  return d.toLocaleDateString(dateLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Temps relatif (il y a X minutes/heures/jours)
 */
export function getRelativeTime(date: Date, locale: string = 'fr-CD'): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const isEn = locale.startsWith('en');

  if (diffSec < 60) return isEn ? 'Just now' : 'À l\'instant';
  if (diffMin < 60) return isEn ? `${diffMin} min ago` : `Il y a ${diffMin} min`;
  if (diffHours < 24) return isEn ? `${diffHours}h ago` : `Il y a ${diffHours}h`;
  if (diffDays < 7) return isEn ? `${diffDays}d ago` : `Il y a ${diffDays}j`;
  if (diffWeeks < 4) return isEn ? `${diffWeeks} wk ago` : `Il y a ${diffWeeks} sem.`;
  if (diffMonths < 12) return isEn ? `${diffMonths} mo ago` : `Il y a ${diffMonths} mois`;
  return formatDate(date, 'short', locale);
}

/**
 * Formater un poids (kg ou tonnes)
 */
export function formatWeight(weightKg: number): string {
  if (weightKg >= 1000) {
    const tonnes = weightKg / 1000;
    return `${tonnes.toFixed(tonnes % 1 === 0 ? 0 : 1)} T`;
  }
  return `${weightKg} kg`;
}

/**
 * Formater une distance
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm >= 1000) {
    return `${(distanceKm / 1000).toFixed(1)} K km`;
  }
  return `${distanceKm} km`;
}

/**
 * Formater un numéro de téléphone RDC
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('243') && cleaned.length === 12) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Formater un nombre avec séparateurs de milliers
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat('fr-CD').format(num);
}

/**
 * Tronquer un texte avec ellipsis
 */
export function truncate(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Capitaliser la première lettre
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Formater le statut en français avec couleur
 */
export function formatStatus(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    'available': { label: 'Disponible', color: 'emerald' },
    'booked': { label: 'Réservé', color: 'blue' },
    'in-transit': { label: 'En transit', color: 'amber' },
    'completed': { label: 'Complété', color: 'green' },
    'maintenance': { label: 'En maintenance', color: 'red' },
    'active': { label: 'Actif', color: 'emerald' },
    'suspended': { label: 'Suspendu', color: 'red' },
    'pending': { label: 'En attente', color: 'amber' },
    'expired': { label: 'Expiré', color: 'gray' },
    'cancelled': { label: 'Annulé', color: 'red' },
    'draft': { label: 'Brouillon', color: 'gray' },
    'signed': { label: 'Signé', color: 'blue' },
    'failed': { label: 'Échoué', color: 'red' },
  };

  return statusMap[status] || { label: capitalize(status), color: 'gray' };
}

/**
 * Formater le rôle utilisateur
 */
export function formatRole(role: string): string {
  const roleMap: Record<string, string> = {
    'admin': 'Administrateur',
    'company': 'Entreprise de transport',
    'broker': 'Courtier / Commissionnaire',
  };
  return roleMap[role] || capitalize(role);
}

/**
 * Formater la province
 */
export function formatProvince(province: string): string {
  const provinceMap: Record<string, string> = {
    'haut-katanga': 'Haut-Katanga',
    'lualaba': 'Lualaba',
  };
  return provinceMap[province] || capitalize(province);
}

/**
 * Générer un ID court (pour affichage)
 */
export function shortId(id: string, length: number = 8): string {
  return id.substring(0, length).toUpperCase();
}

/**
 * Formater la taille d'un fichier
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
