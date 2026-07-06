'use client';

import jsPDF from 'jspdf';
import { SUPPORT_PHONE } from '@/lib/constants/support';

export interface PaymentForInvoice {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transaction_id: string;
  payment_type?: string;
  created_at: string;
  paid_at?: string | null;
  metadata?: { description?: string } | null;
}

const APP_NAME = 'Nzela';
const COMPANY = 'Maintenance de Matériel au Congo (M M C SARL)';
const ADDRESS = '04, Avenue Monga, Quartier Craa, Lubumbashi, RDC — RCCM LSHI 17-B-6981';

function paymentTypeLabel(type?: string): string {
  if (!type) return 'Paiement';
  if (type === 'subscription') return 'Abonnement plateforme Nzela';
  if (type === 'load' || type === 'freight') return 'Paiement fret / chargement';
  return type;
}

function statusLabel(status: string): string {
  if (status === 'completed') return 'Payé';
  if (status === 'pending') return 'En attente';
  if (status === 'failed') return 'Échoué';
  return status;
}

/**
 * Génère une facture PDF pour un paiement (demande ou reçu).
 */
export function generateInvoicePDF(payment: PaymentForInvoice, options?: { customerName?: string }) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = 210;
  const margin = 14;
  const innerW = W - margin * 2;
  let y = margin;

  const invoiceNumber = payment.transaction_id || `INV-${payment.id.slice(0, 8).toUpperCase()}`;
  const date = new Date(payment.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const description = (payment.metadata as any)?.description || paymentTypeLabel(payment.payment_type);
  const methodLabel =
    payment.method === 'mobile-money'
      ? 'Mobile Money'
      : payment.method === 'bank-transfer'
        ? 'Virement bancaire'
        : payment.method === 'card'
          ? 'Carte bancaire'
          : payment.method;

  // ── En-tête ──
  doc.setFillColor(5, 150, 105); // primary-600
  doc.rect(0, 0, W, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(APP_NAME, margin, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Facture', margin, 20);
  doc.setTextColor(0, 0, 0);

  y = 28;

  // ── Numéro et date (droite) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Facture N° ${invoiceNumber}`, margin + innerW - doc.getTextWidth(`Facture N° ${invoiceNumber}`), y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date : ${date}`, margin + innerW - doc.getTextWidth(`Date : ${date}`), y + 6);
  y += 14;

  // ── Émetteur (Nzela / MMC) ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Émetteur', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${COMPANY} - ${APP_NAME}`, margin, y + 5);
  doc.text(ADDRESS, margin, y + 10);
  doc.text(`Tél : ${SUPPORT_PHONE}`, margin, y + 15);
  y += 22;

  // ── Client ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Client', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(options?.customerName || 'Client plateforme Nzela', margin, y + 5);
  y += 14;

  // ── Ligne de séparation ──
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + innerW, y);
  y += 10;

  // ── Détail / Table ──
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, innerW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Description', margin + 4, y + 5.5);
  doc.text('Montant', margin + innerW - 28, y + 5.5);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(description, margin + 4, y + 6);
  doc.text(
    `${payment.amount.toLocaleString('fr-FR')} ${payment.currency}`,
    margin + innerW - doc.getTextWidth(`${payment.amount.toLocaleString('fr-FR')} ${payment.currency}`) - 4,
    y + 6,
  );
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`Méthode : ${methodLabel}`, margin + 4, y + 4);
  doc.text(`Statut : ${statusLabel(payment.status)}`, margin + innerW - 50, y + 4);
  doc.setTextColor(0, 0, 0);
  y += 14;

  // ── Total ──
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    `Total : ${payment.amount.toLocaleString('fr-FR')} ${payment.currency}`,
    margin + innerW - doc.getTextWidth(`Total : ${payment.amount.toLocaleString('fr-FR')} ${payment.currency}`),
    y + 6,
  );
  y += 18;

  // ── Pied ──
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, margin + innerW, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(
    'Document généré par Nzela. Ce document constitue une facture / demande de paiement.',
    margin,
    y,
    { maxWidth: innerW },
  );
  doc.text(`${COMPANY} · ${ADDRESS} · ${SUPPORT_PHONE}`, margin, y + 5);

  return doc;
}

/**
 * Télécharge la facture PDF pour un paiement.
 */
export function downloadInvoicePDF(payment: PaymentForInvoice, options?: { customerName?: string }) {
  const doc = generateInvoicePDF(payment, options);
  const fileName = `Facture-${payment.transaction_id || payment.id.slice(0, 8)}.pdf`;
  doc.save(fileName);
}
