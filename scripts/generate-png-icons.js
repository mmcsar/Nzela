/**
 * Generate PWA PNG icons from SVGs using Sharp (bundled with Next.js)
 * Run: node scripts/generate-png-icons.js
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');
const SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log('🎨 Generating Nzela PWA PNG icons with Sharp...\n');

  for (const size of SIZES) {
    const svgPath = path.join(ICONS_DIR, `icon-${size}x${size}.svg`);
    const pngPath = path.join(ICONS_DIR, `icon-${size}x${size}.png`);

    if (!fs.existsSync(svgPath)) {
      console.log(`⚠ SVG not found: ${svgPath}, skipping`);
      continue;
    }

    await sharp(svgPath)
      .resize(size, size)
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(pngPath);

    const stats = fs.statSync(pngPath);
    console.log(`✓ icon-${size}x${size}.png (${(stats.size / 1024).toFixed(1)} KB)`);
  }

  // Apple touch icon (180x180)
  const apple180 = path.join(ICONS_DIR, 'apple-touch-icon.svg');
  if (fs.existsSync(apple180)) {
    await sharp(apple180)
      .resize(180, 180)
      .png({ quality: 100 })
      .toFile(path.join(ICONS_DIR, 'apple-touch-icon.png'));
    console.log('✓ apple-touch-icon.png (180x180)');
  }

  // Favicon 32x32
  const favicon = path.join(ICONS_DIR, '..', 'favicon.svg');
  if (fs.existsSync(favicon)) {
    await sharp(favicon)
      .resize(32, 32)
      .png()
      .toFile(path.join(ICONS_DIR, '..', 'favicon.png'));
    console.log('✓ favicon.png (32x32)');

    // Also generate ICO-compatible 16x16 and 32x32
    await sharp(favicon)
      .resize(16, 16)
      .png()
      .toFile(path.join(ICONS_DIR, '..', 'favicon-16x16.png'));
    console.log('✓ favicon-16x16.png');

    await sharp(favicon)
      .resize(32, 32)
      .png()
      .toFile(path.join(ICONS_DIR, '..', 'favicon-32x32.png'));
    console.log('✓ favicon-32x32.png');
  }

  console.log('\n✅ All PNG icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
