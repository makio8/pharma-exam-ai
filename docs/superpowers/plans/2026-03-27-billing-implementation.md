# 課金実装（Stripe + サブスクリプション管理）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stripe決済によるPro課金を実装し、Free/Pro機能の出し分けを行う

**Architecture:** Stripe Checkout Session → Webhook → DB更新 → entitlements付与。クライアントはcheck_my_entitlement RPCで権利確認。Stripe Customer Portalで解約管理。

**Tech Stack:** Stripe API / Supabase Edge Functions (Deno) / React

**Depends on:** Plan 1（スキーマ）+ Plan 2（認証）+ Plan 3（Repo移行）完了

---

## 引き継ぎコンテキスト

### DB設計specの実装計画 全5プラン

```
Plan 1（完了前提）→ Plan 2（完了前提）→ Plan 3（完了前提）→ **Plan 4（本計画）** → Plan 5
スキーマ構築        認証統合            Repo移行            課金実装               アカウント削除
(SQL only)         (LINE+Apple)        (TS+SQL)            (Stripe+Webhook)       (Purgeバッチ)
```

### 課金設計の確定済み判断（DB設計spec v1.1 §1.2 + PRD v1.2）

| 判断項目 | 決定 | 根拠 |
|---------|------|------|
| 課金ティア | Free + Pro（月額980円 / 年度パス7,800円） | PRD v1.2改訂 |
| 決済プラットフォーム | Phase 2 = **Stripe（Web決済のみ）**。Phase 3でIAP追加 | クロスプラットフォーム設計済み |
| 課金テーブル | 6テーブル分割（billing_customers / product_catalog / subscription_contracts / purchase_events / billing_transactions / entitlements） | GPT-5.4 P1指摘 |
| 権利判定 | `check_my_entitlement()` RPC（auth.uid()強制、SECURITY DEFINER） | DB設計spec §5.1 |
| 二重課金防止 | `can_purchase()` RPC + DB UNIQUE制約（`idx_ent_no_duplicate_active`） | DB設計spec §5.2 |
| DBが真実の唯一の源 | Stripeは決済処理のみ。権利判定はDB（entitlementsテーブル） | 設計方針 |
| 無料トライアル | なし（offer codeでキャンペーン対応） | GPT-5.4: Freeが十分強い |
| Proで解放される機能 | `notes_all`（付箋全量）/ `cards_all`（暗記カード全量）/ `analytics_full`（分析全機能）/ `cloud_sync`（クラウド同期） | product_catalog.granted_entitlements |

### Free / Pro 機能分界（PRD v1.2 + DB設計spec）

| 機能 | Free | Pro |
|------|------|-----|
| 過去問 3,470問 + AI解説 | 全部無料 | 同左 |
| 演習（PracticePage / QuestionPage） | 全機能 | 同左 |
| 公式付箋（NotesPage） | 200枚（`tier: 'free'`） | **全1,000枚**（`notes_all`） |
| 付箋詳細（FusenDetailPage） | Free付箋のみ | 全付箋 |
| 暗記カード（FlashCardListPage / FlashCardPage） | Free付箋分のみ | **全カード**（`cards_all`） |
| 分析（AnalysisPage） | 基本分析 | **詳細分析**（`analytics_full`） |
| クラウド同期 | なし（localStorage） | **あり**（`cloud_sync`） |

### 既存コードベースの関連箇所

| 項目 | ファイルパス |
|------|------------|
| 認証フック | `src/hooks/useAuth.ts`（既存。Plan 2でLINE/Apple対応に拡張済み前提） |
| Supabaseクライアント | `src/lib/supabase.ts`（既存。isSupabaseConfigured判定あり） |
| 付箋データ | `src/data/official-notes.ts`（`tier: 'free' | 'premium'` フィールド既存） |
| 付箋一覧フック | `src/hooks/useFusenLibrary.ts` |
| ルーティング | `src/routes.tsx`（全ページ定義済み） |
| RLSポリシー | 課金テーブルはユーザーSELECTのみ。変更はservice_role経由 |

### Stripe 概念の整理

| Stripe用語 | 説明 | 本アプリでの使い方 |
|-----------|------|------------------|
| Product | 商品（Pro月額プラン等） | Stripe Dashboardで作成。DB product_catalogと対応 |
| Price | 価格（月額980円等） | Productに紐づく。Checkout Session作成時に指定 |
| Customer | 顧客 | billing_customers.stripe_customer_id と対応 |
| Checkout Session | 決済画面 | Edge Functionが作成→ユーザーをリダイレクト |
| Webhook | イベント通知 | Stripe→Edge Function。決済完了・更新・解約を受信 |
| Customer Portal | 顧客管理画面 | Stripe提供のUI。プラン変更・解約・カード更新 |
| Subscription | 定期課金 | subscription_contracts テーブルと対応 |

### Webhook イベントとDB操作の対応表

| Stripe Event | DB操作 | entitlements |
|-------------|--------|-------------|
| `checkout.session.completed` | billing_customers UPSERT → subscription_contracts INSERT → purchase_events INSERT → billing_transactions INSERT | INSERT（`notes_all` 等4件） |
| `invoice.paid`（更新） | subscription_contracts UPDATE（period延長）→ purchase_events INSERT → billing_transactions INSERT | UPDATE（expires_at延長） |
| `customer.subscription.updated` | subscription_contracts UPDATE（status変更）→ purchase_events INSERT | （status変更のみ。権利は維持） |
| `customer.subscription.deleted` | subscription_contracts UPDATE（status='expired'）→ purchase_events INSERT | UPDATE（revoked_at設定） |

---

## ファイル構成

```
supabase/functions/
  stripe-checkout/
    index.ts                    → Checkout Session 作成（Deno Edge Function）
  stripe-webhook/
    index.ts                    → Webhook ハンドラー（署名検証+DB操作）
  stripe-portal/
    index.ts                    → Customer Portal Session 作成

src/
  hooks/
    useEntitlement.ts           → check_my_entitlement RPC 呼び出し + キャッシュ
  pages/
    PaywallPage.tsx             → Pro訴求UI（プラン比較+CTA）
    PaywallPage.module.css      → PaywallPageスタイル
    SettingsPage.tsx            → サブスクリプション管理（プラン表示+解約+Portal）
    SettingsPage.module.css     → SettingsPageスタイル
  components/
    ui/
      ProBadge.tsx              → 🔒 Pro表示バッジ（ゲーティングUI部品）
  routes.tsx                    → /paywall, /settings ルート追加
  types/
    entitlement.ts              → 権利関連の型定義
```

---

### Task 1: Stripe アカウント設定 + 商品/価格作成

