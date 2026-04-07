'use client';

import jsPDF from 'jspdf';

// ══════════════════════════════════════════
// INTERFACES
// ══════════════════════════════════════════
export interface PODData {
  // Identifiants
  controlNumber?: string;
  invoiceNumber?: string;
  bolNumber?: string;
  loadId?: string;

  // Entreprise de transport
  companyName?: string;
  companyAddress?: string;
  companyCity?: string;
  companyProvince?: string;
  companyPhone?: string;
  companyEmail?: string;
  dotNumber?: string;
  mcNumber?: string;
  licenseNumber?: string;

  // Chauffeur
  driverName?: string;
  driverLicense?: string;
  truckNumber?: string;
  trailerNumber?: string;

  // Dates et heures
  pickupDate?: string;
  deliveryDate?: string;
  shipperTimeIn?: string;
  shipperTimeOut?: string;
  receiverTimeIn?: string;
  receiverTimeOut?: string;
  shipperDate?: string;
  receiverDate?: string;

  // Expediteur (Shipper)
  shipperName?: string;
  shipperAddress?: string;
  shipperCity?: string;
  shipperProvince?: string;
  shipperPhone?: string;

  // Destinataire (Consignee / Receiver)
  consigneeName?: string;
  consigneeAddress?: string;
  consigneeCity?: string;
  consigneeProvince?: string;
  consigneePhone?: string;

  // References
  customerPO?: string;
  referenceNumber?: string;
  orderNumber?: string;

  // Articles
  items?: PODItem[];

  // Totaux
  totalWeight?: number;
  totalPieces?: number;

  // POD specifique
  receiverName?: string;
  condition?: 'good' | 'damaged' | 'partial';
  conditionNotes?: string;
  notes?: string;

  // Signatures (base64 images ou texte)
  shipperSignature?: string;
  driverSignature?: string;
  receiverSignature?: string;

  // Charges
  freightCharges?: number;
  advancedCharges?: number;
  codAmount?: number;
  paymentTerms?: string;
}

export interface PODItem {
  description?: string;
  quantity?: number;
  weight?: number;
  grossWeight?: number;
  rate?: number;
  specialMarks?: string;
}

// ══════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════
function fmtDate(d: string | undefined) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { return d; }
}

function fmtPrice(n: number | undefined) {
  if (!n) return '0';
  return n.toLocaleString('fr-FR');
}

/** Signature canvas → data URL pour addImage jsPDF */
function isDataUrlImage(s: string | undefined): s is string {
  return !!s && /^data:image\/(png|jpeg|jpg|webp);base64,/i.test(s);
}

