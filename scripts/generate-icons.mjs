import { chromium } from '@playwright/test';
import { readFile, mkdir } from 'node:fs/promises';
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
});
try {
  const svg = await readFile('public/icon.svg', 'utf8');
  for (const size of [192, 512]) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await page.setContent(
      `<style>body{margin:0;background:#0b1420}svg{width:100vw;height:100vh}</style>${svg}`,
    );
    await page.screenshot({ path: `public/icon-${size}.png` });
    await page.close();
  }
  const page = await browser.newPage({
    viewport: { width: 512, height: 512 },
    deviceScaleFactor: 1,
  });
  await page.setContent(
    `<style>body{margin:0;background:#0b1420;display:grid;place-items:center;height:100vh}svg{width:72vw;height:72vh}</style>${svg}`,
  );
  await page.screenshot({ path: 'public/icon-maskable.png' });
  await page.close();
  for (const [density, size] of Object.entries({
    mdpi: 48,
    hdpi: 72,
    xhdpi: 96,
    xxhdpi: 144,
    xxxhdpi: 192,
  })) {
    const folder = `android/app/src/main/res/mipmap-${density}`;
    await mkdir(folder, { recursive: true });
    const iconPage = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    await iconPage.setContent(`<style>body{margin:0}svg{width:100vw;height:100vh}</style>${svg}`);
    await iconPage.screenshot({ path: `${folder}/ic_launcher.png`, omitBackground: true });
    await iconPage.addStyleTag({ content: 'svg{clip-path:circle(49% at 50% 50%)}' });
    await iconPage.screenshot({ path: `${folder}/ic_launcher_round.png`, omitBackground: true });
    const adaptiveSize = Math.round((size / 48) * 108);
    await iconPage.setViewportSize({ width: adaptiveSize, height: adaptiveSize });
    await iconPage.setContent(
      `<style>body{margin:0;display:grid;place-items:center;height:100vh}svg{width:70vw;height:70vh}</style>${svg}`,
    );
    await iconPage.screenshot({
      path: `${folder}/ic_launcher_foreground.png`,
      omitBackground: true,
    });
    await iconPage.close();
  }
} finally {
  await browser.close();
}
