// Simpel script om placeholder iconen te genereren
// Gebruik: node scripts/generate-icons.js
// Of installeer sharp: npm install sharp --save-dev

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simpele SVG template voor het icon
const iconSVG = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <rect width="512" height="512" fill="#D95829" rx="100"/>
  <text x="256" y="300" font-family="Arial, sans-serif" font-size="200" font-weight="bold" fill="white" text-anchor="middle">O</text>
</svg>
`;

// Schrijf SVG bestanden (kan later geconverteerd worden naar PNG)
const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Schrijf SVG als placeholder
fs.writeFileSync(path.join(publicDir, 'icon.svg'), iconSVG);

console.log('✅ Placeholder icon.svg aangemaakt in public folder');
console.log('');
console.log('📝 Volgende stappen:');
console.log('1. Converteer icon.svg naar PNG formaten:');
console.log('   - 192x192 pixels -> icon-192.png');
console.log('   - 512x512 pixels -> icon-512.png');
console.log('');
console.log('2. Online tools:');
console.log('   - https://cloudconvert.com/svg-to-png');
console.log('   - https://convertio.co/svg-png/');
console.log('');
console.log('3. Of gebruik ImageMagick:');
console.log('   convert -background none -resize 192x192 icon.svg icon-192.png');
console.log('   convert -background none -resize 512x512 icon.svg icon-512.png');

