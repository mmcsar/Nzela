'use client';

import jsPDF from 'jspdf';

const APP_NAME = 'Nzela';

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
  broker?: { name?: string } | null;
}

export function generateTransportInvoicePDF(inv: TransportInvoiceForPDF): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = 210;
  const margin = 14;
  const innerW = W - margin * 2;
  let y = margin;

  const invNum = inv.invoice_number || `INV-${inv.id.slice(0, 8).toUpperCase()}`;
  const date = inv.created_at
    ? new Date(inv.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
    : '—';
  const origin = inv.load ? parseLoc(inv.load.origin) : '—';
  const dest = inv.load ? parseLoc(inv.load.destination) : '—';
  const brokerName = (inv.broker as { name?: string })?.name || 'Courtier Nzela';
  const statusLabel =
    inv.status === 'paid' ? 'Payée' : inv.status === 'sent' ? 'Envoyée' : inv.status === 'cancelled' ? 'Annulée' : 'Brouillon';

  // En-tête
  doc.setFillColor(0, 102, 204);
  doc.rect(0, 0, W, 22, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text(APP_NAME, margin, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('Facture transport', margin, 20);
  doc.setTextColor(0, 0, 0);
  y = 28;

  // Numéro et date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Facture N° ${invNum}`, margin + innerW - doc.getTextWidth(`Facture N° ${invNum}`), y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Date : ${date}`, margin + innerW - doc.getTextWidth(`Date : ${date}`), y + 6);
  doc.text(`Statut : ${statusLabel}`, margin + innerW - doc.getTextWidth(`Statut : ${statusLabel}`), y + 12);
  y += 20;

  // Émetteur (courtier)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Émetteur (courtier)', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(brokerName, margin, y + 6);
  y += 14;

  // Prestation (trajet)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Prestation (transport)', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`De : ${origin}`, margin, y + 6);
  doc.text(`À : ${dest}`, margin, y + 12);
  y += 22;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, y, margin + innerW, y);
  y += 10;

  // Table
  doc.setFillColor(245, 245, 245);
  doc.rect(margin, y, innerW, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Désignation', margin + 4, y + 5.5);
  doc.text('Montant', margin + innerW - 32, y + 5.5);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const design = `Transport fret ${origin} → ${dest}`;
  doc.text(design.length > 50 ? design.slice(0, 47) + '...' : design, margin + 4, y + 6);
  doc.text(
    `${Number(inv.amount).toLocaleString('fr-FR')} ${inv.currency}`,
    margin + innerW - doc.getTextWidth(`${Number(inv.amount).toLocaleString('fr-FR')} ${inv.currency}`) - 4,
    y + 6,
  );
  y += 14;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(
    `Total : ${Number(inv.amount).toLocaleString('fr-FR')} ${inv.currency}`,
    margin + innerW - doc.getTextWidth(`Total : ${Number(inv.amount).toLocaleString('fr-FR')} ${inv.currency}`),
    y + 4,
  );
  y += 16;

  if (inv.notes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text('Notes :', margin, y);
    doc.text(String(inv.notes).slice(0, 200), margin, y + 5, { maxWidth: innerW });
    doc.setTextColor(0, 0, 0);
    y += 14;
  }

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, margin + innerW, y);
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text('Document généré par Nzela — Facture transport liée à un chargement.', margin, y, { maxWidth: innerW });

  return doc;
}

export function downloadTransportInvoicePDF(inv: TransportInvoiceForPDF): void {
  const doc = generateTransportInvoicePDF(inv);
  const num = (inv.invoice_number || inv.id.slice(0, 8)).replace(/[^A-Za-z0-9-]/g, '_');
  doc.save(`Facture-transport-${num}.pdf`);
}
