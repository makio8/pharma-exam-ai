import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = '/Users/ai/Library/CloudStorage/GoogleDrive-yaku.goro@gmail.com/マイドライブ/pharma-exam-ai/design-mockups';

const pages = [
  {
    file: '01-practice-page-full.html',
    output: '01_演習ページ_リデザイン案.png',
    width: 390,
    height: 1600,
  },
  {
    file: '02-bottom-sheet-filter.html',
    output: '02_ボトムシート_詳細フィルター.png',
    width: 390,
    height: 844,
  },
  {
    file: '03-comparison-before-after.html',
    output: '03_Before_After_比較.png',
    width: 840,
    height: 1200,
  },
];

async function main() {
  const browser = await chromium.launch();

  for (const page of pages) {
    const context = await browser.newContext({
      viewport: { width: page.width, height: page.height },
      deviceScaleFactor: 2,
    });
    const p = await context.newPage();
    const filePath = join(__dirname, page.file);
    await p.goto(`file://${filePath}`, { waitUntil: 'networkidle' });
    // Wait for fonts to load
    await p.waitForTimeout(2000);
    await p.screenshot({
      path: join(outputDir, page.output),
      fullPage: true,
    });
    console.log(`✅ ${page.output}`);
    await context.close();
  }

  await browser.close();
  console.log(`\n📁 保存先: ${outputDir}`);
}

main().catch(console.error);
