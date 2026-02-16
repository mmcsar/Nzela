/**
 * Script to generate PWA icons for Nzela
 * Uses pure SVG to create professional icons at all required sizes
 * Run: node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

// Nzela brand colors
const BRAND = {
  primary: '#059669',    // emerald-600
  primaryDark: '#047857', // emerald-700
  accent: '#10b981',     // emerald-500
  white: '#ffffff',
};

// All sizes needed for PWA + Apple
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

function generateSVG(size) {
  const padding = Math.round(size * 0.12);
  const innerSize = size - padding * 2;
  const cornerRadius = Math.round(size * 0.18);
  
  // Letter sizing
  const fontSize = Math.round(size * 0.42);
  const subFontSize = Math.round(size * 0.10);
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Road/path icon element
  const roadWidth = Math.round(size * 0.06);
  const roadY = centerY + fontSize * 0.32;
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${BRAND.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${BRAND.primaryDark};stop-opacity:1" />
    </linearGradient>
    <linearGradient id="shine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${BRAND.white};stop-opacity:0.15" />
      <stop offset="50%" style="stop-color:${BRAND.white};stop-opacity:0" />
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="url(#bg)" />
  
  <!-- Subtle shine overlay -->
  <rect width="${size}" height="${size}" rx="${cornerRadius}" fill="url(#shine)" />
  
  <!-- Main letter N -->
  <text x="${centerX}" y="${centerY + fontSize * 0.12}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${fontSize}" 
        font-weight="900" 
        fill="${BRAND.white}" 
        text-anchor="middle" 
        dominant-baseline="middle"
        letter-spacing="-${Math.round(size * 0.01)}">N</text>
  
  <!-- Road line under letter -->
  <line x1="${centerX - innerSize * 0.25}" y1="${roadY}" 
        x2="${centerX + innerSize * 0.25}" y2="${roadY}" 
        stroke="${BRAND.accent}" 
        stroke-width="${roadWidth}" 
        stroke-linecap="round" 
        opacity="0.9"/>
  
  <!-- Small dashes on road -->
  <line x1="${centerX - innerSize * 0.08}" y1="${roadY}" 
        x2="${centerX + innerSize * 0.08}" y2="${roadY}" 
        stroke="${BRAND.white}" 
        stroke-width="${Math.max(1, Math.round(roadWidth * 0.4))}" 
        stroke-linecap="round"
        stroke-dasharray="${Math.round(size * 0.03)} ${Math.round(size * 0.02)}"
        opacity="0.7"/>
  
  ${size >= 128 ? `
  <!-- "NZELA" text below road for larger icons -->
  <text x="${centerX}" y="${roadY + subFontSize * 1.8}" 
        font-family="Arial, Helvetica, sans-serif" 
        font-size="${subFontSize}" 
        font-weight="700" 
        fill="${BRAND.white}" 
        text-anchor="middle" 
        opacity="0.8"
        letter-spacing="${Math.round(size * 0.02)}">NZELA</text>
  ` : ''}
</svg>`;
}

// Ensure directory exists
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Generate SVG files (browsers and PWA support SVG icons now)
// But for maximum compatibility, we also need PNG
// Since we can't generate PNG natively in Node without deps,
// we'll create SVGs and a helper HTML to convert them

SIZES.forEach(size => {
  const svg = generateSVG(size);
  const svgPath = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
  fs.writeFileSync(svgPath, svg);
  console.log(`✓ Generated icon-${size}x${size}.svg`);
});

// Also generate a favicon.svg  
const faviconSvg = generateSVG(32);
fs.writeFileSync(path.join(ICONS_DIR, '..', 'favicon.svg'), faviconSvg);
console.log('✓ Generated favicon.svg');

// Generate apple-touch-icon as SVG too
const appleSvg = generateSVG(180);
fs.writeFileSync(path.join(ICONS_DIR, 'apple-touch-icon.svg'), appleSvg);
console.log('✓ Generated apple-touch-icon.svg');

// Generate a converter HTML page users can open to download PNGs
const converterHTML = `<!DOCTYPE html>
<html><head><title>Nzela Icon Converter</title></head>
<body style="font-family:sans-serif;padding:40px;background:#f5f5f5">
<h1>Nzela PWA Icon Generator</h1>
<p>Click the button to generate and download all PNG icons.</p>
<button id="gen" style="padding:12px 24px;font-size:16px;background:#059669;color:white;border:none;border-radius:8px;cursor:pointer">Generate PNG Icons</button>
<div id="status" style="margin-top:20px"></div>
<script>
const sizes = [${SIZES.join(',')}];
document.getElementById('gen').onclick = async () => {
  const status = document.getElementById('status');
  for (const size of sizes) {
    const resp = await fetch('/icons/icon-' + size + 'x' + size + '.svg');
    const svgText = await resp.text();
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const blob = new Blob([svgText], {type:'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    await new Promise(r => { img.onload = r; img.src = url; });
    ctx.drawImage(img, 0, 0, size, size);
    const link = document.createElement('a');
    link.download = 'icon-' + size + 'x' + size + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    status.innerHTML += '<p>✓ icon-' + size + 'x' + size + '.png</p>';
    URL.revokeObjectURL(url);
  }
  // Apple touch icon
  {
    const resp = await fetch('/icons/apple-touch-icon.svg');
    const svgText = await resp.text();
    const canvas = document.createElement('canvas');
    canvas.width = 180; canvas.height = 180;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const blob = new Blob([svgText], {type:'image/svg+xml'});
    const url = URL.createObjectURL(blob);
    await new Promise(r => { img.onload = r; img.src = url; });
    ctx.drawImage(img, 0, 0, 180, 180);
    const link = document.createElement('a');
    link.download = 'apple-touch-icon.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    status.innerHTML += '<p>✓ apple-touch-icon.png</p>';
  }
  status.innerHTML += '<p style="color:#059669;font-weight:bold">Done! Place the downloaded PNGs in public/icons/</p>';
};
</script>
</body></html>`;
fs.writeFileSync(path.join(ICONS_DIR, 'converter.html'), converterHTML);
console.log('✓ Generated converter.html (open in browser to create PNGs)');

console.log('\n✅ All SVG icons generated!');
console.log('📌 For PNG versions: open http://localhost:3000/icons/converter.html in your browser');
console.log('   OR deploy the app and the SVGs will work directly as PWA icons\n');
