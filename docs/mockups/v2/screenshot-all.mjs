import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = '/Users/ai/Library/CloudStorage/GoogleDrive-yaku.goro@gmail.com/マイドライブ/pharma-exam-ai/design-mockups/v2';

const pages = [
  { file: '00-screen-flow.html', output: '00_画面遷移図.png', width: 900, height: 1100 },
  { file: '01-onboarding.html', output: '01_オンボーディング.png', width: 390, height: 1400 },
  { file: '02-home.html', output: '02_ホーム画面.png', width: 390, height: 1200 },
  { file: '03-practice.html', output: '03_演習画面.png', width: 390, height: 1500 },
  { file: '04-question.html', output: '04_問題解答画面.png', width: 390, height: 1400 },
  { file: '05-notes.html', output: '05_ノートタブ.png', width: 390, height: 1300 },
  { file: '06-analysis.html', output: '06_分析画面.png', width: 390, height: 1300 },
];

async function main() {
  const browser = await chromium.launch();

  for (const page of pages) {
    const context = await browser.newContext({
      viewport: { width: page.width, height: page.height },
      deviceScaleFactor: 2,
    });
    const p = await context.newPage();
    await p.goto(`file://${join(__dirname, page.file)}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(2000);
    await p.screenshot({ path: join(outputDir, page.output), fullPage: true });
    console.log(`✅ ${page.output}`);
    await context.close();
  }

  await browser.close();
  console.log(`\n📁 保存先: ${outputDir}`);
}

main().catch(console.error);