**Files:**
- Create: `.env.local`（Stripeキー追加。gitignore済み）
- Create: `docs/setup/stripe-setup.md`（手順メモ）

**注意**: Stripe Secret Key / Webhook Signing Secret は `.env.local` に保存。**絶対にコミットしない**。

- [ ] **Step 1: Stripe Dashboard で商品・価格を作成**

Stripe Dashboard（https://dashboard.stripe.com）にログインし、以下を作成:

```
Product 1: 「Pro月額プラン」
  - Price: ¥980/月（recurring, monthly）
  - metadata: { product_catalog_id: 'pro_monthly' }

Product 2: 「Pro年度パス」
  - Price: ¥7,800/年（recurring, yearly）
  - metadata: { product_catalog_id: 'pro_annual' }
```

- [ ] **Step 2: Stripe API キーを控える**

Dashboard > Developers > API keys から:
- Publishable key（`pk_test_...`）→ クライアント用（Checkout Session リダイレクト）
- Secret key（`sk_test_...`）→ Edge Function 用

- [ ] **Step 3: .env.local にキーを追加**

```bash
# .env.local（既存のSupabase変数の下に追加）
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET は Task 3 の Webhook 登録後に追加
```

- [ ] **Step 4: Supabase Edge Function 用のシークレットを設定**

```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_test_...
# STRIPE_WEBHOOK_SECRET は Task 3 で設定
```

- [ ] **Step 5: .gitignore に Stripe キーが含まれないことを確認**

`.env.local` が `.gitignore` に含まれていることを確認:

```bash
grep '.env.local' .gitignore
```

Expected: `.env.local` がリストされる

- [ ] **Step 6: コミット（キーを含まない）**

```bash
git commit --allow-empty -m "chore: Stripe商品作成完了（pro_monthly ¥980/月, pro_annual ¥7,800/年）"
```

---

### Task 2: Supabase Edge Function — Checkout Session 作成

**Files:**
- Create: `supabase/functions/stripe-checkout/index.ts`

- [ ] **Step 1: Edge Function ファイル作成**

```typescript
// supabase/functions/stripe-checkout/index.ts
// Stripe Checkout Session を作成し、URLを返す
// クライアント: この URL にリダイレクトして決済画面を表示
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req: Request) => {
  // CORS プリフライト
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // 認証チェック（JWTからユーザーID取得）
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // リクエストボディ
    const { priceId, productCatalogId, examYear } = await req.json()

    if (!priceId || !productCatalogId) {
      return new Response(JSON.stringify({ error: 'Missing priceId or productCatalogId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // 二重課金防止: can_purchase RPC 呼び出し
    const { data: canPurchaseResult, error: canPurchaseError } = await supabase.rpc(
      'can_purchase',
      { p_product_id: productCatalogId, p_exam_year: examYear ?? null },
      // ユーザーのJWTで呼ぶためにanonクライアントを使う
    )
    // ※ can_purchase は auth.uid() を使うため、service_role ではなくユーザートークンで呼ぶ必要がある
    // service_role でユーザーの権利を確認する場合は check_entitlement を使う
    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: purchaseCheck } = await supabaseUser.rpc('can_purchase', {
      p_product_id: productCatalogId,
      p_exam_year: examYear ?? null,
    })

    if (purchaseCheck && !purchaseCheck.allowed) {
      return new Response(JSON.stringify({
        error: 'already_entitled',
        reason: purchaseCheck.reason,
      }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // billing_customers から Stripe Customer ID を取得（なければ作成）
    const { data: billingCustomer } = await supabase
      .from('billing_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    let stripeCustomerId = billingCustomer?.stripe_customer_id

    if (!stripeCustomerId) {
      // Stripe Customer 作成
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      stripeCustomerId = customer.id

      // billing_customers に保存
      await supabase.from('billing_customers').upsert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
      })
    }

    // Checkout Session 作成
    const origin = req.headers.get('origin') || 'https://your-app.com'
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${origin}/settings?checkout=success`,
      cancel_url: `${origin}/paywall?checkout=cancelled`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          product_catalog_id: productCatalogId,
          exam_year: examYear?.toString() ?? '',
        },
      },
      // 日本語ロケール
      locale: 'ja',
      // 自動税計算（将来用）
      // automatic_tax: { enabled: true },
    })

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Checkout error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Edge Function をデプロイ**

```bash
npx supabase functions deploy stripe-checkout --no-verify-jwt
```

`--no-verify-jwt` は Edge Function 自体の JWT 検証をスキップする（関数内部で独自に検証するため）。

- [ ] **Step 3: コミット**

```bash
git add supabase/functions/stripe-checkout/
git commit -m "feat: Stripe Checkout Session 作成 Edge Function（二重課金防止+Customer自動作成）"
```

---

### Task 3: Supabase Edge Function — Webhook ハンドラー

**Files:**
- Create: `supabase/functions/stripe-webhook/index.ts`

**セキュリティ要件:**
- Stripe 署名検証（`stripe.webhooks.constructEvent`）が**必須**。署名なしのリクエストは全拒否
- service_role でDB操作（RLSバイパス）
- purchase_events で冪等性保証（同じイベントを2回処理しない）

- [ ] **Step 1: Webhook Edge Function ファイル作成**

