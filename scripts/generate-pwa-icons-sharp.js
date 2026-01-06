import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateIcons() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (e) {
    console.error('Sharp is not installed. Run: npm install sharp --save-dev');
    process.exit(1);
  }

  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  const logoPath = path.join(__dirname, '..', 'public', 'logo.svg');
  
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const ICON_SIZES = [16, 32, 48, 72, 96, 128, 152, 192, 256, 384, 512];
  const APPLE_SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 180];

  console.log('Generating PWA icons...\n');

  for (const size of ICON_SIZES) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    await sharp(logoPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Created: icon-${size}x${size}.png`);
  }

  for (const size of APPLE_SIZES) {
    const outputPath = path.join(iconsDir, `apple-touch-icon-${size}x${size}.png`);
    await sharp(logoPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Created: apple-touch-icon-${size}x${size}.png`);
  }

  const appleDefault = path.join(iconsDir, 'apple-touch-icon.png');
  await sharp(logoPath)
    .resize(180, 180)
    .png()
    .toFile(appleDefault);
  console.log('Created: apple-touch-icon.png (180x180)');

  const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
    <defs>
      <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#53317B"/>
        <stop offset="50%" style="stop-color:#6B3FA0"/>
        <stop offset="100%" style="stop-color:#8456BC"/>
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#purpleGradient)"/>
    <text x="256" y="200" font-family="Arial, sans-serif" font-size="100" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">DREAM</text>
    <text x="256" y="320" font-family="Arial, sans-serif" font-size="150" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">60</text>
  </svg>`;
  
  const maskableSvgPath = path.join(iconsDir, 'maskable-temp.svg');
  fs.writeFileSync(maskableSvgPath, maskableSvg);

  for (const size of [192, 512]) {
    const outputPath = path.join(iconsDir, `icon-maskable-${size}x${size}.png`);
    await sharp(maskableSvgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`Created: icon-maskable-${size}x${size}.png`);
  }

  fs.unlinkSync(maskableSvgPath);

  const SPLASH_SCREENS = [
    { width: 1125, height: 2436, name: 'splash-1125x2436' },
    { width: 828, height: 1792, name: 'splash-828x1792' },
    { width: 1242, height: 2688, name: 'splash-1242x2688' },
    { width: 750, height: 1334, name: 'splash-750x1334' },
    { width: 1242, height: 2208, name: 'splash-1242x2208' },
    { width: 2048, height: 2732, name: 'splash-2048x2732' },
    { width: 1668, height: 2388, name: 'splash-1668x2388' },
    { width: 1668, height: 2224, name: 'splash-1668x2224' },
    { width: 1536, height: 2048, name: 'splash-1536x2048' }
  ];

  console.log('\nGenerating splash screens...');
  
  for (const { width, height, name } of SPLASH_SCREENS) {
    const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="splashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#53317B"/>
          <stop offset="50%" style="stop-color:#6B3FA0"/>
          <stop offset="100%" style="stop-color:#8456BC"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#splashGradient)"/>
      <text x="${width/2}" y="${height/2 - 40}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.12}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">DREAM</text>
      <text x="${width/2}" y="${height/2 + 80}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.18}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">60</text>
    </svg>`;
    
    const tempPath = path.join(iconsDir, `${name}-temp.svg`);
    fs.writeFileSync(tempPath, splashSvg);
    
    const outputPath = path.join(iconsDir, `${name}.png`);
    await sharp(tempPath)
      .resize(width, height)
      .png()
      .toFile(outputPath);
    
    fs.unlinkSync(tempPath);
    console.log(`Created: ${name}.png`);
  }

  console.log('\nAll icons generated successfully!');
}

generateIcons().catch(console.error);