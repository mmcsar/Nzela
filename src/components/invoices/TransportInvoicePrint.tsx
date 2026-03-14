'use client';

import jsPDF from 'jspdf';

const APP_NAME = 'Nzela';
const HEADER_GREEN = { r: 5, g: 120, b: 80 } as const;
const BADGE_YELLOW = { r: 240, g: 192, b: 64 } as const;
const CDF_PER_USD = 2850; // Taux indicatif pour conversion affichée

function parseLoc(loc: unknown): string {
  if (!loc) return '—';
  if (typeof loc === 'string') {
    try {
      const o = JSON.parse(loc);
      return [o?.city, o?.address].filter(Boolean).join(', ') || '—';
    } catch {
      return loc;
    }
  }
  const o = loc as { city?: string; address?: string };
  return [o?.city, o?.address].filter(Boolean).join(', ') || '—';
}

export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface TransportInvoiceForPDF {
  id: string;
  invoice_number: string | null;
  amount: number;
  currency: string;
  status: string;
  notes?: string | null;
  created_at: string;
  load?: {
    origin: unknown;
    destination: unknown;
    price?: number;
  } | null;
  broker?: { name?: string; address?: string; city?: string; phone?: string; registration_number?: string } | null;
  company?: { name?: string; address?: string; city?: string; phone?: string; registration_number?: string } | null;
  /** Lignes de détail (si vide, une ligne "Transport fret" est générée) */
  line_items?: InvoiceLineItem[] | null;
  /** Taux TVA en % (ex: 16). Défaut 0 */
  tva_rate?: number;
  /** Acompte déjà reçu */
  advance_payment?: { amount: number; date: string; reference?: string; method?: string } | null;
  /** Jours pour échéance après émission (défaut 14) */
  due_days?: number;
}