```typescript
// supabase/functions/stripe-webhook/index.ts
// Stripe Webhook ハンドラー
// セキュリティ: 署名検証必須。未検証リクエストは全拒否
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
})
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// service_role クライアント（RLSバイパス。課金テーブルはユーザーからINSERT不可のため）
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  // ── 署名検証（最重要セキュリティ） ──
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    console.error('Missing stripe-signature header')
    return new Response('Missing signature', { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return new Response('Invalid signature', { status: 400 })
  }

  // ── 冪等性チェック: 同じイベントを2回処理しない ──
  const { data: existingEvent } = await supabase
    .from('purchase_events')
    .select('id')
    .eq('payment_platform', 'stripe')
    .eq('provider_event_id', event.id)
    .single()

  if (existingEvent) {
    console.log(`Event ${event.id} already processed, skipping`)
    return new Response(JSON.stringify({ received: true, skipped: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // ── イベント処理 ──
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event)
        break
      case 'invoice.paid':
        await handleInvoicePaid(event)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error(`Error processing ${event.type}:`, error)
    // purchase_events に失敗を記録（再試行用）
    await recordPurchaseEvent(event, null, null, 'failed', (error as Error).message)
    return new Response(JSON.stringify({ error: 'Processing failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})

// ── checkout.session.completed ──
// 初回購入完了。subscription_contracts + entitlements を作成
async function handleCheckoutCompleted(event: Stripe.Event) {
  const session = event.data.object as Stripe.Checkout.Session
  const subscriptionId = session.subscription as string
  const customerId = session.customer as string

  // Stripe Subscription 詳細取得
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)
  const metadata = subscription.metadata

  const userId = metadata.supabase_user_id
  const productCatalogId = metadata.product_catalog_id
  const examYear = metadata.exam_year ? parseInt(metadata.exam_year) : null

  if (!userId || !productCatalogId) {
    throw new Error(`Missing metadata: userId=${userId}, productCatalogId=${productCatalogId}`)
  }

  // product_catalog から付与する権利を取得
  const { data: product } = await supabase
    .from('product_catalog')
    .select('granted_entitlements')
    .eq('id', productCatalogId)
    .single()

  if (!product) {
    throw new Error(`Product not found: ${productCatalogId}`)
  }

  // 1. subscription_contracts 作成
  const { data: contract, error: contractError } = await supabase
    .from('subscription_contracts')
    .insert({
      user_id: userId,
      product_id: productCatalogId,
      status: 'active',
      payment_platform: 'stripe',
      provider_subscription_id: subscriptionId,
      environment: 'production',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      auto_renew_status: !subscription.cancel_at_period_end,
      exam_year: examYear,
    })
    .select('id')
    .single()

  if (contractError) throw contractError
  const contractId = contract!.id

  // 2. entitlements 作成（granted_entitlements の各キーに対して1行ずつ）
  const entitlementRows = (product.granted_entitlements as string[]).map((key: string) => ({
    user_id: userId,
    entitlement_key: key,
    source_type: 'subscription',
    source_id: contractId,
    exam_year: examYear,
    granted_at: new Date().toISOString(),
    // expires_at: NULL（サブスク有効中は無期限。失効時にWebhookで設定）
  }))

  const { error: entError } = await supabase
    .from('entitlements')
    .insert(entitlementRows)

  if (entError) throw entError

  // 3. billing_transactions 記録
  const amountJpy = session.amount_total ? Math.round(session.amount_total / 1) : 0 // JPY は小数なし
  await supabase.from('billing_transactions').insert({
    user_id: userId,
    contract_id: contractId,
    product_id: productCatalogId,
    transaction_type: 'charge',
    amount_jpy: amountJpy,
    currency: 'JPY',
    payment_platform: 'stripe',
    provider_txn_id: session.payment_intent as string,
    occurred_at: new Date(event.created * 1000).toISOString(),
  })

  // 4. purchase_events 記録
  await recordPurchaseEvent(event, userId, contractId, 'processed')
}

// ── invoice.paid（更新時） ──
// サブスク更新。current_period を延長
async function handleInvoicePaid(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice
  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) {
    // 一回きりの請求（サブスクでない）→スキップ
    await recordPurchaseEvent(event, null, null, 'skipped')
    return
  }

  // subscription_contracts を検索
  const { data: contract } = await supabase
    .from('subscription_contracts')
    .select('id, user_id, product_id, exam_year')
    .eq('provider_subscription_id', subscriptionId)
    .eq('payment_platform', 'stripe')
    .single()

  if (!contract) {
    // checkout.session.completed がまだ来ていない可能性
    // → pending で記録して後で処理
    await recordPurchaseEvent(event, null, null, 'pending')
    return
  }

  // Stripe Subscription 詳細取得
  const subscription = await stripe.subscriptions.retrieve(subscriptionId)

  // current_period 延長
  await supabase
    .from('subscription_contracts')
    .update({
      status: 'active',
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', contract.id)

  // entitlements の expires_at をクリア（更新されたので無期限に戻す）
  await supabase
    .from('entitlements')
    .update({ expires_at: null, revoked_at: null })
    .eq('source_id', contract.id)
    .is('revoked_at', null)

  // billing_transactions 記録
  const amountJpy = invoice.amount_paid ?? 0
  await supabase.from('billing_transactions').insert({
    user_id: contract.user_id,
    contract_id: contract.id,
    product_id: contract.product_id,
    transaction_type: 'charge',
    amount_jpy: amountJpy,
    currency: 'JPY',
    payment_platform: 'stripe',
    provider_txn_id: invoice.payment_intent as string,
    occurred_at: new Date(event.created * 1000).toISOString(),
  })

  await recordPurchaseEvent(event, contract.user_id, contract.id, 'processed')
}

// ── customer.subscription.updated ──
// ステータス変更（解約予約、支払い遅延等）
async function handleSubscriptionUpdated(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const subscriptionId = subscription.id

  const { data: contract } = await supabase
    .from('subscription_contracts')
    .select('id, user_id')
    .eq('provider_subscription_id', subscriptionId)
    .eq('payment_platform', 'stripe')
    .single()

  if (!contract) {
    await recordPurchaseEvent(event, null, null, 'pending')
    return
  }

  // Stripe status → DB status マッピング
  const statusMap: Record<string, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'cancelled',  // Stripe spelling: canceled (1 l)
    unpaid: 'past_due',
    paused: 'paused',
    trialing: 'trialing',
  }

  const dbStatus = statusMap[subscription.status] || 'active'

  const updateData: Record<string, unknown> = {
    status: dbStatus,
    auto_renew_status: !subscription.cancel_at_period_end,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
  }

  // 解約予約の場合
  if (subscription.cancel_at_period_end) {
    updateData.cancel_at = new Date(subscription.current_period_end * 1000).toISOString()
    updateData.cancelled_at = new Date().toISOString()
  }

  await supabase
    .from('subscription_contracts')
    .update(updateData)
    .eq('id', contract.id)

  await recordPurchaseEvent(event, contract.user_id, contract.id, 'processed')
}

// ── customer.subscription.deleted ──
// サブスク完全終了。entitlements を失効
async function handleSubscriptionDeleted(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription
  const subscriptionId = subscription.id

  const { data: contract } = await supabase
    .from('subscription_contracts')
    .select('id, user_id')
    .eq('provider_subscription_id', subscriptionId)
    .eq('payment_platform', 'stripe')
    .single()

  if (!contract) {
    await recordPurchaseEvent(event, null, null, 'pending')
    return
  }

  // subscription_contracts を expired に
  await supabase
    .from('subscription_contracts')
    .update({ status: 'expired' })
    .eq('id', contract.id)

  // entitlements を失効（revoked_at を設定）
  await supabase
    .from('entitlements')
    .update({ revoked_at: new Date().toISOString() })
    .eq('source_id', contract.id)
    .is('revoked_at', null)

  await recordPurchaseEvent(event, contract.user_id, contract.id, 'processed')
}

// ── purchase_events 記録（共通ヘルパー） ──
async function recordPurchaseEvent(
  event: Stripe.Event,
  userId: string | null,
  contractId: string | null,
  state: 'pending' | 'processed' | 'failed' | 'skipped',
  errorMsg?: string,
) {
  const eventTypeMap: Record<string, string> = {
    'checkout.session.completed': 'initial_purchase',
    'invoice.paid': 'renewal',
    'customer.subscription.updated': 'cancellation',
    'customer.subscription.deleted': 'cancellation',
  }

  await supabase.from('purchase_events').insert({
    user_id: userId,
    contract_id: contractId,
    event_type: eventTypeMap[event.type] || 'initial_purchase',
    payment_platform: 'stripe',
    provider_event_id: event.id,
    provider_payload: event.data.object,
    occurred_at: new Date(event.created * 1000).toISOString(),
    amount_jpy: null, // Checkout/Invoiceから取得済みの場合はbilling_transactionsに記録
    processing_state: state,
    processed_at: state === 'processed' ? new Date().toISOString() : null,
    processing_error: errorMsg ?? null,
  })
}
```

