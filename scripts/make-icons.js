// One-off: crop the brain-network icon out of public/logo.png (a wide
// lockup) into square app icons / favicons. Run: node scripts/make-icons.js
const path = require('path');
const Jimp = require('jimp');

const SRC = path.resolve(__dirname, '../public/logo.png');
const OUT = path.resolve(__dirname, '../public');

(async () => {
  const img = await Jimp.read(SRC);
  const W = img.bitmap.width;
  const H = img.bitmap.height;

  // The icon sits on the left of the lockup. Crop a square around it.
  const side = Math.round(H * 0.60);
  const cx = Math.round(W * 0.285);
  const cy = Math.round(H * 0.52);
  let x = Math.max(0, Math.round(cx - side / 2));
  let y = Math.max(0, Math.round(cy - side / 2));
  if (x + side > W) x = W - side;
  if (y + side > H) y = H - side;

  const icon = img.clone().crop(x, y, side, side);

  await icon.clone().resize(512, 512).writeAsync(path.join(OUT, 'logo512.png'));
  await icon.clone().resize(192, 192).writeAsync(path.join(OUT, 'logo192.png'));
  await icon.clone().resize(64, 64).writeAsync(path.join(OUT, 'favicon-64.png'));
  await icon.clone().resize(32, 32).writeAsync(path.join(OUT, 'favicon-32.png'));

  // Tight horizontal lockup for the navbar/footer — trim the uniform
  // cream border so the logo isn't tiny when scaled to nav height.
  const lockup = img.clone().autocrop(0.02);
  await lockup.writeAsync(path.join(OUT, 'logo-lockup.png'));

  console.log(`source ${W}x${H} — icon square ${side}px at (${x}, ${y})`);
  console.log(`lockup ${lockup.bitmap.width}x${lockup.bitmap.height}`);
  console.log('wrote logo512, logo192, favicon-64, favicon-32, logo-lockup');
})().catch((e) => { console.error(e); process.exit(1); });
