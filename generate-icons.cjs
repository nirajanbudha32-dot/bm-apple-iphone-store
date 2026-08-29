const sharp = require('sharp');
const path = require('path');

async function generate() {
  const input = path.join(__dirname, 'public', 'bm-logo.jpeg');

  await sharp(input)
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(path.join(__dirname, 'public', 'icon-192.png'));

  await sharp(input)
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 1 } })
    .png()
    .toFile(path.join(__dirname, 'public', 'icon-512.png'));

  console.log('Icons generated: icon-192.png, icon-512.png');
}

generate().catch(console.error);