- [ ] **Step 2: Stripe Dashboard で Webhook エンドポイントを登録**

Dashboard > Developers > Webhooks > Add endpoint:
- URL: `https://<project-ref>.supabase.co/functions/v1/stripe-webhook`
- Events:
  - `checkout.session.completed`
  - `invoice.paid`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`

Signing Secret（`whsec_...`）を控える。

- [ ] **Step 3: Webhook Secret を設定**

```bash
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
```

`.env.local` にも追加:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

- [ ] **Step 4: Edge Function をデプロイ**

```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

`--no-verify-jwt`: Stripe からのリクエストは Supabase JWT を持たない。署名検証で代替。

- [ ] **Step 5: コミット**

```bash
git add supabase/functions/stripe-webhook/
git commit -m "feat: Stripe Webhook ハンドラー（署名検証+冪等性+4イベント対応+billing_transactions記録）"
```

---

### Task 4: Supabase Edge Function — Customer Portal Session 作成

**Files:**
- Create: `supabase/functions/stripe-portal/index.ts`

- [ ] **Step 1: Edge Function ファイル作成**

```typescript
// supabase/functions/stripe-portal/index.ts
// Stripe Customer Portal Session を作成し、URLを返す
// ユーザーはこのURLでプラン変更・解約・カード更新が可能
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2024-12-18.acacia',
})

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req: Request) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // billing_customers から Stripe Customer ID を取得
    const { data: billingCustomer } = await supabase
      .from('billing_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single()

    if (!billingCustomer?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: 'No billing account found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const origin = req.headers.get('origin') || 'https://your-app.com'
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: billingCustomer.stripe_customer_id,
      return_url: `${origin}/settings`,
    })

    return new Response(JSON.stringify({ url: portalSession.url }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Portal error:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
```

- [ ] **Step 2: Stripe Dashboard で Customer Portal を設定**

Dashboard > Settings > Billing > Customer portal:
- サブスクリプションのキャンセル: 許可
- サブスクリプションの変更（プラン切替）: 許可
- 請求履歴の閲覧: 許可

- [ ] **Step 3: Edge Function をデプロイ**

```bash
npx supabase functions deploy stripe-portal --no-verify-jwt
```

- [ ] **Step 4: コミット**

```bash
git add supabase/functions/stripe-portal/
git commit -m "feat: Stripe Customer Portal Session 作成 Edge Function（解約・プラン変更・カード更新）"
```

---

### Task 5: 権利関連の型定義

**Files:**
- Create: `src/types/entitlement.ts`

- [ ] **Step 1: 型定義ファイル作成**

```typescript
// src/types/entitlement.ts
// 権利（entitlement）関連の型定義
// DB: entitlements テーブル / product_catalog.granted_entitlements に対応

/** 権利キー（product_catalog.granted_entitlements の値） */
export type EntitlementKey =
  | 'notes_all'        // 付箋全量（1,000枚）
  | 'cards_all'        // 暗記カード全量
  | 'analytics_full'   // 分析ページ詳細機能
  | 'cloud_sync'       // クラウド同期
  | 'beta_access'      // βアクセス（admin_grant）

/** プラン情報（UIに表示するプランの構造） */
export interface PlanInfo {
  id: string               // product_catalog.id: 'pro_monthly' | 'pro_annual'
  name: string             // 表示名
  priceJpy: number         // 税込価格（円）
  intervalMonths: number   // 課金間隔（月）
  stripePriceId: string    // Stripe Price ID（Checkout Session作成時に使用）
  features: string[]       // UI表示用の機能リスト
}

/** サブスクリプション状態（UIに表示する契約情報） */
export interface SubscriptionInfo {
  productId: string
  status: 'active' | 'cancelled' | 'past_due' | 'expired'
  currentPeriodEnd: string   // ISO 8601
  autoRenew: boolean
  cancelAt: string | null    // 解約予約日（解約予約済みの場合）
}

/** useEntitlement の返り値 */
export interface UseEntitlementReturn {
  /** 指定した権利キーを持っているか */
  hasEntitlement: (key: EntitlementKey) => boolean
  /** Pro（いずれかのPro権利を持っている）か */
  isPro: boolean
  /** 現在のサブスクリプション情報（Proの場合） */
  subscription: SubscriptionInfo | null
  /** 読み込み中 */
  loading: boolean
  /** エラー */
  error: string | null
  /** キャッシュをリフレッシュ */
  refresh: () => Promise<void>
}
```

- [ ] **Step 2: コミット**

```bash
git add src/types/entitlement.ts
git commit -m "feat: 権利関連の型定義（EntitlementKey / PlanInfo / SubscriptionInfo / UseEntitlementReturn）"
```

---

### Task 6: useEntitlement フック

**Files:**
- Create: `src/hooks/useEntitlement.ts`

- [ ] **Step 1: フック作成**