// ══════════════════════════════════════════
// GENERATEUR PDF POD
// ══════════════════════════════════════════
export function generatePODPDF(pod: PODData): jsPDF {
  const doc = new jsPDF('p', 'mm', 'a4');
  const W = 210;
  const M = 10; // margin
  const IW = W - M * 2; // inner width
  const halfW = IW / 2;

  let y = M;

  // ── Drawing helpers ──
  const rect = (x: number, yy: number, w: number, h: number, thick = false) => {
    doc.setDrawColor(0);
    doc.setLineWidth(thick ? 0.5 : 0.25);
    doc.rect(x, yy, w, h);
  };

  const fillRect = (x: number, yy: number, w: number, h: number, r: number, g: number, b: number) => {
    doc.setFillColor(r, g, b);
    doc.rect(x, yy, w, h, 'F');
  };

  const hline = (x1: number, yy: number, x2: number) => {
    doc.setDrawColor(160);
    doc.setLineWidth(0.15);
    doc.line(x1, yy, x2, yy);
  };

  const lbl = (text: string, x: number, yy: number, size = 6.5) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(60, 60, 60);
    doc.text(text, x, yy);
    doc.setTextColor(0);
  };

  const val = (text: string, x: number, yy: number, size = 8.5, maxW = 80) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(size);
    doc.setTextColor(0);
    doc.text(text || '', x, yy, { maxWidth: maxW });
  };

  const valBold = (text: string, x: number, yy: number, size = 9) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.text(text || '', x, yy);
  };

  const sectionHead = (text: string, x: number, yy: number, w: number, h = 5.5) => {
    fillRect(x, yy, w, h, 30, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(text.toUpperCase(), x + 2, yy + h / 2 + 1);
    doc.setTextColor(0);
  };

  // ══════════════════════════════════════════════
  // 1. BANDEAU TITRE
  // ══════════════════════════════════════════════
  // Fond bleu fonce (comme l'image)
  fillRect(M, y, IW, 16, 0, 60, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.text('PREUVE DE LIVRAISON', M + 4, y + 7);
  doc.setFontSize(8);
  doc.text('PROOF OF DELIVERY / BORDEREAU DE RECEPTION', M + 4, y + 12);

  // Numero a droite
  doc.setFontSize(9);
  doc.text('CONTROLE #', M + IW - 55, y + 5);
  doc.text('FACTURE #', M + IW - 55, y + 10);

  // Cases blanches pour les numeros
  fillRect(M + IW - 35, y + 1, 33, 6, 255, 255, 255);
  fillRect(M + IW - 35, y + 8, 33, 6, 255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 60, 120);
  doc.text(pod.controlNumber || pod.loadId?.substring(0, 8).toUpperCase() || '', M + IW - 34, y + 5.5);
  doc.text(pod.invoiceNumber || 'N/A', M + IW - 34, y + 12.5);
  doc.setTextColor(0);

  y += 18;

  // ══════════════════════════════════════════════
  // 2. ENTREPRISE DE TRANSPORT + DOT/MC + DATES
  // ══════════════════════════════════════════════
  const topH = 28;
  const col1W = IW * 0.38;
  const col2W = IW * 0.30;
  const col3W = IW * 0.32;

  rect(M, y, col1W, topH, true);
  rect(M + col1W, y, col2W, topH, true);
  rect(M + col1W + col2W, y, col3W, topH, true);

  // Col 1: Entreprise
  sectionHead('Entreprise de transport', M, y, col1W);
  let cy = y + 8;
  valBold(pod.companyName || 'NZELA TRANSPORT', M + 2, cy, 10);
  cy += 4.5;
  val(pod.companyAddress || '', M + 2, cy, 7.5);
  cy += 3.5;
  val(`${pod.companyCity || ''}, ${pod.companyProvince || ''}`, M + 2, cy, 7.5);
  cy += 3.5;
  lbl('Tel:', M + 2, cy); val(pod.companyPhone || '', M + 12, cy, 7.5);
  cy += 3.5;
  lbl('Email:', M + 2, cy); val(pod.companyEmail || '', M + 14, cy, 7);

  // Col 2: DOT/MC + Chauffeur
  sectionHead('Identification', M + col1W, y, col2W);
  cy = y + 8;
  lbl('N° Licence:', M + col1W + 2, cy); val(pod.licenseNumber || pod.dotNumber || '', M + col1W + 22, cy, 8);
  cy += 4.5;
  lbl('N° Immatricul.:', M + col1W + 2, cy); val(pod.mcNumber || '', M + col1W + 28, cy, 8);
  cy += 4.5;
  lbl('Chauffeur:', M + col1W + 2, cy); valBold(pod.driverName || '', M + col1W + 22, cy, 8.5);
  cy += 4.5;
  lbl('Permis N°:', M + col1W + 2, cy); val(pod.driverLicense || '', M + col1W + 22, cy, 8);
  cy += 4.5;
  lbl('Camion #:', M + col1W + 2, cy); val(pod.truckNumber || '', M + col1W + 20, cy, 8);

  // Col 3: Dates / Heures
  sectionHead('Dates & Heures', M + col1W + col2W, y, col3W);
  const dx = M + col1W + col2W + 2;
  cy = y + 8;
  lbl('Ramassage:', dx, cy); val(fmtDate(pod.pickupDate), dx + 22, cy, 8);
  cy += 4;
  lbl('Livraison:', dx, cy); val(fmtDate(pod.deliveryDate), dx + 22, cy, 8);
  cy += 5;
  // Sous-tableau heures
  fillRect(dx, cy, col3W - 4, 4, 230, 230, 230);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text('', dx + 1, cy + 3);
  doc.text('ENTREE', dx + 14, cy + 3);
  doc.text('SORTIE', dx + 32, cy + 3);
  cy += 4.5;
  lbl('Exp.:', dx, cy);
  val(pod.shipperTimeIn || '__:__', dx + 14, cy, 7.5);
  val(pod.shipperTimeOut || '__:__', dx + 32, cy, 7.5);
  cy += 3.5;
  lbl('Dest.:', dx, cy);
  val(pod.receiverTimeIn || '__:__', dx + 14, cy, 7.5);
  val(pod.receiverTimeOut || '__:__', dx + 32, cy, 7.5);

  y += topH + 1;

  // ══════════════════════════════════════════════
  // 3. EXPEDITEUR + DESTINATAIRE
  // ══════════════════════════════════════════════
  const addrH = 24;
  rect(M, y, halfW, addrH, true);
  rect(M + halfW, y, halfW, addrH, true);

  sectionHead('Expediteur (Shipper)', M, y, halfW);
  cy = y + 8;
  valBold(pod.shipperName || '', M + 2, cy, 9);
  cy += 4;
  val(pod.shipperAddress || '', M + 2, cy, 7.5);
  cy += 3.5;
  val(`${pod.shipperCity || ''}, ${pod.shipperProvince || ''}`, M + 2, cy, 7.5);
  cy += 3.5;
  if (pod.shipperPhone) { lbl('Tel:', M + 2, cy); val(pod.shipperPhone, M + 12, cy, 7.5); }

  sectionHead('Destinataire (Consignee)', M + halfW, y, halfW);
  cy = y + 8;
  valBold(pod.consigneeName || '', M + halfW + 2, cy, 9);
  cy += 4;
  val(pod.consigneeAddress || '', M + halfW + 2, cy, 7.5);
  cy += 3.5;
  val(`${pod.consigneeCity || ''}, ${pod.consigneeProvince || ''}`, M + halfW + 2, cy, 7.5);
  cy += 3.5;
  if (pod.consigneePhone) { lbl('Tel:', M + halfW + 2, cy); val(pod.consigneePhone, M + halfW + 12, cy, 7.5); }

  y += addrH + 1;

  // ══════════════════════════════════════════════
  // 4. REFERENCES
  // ══════════════════════════════════════════════
  const refH = 8;
  rect(M, y, IW, refH, true);
  const refW = IW / 3;
  lbl('Ref. Client (P.O.):', M + 2, y + 5); val(pod.customerPO || '', M + 32, y + 5, 8);
  doc.setLineWidth(0.15); doc.line(M + refW, y, M + refW, y + refH);
  lbl('N° Reference:', M + refW + 2, y + 5); val(pod.referenceNumber || pod.bolNumber || '', M + refW + 25, y + 5, 8);
  doc.line(M + refW * 2, y, M + refW * 2, y + refH);
  lbl('N° Commande:', M + refW * 2 + 2, y + 5); val(pod.orderNumber || '', M + refW * 2 + 27, y + 5, 8);

  y += refH + 1;

  // ══════════════════════════════════════════════
  // 5. TABLEAU DES ARTICLES
  // ══════════════════════════════════════════════
  sectionHead('Description des marchandises, marques speciales et exceptions', M, y, IW);
  y += 6;

  // Table header
  const cols = [
    { label: 'Nb\nColis', w: 16 },
    { label: 'Description des articles / Marchandises', w: 72 },
    { label: 'Marques\nspeciales', w: 26 },
    { label: 'Poids Net\n(kg)', w: 22 },
    { label: 'Poids Brut\n(kg)', w: 24 },
    { label: 'Tarif\n(CDF)', w: 26 },
  ];

  fillRect(M, y, IW, 8, 220, 225, 230);
  rect(M, y, IW, 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  let cx = M;
  cols.forEach((col, i) => {
    if (i > 0) { doc.setLineWidth(0.15); doc.line(cx, y, cx, y + 8); }
    const lines = col.label.split('\n');
    lines.forEach((line, li) => {
      doc.text(line, cx + col.w / 2, y + 3 + li * 3, { align: 'center' });
    });
    cx += col.w;
  });
  y += 8;

  // Table rows
  const rH = 7;
  const items = pod.items || [];

  // Au minimum 5 lignes
  const rowCount = Math.max(5, items.length);
  for (let i = 0; i < rowCount; i++) {
    if (y > 255) {
      doc.addPage();
      y = M;
    }

    rect(M, y, IW, rH);
    cx = M;
    const item = items[i];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);

    const vals = item ? [
      String(item.quantity || ''),
      item.description || '',
      item.specialMarks || '',
      item.weight ? fmtPrice(item.weight) : '',
      item.grossWeight ? fmtPrice(item.grossWeight) : '',
      item.rate ? fmtPrice(item.rate) : '',
    ] : ['', '', '', '', '', ''];

    cols.forEach((col, ci) => {
      if (ci > 0) { doc.setLineWidth(0.15); doc.line(cx, y, cx, y + rH); }
      doc.text(vals[ci].substring(0, 40), cx + 2, y + rH / 2 + 1, { maxWidth: col.w - 4 });
      cx += col.w;
    });

    y += rH;
  }

  // Total row
  fillRect(M, y, IW, rH, 235, 240, 245);
  rect(M, y, IW, rH, true);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('POIDS TOTAL', M + 4, y + rH / 2 + 1);
  const totalKg = pod.totalWeight || items.reduce((s, i) => s + (i.weight || 0), 0);
  const totalGross = items.reduce((s, i) => s + (i.grossWeight || 0), 0);
  doc.text(`${fmtPrice(totalKg)} kg`, M + 16 + 72 + 26 + 2, y + rH / 2 + 1);
  if (totalGross > 0) doc.text(`${fmtPrice(totalGross)} kg`, M + 16 + 72 + 26 + 22 + 2, y + rH / 2 + 1);

  // Symbol CDF a droite
  fillRect(M + IW - 14, y - rH * rowCount - 8, 14, rH * rowCount + rH + 8, 0, 60, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.text('CDF', M + IW - 7, y - rH * (rowCount / 2) + 2, { align: 'center' });
  doc.setTextColor(0);

  y += rH + 2;

  // ══════════════════════════════════════════════
  // 6. ETAT DE LA MARCHANDISE (specifique POD)
  // ══════════════════════════════════════════════
  const condH = 16;
  rect(M, y, IW, condH, true);
  sectionHead('Etat de la marchandise a la livraison', M, y, IW);

  cy = y + 8;
  const conditions = [
    { key: 'good', label: 'Bon etat', emoji: '✓' },
    { key: 'damaged', label: 'Endommage', emoji: '✗' },
    { key: 'partial', label: 'Partiel', emoji: '~' },
  ];

  let condX = M + 4;
  conditions.forEach(c => {
    const isSelected = pod.condition === c.key;
    // Checkbox
    rect(condX, cy - 2.5, 4, 4);
    if (isSelected) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(c.emoji, condX + 0.5, cy + 0.5);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(c.label, condX + 6, cy);
    condX += 40;
  });

  // Notes condition
  if (pod.conditionNotes) {
    cy += 5;
    lbl('Notes:', M + 4, cy);
    val(pod.conditionNotes, M + 18, cy, 7.5, IW - 22);
  }

  y += condH + 1;

  // ══════════════════════════════════════════════
  // 7. CHARGES ET PAIEMENT
  // ══════════════════════════════════════════════
  const chargeH = 18;
  rect(M, y, halfW, chargeH, true);
  rect(M + halfW, y, halfW, chargeH, true);

  // Gauche: mentions legales
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(5.5);
  doc.setTextColor(80);
  const legalText = 'Conformement a l\'article 7 des conditions applicables du bordereau de chargement, le transporteur ne fera pas la livraison sans paiement integral des frais de transport et de tous les autres frais legaux. La limitation de responsabilite pour perte ou dommage peut etre applicable. TOUT LITIGE DOIT ETRE SIGNALE DANS LES 30 JOURS SUIVANT LA DATE DE LIVRAISON.';
  doc.text(legalText, M + 2, y + 4, { maxWidth: halfW - 4 });
  doc.setTextColor(0);

  // Droite: charges
  sectionHead('Charges', M + halfW, y, halfW);
  cy = y + 8;
  lbl('Fret:', M + halfW + 2, cy); valBold(pod.freightCharges ? `${fmtPrice(pod.freightCharges)} CDF` : '_______ CDF', M + halfW + 25, cy);
  cy += 4.5;
  lbl('Avances:', M + halfW + 2, cy); val(pod.advancedCharges ? `${fmtPrice(pod.advancedCharges)} CDF` : '0 CDF', M + halfW + 25, cy);
  cy += 4.5;
  lbl('Modalites:', M + halfW + 2, cy); val(pod.paymentTerms || 'Prepaye', M + halfW + 25, cy);

  y += chargeH + 1;

  // ══════════════════════════════════════════════
  // 8. RECEPTION CONFIRMEE (FR + EN sur deux lignes — evite superposition et doublons)
  // ══════════════════════════════════════════════
  const receptionBannerH = 9;
  fillRect(M, y, IW, receptionBannerH, 0, 60, 120);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.text('RECU EN BON ETAT SAUF MENTION CONTRAIRE', W / 2, y + 3.3, { align: 'center' });
  doc.setFontSize(6.5);
  doc.text('RECEIVED IN GOOD CONDITION EXCEPT AS NOTED', W / 2, y + 6.5, { align: 'center' });
  doc.setTextColor(0);
  y += receptionBannerH + 1;

  // ══════════════════════════════════════════════
  // 9. SIGNATURES - 2 colonnes
  // ══════════════════════════════════════════════
  const sigH = 22;
  rect(M, y, halfW, sigH, true);
  rect(M + halfW, y, halfW, sigH, true);

  // Gauche: Signature chauffeur
  lbl('Chauffeur:', M + 2, y + 4);
  valBold(pod.driverName || '', M + 22, y + 4, 9);
  hline(M + 4, y + 14, M + halfW - 4);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(120);
  doc.text('Signature Chauffeur', M + 4, y + 18);
  doc.setTextColor(0);

  lbl('Date:', M + halfW - 35, y + 18);
  val(fmtDate(pod.deliveryDate) || '___/___/______', M + halfW - 23, y + 18, 7.5);

  // Signature chauffeur (image PNG data URL)
  const driverSig = pod.driverSignature as string | undefined;
  if (driverSig && isDataUrlImage(driverSig)) {
    try {
      doc.addImage(driverSig, 'PNG', M + 5, y + 7, halfW - 12, 6);
    } catch {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(0, 100, 0);
      doc.text('[Signature image — erreur rendu]', M + halfW / 2, y + 11, { align: 'center' });
      doc.setTextColor(0);
    }
  } else if (driverSig && !driverSig.startsWith('data:')) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text(driverSig.slice(0, 80), M + halfW / 2, y + 11, { align: 'center', maxWidth: halfW - 8 });
  }

  // Droite: Signature destinataire / recepteur
  lbl('Destinataire:', M + halfW + 2, y + 4);
  valBold(pod.receiverName || pod.consigneeName || '', M + halfW + 25, y + 4, 9);
  hline(M + halfW + 4, y + 14, M + IW - 4);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(6);
  doc.setTextColor(120);
  doc.text('Signature Destinataire', M + halfW + 4, y + 18);
  doc.setTextColor(0);

  lbl('Date:', M + IW - 35, y + 18);
  val(fmtDate(pod.deliveryDate) || '___/___/______', M + IW - 23, y + 18, 7.5);

  // Signature destinataire : image PNG du canvas
  const recvSig = pod.receiverSignature as string | undefined;
  if (recvSig && isDataUrlImage(recvSig)) {
    try {
      doc.addImage(recvSig, 'PNG', M + halfW + 5, y + 7, halfW - 12, 6);
    } catch {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(180, 0, 0);
      doc.text('[Signature — erreur rendu PDF]', M + halfW + halfW / 2, y + 11, { align: 'center' });
      doc.setTextColor(0);
    }
  } else if (recvSig && !recvSig.startsWith('data:')) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.text(recvSig.slice(0, 80), M + halfW + halfW / 2, y + 11, { align: 'center', maxWidth: halfW - 8 });
  }

  y += sigH + 2;

  // ══════════════════════════════════════════════
  // 10. NOTES SUPPLEMENTAIRES
  // ══════════════════════════════════════════════
  if (pod.notes) {
    rect(M, y, IW, 14);
    lbl('Notes supplementaires:', M + 2, y + 4);
    val(pod.notes, M + 2, y + 8, 7.5, IW - 4);
    y += 16;
  }

  // ══════════════════════════════════════════════
  // 11. FOOTER
  // ══════════════════════════════════════════════
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Ligne de separation
    doc.setDrawColor(0, 60, 120);
    doc.setLineWidth(0.5);
    doc.line(M, 286, M + IW, 286);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(100);
    doc.text(
      `Nzela - Plateforme de Logistique RDC  |  POD ${pod.controlNumber || pod.loadId?.substring(0, 8).toUpperCase() || ''}  |  Page ${i}/${pageCount}`,
      W / 2, 290, { align: 'center' }
    );
    doc.setTextColor(0);
  }

  return doc;
}

// ══════════════════════════════════════════
// EXPORT HELPERS
// ══════════════════════════════════════════
export function downloadPODPDF(pod: PODData) {
  const doc = generatePODPDF(pod);
  const num = pod.controlNumber || pod.loadId?.substring(0, 8).toUpperCase() || 'POD';
  doc.save(`POD-${num}.pdf`);
}

export function printPODPDF(pod: PODData) {
  const doc = generatePODPDF(pod);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
