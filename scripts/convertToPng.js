import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const svgPath = path.resolve('public/badge.svg');
const pngPath = path.resolve('public/badge.png');

async function convert() {
  const svgBuffer = fs.readFileSync(svgPath);
  await sharp(svgBuffer)
    .resize(96, 96)
    .png()
    .toFile(pngPath);
  console.log('Converted badge.svg to badge.png (96x96)');
}

convert().catch(console.error);