```typescript
// src/hooks/useEntitlement.ts
// check_my_entitlement RPC を呼び出し、ユーザーの権利をキャッシュして返す
// キャッシュ: メモリ（React state）+ localStorage（オフライン猶予用）
import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import type { EntitlementKey, SubscriptionInfo, UseEntitlementReturn } from '../types/entitlement'

/** オフラインキャッシュの型 */
interface EntitlementCache {
  entitlements: Record<EntitlementKey, boolean>
  subscription: SubscriptionInfo | null
  verifiedAt: string   // ISO 8601
}

const CACHE_KEY = 'entitlement_cache'
/** ソフトTTL: オンライン時にこの間隔で再検証（24時間） */
const SOFT_TTL_MS = 24 * 60 * 60 * 1000
/** ハードTTL: この期間を超えたらPro機能ブロック（7日） */
const HARD_TTL_MS = 7 * 24 * 60 * 60 * 1000

const ALL_PRO_KEYS: EntitlementKey[] = ['notes_all', 'cards_all', 'analytics_full', 'cloud_sync']

function loadCache(): EntitlementCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCache(cache: EntitlementCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage full → 無視
  }
}

function isCacheValid(cache: EntitlementCache): boolean {
  const age = Date.now() - new Date(cache.verifiedAt).getTime()
  return age < HARD_TTL_MS
}

function isCacheFresh(cache: EntitlementCache): boolean {
  const age = Date.now() - new Date(cache.verifiedAt).getTime()
  return age < SOFT_TTL_MS
}

export function useEntitlement(): UseEntitlementReturn {
  const { user } = useAuth()
  const [entitlements, setEntitlements] = useState<Record<string, boolean>>({})
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  const fetchEntitlements = useCallback(async () => {
    if (!supabase || !user || fetchingRef.current) return
    fetchingRef.current = true

    try {
      // 全Pro権利キーを並列でチェック
      const results = await Promise.all(
        ALL_PRO_KEYS.map(async (key) => {
          const { data, error: rpcError } = await supabase.rpc('check_my_entitlement', {
            p_key: key,
          })
          if (rpcError) throw rpcError
          return [key, data as boolean] as const
        })
      )

      const entMap: Record<string, boolean> = {}
      for (const [key, value] of results) {
        entMap[key] = value
      }

      // サブスクリプション情報を取得（Proユーザーの場合）
      let subInfo: SubscriptionInfo | null = null
      if (Object.values(entMap).some(v => v)) {
        const { data: contracts } = await supabase
          .from('subscription_contracts')
          .select('product_id, status, current_period_end, auto_renew_status, cancel_at')
          .eq('user_id', user.id)
          .in('status', ['active', 'cancelled', 'past_due'])
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (contracts) {
          subInfo = {
            productId: contracts.product_id,
            status: contracts.status as SubscriptionInfo['status'],
            currentPeriodEnd: contracts.current_period_end,
            autoRenew: contracts.auto_renew_status,
            cancelAt: contracts.cancel_at,
          }
        }
      }

      setEntitlements(entMap)
      setSubscription(subInfo)
      setError(null)

      // キャッシュ保存
      saveCache({
        entitlements: entMap as Record<EntitlementKey, boolean>,
        subscription: subInfo,
        verifiedAt: new Date().toISOString(),
      })
    } catch (err) {
      console.error('Failed to fetch entitlements:', err)
      setError((err as Error).message)

      // オフライン時はキャッシュを使用
      const cache = loadCache()
      if (cache && isCacheValid(cache)) {
        setEntitlements(cache.entitlements)
        setSubscription(cache.subscription)
      }
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      // 未ログイン → 全権利なし
      setEntitlements({})
      setSubscription(null)
      setLoading(false)
      return
    }

    // キャッシュが新鮮ならまずキャッシュを使用（UIの初回表示を高速化）
    const cache = loadCache()
    if (cache && isCacheFresh(cache)) {
      setEntitlements(cache.entitlements)
      setSubscription(cache.subscription)
      setLoading(false)
      // バックグラウンドで再検証はしない（Fresh期間内）
      return
    }

    if (cache && isCacheValid(cache)) {
      // 古いがまだ有効 → まずキャッシュを表示してバックグラウンドで再検証
      setEntitlements(cache.entitlements)
      setSubscription(cache.subscription)
      setLoading(false)
    }

    // サーバーに権利を確認
    fetchEntitlements()
  }, [user, fetchEntitlements])

  // visibilitychange で再検証（アプリ復帰時）
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        const cache = loadCache()
        if (!cache || !isCacheFresh(cache)) {
          fetchEntitlements()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [user, fetchEntitlements])

  const hasEntitlement = useCallback(
    (key: EntitlementKey) => !!entitlements[key],
    [entitlements],
  )

  const isPro = ALL_PRO_KEYS.some(key => !!entitlements[key])

  return {
    hasEntitlement,
    isPro,
    subscription,
    loading,
    error,
    refresh: fetchEntitlements,
  }
}
```

- [ ] **Step 2: コミット**

```bash
git add src/hooks/useEntitlement.ts
git commit -m "feat: useEntitlement フック（check_my_entitlement RPC + localStorage キャッシュ + visibilitychange 再検証）"
```

---

### Task 7: PaywallPage コンポーネント

**Files:**
- Create: `src/pages/PaywallPage.tsx`
- Create: `src/pages/PaywallPage.module.css`

- [ ] **Step 1: PaywallPage 作成**

Soft Companion デザインシステムに準拠した Pro 訴求ページ。

```
┌───────────────────────────────────┐
│  ← 戻る                           │
│                                   │
│  🎓 Proにアップグレード              │
│  「全1,000枚の付箋で合格を掴む」     │
│                                   │
│  ┌─── Free（現在）────────────┐   │
│  │ ✓ 過去問3,470問            │   │
│  │ ✓ AI解説                   │   │
│  │ ✓ 付箋200枚               │   │
│  │ ✗ 暗記カード全量           │   │
│  │ ✗ 分析詳細                 │   │
│  └────────────────────────────┘   │
│                                   │
│  ┌─── Pro ─── おすすめ ──────┐   │
│  │ ✓ 過去問3,470問            │   │
│  │ ✓ AI解説                   │   │
│  │ ✓ 付箋1,000枚             │   │
│  │ ✓ 暗記カード全量           │   │
│  │ ✓ 分析詳細                 │   │
│  │ ✓ クラウド同期             │   │
│  │                            │   │
│  │  月額 ¥980                 │   │
│  │  [Pro月額を始める]          │   │
│  │                            │   │
│  │  年度パス ¥7,800（33%お得） │   │
│  │  [年度パスを購入]           │   │
│  └────────────────────────────┘   │
│                                   │
│  解約はいつでも可能                 │
│  特定商取引法に基づく表記            │
└───────────────────────────────────┘
```

UIの構成:
- ヘッダー: タイトル + サブタイトル（Soft Companion アクセントカラー）
- プラン比較カード: Free / Pro の機能比較
- CTAボタン: Stripe Checkout Session を作成してリダイレクト
- フッター: 特商法リンク + 解約案内

