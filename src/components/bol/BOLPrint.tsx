'use client';

import { BOL } from '@/types';
import jsPDF from 'jspdf';

// ── Helpers ──
function safe(val: any): any {
  if (!val) return {};
  return typeof val === 'string' ? JSON.parse(val) : val;
}

function safeArr(val: any): any[] {
  if (!val) return [];
  const parsed = typeof val === 'string' ? JSON.parse(val) : val;
  return Array.isArray(parsed) ? parsed : [];
}

/**
 * Génère un PDF BOL professionnel style "Bill of Lading - Shipping Form"
 * Adapté pour la RDC - Tout en français
 */
export function generateBOLPDF(bol: BOL) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = 210;
  const margin = 12;
  const innerW = W - margin * 2;
  const halfW = innerW / 2;

  const shipper = safe(bol.shipper);
  const carrier = safe(bol.carrier);
  const consignee = safe((bol as any).consignee);
  const origin = safe(bol.origin);
  const destination = safe(bol.destination);
  const items = safeArr(bol.items);

  let y = margin;

  // ── HELPER FUNCTIONS ──
  const drawRect = (x: number, y: number, w: number, h: number) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.rect(x, y, w, h);
  };

  const drawThickRect = (x: number, y: number, w: number, h: number) => {
    doc.setDrawColor(0);
    doc.setLineWidth(0.6);
    doc.rect(x, y, w, h);
  };

  const sectionHeader = (text: string, x: number, yPos: number, w: number, h: number = 6) => {
    doc.setFillColor(40, 40, 40);
    doc.rect(x, yPos, w, h, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(text.toUpperCase(), x + w / 2, yPos + h / 2 + 1, { align: 'center' });
    doc.setTextColor(0, 0, 0);
  };

  const label = (text: string, x: number, yPos: number) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    doc.text(text, x, yPos);
    doc.setTextColor(0, 0, 0);
  };

  const value = (text: string, x: number, yPos: number, maxW: number = 80) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(text || '', x, yPos, { maxWidth: maxW });
  };

  // ══════════════════════════════════════════
  // TITRE PRINCIPAL
  // ══════════════════════════════════════════
  doc.setFillColor(20, 20, 20);
  doc.rect(margin, y, innerW, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.text('BORDEREAU DE CHARGEMENT - FORMULAIRE D\'EXPEDITION', W / 2, y + 5.5, { align: 'center' });
  doc.setFontSize(7);
  doc.text('Republique Democratique du Congo', W / 2, y + 10, { align: 'center' });
  doc.setTextColor(0, 0, 0);
  y += 14;

  // ══════════════════════════════════════════
  // EXPEDITEUR (gauche) | N° BORDEREAU (droite)
  // ══════════════════════════════════════════
  const blockH1 = 32;
  drawThickRect(margin, y, halfW, blockH1);
  drawThickRect(margin + halfW, y, halfW, blockH1);

  // Header gauche
  sectionHeader('Expedier de (Expediteur)', margin, y, halfW);
  let yL = y + 9;
  label('Nom:', margin + 2, yL); value(shipper.name || '', margin + 15, yL);
  yL += 5;
  label('Adresse:', margin + 2, yL); value(shipper.address || '', margin + 20, yL);
  yL += 5;
  label('Ville:', margin + 2, yL); value(`${shipper.city || ''}, ${shipper.province || ''}`, margin + 15, yL);
  yL += 5;
  label('Tel:', margin + 2, yL); value(shipper.phone || '', margin + 12, yL);
  if (shipper.email) { label('Email:', margin + 50, yL); value(shipper.email, margin + 62, yL); }

  // Header droite
  sectionHeader('Numero du Bordereau', margin + halfW, y, halfW);
  let yR = y + 10;
  const bolNum = (bol as any).bolNumber || (bol as any).bol_number || `BOL-${bol.id.substring(0, 8).toUpperCase()}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(bolNum, margin + halfW + halfW / 2, yR + 2, { align: 'center' });
  yR += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text(`Date: ${new Date(bol.createdAt).toLocaleDateString('fr-FR')}`, margin + halfW + halfW / 2, yR, { align: 'center' });
  // Barcode placeholder
  yR += 4;
  doc.setDrawColor(180);
  doc.setLineWidth(0.2);
  doc.rect(margin + halfW + 15, yR, halfW - 30, 8, 'S');
  doc.setFontSize(6);
  doc.setTextColor(150);
  doc.text('ESPACE CODE-BARRES', margin + halfW + halfW / 2, yR + 5, { align: 'center' });
  doc.setTextColor(0);

  y += blockH1 + 1;

  // ══════════════════════════════════════════
  // DESTINATAIRE (gauche) | TRANSPORTEUR (droite)
  // ══════════════════════════════════════════
  const blockH2 = 28;
  drawThickRect(margin, y, halfW, blockH2);
  drawThickRect(margin + halfW, y, halfW, blockH2);

  sectionHeader('*Expedier a (Destinataire)', margin, y, halfW);
  yL = y + 9;
  const dest = consignee.name ? consignee : destination;
  label('Nom:', margin + 2, yL); value(dest.name || dest.city || '', margin + 15, yL);
  yL += 5;
  label('Adresse:', margin + 2, yL); value(dest.address || '', margin + 20, yL);
  yL += 5;
  label('Ville:', margin + 2, yL); value(`${dest.city || ''}, ${dest.province || ''}`, margin + 15, yL);
  yL += 5;
  if (dest.phone) { label('Tel:', margin + 2, yL); value(dest.phone, margin + 12, yL); }

  sectionHeader('Nom du Transporteur', margin + halfW, y, halfW);
  yR = y + 10;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(carrier.name || '', margin + halfW + 5, yR);
  yR += 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  if (carrier.scac) {
    label('SCAC:', margin + halfW + 5, yR); value(carrier.scac, margin + halfW + 20, yR);
  }

  y += blockH2 + 1;

  // ══════════════════════════════════════════
  // INSTRUCTIONS SPECIALES | CONDITIONS DE FRET
  // ══════════════════════════════════════════
  const blockH3 = 18;
  drawThickRect(margin, y, halfW, blockH3);
  drawThickRect(margin + halfW, y, halfW, blockH3);

  label('Instructions speciales:', margin + 2, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text((bol as any).specialInstructions || (bol as any).special_instructions || '', margin + 2, y + 9, { maxWidth: halfW - 4 });

  label('Conditions de fret:', margin + halfW + 2, y + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Les frais de transport sont prepayes sauf mention contraire.', margin + halfW + 2, y + 9, { maxWidth: halfW - 4 });

  y += blockH3 + 1;

  // ══════════════════════════════════════════
  // TABLEAU DES ARTICLES
  // ══════════════════════════════════════════
  sectionHeader('Information commande client', margin, y, innerW);
  y += 7;

  // Table Header
  const colWidths = [25, 55, 18, 20, 20, 20, 28];
  const colHeaders = ['N° Commande', 'Description marchandise', 'Nb Colis', 'Poids (kg)', 'Palette', 'Classe', 'Info supplementaire'];

  doc.setFillColor(230, 230, 230);
  doc.rect(margin, y, innerW, 6, 'F');
  drawRect(margin, y, innerW, 6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  let xCol = margin;
  colHeaders.forEach((header, i) => {
    doc.text(header, xCol + 1, y + 4);
    doc.line(xCol, y, xCol, y + 6);
    xCol += colWidths[i];
  });
  doc.line(margin + innerW, y, margin + innerW, y + 6);
  y += 6;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const rowH = 7;

  items.forEach((item: any) => {
    if (y > 250) {
      doc.addPage();
      y = margin;
    }
    drawRect(margin, y, innerW, rowH);
    xCol = margin;

    const vals = [
      item.customerOrderNo || '',
      item.description || '',
      String(item.quantity || 1),
      String(item.weight || 0),
      item.palletSlip ? 'Oui' : 'Non',
      item.freightClass || '70',
      item.nmfcNo || '',
    ];

    vals.forEach((val, i) => {
      doc.text(val.substring(0, 25), xCol + 1, y + rowH / 2 + 1);
      doc.line(xCol, y, xCol, y + rowH);
      xCol += colWidths[i];
    });
    doc.line(margin + innerW, y, margin + innerW, y + rowH);
    y += rowH;
  });

  // Total Row
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, innerW, rowH, 'F');
  drawRect(margin, y, innerW, rowH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('TOTAL GENERAL', margin + 2, y + rowH / 2 + 1);
  doc.text(`${bol.totalWeight.toLocaleString()} kg`, margin + 98 + 1, y + rowH / 2 + 1);
  doc.text(`${bol.totalValue.toLocaleString()} CDF`, margin + innerW - 30, y + rowH / 2 + 1);
  y += rowH + 2;

  // ══════════════════════════════════════════
  // INFORMATION TRANSPORTEUR
  // ══════════════════════════════════════════
  sectionHeader('Information transporteur', margin, y, innerW);
  y += 7;

  const infoH = 16;
  drawThickRect(margin, y, halfW, infoH);
  drawThickRect(margin + halfW, y, halfW, infoH);

  label('Montant contre remboursement:', margin + 2, y + 5);
  value((bol as any).codAmount || '0 CDF', margin + 55, y + 5);

  label('Modalites:', margin + 2, y + 11);
  value((bol as any).feeTerms || 'Prepaye', margin + 22, y + 11);

  label('Date de ramassage:', margin + halfW + 2, y + 5);
  value(new Date(bol.pickupDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), margin + halfW + 38, y + 5);

  label('Date de livraison:', margin + halfW + 2, y + 11);
  value(new Date(bol.deliveryDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }), margin + halfW + 38, y + 11);

  y += infoH + 2;

  // ══════════════════════════════════════════
  // MENTION LEGALE
  // ══════════════════════════════════════════
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('Note : La limitation de responsabilite pour perte ou dommage peut etre applicable.', margin, y + 3);
  doc.setFont('helvetica', 'normal');
  doc.text('Le transporteur ne fera pas la livraison sans paiement des frais de transport et de tous les autres frais legaux.', margin, y + 7);
  y += 10;

  // ══════════════════════════════════════════
  // SIGNATURES
  // ══════════════════════════════════════════
  const sigH = 24;
  drawThickRect(margin, y, halfW, sigH);
  drawThickRect(margin + halfW, y, halfW, sigH);

  label('Signature Expediteur / Date', margin + 2, y + 4);
  doc.setDrawColor(200);
  doc.line(margin + 5, y + 18, margin + halfW - 5, y + 18);

  label('Signature Transporteur / Date de ramassage', margin + halfW + 2, y + 4);
  doc.line(margin + halfW + 5, y + 18, margin + innerW - 5, y + 18);

  if (bol.signature) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('[Signe electroniquement]', margin + halfW / 2, y + 14, { align: 'center' });
  }

  y += sigH + 3;

  // ══════════════════════════════════════════
  // CERTIFICATION
  // ══════════════════════════════════════════
  doc.setFontSize(6);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100);
  doc.text(
    'Le soussigne certifie que les matieres ci-dessus sont correctement classifiees, emballees, marquees et etiquetees, et sont en bon etat pour le transport conformement aux reglementations du Ministere des Transports de la RDC.',
    margin, y, { maxWidth: innerW }
  );
  doc.setTextColor(0);

  // ══════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(130);
    doc.text(
      `Page ${i}/${pageCount}  |  Nzela - Plateforme de Logistique RDC  |  ${bolNum}`,
      W / 2, 290, { align: 'center' }
    );
    doc.setTextColor(0);
  }

  return doc;
}

export function downloadBOLPDF(bol: BOL) {
  const doc = generateBOLPDF(bol);
  const bolNum = (bol as any).bolNumber || (bol as any).bol_number || `BOL-${bol.id.substring(0, 8).toUpperCase()}`;
  doc.save(`${bolNum}.pdf`);
}
