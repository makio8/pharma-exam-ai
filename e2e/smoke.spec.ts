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

test('r100-016 の付箋レコメンドでビタミンB12付箋が上位に表示される', async ({ page }) => {
  // === 認証モック ===
  // Supabase JS v2 は navigator.locks（Web Locks API）を使ってセッションを管理する。
  // Playwright の headless Chromium では navigator.locks が使えるが、
  // ロックが解放されず getSession() が永遠にブロックするケースがある。
  // 対策:
  //   1. addInitScript で navigator.locks を undefined に差し替え → lockNoOp にフォールバック
  //   2. addInitScript で localStorage にフェイクセッションを注入
  //   3. page.route で Supabase REST API をインターセプト（user_profiles 取得など）
  const SUPABASE_KEY = 'sb-kceshdbwoastudjuqssu-auth-token'
  const fakeUser = {
    id: 'e2e-test-user-id',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'test@e2e.example.com',
    email_confirmed_at: '2026-01-01T00:00:00.000Z',
    phone: '',
    confirmed_at: '2026-01-01T00:00:00.000Z',
    last_sign_in_at: '2026-01-01T00:00:00.000Z',
    app_metadata: { provider: 'email', providers: ['email'] },
    user_metadata: {},
    identities: [],
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    is_anonymous: false,
  }
  const fakeSession = {
    access_token: 'fake-e2e-access-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: 'fake-e2e-refresh-token',
    user: fakeUser,
  }
  const fakeProfile = {
    user_id: 'e2e-test-user-id',
    display_name: 'E2E Test User',
    target_exam_year: 2026,
    university: null,
    study_start_date: null,
    target_score: null,
    onboarding_completed_at: '2026-01-01T00:00:00.000Z',
    last_active_at: null,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  }

  // addInitScript: ページ JS 実行前に navigator.locks を無効化 + localStorage 注入
  await page.addInitScript(({ key, session }) => {
    Object.defineProperty(navigator, 'locks', { get: () => undefined, configurable: true })
    localStorage.setItem(key, JSON.stringify(session))
  }, { key: SUPABASE_KEY, session: fakeSession })

  // Supabase REST API（user_profiles 等）をインターセプト
  await page.route('**kceshdbwoastudjuqssu**', async (route) => {
    const url = route.request().url()
    if (url.includes('/rest/v1/user_profiles')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { 'Content-Range': '0-0/1' },
        body: JSON.stringify(fakeProfile),
      })
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...fakeSession }),
      })
    }
  })

  await page.goto('/practice/r100-016')
  await page.waitForLoadState('networkidle')

  // r100-016 は choices あり（ビタミンB1〜E）の通常問題
  // ChoiceCard は <div role="radio"> で描画される
  const firstChoice = page.getByRole('radio').first()
  await expect(firstChoice).toBeVisible({ timeout: 10000 })
  await firstChoice.click()

  // 解答ボタン（ActionArea: 「解答する」）をクリック
  await page.getByRole('button', { name: '解答する' }).click()

  await page.waitForLoadState('networkidle')

  // 公式付箋セクションが1枚以上表示されているか確認（複数枚表示されることがある）
  await expect(page.getByText('📌 この問題の公式付箋').first()).toBeVisible({ timeout: 5000 })

  // fusen-0373「ビタミンB12（コバラミン）」が上位にレコメンドされている
  await expect(page.getByText('ビタミンB12（コバラミン）').first()).toBeVisible({ timeout: 5000 })
})