```typescript
// src/pages/PaywallPage.tsx
// Pro訴求ページ。Free/Pro機能比較 + Stripe Checkout Session 作成
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useEntitlement } from '../hooks/useEntitlement'
import styles from './PaywallPage.module.css'

// Stripe Price ID（環境変数から取得）
const PLANS = [
  {
    id: 'pro_monthly',
    name: 'Pro月額プラン',
    priceJpy: 980,
    interval: '月',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_MONTHLY as string,
    badge: null,
  },
  {
    id: 'pro_annual',
    name: 'Pro年度パス',
    priceJpy: 7800,
    interval: '年',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_ANNUAL as string,
    badge: '33%お得',
  },
] as const

const FREE_FEATURES = [
  { text: '過去問 3,470問 + AI解説', included: true },
  { text: '演習フィルター・分析基本', included: true },
  { text: '公式付箋 200枚', included: true },
  { text: '暗記カード全量', included: false },
  { text: '分析詳細機能', included: false },
  { text: 'クラウド同期', included: false },
]

const PRO_FEATURES = [
  { text: '過去問 3,470問 + AI解説', included: true },
  { text: '演習フィルター・分析基本', included: true },
  { text: '公式付箋 1,000枚', included: true },
  { text: '暗記カード全量', included: true },
  { text: '分析詳細機能', included: true },
  { text: 'クラウド同期', included: true },
]

export function PaywallPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { isPro } = useEntitlement()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 既にProならSettingsに飛ばす
  if (isPro) {
    navigate('/settings', { replace: true })
    return null
  }

  const handlePurchase = async (plan: typeof PLANS[number]) => {
    if (!supabase || !user) {
      navigate('/login')
      return
    }

    setLoadingPlan(plan.id)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        navigate('/login')
        return
      }

      const response = await supabase.functions.invoke('stripe-checkout', {
        body: {
          priceId: plan.stripePriceId,
          productCatalogId: plan.id,
          examYear: null, // 年度パスの場合はUI上で受験年度を選択させる（将来実装）
        },
      })

      if (response.error) throw response.error

      const { url } = response.data
      if (url) {
        window.location.href = url  // Stripe Checkout にリダイレクト
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError('決済ページの表示に失敗しました。もう一度お試しください。')
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate(-1)}>
        ← 戻る
      </button>

      <div className={styles.header}>
        <h1 className={styles.title}>Proにアップグレード</h1>
        <p className={styles.subtitle}>全1,000枚の付箋で合格を掴む</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {/* Free プラン */}
      <div className={styles.planCard}>
        <div className={styles.planHeader}>
          <h2 className={styles.planName}>Free</h2>
          <span className={styles.currentBadge}>現在のプラン</span>
        </div>
        <ul className={styles.featureList}>
          {FREE_FEATURES.map((f, i) => (
            <li key={i} className={f.included ? styles.included : styles.excluded}>
              {f.included ? '✓' : '✗'} {f.text}
            </li>
          ))}
        </ul>
      </div>

      {/* Pro プラン */}
      <div className={`${styles.planCard} ${styles.proPlan}`}>
        <div className={styles.planHeader}>
          <h2 className={styles.planName}>Pro</h2>
          <span className={styles.recommendBadge}>おすすめ</span>
        </div>
        <ul className={styles.featureList}>
          {PRO_FEATURES.map((f, i) => (
            <li key={i} className={styles.included}>
              ✓ {f.text}
            </li>
          ))}
        </ul>

        <div className={styles.priceSection}>
          {PLANS.map(plan => (
            <div key={plan.id} className={styles.priceOption}>
              <div className={styles.priceRow}>
                <span className={styles.price}>¥{plan.priceJpy.toLocaleString()}</span>
                <span className={styles.interval}>/{plan.interval}</span>
                {plan.badge && <span className={styles.saveBadge}>{plan.badge}</span>}
              </div>
              <button
                className={styles.ctaButton}
                disabled={loadingPlan !== null}
                onClick={() => handlePurchase(plan)}
              >
                {loadingPlan === plan.id ? '処理中...' : `${plan.name}を始める`}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <p>解約はいつでも可能です</p>
        <a href="/legal/tokushoho" className={styles.legalLink}>
          特定商取引法に基づく表記
        </a>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: CSS Modules スタイル作成**

`PaywallPage.module.css` を Soft Companion デザイントークン（`--accent`, `--bg`, `--card` 等）に基づいて作成。プロプランカードは `--accent` をボーダーに使用してハイライト。

- [ ] **Step 3: コミット**

```bash
git add src/pages/PaywallPage.tsx src/pages/PaywallPage.module.css
git commit -m "feat: PaywallPage（Pro訴求UI — Free/Pro比較+Stripe Checkout連携+Soft Companion準拠）"
```

---

### Task 8: ProBadge コンポーネント + ゲーティングUI部品

**Files:**
- Create: `src/components/ui/ProBadge.tsx`

- [ ] **Step 1: ProBadge コンポーネント作成**

Pro限定コンテンツに表示する小さなバッジ。付箋カードのサムネイルにオーバーレイ、またはリスト項目の右端に表示。

```typescript
// src/components/ui/ProBadge.tsx
// Pro限定コンテンツに表示するバッジ。タップで PaywallPage に遷移
import { useNavigate } from 'react-router-dom'

interface ProBadgeProps {
  /** バッジのサイズ */
  size?: 'sm' | 'md'
  /** タップ時にPaywallに遷移するか（デフォルト: true） */
  navigateToPaywall?: boolean
}

export function ProBadge({ size = 'sm', navigateToPaywall = true }: ProBadgeProps) {
  const navigate = useNavigate()

  const handleClick = (e: React.MouseEvent) => {
    if (navigateToPaywall) {
      e.stopPropagation()
      navigate('/paywall')
    }
  }

  const style: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    padding: size === 'sm' ? '2px 6px' : '4px 10px',
    borderRadius: '4px',
    backgroundColor: 'var(--accent)',
    color: '#fff',
    fontSize: size === 'sm' ? '10px' : '12px',
    fontWeight: 600,
    cursor: navigateToPaywall ? 'pointer' : 'default',
    letterSpacing: '0.5px',
  }

  return (
    <span
      style={style}
      onClick={handleClick}
      role={navigateToPaywall ? 'button' : undefined}
      tabIndex={navigateToPaywall ? 0 : undefined}
    >
      PRO
    </span>
  )
}
```

- [ ] **Step 2: コミット**

```bash
git add src/components/ui/ProBadge.tsx
git commit -m "feat: ProBadge コンポーネント（Pro限定コンテンツのバッジ表示+Paywall遷移）"
```

---

### Task 9: Pro機能ゲーティング（付箋・カード・分析）

**Files:**
- Modify: `src/hooks/useFusenLibrary.ts`（付箋フィルタリング）
- Modify: `src/pages/NotesPage.tsx`（ProBadge表示）
- Modify: `src/pages/FusenDetailPage.tsx`（Premium付箋のブロック）
- Modify: `src/pages/FlashCardListPage.tsx`（カードフィルタリング）
- Modify: `src/pages/AnalysisPage.tsx`（詳細分析のゲーティング）

ゲーティング方針:
- **付箋一覧**: Free付箋はフル表示。Premium付箋はサムネイル+ぼかし+ProBadgeオーバーレイ
- **付箋詳細**: Premium付箋→PaywallPageにリダイレクト
- **暗記カード**: Free付箋分のカードのみ表示。Premium分はProBadge付きでロック
- **分析ページ**: 基本分析はFree。「苦手分野詳細」等のPro機能はProBadge付きで案内

- [ ] **Step 1: useFusenLibrary にゲーティングロジック追加**

```typescript
// useFusenLibrary 内で tier + entitlement を組み合わせ:
// - hasEntitlement('notes_all') → 全付箋を返す
// - !hasEntitlement('notes_all') → tier: 'free' のみフル表示。premium は { ...note, locked: true }

