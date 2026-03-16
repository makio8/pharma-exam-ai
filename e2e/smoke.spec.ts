// スモークテスト: 全ページが表示でき、コンソールエラーがないか確認
import { test, expect } from '@playwright/test'

const pages = [
  { path: '/', name: 'ホーム' },
  { path: '/practice', name: '演習一覧' },
  { path: '/practice/q001', name: '問題ページ(q001)' },
  { path: '/notes', name: '付箋一覧' },
  { path: '/analysis', name: '分析' },
]

for (const { path, name } of pages) {
  test(`${name} (${path}) が読み込める`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    page.on('console', (msg) => {
      // antd の非推奨警告は無視（コード品質の問題であり動作エラーではない）
      if (msg.type() === 'error' && !msg.text().includes('[antd:')) {
        errors.push(msg.text())
      }
    })

    await page.goto(path)
    await page.waitForLoadState('networkidle')

    // ページが真っ白でないことを確認
    const body = await page.textContent('body')
    expect(body).not.toBe('')

    // コンソールエラーがないことを確認
    expect(errors).toHaveLength(0)
  })
}

test('問題(q001)に回答できる', async ({ page }) => {
  await page.goto('/practice/q001')
  await page.waitForLoadState('networkidle')

  // 選択肢1をクリック
  await page.locator('.ant-radio').first().click()

  // 回答ボタンをクリック
  await page.getByRole('button', { name: '回答する' }).click()

  // 正誤フィードバックが表示される（正解 or 不正解）
  const alert = page.locator('.ant-alert')
  await expect(alert).toBeVisible()
  const text = await alert.textContent()
  expect(text).toMatch(/正解|不正解/)
})

test('演習一覧から演習開始できる', async ({ page }) => {
  await page.goto('/practice')
  await page.waitForLoadState('networkidle')

  // 問題リストが表示される（List廃止→独自実装のため「解く」ボタンで確認）
  const solveBtn = page.getByRole('button', { name: '解く' }).first()
  await expect(solveBtn).toBeVisible()

  // 「演習開始」ボタンが表示される
  const startBtn = page.getByRole('button', { name: /演習開始/ })
  await expect(startBtn).toBeVisible()
})
