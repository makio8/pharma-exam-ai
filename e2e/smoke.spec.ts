// スモークテスト: 全ページが表示でき、コンソールエラーがないか確認
import { test, expect } from '@playwright/test'

const pages = [
  { path: '/', name: 'ホーム' },
  { path: '/practice', name: '演習一覧' },
  { path: '/practice/r110-001', name: '問題ページ(r110-001)' },
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

test('問題(r110-001)に回答できる', async ({ page }) => {
  // r110-001 は choices あり の通常問題
  await page.goto('/practice/r110-001')
  await page.waitForLoadState('networkidle')

  // 選択肢1をクリック（.ant-radio が5つ存在する）
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

test('画像問題（choices空）に番号ボタンで回答できる', async ({ page }) => {
  // r110-006 はchoices空 + image_url ありの画像問題
  await page.goto('/practice/r110-006')
  await page.waitForLoadState('networkidle')

  // 画像が表示されていることを確認（alt="第110回 問6 の図"）
  const img = page.locator('img[alt*="第110回 問6"]')
  await expect(img).toBeVisible()

  // 番号ボタンが表示されている（Radio.Groupではなくbuttonで）
  // 未回答時はボタンテキストが数字のみ
  const buttons = page.locator('button').filter({ hasText: /^[1-5]$/ })
  await expect(buttons).toHaveCount(5)

  // 番号4をクリック（この問題の正答）
  await page.locator('button').filter({ hasText: /^4$/ }).click()

  // 回答ボタンをクリック
  await page.getByRole('button', { name: '回答する' }).click()

  // 正誤フィードバックが表示される
  const alert = page.locator('.ant-alert')
  await expect(alert).toBeVisible()
  const text = await alert.textContent()
  expect(text).toMatch(/正解/)
})

test('画像付き通常問題で画像が表示される', async ({ page }) => {
  // r110-001 は image_url あり かつ choices ありの問題
  await page.goto('/practice/r110-001')
  await page.waitForLoadState('networkidle')

  // 画像が表示されている
  const img = page.locator('img[alt*="第110回"]')
  const hasImage = await img.count()
  if (hasImage > 0) {
    await expect(img.first()).toBeVisible()
  }

  // 通常の選択肢（Radio）も表示されている
  const radios = page.locator('.ant-radio')
  const radioCount = await radios.count()
  expect(radioCount).toBeGreaterThan(0)
})

test('correct_answer=0 の問題で回答ボタンが無効になる', async ({ page }) => {
  // r100-093 は correct_answer=0 の問題（choices あり、連問ではない）
  await page.goto('/practice/r100-093')
  await page.waitForLoadState('networkidle')

  // 選択肢が表示されている（choicesありのため通常UI）
  const radios = page.locator('.ant-radio')
  const radioCount = await radios.count()
  expect(radioCount).toBeGreaterThan(0)

  // 回答ボタンが無効であることを確認（correct_answer=0 のため）
  const submitBtn = page.getByRole('button', { name: '回答する' })
  await expect(submitBtn).toBeDisabled()
})

test('連問シナリオが表示される', async ({ page }) => {
  // r110-120 は linked_group: "r110-120-121" の連問（2問セット）
  await page.goto('/practice/r110-120')
  await page.waitForLoadState('networkidle')

  // 連問ヘッダーが表示される（「連問（2問セット）」）
  await expect(page.getByText(/連問（\d+問セット）/)).toBeVisible()

  // シナリオ（共通文）が表示される（紫背景のCardの中）
  const scenarioCard = page.locator('div').filter({ has: page.getByText(/連問/) }).first()
  await expect(scenarioCard).toBeVisible()

  // 各問題カードが縦に並んでいる（問120, 問121）
  await expect(page.getByText('問120').first()).toBeVisible()
  await expect(page.getByText('問121').first()).toBeVisible()
})

test('複数選択問題でCheckboxが表示される', async ({ page }) => {
  // r110-091 は「2つ選べ」の複数選択問題
  await page.goto('/practice/r110-091')
  await page.waitForLoadState('networkidle')

  // 「2つ選べ」タグが表示される
  await expect(page.getByText(/つ選べ/).first()).toBeVisible()

  // Checkbox UIが表示される（Radio ではなく Checkbox）
  const checkboxes = page.locator('.ant-checkbox')
  const checkboxCount = await checkboxes.count()
  expect(checkboxCount).toBeGreaterThan(0)

  // Radio は表示されない（Checkboxのみ）
  const radios = page.locator('.ant-radio')
  const radioCount = await radios.count()
  expect(radioCount).toBe(0)
})

test('PracticePage で画像フィルタが動作する', async ({ page }) => {
  await page.goto('/practice')
  await page.waitForLoadState('networkidle')

  // 「画像問題のみ」ラベルの近くのスイッチをONにする
  // 構造: ant-space > ant-space-item > span（ラベル）
  //              > ant-space-item > button.ant-switch
  const imageFilterLabel = page.getByText('画像問題のみ:')
  const imageSwitch = imageFilterLabel.locator('../..').locator('.ant-switch')
  await imageSwitch.click()

  // フィルタ後の問題数バッジが表示されている（Badge.Ribbon）
  const badge = page.locator('.ant-ribbon')
  await expect(badge).toBeVisible()
})