// 付箋データに locked フラグを追加する型:
interface FusenWithLock extends OfficialNote {
  locked: boolean
}
```

`useFusenLibrary` の返り値に `locked` フラグを追加。UIは `locked: true` のカードにぼかし+ProBadgeを表示。

- [ ] **Step 2: NotesPage に ProBadge 表示追加**

付箋カードコンポーネント内で:
```tsx
{fusen.locked && (
  <div className={styles.lockOverlay}>
    <ProBadge size="md" />
  </div>
)}
```

- [ ] **Step 3: FusenDetailPage にリダイレクトガード追加**

```typescript
// FusenDetailPage 冒頭で:
const { hasEntitlement } = useEntitlement()
const note = OFFICIAL_NOTES.find(n => n.id === fusenId)

if (note && note.tier === 'premium' && !hasEntitlement('notes_all')) {
  return <Navigate to="/paywall" replace />
}
```

- [ ] **Step 4: FlashCardListPage にカードフィルタリング追加**

Free付箋に紐づくカードのみ表示。Premium分はセクション末尾に「Proで解放」案内。

- [ ] **Step 5: AnalysisPage に Pro 機能案内追加**

Proのみの分析セクションにはProBadge + 「Proにアップグレードして詳細分析を見る」CTA。

- [ ] **Step 6: コミット**

```bash
git add src/hooks/useFusenLibrary.ts src/pages/NotesPage.tsx src/pages/FusenDetailPage.tsx \
       src/pages/FlashCardListPage.tsx src/pages/AnalysisPage.tsx
git commit -m "feat: Pro機能ゲーティング（付箋ぼかし+ProBadge+カードフィルタ+分析ロック）"
```

---

### Task 10: SettingsPage — サブスクリプション管理

**Files:**
- Create: `src/pages/SettingsPage.tsx`
- Create: `src/pages/SettingsPage.module.css`

- [ ] **Step 1: SettingsPage 作成**

```
┌───────────────────────────────────┐
│  設定                              │
│                                   │
│  ── アカウント ──                  │
│  [ユーザーアイコン] makio8          │
│  LINE連携済み ✓                    │
│                                   │
│  ── プラン ──                      │
│  現在のプラン: Pro月額              │
│  次回更新日: 2026-04-27            │
│  [プランを管理する]  ← Stripe Portal│
│                                   │
│  ── その他 ──                      │
│  利用規約                          │
│  プライバシーポリシー                │
│  特定商取引法に基づく表記            │
│  ログアウト                        │
│  アカウント削除                     │
└───────────────────────────────────┘
```

UIの構成:
- アカウント情報セクション（表示名 + 連携状態）
- プランセクション:
  - Free: 「Proにアップグレード」ボタン → PaywallPage
  - Pro: プラン名 + 次回更新日 + 「プランを管理する」ボタン → Stripe Customer Portal
  - cancelled: 「解約済み（YYYY-MM-DD まで利用可能）」表示
- その他セクション（法務リンク + ログアウト + アカウント削除）

```typescript
// src/pages/SettingsPage.tsx 骨格
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useEntitlement } from '../hooks/useEntitlement'
import styles from './SettingsPage.module.css'