function formatDate(s: string | undefined): string {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatMoney(amount: number, currency: string): string {
  return `${Number(amount).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

export function generateTransportInvoicePDF(inv: TransportInvoiceForPDF): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = 210;
  const H = 297;
  const margin = 14;
  const innerW = W - margin * 2;
  let y = margin;

  const invNum = inv.invoice_number || `FAC-${inv.id.slice(0, 8).toUpperCase()}`;
  const dateEmission = formatDate(inv.created_at);
  const dueDays = inv.due_days ?? 14;
  const dueDate = inv.created_at
    ? formatDate(new Date(new Date(inv.created_at).getTime() + dueDays * 24 * 60 * 60 * 1000).toISOString())
    : '—';
  const origin = inv.load ? parseLoc(inv.load.origin) : '—';
  const dest = inv.load ? parseLoc(inv.load.destination) : '—';
  const tvaRate = inv.tva_rate ?? 0;
  const statusLabel =
    inv.status === 'paid' ? 'Payée' : inv.status === 'sent' ? 'Envoyée' : inv.status === 'cancelled' ? 'Annulée' : 'Émise';

  const issuerName = (inv.broker as { name?: string })?.name || APP_NAME;
  const issuerAddress = [inv.broker?.address, inv.broker?.city].filter(Boolean).join(', ') || 'Lubumbashi, RDC';
  const issuerPhone = inv.broker?.phone || '—';
  const issuerRccm = inv.broker?.registration_number || '—';

  const clientName = inv.company?.name || 'Client';
  const clientAddress = [inv.company?.address, inv.company?.city].filter(Boolean).join(', ') || '—';
  const clientPhone = inv.company?.phone || '—';
  const clientNif = inv.company?.registration_number || '—';

  const lineItems: InvoiceLineItem[] =
    inv.line_items && inv.line_items.length > 0
      ? inv.line_items
      : [{ description: `Transport fret ${origin} → ${dest}`, quantity: 1, unit_price: inv.amount, amount: inv.amount }];

  const subtotalHT = lineItems.reduce((s, l) => s + l.amount, 0);
  const tvaAmount = (subtotalHT * tvaRate) / 100;
  const totalTTC = subtotalHT + tvaAmount;
  const advance = inv.advance_payment?.amount ?? 0;
  const solde = totalTTC - advance;

  // —— En-tête fond vert ——
  doc.setFillColor(HEADER_GREEN.r, HEADER_GREEN.g, HEADER_GREEN.b);
  doc.rect(0, 0, W, 36, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 212, 0);
  doc.text(issuerName, margin, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Logistique & Transport — RDC', margin, 18);
  doc.text(`RCCM: ${issuerRccm}`, margin, 23);
  doc.text(issuerAddress, margin, 28);
  doc.text(`Tél: ${issuerPhone}`, margin, 33);

  doc.setFillColor(BADGE_YELLOW.r, BADGE_YELLOW.g, BADGE_YELLOW.b);
  doc.setTextColor(0, 0, 0);
  doc.rect(margin + innerW - 52, 6, 38, 10, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('FACTURE', margin + innerW - 33 - doc.getTextWidth('FACTURE') / 2, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(invNum, margin + innerW - 52, 22);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.rect(margin + innerW - 52, 24, 38, 6, 'S');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text(statusLabel, margin + innerW - 33 - doc.getTextWidth(statusLabel) / 2, 28);
  doc.setTextColor(0, 0, 0);
  y = 42;

  // —— Facturé à / Référence ——
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('FACTURÉ À', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(clientName, margin, y + 6);
  doc.text(`NIF / Id. Nat.: ${clientNif}`, margin, y + 11);
  doc.text(clientAddress, margin, y + 16);
  doc.text(`Tél: ${clientPhone}`, margin, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.text('RÉFÉRENCE COMMANDE', margin + innerW / 2, y);
  doc.setFont('helvetica', 'normal');
  doc.text(invNum, margin + innerW / 2, y + 6);
  doc.setFontSize(8);
  doc.text('Chargé de compte: Nzela', margin + innerW / 2, y + 14);
  y += 28;

  // —— Dates et devise ——
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('DATE D\'ÉMISSION', margin, y);
  doc.text('ÉCHÉANCE PAIEMENT', margin + 50, y);
  doc.text('DEVISE', margin + 100, y);
  doc.setFont('helvetica', 'normal');
  doc.text(dateEmission, margin, y + 6);
  doc.setTextColor(220, 120, 0);
  doc.text(dueDate, margin + 50, y + 6);
  doc.setTextColor(0, 0, 0);
  doc.text(inv.currency === 'USD' ? 'USD / CDF' : 'CDF', margin + 100, y + 6);
  y += 16;

  // —— Acompte (si présent) ——
  if (inv.advance_payment && inv.advance_payment.amount > 0) {
    doc.setFillColor(255, 248, 220);
    doc.rect(margin, y, innerW, 10, 'F');
    const acText = `Acompte reçu le ${formatDate(inv.advance_payment.date)} — ${formatMoney(inv.advance_payment.amount, inv.currency)}${inv.advance_payment.method ? ` via ${inv.advance_payment.method}` : ''}${inv.advance_payment.reference ? ` (Réf. ${inv.advance_payment.reference})` : ''}`;
    doc.setFontSize(8);
    doc.text(acText.slice(0, 90) + (acText.length > 90 ? '...' : ''), margin + 2, y + 6.5, { maxWidth: innerW - 4 });
    y += 14;
  }

  // —— Tableau lignes ——
  const colW = [8, innerW - 8 - 18 - 28 - 32, 18, 28, 32];
  const x0 = margin;
  doc.setFillColor(248, 248, 248);
  doc.rect(margin, y, innerW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('#', x0 + 2, y + 5.5);
  doc.text('DESCRIPTION', x0 + colW[0] + 2, y + 5.5);
  doc.text('QTÉ', x0 + colW[0] + colW[1] + 2, y + 5.5);
  doc.text('P.U.', x0 + colW[0] + colW[1] + colW[2] + 2, y + 5.5);
  doc.text('MONTANT', x0 + colW[0] + colW[1] + colW[2] + colW[3] + 2, y + 5.5);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  lineItems.forEach((line, i) => {
    doc.text(String(i + 1).padStart(2, '0'), x0 + 2, y + 5);
    doc.text(line.description.slice(0, 45) + (line.description.length > 45 ? '...' : ''), x0 + colW[0] + 2, y + 5, { maxWidth: colW[1] - 2 });
    doc.text(String(line.quantity), x0 + colW[0] + colW[1] + 2, y + 5);
    doc.text(
      line.unit_price.toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
      x0 + colW[0] + colW[1] + colW[2] + colW[3] - doc.getTextWidth(line.unit_price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })),
      y + 5,
    );
    doc.text(
      line.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 }),
      x0 + innerW - 4 - doc.getTextWidth(line.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })),
      y + 5,
    );
    y += 8;
  });
  y += 4;

  // —— Totaux (alignés à droite) ——
  const rightX = margin + innerW - 4;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Sous-total HT: ${formatMoney(subtotalHT, inv.currency)}`, rightX - doc.getTextWidth(`Sous-total HT: ${formatMoney(subtotalHT, inv.currency)}`), y);
  y += 7;
  if (tvaRate > 0) {
    doc.text(`TVA (${tvaRate}%): ${formatMoney(tvaAmount, inv.currency)}`, rightX - doc.getTextWidth(`TVA (${tvaRate}%): ${formatMoney(tvaAmount, inv.currency)}`), y);
    y += 7;
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`Total TTC: ${formatMoney(totalTTC, inv.currency)}`, rightX - doc.getTextWidth(`Total TTC: ${formatMoney(totalTTC, inv.currency)}`), y);
  y += 7;
  if (advance > 0) {
    doc.setFont('helvetica', 'normal');
    doc.text(`Acompte versé: - ${formatMoney(advance, inv.currency)}`, rightX - doc.getTextWidth(`Acompte versé: - ${formatMoney(advance, inv.currency)}`), y);
    y += 7;
  }
  doc.setFont('helvetica', 'bold');
  doc.text(`Solde dû: ${formatMoney(solde, inv.currency)}`, rightX - doc.getTextWidth(`Solde dû: ${formatMoney(solde, inv.currency)}`), y);
  y += 14;

  // —— Bloc SOLDE À PAYER (vert) ——
  doc.setFillColor(HEADER_GREEN.r, HEADER_GREEN.g, HEADER_GREEN.b);
  doc.rect(margin, y, innerW, 18, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('SOLDE À PAYER', margin + 6, y + 8);
  doc.text(formatMoney(solde, inv.currency), margin + 6, y + 15);
  if (inv.currency === 'USD') {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const cdfApprox = Math.round(solde * CDF_PER_USD);
    doc.text(`≈ ${cdfApprox.toLocaleString('fr-FR')} CDF`, margin + 6, y + 22);
  }
  doc.setTextColor(0, 0, 0);
  y += 24;

  // —— Modes de règlement ——
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('MODES DE RÈGLEMENT ACCEPTÉS', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Orange Money · M-Pesa · Airtel Money · Virement bancaire', margin, y + 6);
  doc.text(`Numéro Orange Money: ${issuerPhone} (${issuerName})`, margin, y + 12);
  y += 20;

  // —— Mentions légales ——
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.setTextColor(80, 80, 80);
  const mentions = [
    'Facture soumise à la TVA au taux en vigueur (DGI/RDC).',
    'Pénalité de retard: 1,5% par mois après l\'échéance.',
    'Conservation obligatoire: 10 ans (loi OHADA).',
    'En cas de litige: Tribunal de Commerce de Lubumbashi.',
  ];
  mentions.forEach((m) => {
    doc.text(m, margin, y, { maxWidth: innerW });
    y += 4;
  });
  doc.setTextColor(0, 0, 0);
  y += 4;

  if (inv.notes) {
    doc.setFontSize(7);
    doc.text('Notes: ' + String(inv.notes).slice(0, 150), margin, y, { maxWidth: innerW });
    y += 6;
  }

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, margin + innerW, y);
  y += 6;
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  doc.text('Document généré par Nzela — Facture transport.', margin, y, { maxWidth: innerW });

  return doc;
}

export function downloadTransportInvoicePDF(inv: TransportInvoiceForPDF): void {
  const doc = generateTransportInvoicePDF(inv);
  const num = (inv.invoice_number || inv.id.slice(0, 8)).replace(/[^A-Za-z0-9-]/g, '_');
  doc.save(`Facture-${num}.pdf`);
}