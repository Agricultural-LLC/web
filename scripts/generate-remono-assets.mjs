import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const sourceSvgPath = path.join(root, "public", "logo.svg");
const publicDir = path.join(root, "public");
const faviconDir = path.join(publicDir, "favicon");
const ogDir = path.join(publicDir, "og");
const srcAssetsDir = path.join(root, "src", "assets");

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const white = { r: 255, g: 255, b: 255, alpha: 1 };

const svg = await readFile(sourceSvgPath);
await mkdir(faviconDir, { recursive: true });
await mkdir(ogDir, { recursive: true });

async function squareLogo(
  size,
  { background = transparent, padding = 0.08 } = {},
) {
  const innerSize = Math.round(size * (1 - padding * 2));
  const logo = await sharp(svg)
    .resize(innerSize, innerSize, {
      fit: "contain",
      background: transparent,
    })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background,
    },
  })
    .composite([{ input: logo, gravity: "center" }])
    .png()
    .toBuffer();
}

async function writeSquareLogo(filePath, size, options) {
  await writeFile(filePath, await squareLogo(size, options));
}

function icoDimension(size) {
  return size >= 256 ? 0 : size;
}

function makeIco(images) {
  const headerSize = 6;
  const entrySize = 16;
  const directorySize = headerSize + images.length * entrySize;
  const imageBytes = images.reduce(
    (total, image) => total + image.buffer.length,
    0,
  );
  const ico = Buffer.alloc(directorySize + imageBytes);

  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(images.length, 4);

  let imageOffset = directorySize;
  images.forEach((image, index) => {
    const entryOffset = headerSize + index * entrySize;
    ico.writeUInt8(icoDimension(image.width), entryOffset);
    ico.writeUInt8(icoDimension(image.height), entryOffset + 1);
    ico.writeUInt8(0, entryOffset + 2);
    ico.writeUInt8(0, entryOffset + 3);
    ico.writeUInt16LE(1, entryOffset + 4);
    ico.writeUInt16LE(32, entryOffset + 6);
    ico.writeUInt32LE(image.buffer.length, entryOffset + 8);
    ico.writeUInt32LE(imageOffset, entryOffset + 12);
    image.buffer.copy(ico, imageOffset);
    imageOffset += image.buffer.length;
  });

  return ico;
}

await writeSquareLogo(path.join(srcAssetsDir, "logo.png"), 1024, {
  padding: 0.07,
});
await writeSquareLogo(path.join(publicDir, "logo.png"), 512, {
  padding: 0.07,
});

const favicon16 = await squareLogo(16, { padding: 0.16 });
const favicon32 = await squareLogo(32, { padding: 0.16 });
const favicon48 = await squareLogo(48, { padding: 0.16 });
await writeFile(path.join(faviconDir, "favicon-16x16.png"), favicon16);
await writeFile(path.join(faviconDir, "favicon-32x32.png"), favicon32);
await writeFile(
  path.join(faviconDir, "favicon.ico"),
  makeIco([
    { width: 16, height: 16, buffer: favicon16 },
    { width: 32, height: 32, buffer: favicon32 },
    { width: 48, height: 48, buffer: favicon48 },
  ]),
);

await writeSquareLogo(path.join(faviconDir, "apple-touch-icon.png"), 180, {
  background: white,
  padding: 0.12,
});
await writeSquareLogo(
  path.join(faviconDir, "android-chrome-192x192.png"),
  192,
  {
    padding: 0.1,
  },
);
await writeSquareLogo(
  path.join(faviconDir, "android-chrome-512x512.png"),
  512,
  {
    padding: 0.1,
  },
);
await writeSquareLogo(path.join(faviconDir, "maskable-icon-192x192.png"), 192, {
  background: white,
  padding: 0.18,
});
await writeSquareLogo(path.join(faviconDir, "maskable-icon-512x512.png"), 512, {
  background: white,
  padding: 0.18,
});

const ogLogo = await sharp(svg)
  .resize(420, 540, {
    fit: "contain",
    background: transparent,
  })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: white,
  },
})
  .composite([{ input: ogLogo, gravity: "center" }])
  .png()
  .toFile(path.join(ogDir, "default.png"));