export function SettingsPage() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const { isPro, subscription, loading } = useEntitlement()
  const [portalLoading, setPortalLoading] = useState(false)

  const handleManageSubscription = async () => {
    if (!supabase) return
    setPortalLoading(true)
    try {
      const response = await supabase.functions.invoke('stripe-portal')
      if (response.data?.url) {
        window.location.href = response.data.url
      }
    } catch (err) {
      console.error('Portal error:', err)
    } finally {
      setPortalLoading(false)
    }
  }

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>設定</h1>

      {/* アカウントセクション */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>アカウント</h2>
        <div className={styles.card}>
          <p>{user?.email ?? '未ログイン'}</p>
        </div>
      </section>

      {/* プランセクション */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>プラン</h2>
        <div className={styles.card}>
          {loading ? (
            <p>読み込み中...</p>
          ) : isPro && subscription ? (
            <>
              <p className={styles.planName}>
                {subscription.productId === 'pro_monthly' ? 'Pro月額プラン' : 'Pro年度パス'}
              </p>
              <p className={styles.planDetail}>
                {subscription.status === 'cancelled'
                  ? `解約済み（${new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')} まで利用可能）`
                  : `次回更新日: ${new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}`
                }
              </p>
              <button
                className={styles.manageButton}
                onClick={handleManageSubscription}
                disabled={portalLoading}
              >
                {portalLoading ? '読み込み中...' : 'プランを管理する'}
              </button>
            </>
          ) : (
            <>
              <p className={styles.planName}>Free</p>
              <button
                className={styles.upgradeButton}
                onClick={() => navigate('/paywall')}
              >
                Proにアップグレード
              </button>
            </>
          )}
        </div>
      </section>

      {/* その他セクション */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>その他</h2>
        <div className={styles.linkList}>
          <a href="/legal/terms" className={styles.link}>利用規約</a>
          <a href="/legal/privacy" className={styles.link}>プライバシーポリシー</a>
          <a href="/legal/tokushoho" className={styles.link}>特定商取引法に基づく表記</a>
          <button className={styles.logoutButton} onClick={handleLogout}>
            ログアウト
          </button>
          <button className={styles.deleteButton} onClick={() => {/* Task: Plan 5 */}}>
            アカウント削除
          </button>
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 2: CSS Modules スタイル作成**

- [ ] **Step 3: コミット**

```bash
git add src/pages/SettingsPage.tsx src/pages/SettingsPage.module.css
git commit -m "feat: SettingsPage（プラン表示+Stripe Portal連携+ログアウト+アカウント削除導線）"
```

---

### Task 11: ルーティング更新 + 環境変数追加

**Files:**
- Modify: `src/routes.tsx`（/paywall, /settings ルート追加）
- Modify: `vite.config.ts`（必要なら）

- [ ] **Step 1: routes.tsx に新ルート追加**

```typescript
// src/routes.tsx に追加:
const PaywallPage = React.lazy(() => import('./pages/PaywallPage').then(m => ({ default: m.PaywallPage })))
const SettingsPage = React.lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))

// ルート配列に追加:
{
  path: '/paywall',
  element: <AppLayout><Suspense fallback={<Loading />}><PaywallPage /></Suspense></AppLayout>,
},
{
  path: '/settings',
  element: <AppLayout><Suspense fallback={<Loading />}><SettingsPage /></Suspense></AppLayout>,
},
```

- [ ] **Step 2: AppLayout の REDESIGNED_EXACT に新ページを追加**

`/paywall` と `/settings` は新デザインなので、REDESIGNED_EXACT に追加してAppLayoutが正しくレンダリングされるようにする。

- [ ] **Step 3: 環境変数ドキュメント更新**

`.env.example` （または CLAUDE.md）に必要な環境変数を記載:

```
# Stripe（課金用。Phase 2以降）
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
VITE_STRIPE_PRICE_MONTHLY=price_...
VITE_STRIPE_PRICE_ANNUAL=price_...
STRIPE_SECRET_KEY=sk_test_...                # Edge Function用（supabase secrets setで設定）
STRIPE_WEBHOOK_SECRET=whsec_...              # Edge Function用
```

- [ ] **Step 4: コミット**

```bash
git add src/routes.tsx
git commit -m "feat: /paywall + /settings ルート追加 + Stripe環境変数ドキュメント"
```

---

### Task 12: E2E 検証 + CLAUDE.md 更新

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: ビルド確認**

```bash
npm run build
```

Expected: 型エラーなし

- [ ] **Step 2: Stripe テストモードでの E2E フロー確認**

手動テスト手順:
1. ログイン → `/paywall` にアクセス
2. 「Pro月額を始める」をクリック
3. Stripe Checkout に遷移（テストカード `4242 4242 4242 4242` で決済）
4. 決済完了 → `/settings?checkout=success` にリダイレクト
5. `/settings` でプラン表示を確認（「Pro月額プラン」が表示される）
6. 「プランを管理する」→ Stripe Customer Portal で解約を確認
7. `/notes` で Premium 付箋がアンロックされていることを確認
8. ログアウト → 再ログイン → 権利が維持されていることを確認

テスト用 Stripe カード:
- 成功: `4242 4242 4242 4242`
- 残高不足: `4000 0000 0000 9995`
- 認証必要: `4000 0025 0000 3155`

- [ ] **Step 3: Webhook テスト**

```bash
# Stripe CLI でローカル Webhook テスト
stripe listen --forward-to https://<project-ref>.supabase.co/functions/v1/stripe-webhook
stripe trigger checkout.session.completed
```

DB確認:
```sql
SELECT * FROM purchase_events ORDER BY created_at DESC LIMIT 5;
SELECT * FROM subscription_contracts ORDER BY created_at DESC LIMIT 5;
SELECT * FROM entitlements ORDER BY created_at DESC LIMIT 5;
SELECT * FROM billing_transactions ORDER BY created_at DESC LIMIT 5;
```

- [ ] **Step 4: CLAUDE.md 更新**

開発状況セクションに追記:

```markdown
- **課金実装（Stripe + サブスクリプション管理）（2026-XX-XX）**
  - Stripe Checkout Session + Webhook + Customer Portal（Edge Function 3本）
  - 署名検証 + 冪等性保証 + billing_transactions 記録
  - useEntitlement フック（check_my_entitlement RPC + localStorage キャッシュ + visibilitychange 再検証）
  - PaywallPage（Free/Pro比較 + Stripe Checkout連携）
  - SettingsPage（プラン表示 + Stripe Portal連携 + ログアウト + アカウント削除導線）
  - Pro機能ゲーティング: 付箋（ぼかし+ProBadge）/ カード / 分析
  - 次: Plan 5（アカウント削除 Purge バッチ）
```

コマンドセクションに追記:

```markdown
- `npx supabase functions deploy stripe-checkout --no-verify-jwt` — Checkout Session Edge Function デプロイ
- `npx supabase functions deploy stripe-webhook --no-verify-jwt` — Webhook Edge Function デプロイ
- `npx supabase functions deploy stripe-portal --no-verify-jwt` — Customer Portal Edge Function デプロイ
- `stripe listen --forward-to <url>` — Stripe CLI ローカル Webhook テスト
```

- [ ] **Step 5: コミット**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md に課金実装完了状況 + Edge Functionコマンド追記"
```

---

## 完了基準

- [ ] Stripe Dashboard に商品2つ（pro_monthly / pro_annual）+ Webhook エンドポイントが登録済み
- [ ] Edge Function 3本（checkout / webhook / portal）がデプロイ済み
- [ ] Webhook 署名検証が動作し、未署名リクエストが拒否されることを確認
- [ ] purchase_events による冪等性（同一イベント2回処理でスキップ）を確認
- [ ] billing_transactions に決済記録が保存されることを確認
- [ ] useEntitlement フックが check_my_entitlement RPC を正しく呼び出し、キャッシュが機能する
- [ ] PaywallPage → Stripe Checkout → 決済完了 → 権利付与 の E2E フローが成功
- [ ] Pro付箋がアンロック、Free付箋のみ表示（未課金時）のゲーティングが動作
- [ ] SettingsPage から Stripe Customer Portal に遷移して解約できる
- [ ] `npm run build` が型エラーなしで成功

## セキュリティチェックリスト

- [ ] Stripe Secret Key / Webhook Secret が `.env.local` のみにあり、gitにコミットされていない
- [ ] Webhook ハンドラーが署名検証を必ず最初に実行（`constructEvent`）
- [ ] 課金テーブルの RLS が SELECT のみ（ユーザーからの INSERT/UPDATE/DELETE 不可）
- [ ] Edge Function が service_role キーを使い、RLS をバイパスして課金データを操作
- [ ] `can_purchase()` RPC で二重課金が防止されている
- [ ] `idx_ent_no_duplicate_active` DB制約でレースコンディション時の二重付与がブロックされている

## 次のステップ

Plan 5（アカウント削除）の計画書作成:
- `request_account_deletion()` RPC のUI連携
- Purge バッチ（pg_cron日次実行）
- billing_transactions の匿名化（sentinel UUID）
- Apple revoke / LINE unlink
- アカウント削除確認ダイアログ
