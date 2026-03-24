import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = '/Users/ai/Library/CloudStorage/GoogleDrive-yaku.goro@gmail.com/マイドライブ/pharma-exam-ai/design-mockups/v2';

const pages = [
  { file: 'variation-a-dark-medical.html', output: 'DesignA_Refined_Medical.png', width: 390, height: 1200 },
  { file: 'variation-b-soft-companion.html', output: 'DesignB_Soft_Companion.png', width: 390, height: 1200 },
  { file: 'variation-c-bold-minimal.html', output: 'DesignC_Bold_Minimal.png', width: 390, height: 1200 },
];

async function main() {
  const browser = await chromium.launch();
  for (const page of pages) {
    const ctx = await browser.newContext({ viewport: { width: page.width, height: page.height }, deviceScaleFactor: 2 });
    const p = await ctx.newPage();
    await p.goto(`file://${join(__dirname, page.file)}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(2000);
    await p.screenshot({ path: join(outputDir, page.output), fullPage: true });
    console.log(`✅ ${page.output}`);
    await ctx.close();
  }
  await browser.close();
}
main().catch(console.error);
