const fs = require('fs');
const path = require('path');

const ICON_SIZES = [16, 32, 48, 57, 60, 72, 76, 96, 114, 120, 128, 144, 152, 180, 192, 256, 384, 512];
const APPLE_TOUCH_SIZES = [57, 60, 72, 76, 114, 120, 144, 152, 180];
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

const SVG_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#53317B"/>
      <stop offset="50%" style="stop-color:#6B3FA0"/>
      <stop offset="100%" style="stop-color:#8456BC"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#purpleGradient)"/>
  <text x="256" y="200" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">DREAM</text>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="180" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">60</text>
</svg>`;

const MASKABLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
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

function createSplashSVG(width, height) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="splashGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#53317B"/>
        <stop offset="50%" style="stop-color:#6B3FA0"/>
        <stop offset="100%" style="stop-color:#8456BC"/>
      </linearGradient>
    </defs>
    <rect width="${width}" height="${height}" fill="url(#splashGradient)"/>
    <text x="${width/2}" y="${height/2 - 40}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.15}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">DREAM</text>
    <text x="${width/2}" y="${height/2 + 80}" font-family="Arial, sans-serif" font-size="${Math.min(width, height) * 0.22}" font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="middle">60</text>
  </svg>`;
}

async function generateIcons() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  console.log('PWA Icon Generation Script');
  console.log('==========================');
  console.log('');
  console.log('To generate PNG icons from the SVG logo, you need one of these tools:');
  console.log('');
  console.log('Option 1: Use sharp (Node.js)');
  console.log('  npm install sharp');
  console.log('  Then run: node scripts/generate-pwa-icons-sharp.js');
  console.log('');
  console.log('Option 2: Use an online converter');
  console.log('  1. Go to https://realfavicongenerator.net/');
  console.log('  2. Upload public/logo.svg');
  console.log('  3. Download the generated icons');
  console.log('  4. Extract to public/icons/');
  console.log('');
  console.log('Option 3: Use ImageMagick (CLI)');
  console.log('  convert -background none -resize 512x512 public/logo.svg public/icons/icon-512x512.png');
  console.log('');
  console.log('Required icon sizes:', ICON_SIZES.join(', '));
  console.log('');
  
  fs.writeFileSync(path.join(iconsDir, '.gitkeep'), '');
  
  const svgPath = path.join(__dirname, '..', 'public', 'logo.svg');
  if (!fs.existsSync(svgPath)) {
    fs.writeFileSync(svgPath, SVG_LOGO);
    console.log('Created: public/logo.svg');
  }

  const maskablePath = path.join(iconsDir, 'maskable-icon.svg');
  fs.writeFileSync(maskablePath, MASKABLE_SVG);
  console.log('Created: public/icons/maskable-icon.svg');

  SPLASH_SCREENS.forEach(({ width, height, name }) => {
    const splashPath = path.join(iconsDir, `${name}.svg`);
    fs.writeFileSync(splashPath, createSplashSVG(width, height));
    console.log(`Created: public/icons/${name}.svg`);
  });

  console.log('');
  console.log('SVG files created. Convert them to PNG using one of the options above.');
}

generateIcons();
