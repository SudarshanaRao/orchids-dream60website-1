# Dream60 PWA Setup Guide

This document explains how to complete the PWA setup, test it, and deploy it.

## Quick Start

### 1. Generate PWA Icons

The PWA requires PNG icons at multiple sizes. Use one of these methods:

**Option A: Online Generator (Recommended)**
1. Go to [RealFaviconGenerator](https://realfavicongenerator.net/)
2. Upload `public/logo.svg`
3. Configure settings (use theme color `#6B3FA0`)
4. Download and extract to `public/icons/`

**Option B: Using Sharp (Node.js)**
```bash
npm install sharp --save-dev
node scripts/generate-pwa-icons-sharp.js
```

**Option C: Using ImageMagick**
```bash
# Install ImageMagick first, then:
for size in 16 32 48 57 60 72 76 96 114 120 128 144 152 180 192 256 384 512; do
  convert -background none -resize ${size}x${size} public/logo.svg public/icons/icon-${size}x${size}.png
done
```

### 2. Required Icon Files

Place these files in `public/icons/`:

**Standard Icons:**
- `icon-72x72.png`
- `icon-96x96.png`
- `icon-128x128.png`
- `icon-152x152.png`
- `icon-192x192.png`
- `icon-256x256.png`
- `icon-384x384.png`
- `icon-512x512.png`

**Maskable Icons (for Android adaptive icons):**
- `icon-maskable-192x192.png`
- `icon-maskable-512x512.png`

**Apple Touch Icons:**
- `apple-touch-icon.png` (180x180)
- `apple-touch-icon-57x57.png`
- `apple-touch-icon-60x60.png`
- `apple-touch-icon-72x72.png`
- `apple-touch-icon-76x76.png`
- `apple-touch-icon-114x114.png`
- `apple-touch-icon-120x120.png`
- `apple-touch-icon-144x144.png`
- `apple-touch-icon-152x152.png`
- `apple-touch-icon-180x180.png`

**Favicon:**
- `icon-16x16.png`
- `icon-32x32.png`
- `icon-48x48.png`

**iOS Splash Screens (Optional but recommended):**
- `splash-1125x2436.png` (iPhone X/XS/11 Pro)
- `splash-828x1792.png` (iPhone XR/11)
- `splash-1242x2688.png` (iPhone XS Max/11 Pro Max)
- `splash-750x1334.png` (iPhone 8/7/6s/6)
- `splash-1242x2208.png` (iPhone 8 Plus/7 Plus/6s Plus/6 Plus)
- `splash-2048x2732.png` (iPad Pro 12.9")
- `splash-1668x2388.png` (iPad Pro 11")
- `splash-1668x2224.png` (iPad Pro 10.5")
- `splash-1536x2048.png` (iPad Mini/Air)

## Serving Over HTTPS

PWA features require HTTPS. Options:

### Local Development
```bash
# Using mkcert for local HTTPS
mkcert -install
mkcert localhost 127.0.0.1 ::1
# Configure Vite to use the certificates
```

### Production
- Deploy to any HTTPS-enabled host (Vercel, Netlify, AWS, etc.)
- The service worker will only activate on HTTPS

## Running Lighthouse Audit

### Chrome DevTools
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select categories: Performance, Accessibility, Best Practices, SEO, PWA
4. Click "Analyze page load"

### CLI
```bash
npm install -g lighthouse
lighthouse https://your-domain.com --view
```

### Key Metrics to Check
- **PWA**: Installable, Works offline, Has manifest
- **Performance**: First Contentful Paint, Largest Contentful Paint
- **Accessibility**: Color contrast, ARIA labels
- **Best Practices**: HTTPS, No console errors
- **SEO**: Meta description, Valid robots.txt

## Testing "Add to Home Screen"

### Android (Chrome)
1. Open site in Chrome
2. Wait for install prompt OR tap menu (⋮) > "Install app" / "Add to Home screen"
3. Confirm installation
4. App appears on home screen with custom icon

### iOS (Safari)
1. Open site in Safari
2. Tap Share button (□↑)
3. Scroll down, tap "Add to Home Screen"
4. Edit name if desired, tap "Add"
5. App appears on home screen

### Desktop (Chrome/Edge)
1. Open site in Chrome/Edge
2. Look for install icon in address bar (⊕)
3. Click "Install"
4. App opens in standalone window

## Testing Offline Mode

1. Open Chrome DevTools
2. Go to "Application" tab > "Service Workers"
3. Check "Offline" checkbox
4. Refresh the page
5. Should see the offline page with retry button

## Troubleshooting

### Service Worker Not Registering
- Ensure HTTPS is used
- Check console for errors
- Clear site data and reload

### Install Prompt Not Showing
- Verify manifest.json is valid: https://manifest-validator.appspot.com/
- Check all required icons are present
- Ensure start_url is accessible

### iOS Issues
- Safari doesn't support service workers in WebView
- Splash screens require exact dimensions
- apple-touch-icon must be PNG (not SVG)

### Manifest Validation
```bash
# Use Chrome DevTools
Application > Manifest > Check for errors
```

## Files Created

| File | Purpose |
|------|---------|
| `public/manifest.json` | PWA manifest with app metadata and icons |
| `public/service-worker.js` | Caching strategies for offline support |
| `public/logo.svg` | Base logo file |
| `public/offline.html` | Offline fallback page |
| `public/browserconfig.xml` | Windows tile configuration |
| `index.html` | Updated with PWA meta tags |

## Service Worker Caching Strategy

| Resource Type | Strategy | Cache Duration |
|--------------|----------|----------------|
| Static assets (JS/CSS) | Stale-while-revalidate | 30 days |
| Images | Cache-first | 7 days |
| API calls | Network-first with timeout | 5 minutes |
| Navigation | Network-first, offline fallback | - |

## Performance Optimization Tips

1. **Images**: Use WebP format, lazy loading
2. **Fonts**: Preload critical fonts, use font-display: swap
3. **JavaScript**: Code splitting, tree shaking
4. **CSS**: Purge unused styles, critical CSS inline
5. **Caching**: Configure proper cache headers on server

## Security Headers (for deployment)

Add these headers to your server configuration:

```
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
```
