#!/usr/bin/env node
/**
 * Generates circular (transparent background) versions of all DogClaud icons.
 * Overwrites originals in assets/ and build/icons/.
 * Usage: node scripts/generate-circular-icons.js
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const BUILD_ICONS_DIR = path.join(__dirname, '..', 'build', 'icons');

async function makeCircular(inputPath) {
  const metadata = await sharp(inputPath).metadata();
  const size = Math.min(metadata.width, metadata.height);

  // Create circular mask SVG
  const r = size / 2;
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}">
       <circle cx="${r}" cy="${r}" r="${r}" fill="white"/>
     </svg>`
  );

  const result = await sharp(inputPath)
    .resize(size, size, { fit: 'cover' })
    .ensureAlpha()
    .composite([{ input: mask, blend: 'dest-in' }])
    .png()
    .toBuffer();

  await sharp(result).toFile(inputPath);
  console.log(`  -> ${path.basename(inputPath)} (${size}x${size})`);
}

async function main() {
  console.log('Generating circular icons...\n');

  // Tray color icons in assets/
  const colorIcons = ['blue', 'green', 'orange', 'red', 'yellow'];
  console.log('Tray icons (assets/):');
  for (const color of colorIcons) {
    const file = path.join(ASSETS_DIR, `dog-emoji-${color}.png`);
    if (fs.existsSync(file)) await makeCircular(file);
  }

  // Sized icons in assets/
  const sizes = [16, 32, 48, 64, 128, 256, 512];
  console.log('\nSized icons (assets/):');
  for (const size of sizes) {
    const file = path.join(ASSETS_DIR, `dog-emoji-${size}.png`);
    if (fs.existsSync(file)) await makeCircular(file);
  }

  // Build icons
  console.log('\nBuild icons (build/icons/):');
  for (const size of sizes) {
    const file = path.join(BUILD_ICONS_DIR, `${size}x${size}.png`);
    if (fs.existsSync(file)) await makeCircular(file);
  }

  // Favicon
  const favicon = path.join(ASSETS_DIR, 'favicon.png');
  if (fs.existsSync(favicon)) {
    console.log('\nFavicon:');
    await makeCircular(favicon);
  }

  console.log('\nDone!');
}

main().catch(console.error);
