# 認証統合（LINE Login + Apple Login）実装計画

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** LINE Login + Apple Login による認証を実装し、全画面をログイン必須にする

**Architecture:** Supabase Auth のOAuthプロバイダとして LINE/Apple を設定。ログイン後に line_accounts テーブルへLINE情報を保存。初回ログイン時にオンボーディング（user_profiles設定）を表示。

**Tech Stack:** React 19 / Supabase Auth / LINE Login v2.1 / Sign in with Apple

**Depends on:** Plan 1（Supabaseスキーマ構築）完了

---

## 引き継ぎコンテキスト

### 全体ロードマップ

```
Plan 1 (完了)  → Plan 2 (本計画)  → Plan 3         → Plan 4/5
スキーマ構築      認証統合           Repo移行          課金/削除
(SQL only)      (LINE+Apple)      (localStorage→    (Stripe+IAP)
                                   Supabase移行)
```

### このプランの位置づけ

Plan 2 は「ユーザーがアプリにログインできるようにする」最初のフロントエンド実装。
Plan 1 で構築済みのDBスキーマ（users / user_profiles / line_accounts テーブル + handle_new_user トリガー）を活用し、認証フローを完成させる。

### 前提条件（Plan 1 完了で保証されるもの）

- `supabase/migrations/` に5ファイルのマイグレーション適用済み
- `handle_new_user` トリガー: auth.users INSERT → public.users 自動作成
- `users` テーブル: id(uuid), status, role, created_at, updated_at
- `user_profiles` テーブル: user_id, display_name, target_exam_year, university, target_score, onboarding_completed_at
- `line_accounts` テーブル: user_id, line_user_id, display_name, picture_url, is_friend, friend_added_at
- RLS: users は SELECT のみ、user_profiles は全操作可、line_accounts は SELECT のみ（INSERT/UPDATE はサーバーサイド）

### 次のステップ（Plan 3: Repo移行）

- localStorage → Supabase データ移行（初回ログイン時）
- SyncRepository パターン導入
- answer_history / bookmarks のリポジトリ統一

### 重要な技術判断

**LINE Login の実装方式:**
Supabase Auth JS SDK の `Provider` 型に `'line'` は含まれていない（apple, google, kakao 等のみ）。
LINE Login は以下のいずれかの方式で実装する:

- **方式A（推奨）: Supabase Dashboard で LINE を Third-Party Auth (OIDC) として登録**
  - Supabase Dashboard > Authentication > Providers > Add Custom Provider
  - LINE Login v2.1 の OpenID Connect 対応を利用
  - クライアントは `signInWithOAuth({ provider: 'line' as Provider })` で呼び出し（Supabase 側が `line` プロバイダを認識するため動作する）
  - LINE の OIDC Discovery URL: `https://access.line.me/.well-known/openid-configuration`

- **方式B: 手動 OAuth フロー + signInWithIdToken**
  - LINE OAuth を自前で実装し、取得した ID Token を `signInWithIdToken({ provider: 'custom:line', token })` で Supabase に渡す
  - より複雑だが、LINE 固有の情報（友だち追加状態等）を認証フロー内で取得しやすい

**本計画では方式Aを採用** し、LINE固有情報（友だち追加状態）は認証後にLINE API を別途呼ぶ。

---

## ファイルマップ

| アクション | ファイル | 責務 |
|-----------|---------|------|
| 修正 | `src/lib/supabase.ts` | Database型更新、OAuth ヘルパー追加 |
| 作成 | `src/contexts/AuthContext.tsx` | 認証状態のグローバル管理（Context + Provider） |
| 修正 | `src/hooks/useAuth.ts` | Context ベースに全面書き換え |
| 作成 | `src/lib/line-account.ts` | line_accounts 保存ロジック |
| 作成 | `src/lib/__tests__/line-account.test.ts` | line_accounts ロジックのテスト |
| 書換 | `src/pages/LoginPage.tsx` | Soft Companion デザインでフル書き換え |
| 作成 | `src/pages/LoginPage.module.css` | ログイン画面スタイル |
| 作成 | `src/pages/OnboardingPage.tsx` | オンボーディングフロー（受験年度・目標設定） |
| 作成 | `src/pages/OnboardingPage.module.css` | オンボーディングスタイル |
| 作成 | `src/components/auth/AuthGuard.tsx` | 認証必須ガードコンポーネント |
| 作成 | `src/pages/AuthCallbackPage.tsx` | OAuth コールバック処理ページ |
| 修正 | `src/routes.tsx` | AuthGuard ラッパー追加、callback ルート追加 |
| 修正 | `src/App.tsx` | AuthProvider でアプリ全体をラップ |
| 修正 | `src/components/layout/AppLayout.tsx` | 認証状態の表示をContext経由に変更 |
| 修正 | `src/types/user.ts` | DB設計spec v1.1 に合わせた型更新 |

---

### Task 1: Supabase Auth プロバイダ設定（LINE + Apple）

**Files:**
- No code files (Supabase Dashboard + 外部サービス設定)

**参照:** DB設計spec v1.1 §9

> このタスクはコンソール操作のみ。コード変更なし。

- [ ] **Step 1: LINE Developers Console — LINE Login チャネル作成**

1. [LINE Developers Console](https://developers.line.biz/console/) にログイン
2. 新規プロバイダー作成（既存あれば再利用）
3. 新規チャネル作成 > LINE Login
4. 設定値:
   - チャネル名: `国試ノート`
   - チャネル説明: `薬剤師国家試験対策アプリ`
   - アプリタイプ: `ウェブアプリ`
   - メールアドレス: （開発者メール）
5. Callback URL 設定:
   - `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
   - 開発用: `http://localhost:54321/auth/v1/callback` （ローカルSupabase）
6. OpenID Connect: **有効** にする
7. 以下をメモ:
   - Channel ID（= Client ID）
   - Channel Secret（= Client Secret）

- [ ] **Step 2: LINE Official Account — 友だち追加オプション**

1. [LINE Official Account Manager](https://manager.line.biz/) で公式アカウント確認
2. LINE Login チャネルと公式アカウントを連携
3. 「Add friend option」を有効化 → ログイン画面に友だち追加チェックボックスが表示される

- [ ] **Step 3: Apple Developer Console — Sign in with Apple 設定**

1. [Apple Developer](https://developer.apple.com/) にログイン
2. Certificates, Identifiers & Profiles > Identifiers > App IDs
3. Sign in with Apple を有効化
4. Services IDs 作成:
   - Description: `国試ノート Web`
   - Identifier: `com.kokushinote.web`（仮）
   - Domains: `<SUPABASE_PROJECT_REF>.supabase.co`
   - Return URLs: `https://<SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
5. Keys 作成:
   - Key Name: `国試ノート Auth`
   - Sign in with Apple を有効化
   - 以下をメモ:
     - Key ID
     - Team ID
     - Client ID (Services ID の Identifier)
     - Private Key (.p8 ファイルダウンロード)

- [ ] **Step 4: Supabase Dashboard — LINE プロバイダ登録**

1. Supabase Dashboard > Authentication > Providers
2. LINE を検索（Third-Party Auth / OIDC に該当する場合あり）
3. もし LINE がビルトインにない場合:
   - 「Add Custom Provider」を選択
   - Provider name: `line`
   - Client ID: LINE Channel ID
   - Client Secret: LINE Channel Secret
   - Issuer URL: `https://access.line.me`
   - Discovery URL: `https://access.line.me/.well-known/openid-configuration`（LINEがOIDC対応の場合）
   - もしOIDC Discovery未対応の場合、手動で以下を設定:
     - Authorization URL: `https://access.line.me/oauth2/v2.1/authorize`
     - Token URL: `https://api.line.me/oauth2/v2.1/token`
     - User Info URL: `https://api.line.me/v2/profile`
   - Scopes: `profile openid email`
4. Redirect URL が LINE Developers Console の Callback URL と一致することを確認

- [ ] **Step 5: Supabase Dashboard — Apple プロバイダ登録**

1. Supabase Dashboard > Authentication > Providers > Apple
2. Apple を有効化
3. 設定値:
   - Client ID (Services ID): `com.kokushinote.web`
   - Secret Key: .p8 ファイルの内容を貼り付け
   - Key ID: Apple Key ID
   - Team ID: Apple Team ID
4. Redirect URL が Apple Developer Console の Return URL と一致することを確認

- [ ] **Step 6: 環境変数の設定**

`.env.local` に以下を追加:

```bash
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<ANON_KEY>
# 注意: SERVICE_ROLE_KEY はフロントに含めない（DB設計spec §4.3）
```

---

### Task 2: 型定義の更新（UserProfile + Database型）

**Files:**
- Modify: `src/types/user.ts`
- Modify: `src/lib/supabase.ts`

- [ ] **Step 1: `src/types/user.ts` をDB設計spec v1.1に合わせて更新**

```typescript
// src/types/user.ts
// DB設計spec v1.1 §3.2 に準拠

export type UserStatus = 'active' | 'disabled' | 'pending_deletion'
export type UserRole = 'student' | 'graduate' | 'lecturer' | 'admin'

export interface DbUser {
  id: string
  status: UserStatus
  role: UserRole
  created_at: string
  updated_at: string
  deletion_requested_at: string | null
  scheduled_purge_at: string | null
  purged_at: string | null
}

export interface UserProfile {
  user_id: string
  display_name: string | null
  target_exam_year: number | null
  university: string | null
  study_start_date: string | null
  target_score: number | null
  onboarding_completed_at: string | null
  last_active_at: string | null
  created_at: string
  updated_at: string
}

export interface LineAccount {
  user_id: string
  line_user_id: string
  display_name: string | null
  picture_url: string | null
  is_friend: boolean
  friend_added_at: string | null
  created_at: string
  updated_at: string
}
```

- [ ] **Step 2: `src/lib/supabase.ts` の Database 型を更新**

既存の `Database` インターフェースに新テーブル型を追加する。
旧テーブル定義（questions, profiles, sticky_notes, saved_notes）は残しつつ、新テーブルを追加:

```typescript
// src/lib/supabase.ts に追加する型定義
// 既存の import に追加
import type { DbUser, UserProfile, LineAccount } from '../types/user'

// Database インターフェース内に追加
users: {
  Row: DbUser
  Insert: Pick<DbUser, 'id' | 'status' | 'role'>
  Update: Partial<Pick<DbUser, 'status' | 'role'>>
}
user_profiles: {
  Row: UserProfile
  Insert: Pick<UserProfile, 'user_id'> & Partial<Omit<UserProfile, 'user_id' | 'created_at' | 'updated_at'>>
  Update: Partial<Omit<UserProfile, 'user_id' | 'created_at' | 'updated_at'>>
}
line_accounts: {
  Row: LineAccount
  Insert: Pick<LineAccount, 'user_id' | 'line_user_id'> & Partial<Omit<LineAccount, 'user_id' | 'line_user_id' | 'created_at' | 'updated_at'>>
  Update: Partial<Omit<LineAccount, 'user_id' | 'created_at' | 'updated_at'>>
}
```

- [ ] **Step 3: 旧 OAuth ヘルパー関数を削除**

`src/lib/supabase.ts` の `signInWithEmail`, `signUpWithEmail`, `signOut`, `getUser` を削除。
これらは Task 3 で AuthContext に移行する。

- [ ] **Step 4: ビルド確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/types/user.ts src/lib/supabase.ts
git commit -m "feat: DB設計spec v1.1準拠の型定義（DbUser/UserProfile/LineAccount + Database型更新）"
```

---

### Task 3: AuthContext + AuthProvider 作成

**Files:**
- Create: `src/contexts/AuthContext.tsx`
- Modify: `src/hooks/useAuth.ts`

認証状態をアプリ全体で共有するため、React Context パターンを導入する。
現在の `useAuth` フックは各コンポーネントで独立に `supabase.auth.getSession()` を呼ぶ設計だが、
Context にすることで1箇所でセッション監視し、全コンポーネントが同じ状態を参照できる。

- [ ] **Step 1: AuthContext 作成**

```typescript
// src/contexts/AuthContext.tsx
import { createContext, useState, useEffect, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { User, Session, Provider } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { UserProfile } from '../types/user'

export interface AuthState {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  needsOnboarding: boolean
}

export interface AuthActions {
  signInWithLine: () => Promise<void>
  signInWithApple: () => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export type AuthContextValue = AuthState & AuthActions

export const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [needsOnboarding, setNeedsOnboarding] = useState(false)

  // プロフィール取得（オンボーディング完了判定に使用）
  const fetchProfile = useCallback(async (userId: string) => {
    if (!supabase) return null
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    return data as UserProfile | null
  }, [])

  const refreshProfile = useCallback(async () => {
    if (!user) return
    const p = await fetchProfile(user.id)
    setProfile(p)
    setNeedsOnboarding(!p?.onboarding_completed_at)
  }, [user, fetchProfile])

  // 初回セッション確認 + 認証状態監視
  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    // 初回セッション確認
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      setSession(s)
      setUser(s?.user ?? null)
      if (s?.user) {
        const p = await fetchProfile(s.user.id)
        setProfile(p)
        setNeedsOnboarding(!p?.onboarding_completed_at)
      }
      setLoading(false)
    })

    // 認証状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        setSession(s)
        setUser(s?.user ?? null)
        if (s?.user) {
          const p = await fetchProfile(s.user.id)
          setProfile(p)
          setNeedsOnboarding(!p?.onboarding_completed_at)
        } else {
          setProfile(null)
          setNeedsOnboarding(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [fetchProfile])

  const signInWithLine = useCallback(async () => {
    if (!supabase) return
    // LINE は Supabase Dashboard で Custom OIDC プロバイダとして登録済み
    // Provider型にlineが含まれていないため型アサーションが必要
    await supabase.auth.signInWithOAuth({
      provider: 'line' as Provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'profile openid email',
        queryParams: {
          // LINE Login v2.1: 友だち追加オプション
          // bot_prompt: 'aggressive' → ログイン画面に友だち追加チェックボックスを常時表示
          bot_prompt: 'aggressive',
        },
      },
    })
  }, [])

  const signInWithApple = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'name email',
      },
    })
  }, [])

  const handleSignOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setSession(null)
    setProfile(null)
    setNeedsOnboarding(false)
  }, [])

  const value: AuthContextValue = {
    user,
    session,
    profile,
    loading,
    needsOnboarding,
    signInWithLine,
    signInWithApple,
    signOut: handleSignOut,
    refreshProfile,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
```

- [ ] **Step 2: `useAuth` フックを Context ベースに書き換え**

```typescript
// src/hooks/useAuth.ts
import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import type { AuthContextValue } from '../contexts/AuthContext'

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

- [ ] **Step 3: ビルド確認**

Run: `npx tsc --noEmit`
Expected: エラーなし（AppLayout.tsx の signIn/signUp 参照が壊れるので Task 7 で修正）

- [ ] **Step 4: コミット**

```bash
git add src/contexts/AuthContext.tsx src/hooks/useAuth.ts
git commit -m "feat: AuthContext + AuthProvider（LINE/Apple OAuth対応、プロフィール取得、オンボーディング判定）"
```

---

### Task 4: LINE Account 保存ロジック

**Files:**
- Create: `src/lib/line-account.ts`
- Create: `src/lib/__tests__/line-account.test.ts`

LINE Login 後に LINE 固有情報（userId, display_name, picture_url, 友だち状態）を
`line_accounts` テーブルに保存するロジック。

`line_accounts` の INSERT/UPDATE は RLS で authenticatedユーザーからは SELECT のみ許可されているため、
service_role が必要。しかしフロントエンドに service_role_key は含められない（セキュリティ）。

**解決策:** Supabase Edge Function を使う、またはRLSポリシーを追加する。
本計画ではRLSポリシー追加方式を採用（Edge Function不要で実装がシンプル）。

- [ ] **Step 1: RLSポリシー追加のマイグレーション作成**

```sql
-- supabase/migrations/20260327_006_line_accounts_insert_policy.sql
-- LINE Login 後にユーザー自身が line_accounts を INSERT/UPDATE できるように
-- 自分のuser_idのレコードのみ操作可能

CREATE POLICY "Users can insert own LINE account" ON line_accounts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own LINE account" ON line_accounts
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: LINE アカウント保存コアロジック作成**

```typescript
// src/lib/line-account.ts
import { supabase } from './supabase'
import type { LineAccount } from '../types/user'

/**
 * LINE Login で取得した情報を取得元から抽出するためのユーティリティ。
 * Supabase Auth の user_metadata に LINE から渡されるフィールドを読み取る。
 */
export interface LineUserMetadata {
  /** LINE userId（sub claim） */
  sub: string
  /** LINE 表示名 */
  name?: string
  /** LINE プロフィール画像URL */
  picture?: string
  /** LINE メールアドレス（許可された場合） */
  email?: string
}

/**
 * auth.users.raw_user_meta_data から LINE 固有情報を抽出する。
 * LINE OIDC の ID Token に含まれる claim がここに格納される。
 */
export function extractLineMetadata(
  rawMetadata: Record<string, unknown> | undefined
): LineUserMetadata | null {
  if (!rawMetadata) return null

  const sub = rawMetadata.sub as string | undefined
  if (!sub) return null

  return {
    sub,
    name: (rawMetadata.name as string) ?? (rawMetadata.full_name as string) ?? undefined,
    picture: (rawMetadata.picture as string) ?? (rawMetadata.avatar_url as string) ?? undefined,
    email: rawMetadata.email as string | undefined,
  }
}

/**
 * LINE Login 後に line_accounts テーブルへ保存（UPSERT）。
 * 既存レコードがあれば display_name / picture_url を更新する。
 */
export async function saveLineAccount(
  userId: string,
  metadata: LineUserMetadata
): Promise<{ data: LineAccount | null; error: string | null }> {
  if (!supabase) {
    return { data: null, error: 'Supabase未設定' }
  }

  const { data, error } = await supabase
    .from('line_accounts')
    .upsert(
      {
        user_id: userId,
        line_user_id: metadata.sub,
        display_name: metadata.name ?? null,
        picture_url: metadata.picture ?? null,
      },
      { onConflict: 'user_id' }
    )
    .select()
    .single()

  if (error) {
    return { data: null, error: error.message }
  }
  return { data: data as LineAccount, error: null }
}

/**
 * LINE 友だち追加状態を更新する。
 * LINE Login OAuth レスポンスの friendship_status_changed パラメータから判定。
 *
 * 注意: friendship_status_changed は LINE Login のコールバック URL パラメータに
 * 含まれる場合がある。Supabase Auth が中継するため、
 * auth callback ページで URL パラメータから取得する。
 */
export async function updateFriendshipStatus(
  userId: string,
  isFriend: boolean
): Promise<void> {
  if (!supabase) return

  await supabase
    .from('line_accounts')
    .update({
      is_friend: isFriend,
      friend_added_at: isFriend ? new Date().toISOString() : null,
    })
    .eq('user_id', userId)
}
```

- [ ] **Step 3: テスト作成**

```typescript
// src/lib/__tests__/line-account.test.ts
import { describe, it, expect } from 'vitest'
import { extractLineMetadata } from '../line-account'

describe('extractLineMetadata', () => {
  it('LINE OIDC の標準的な metadata を正しく抽出する', () => {
    const raw = {
      sub: 'U1234567890abcdef',
      name: 'テスト太郎',
      picture: 'https://profile.line-scdn.net/xxxx',
      email: 'test@example.com',
      iss: 'https://access.line.me',
    }

    const result = extractLineMetadata(raw)

    expect(result).toEqual({
      sub: 'U1234567890abcdef',
      name: 'テスト太郎',
      picture: 'https://profile.line-scdn.net/xxxx',
      email: 'test@example.com',
    })
  })

  it('sub がない場合は null を返す', () => {
    const raw = { name: 'テスト' }
    expect(extractLineMetadata(raw)).toBeNull()
  })

  it('undefined の場合は null を返す', () => {
    expect(extractLineMetadata(undefined)).toBeNull()
  })

  it('name がない場合は full_name にフォールバックする', () => {
    const raw = {
      sub: 'U123',
      full_name: 'フォールバック名',
    }

    const result = extractLineMetadata(raw)
    expect(result?.name).toBe('フォールバック名')
  })

  it('picture がない場合は avatar_url にフォールバックする', () => {
    const raw = {
      sub: 'U123',
      avatar_url: 'https://example.com/avatar.png',
    }

    const result = extractLineMetadata(raw)
    expect(result?.picture).toBe('https://example.com/avatar.png')
  })

  it('オプションフィールドが全てない場合も正しく動作する', () => {
    const raw = { sub: 'U123' }

    const result = extractLineMetadata(raw)
    expect(result).toEqual({
      sub: 'U123',
      name: undefined,
      picture: undefined,
      email: undefined,
    })
  })
})
```

- [ ] **Step 4: テスト実行**

Run: `npx vitest run src/lib/__tests__/line-account.test.ts`
Expected: 6テスト全パス

- [ ] **Step 5: コミット**

```bash
git add src/lib/line-account.ts src/lib/__tests__/line-account.test.ts supabase/migrations/20260327_006_line_accounts_insert_policy.sql
git commit -m "feat: LINE Account 保存ロジック（extractLineMetadata + saveLineAccount + RLSポリシー追加）"
```

---

### Task 5: LoginPage — Soft Companion リデザイン

**Files:**
- Rewrite: `src/pages/LoginPage.tsx`
- Create: `src/pages/LoginPage.module.css`

既存の LoginPage は Ant Design（メール/パスワード認証）。
LINE Login + Apple Login のOAuth認証画面に全面書き換える。

- [ ] **Step 1: LoginPage.module.css 作成**

```css
/* src/pages/LoginPage.module.css */
.container {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  font-family: var(--font);
  padding: 24px 16px;
}

.card {
  width: 100%;
  max-width: 400px;
  background: var(--card);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-md);
  padding: 40px 24px 32px;
  text-align: center;
}

.logo {
  font-size: 48px;
  margin-bottom: 8px;
}

.title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 4px;
}

.subtitle {
  font-size: 14px;
  color: var(--text-2);
  margin: 0 0 32px;
}

.buttonGroup {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.lineButton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: var(--r);
  font-family: var(--font);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  /* LINE Brand Color */
  background: #06c755;
  color: #ffffff;
}

.lineButton:hover {
  opacity: 0.9;
}

.lineButton:active {
  transform: scale(0.98);
}

.lineButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.lineIcon {
  width: 24px;
  height: 24px;
}

.appleButton {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: var(--r);
  font-family: var(--font);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s, transform 0.1s;
  /* Apple Black */
  background: #000000;
  color: #ffffff;
}

.appleButton:hover {
  opacity: 0.85;
}

.appleButton:active {
  transform: scale(0.98);
}

.appleButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.agreement {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 24px;
  text-align: left;
}

.checkbox {
  margin-top: 2px;
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  cursor: pointer;
  flex-shrink: 0;
}

.agreementText {
  font-size: 12px;
  color: var(--text-2);
  line-height: 1.5;
}

.agreementLink {
  color: var(--accent);
  text-decoration: underline;
  cursor: pointer;
}

.error {
  background: rgba(239, 68, 68, 0.08);
  color: var(--ng);
  border-radius: var(--r-sm);
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 16px;
  text-align: left;
}

.footer {
  font-size: 11px;
  color: var(--text-3);
  margin-top: 16px;
}
```

- [ ] **Step 2: LoginPage.tsx 書き換え**

```tsx
// src/pages/LoginPage.tsx
import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import styles from './LoginPage.module.css'

export function LoginPage() {
  const { signInWithLine, signInWithApple, loading } = useAuth()
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleLineLogin = async () => {
    if (!agreed) {
      setError('利用規約への同意が必要です')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await signInWithLine()
      // OAuth リダイレクトが発生するため、ここには戻らない
    } catch {
      setError('LINEログインに失敗しました。もう一度お試しください。')
      setSubmitting(false)
    }
  }

  const handleAppleLogin = async () => {
    if (!agreed) {
      setError('利用規約への同意が必要です')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await signInWithApple()
      // OAuth リダイレクトが発生するため、ここには戻らない
    } catch {
      setError('Appleログインに失敗しました。もう一度お試しください。')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <p style={{ color: 'var(--text-2)' }}>読み込み中...</p>
        </div>
      </div>
    )
  }

  const isDisabled = submitting || !agreed

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.logo}>💊</div>
        <h1 className={styles.title}>国試ノート</h1>
        <p className={styles.subtitle}>薬剤師国家試験対策</p>

        {error && <div className={styles.error}>{error}</div>}

        <label className={styles.agreement}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={agreed}
            onChange={(e) => {
              setAgreed(e.target.checked)
              if (e.target.checked) setError(null)
            }}
          />
          <span className={styles.agreementText}>
            <a
              className={styles.agreementLink}
              href="/terms"
              target="_blank"
              rel="noopener noreferrer"
            >
              利用規約
            </a>
            {' と '}
            <a
              className={styles.agreementLink}
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
            >
              プライバシーポリシー
            </a>
            に同意する
          </span>
        </label>

        <div className={styles.buttonGroup}>
          <button
            className={styles.lineButton}
            onClick={handleLineLogin}
            disabled={isDisabled}
            type="button"
          >
            <svg className={styles.lineIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
            </svg>
            LINEでログイン
          </button>

          <button
            className={styles.appleButton}
            onClick={handleAppleLogin}
            disabled={isDisabled}
            type="button"
          >
            <svg width="20" height="24" viewBox="0 0 17 20" fill="currentColor">
              <path d="M13.545 10.239c-.022-2.234 1.828-3.31 1.912-3.362-1.041-1.52-2.662-1.728-3.239-1.752-1.379-.139-2.692.811-3.392.811-.699 0-1.781-.791-2.926-.77-1.505.022-2.893.875-3.669 2.222-1.563 2.712-.4 6.729 1.124 8.932.744 1.076 1.634 2.284 2.801 2.241 1.123-.045 1.548-.727 2.906-.727 1.358 0 1.739.727 2.924.704 1.21-.022 1.98-1.096 2.72-2.174.857-1.248 1.21-2.455 1.231-2.518-.027-.012-2.362-.907-2.392-3.507zM11.321 3.508c.619-.75 1.036-1.79.922-2.828-.891.036-1.97.594-2.609 1.343-.573.663-1.074 1.722-.94 2.738.995.077 2.009-.505 2.627-1.253z" />
            </svg>
            Appleでログイン
          </button>
        </div>

        <p className={styles.footer}>
          ログインすると学習データがクラウドに保存されます
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: ビルド確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/pages/LoginPage.tsx src/pages/LoginPage.module.css
git commit -m "feat: LoginPage Soft Companion リデザイン（LINE緑ボタン + Apple黒ボタン + 利用規約同意）"
```

---

### Task 6: OAuth コールバックページ + LINE Account 保存

**Files:**
- Create: `src/pages/AuthCallbackPage.tsx`

OAuth リダイレクト後のコールバック処理。Supabase Auth がセッションを自動処理した後、
LINE Login の場合は `line_accounts` テーブルに保存し、オンボーディング判定を行う。

- [ ] **Step 1: AuthCallbackPage.tsx 作成**

```tsx
// src/pages/AuthCallbackPage.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { extractLineMetadata, saveLineAccount, updateFriendshipStatus } from '../lib/line-account'
import styles from './LoginPage.module.css'

export function AuthCallbackPage() {
  const navigate = useNavigate()
  const { user, loading, needsOnboarding, refreshProfile } = useAuth()
  const [processing, setProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (loading) return

    if (!user) {
      // 認証失敗 → ログイン画面に戻す
      navigate('/login', { replace: true })
      return
    }

    const handleCallback = async () => {
      try {
        // LINE Login の場合: line_accounts に保存
        const lineMetadata = extractLineMetadata(
          user.user_metadata as Record<string, unknown> | undefined
        )
        if (lineMetadata) {
          await saveLineAccount(user.id, lineMetadata)

          // 友だち追加状態をURLパラメータから取得
          // LINE Login はコールバック時に friendship_status_changed=true を付与する場合がある
          const params = new URLSearchParams(window.location.search)
          const friendshipChanged = params.get('friendship_status_changed')
          if (friendshipChanged === 'true') {
            await updateFriendshipStatus(user.id, true)
          }
        }

        // プロフィール再取得（オンボーディング判定）
        await refreshProfile()

        // 遷移先決定
        if (needsOnboarding) {
          navigate('/onboarding', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } catch {
        setError('ログイン処理中にエラーが発生しました')
      } finally {
        setProcessing(false)
      }
    }

    handleCallback()
  }, [user, loading, needsOnboarding, navigate, refreshProfile])

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.error}>{error}</div>
          <button
            className={styles.lineButton}
            onClick={() => navigate('/login', { replace: true })}
            type="button"
            style={{ background: 'var(--accent)' }}
          >
            ログイン画面に戻る
          </button>
        </div>
      </div>
    )
  }

  if (loading || processing) {
    return (
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>💊</div>
          <p style={{ color: 'var(--text-2)', fontFamily: 'var(--font)' }}>
            ログイン処理中...
          </p>
        </div>
      </div>
    )
  }

  return null
}
```

- [ ] **Step 2: ビルド確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/pages/AuthCallbackPage.tsx
git commit -m "feat: AuthCallbackPage（OAuth コールバック処理 + LINE Account 自動保存）"
```

---

### Task 7: オンボーディングページ

**Files:**
- Create: `src/pages/OnboardingPage.tsx`
- Create: `src/pages/OnboardingPage.module.css`

初回ログイン時に表示されるオンボーディング画面。
受験年度、目標点数、大学名（任意）を設定する。

- [ ] **Step 1: OnboardingPage.module.css 作成**

```css
/* src/pages/OnboardingPage.module.css */
.container {
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: var(--bg);
  font-family: var(--font);
  padding: 24px 16px;
}

.card {
  width: 100%;
  max-width: 400px;
  background: var(--card);
  border-radius: var(--r-card);
  box-shadow: var(--shadow-md);
  padding: 32px 24px;
}

.title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
  margin: 0 0 4px;
  text-align: center;
}

.subtitle {
  font-size: 14px;
  color: var(--text-2);
  margin: 0 0 28px;
  text-align: center;
}

.field {
  margin-bottom: 20px;
}

.label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
}

.optional {
  font-weight: 400;
  color: var(--text-3);
  font-size: 11px;
  margin-left: 4px;
}

.input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-family: var(--font);
  font-size: 15px;
  color: var(--text);
  background: var(--card);
  transition: border-color 0.15s;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-family: var(--font);
  font-size: 15px;
  color: var(--text);
  background: var(--card);
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238b7355' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  cursor: pointer;
  box-sizing: border-box;
}

.select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.submitButton {
  width: 100%;
  padding: 14px 20px;
  border: none;
  border-radius: var(--r);
  font-family: var(--font);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  background: var(--accent);
  color: #ffffff;
  box-shadow: var(--shadow-cta);
  transition: opacity 0.15s, transform 0.1s;
  margin-top: 8px;
}

.submitButton:hover {
  opacity: 0.9;
}

.submitButton:active {
  transform: scale(0.98);
}

.submitButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.skipButton {
  display: block;
  width: 100%;
  padding: 10px;
  border: none;
  background: none;
  font-family: var(--font);
  font-size: 13px;
  color: var(--text-3);
  cursor: pointer;
  text-align: center;
  margin-top: 8px;
}

.skipButton:hover {
  color: var(--text-2);
}

.error {
  background: rgba(239, 68, 68, 0.08);
  color: var(--ng);
  border-radius: var(--r-sm);
  padding: 10px 14px;
  font-size: 13px;
  margin-bottom: 16px;
}
```

- [ ] **Step 2: OnboardingPage.tsx 作成**

```tsx
// src/pages/OnboardingPage.tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import styles from './OnboardingPage.module.css'

// 受験年度の選択肢を生成（現在年〜+2年）
function getExamYearOptions(): number[] {
  const currentYear = new Date().getFullYear()
  return [currentYear, currentYear + 1, currentYear + 2]
}

export function OnboardingPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [targetExamYear, setTargetExamYear] = useState<number | ''>('')
  const [targetScore, setTargetScore] = useState<number | ''>('')
  const [university, setUniversity] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user || !supabase) return
    if (!targetExamYear) {
      setError('受験年度を選択してください')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          target_exam_year: targetExamYear || null,
          target_score: targetScore || null,
          university: university.trim() || null,
          onboarding_completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      if (upsertError) {
        setError(`保存に失敗しました: ${upsertError.message}`)
        return
      }

      await refreshProfile()
      navigate('/', { replace: true })
    } catch {
      setError('保存中にエラーが発生しました')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkip = async () => {
    if (!user || !supabase) return
    setSubmitting(true)

    try {
      // スキップ時もオンボーディング完了として記録
      await supabase
        .from('user_profiles')
        .upsert({
          user_id: user.id,
          onboarding_completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })

      await refreshProfile()
      navigate('/', { replace: true })
    } catch {
      navigate('/', { replace: true })
    } finally {
      setSubmitting(false)
    }
  }

  const examYears = getExamYearOptions()

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>はじめまして!</h1>
        <p className={styles.subtitle}>
          あなたに合った学習プランのために教えてください
        </p>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.field}>
          <label className={styles.label} htmlFor="examYear">
            受験年度
          </label>
          <select
            id="examYear"
            className={styles.select}
            value={targetExamYear}
            onChange={(e) => setTargetExamYear(e.target.value ? Number(e.target.value) : '')}
          >
            <option value="">選択してください</option>
            {examYears.map(year => (
              <option key={year} value={year}>
                {year}年（第{year - 1916}回）
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="targetScore">
            目標点数
            <span className={styles.optional}>任意</span>
          </label>
          <input
            id="targetScore"
            type="number"
            className={styles.input}
            value={targetScore}
            onChange={(e) => {
              const v = e.target.value
              setTargetScore(v === '' ? '' : Math.min(345, Math.max(0, Number(v))))
            }}
            placeholder="例: 260"
            min={0}
            max={345}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="university">
            大学名
            <span className={styles.optional}>任意</span>
          </label>
          <input
            id="university"
            type="text"
            className={styles.input}
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            placeholder="例: 東京薬科大学"
          />
        </div>

        <button
          className={styles.submitButton}
          onClick={handleSubmit}
          disabled={submitting}
          type="button"
        >
          はじめる
        </button>

        <button
          className={styles.skipButton}
          onClick={handleSkip}
          disabled={submitting}
          type="button"
        >
          あとで設定する
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: ビルド確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 4: コミット**

```bash
git add src/pages/OnboardingPage.tsx src/pages/OnboardingPage.module.css
git commit -m "feat: OnboardingPage（受験年度・目標点数・大学名設定 + Soft Companion デザイン）"
```

---

### Task 8: AuthGuard + ルーティング保護

**Files:**
- Create: `src/components/auth/AuthGuard.tsx`
- Modify: `src/routes.tsx`
- Modify: `src/App.tsx`

全画面をログイン必須にするガードコンポーネントを作成し、ルーティングに組み込む。

- [ ] **Step 1: AuthGuard.tsx 作成**

```tsx
// src/components/auth/AuthGuard.tsx
import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

interface AuthGuardProps {
  children: ReactNode
}

/**
 * 認証必須ガード。
 * 未認証 → /login にリダイレクト
 * オンボーディング未完了 → /onboarding にリダイレクト
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading, needsOnboarding } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        fontFamily: 'var(--font)',
        color: 'var(--text-2)',
      }}>
        読み込み中...
      </div>
    )
  }

  if (!user) {
    // 現在のパスを state に保存（ログイン後にリダイレクト）
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  if (needsOnboarding && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
```

- [ ] **Step 2: `src/routes.tsx` を更新**

AuthGuard で保護されたルートと、公開ルート（/login, /auth/callback）を分離:

```tsx
// src/routes.tsx
import React, { Suspense } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { AuthGuard } from './components/auth/AuthGuard'

const HomePage = React.lazy(() => import('./pages/HomePage').then(m => ({ default: m.HomePage })))
const PracticePage = React.lazy(() => import('./pages/PracticePage').then(m => ({ default: m.PracticePage })))
const QuestionPage = React.lazy(() => import('./pages/QuestionPage').then(m => ({ default: m.QuestionPage })))
const NotesPage = React.lazy(() => import('./pages/NotesPage').then(m => ({ default: m.NotesPage })))
const FusenDetailPage = React.lazy(() => import('./pages/FusenDetailPage').then(m => ({ default: m.FusenDetailPage })))
const AnalysisPage = React.lazy(() => import('./pages/AnalysisPage').then(m => ({ default: m.AnalysisPage })))
const FlashCardListPage = React.lazy(() => import('./pages/FlashCardListPage').then(m => ({ default: m.FlashCardListPage })))
const FlashCardPage = React.lazy(() => import('./pages/FlashCardPage').then(m => ({ default: m.FlashCardPage })))
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const AuthCallbackPage = React.lazy(() => import('./pages/AuthCallbackPage').then(m => ({ default: m.AuthCallbackPage })))
const OnboardingPage = React.lazy(() => import('./pages/OnboardingPage').then(m => ({ default: m.OnboardingPage })))

const DevToolsReview = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/review/ReviewPage'))
  : null

const FusenReview = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/fusen-review/FusenReviewPage'))
  : null

const FusenAnnotate = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/fusen-annotate/FusenAnnotatePage'))
  : null

const ExemplarMapping = import.meta.env.DEV
  ? React.lazy(() => import('./dev-tools/exemplar-mapping/ExemplarMappingPage'))
  : null

const Loading = () => <div style={{ padding: '2rem', textAlign: 'center' }}>読み込み中...</div>

/** AuthGuard でラップするヘルパー */
function Protected({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}

export const router = createBrowserRouter([
  // --- 公開ルート（認証不要） ---
  {
    path: '/login',
    element: <Suspense fallback={<Loading />}><LoginPage /></Suspense>,
  },
  {
    path: '/auth/callback',
    element: <Suspense fallback={<Loading />}><AuthCallbackPage /></Suspense>,
  },
  {
    path: '/onboarding',
    element: <Suspense fallback={<Loading />}><OnboardingPage /></Suspense>,
  },

  // --- 認証必須ルート ---
  {
    path: '/',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><HomePage /></Suspense></AppLayout></Protected>,
  },
  {
    path: '/practice',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><PracticePage /></Suspense></AppLayout></Protected>,
  },
  {
    path: '/practice/:questionId',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><QuestionPage /></Suspense></AppLayout></Protected>,
  },
  {
    path: '/notes',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><NotesPage /></Suspense></AppLayout></Protected>,
  },
  {
    path: '/notes/:fusenId',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><FusenDetailPage /></Suspense></AppLayout></Protected>,
  },
  {
    path: '/cards',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><FlashCardListPage /></Suspense></AppLayout></Protected>,
  },
  {
    path: '/cards/review',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><FlashCardPage /></Suspense></AppLayout></Protected>,
  },
  {
    path: '/analysis',
    element: <Protected><AppLayout><Suspense fallback={<Loading />}><AnalysisPage /></Suspense></AppLayout></Protected>,
  },

  // --- Dev Tools（認証不要。DEV環境のみ） ---
  ...(import.meta.env.DEV && DevToolsReview ? [{
    path: '/dev-tools/review',
    element: <Suspense fallback={<Loading />}><DevToolsReview /></Suspense>,
  }] : []),
  ...(import.meta.env.DEV && FusenReview ? [{
    path: '/dev-tools/fusen-review',
    element: <Suspense fallback={<Loading />}><FusenReview /></Suspense>,
  }] : []),
  ...(import.meta.env.DEV && FusenAnnotate ? [{
    path: '/dev-tools/fusen-annotate',
    element: <Suspense fallback={<Loading />}><FusenAnnotate /></Suspense>,
  }] : []),
  ...(import.meta.env.DEV && ExemplarMapping ? [{
    path: '/dev-tools/exemplar-mapping',
    element: <Suspense fallback={<Loading />}><ExemplarMapping /></Suspense>,
  }] : []),
])
```

- [ ] **Step 3: `src/App.tsx` に AuthProvider 追加**

```tsx
// src/App.tsx
import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import jaJP from 'antd/locale/ja_JP'
import { AuthProvider } from './contexts/AuthContext'
import { router } from './routes'

export default function App() {
  return (
    <AuthProvider>
      <ConfigProvider
        locale={jaJP}
        theme={{
          algorithm: theme.defaultAlgorithm,
          token: {
            colorPrimary: '#1890ff',
            borderRadius: 8,
          },
        }}
      >
        <RouterProvider router={router} />
      </ConfigProvider>
    </AuthProvider>
  )
}
```

**注意:** `AuthProvider` は `RouterProvider` の外側に配置する必要がある。
ただし `createBrowserRouter` を使う場合、`AuthGuard` 内で `useLocation` を使うため
`RouterProvider` の内側でなければならない。この矛盾を解消するため、
`AuthProvider` は各ルートの `element` 内（`Protected` コンポーネント内）ではなく
`App.tsx` のトップレベルに配置し、`useLocation` を使う `AuthGuard` は
`RouterProvider` の内側に配置する。

`AuthProvider` は `useLocation` を使わない（Session の監視のみ）ので
`RouterProvider` の外側に置いても問題ない。

- [ ] **Step 4: ビルド確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 5: コミット**

```bash
git add src/components/auth/AuthGuard.tsx src/routes.tsx src/App.tsx
git commit -m "feat: AuthGuard + ルーティング保護（全画面ログイン必須 + オンボーディング強制）"
```

---

### Task 9: AppLayout 認証状態表示の更新 + ログアウト機能

**Files:**
- Modify: `src/components/layout/AppLayout.tsx`

AppLayout が `useAuth` から取得する値のインターフェースが変わったので
（`signIn` / `signUp` 削除、`signOut` はContext経由に変更）対応する。
また、認証必須になったため「ログインボタン」は不要になり、
ユーザー情報表示 + ログアウトボタンのみに簡素化する。

- [ ] **Step 1: AppLayout.tsx の認証部分を更新**

`useAuth()` の返り値から `user` と `signOut` を取得（変更なし）。
ただし以下の変更が必要:

1. `user` は AuthGuard の後なので必ず non-null（Protected ルート内でのみ使用）
2. 「ログイン」ボタン（未認証時の表示）を削除
3. LINE プロフィール画像を表示（user_metadata から取得）

```tsx
// src/components/layout/AppLayout.tsx のヘッダー認証部分を以下に置き換え:

// 既存の import を維持しつつ、以下の変更を適用

// ヘッダー内の認証ステータス部分:
{/* 認証ステータス */}
<div style={{ flexShrink: 0 }}>
  {user && (
    <Tooltip title={user.user_metadata?.name ?? user.email ?? 'ユーザー'}>
      <Avatar
        src={user.user_metadata?.picture ?? user.user_metadata?.avatar_url}
        icon={!user.user_metadata?.picture && !user.user_metadata?.avatar_url ? <UserOutlined /> : undefined}
        size="small"
        style={{ cursor: 'pointer', background: '#1890ff', marginRight: 8 }}
      />
      <Button
        type="text"
        icon={<LogoutOutlined />}
        size="small"
        style={{ color: '#8c8c8c' }}
        onClick={handleSignOut}
      />
    </Tooltip>
  )}
</div>
```

- [ ] **Step 2: ビルド確認**

Run: `npx tsc --noEmit`
Expected: エラーなし

- [ ] **Step 3: コミット**

```bash
git add src/components/layout/AppLayout.tsx
git commit -m "fix: AppLayout 認証表示を AuthContext 対応に更新（ログインボタン削除 + LINE画像表示）"
```

---

### Task 10: 統合テスト + CLAUDE.md 更新

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: ビルド確認**

Run: `npm run build`
Expected: ビルド成功

- [ ] **Step 2: 既存テスト実行**

Run: `npx vitest run`
Expected: 全テストパス（新規テスト含む）

- [ ] **Step 3: 手動動作確認チェックリスト**

```
[ ] npm run dev でアプリ起動
[ ] / にアクセス → /login にリダイレクトされる
[ ] /practice にアクセス → /login にリダイレクトされる
[ ] /login が Soft Companion デザインで表示される
[ ] 利用規約未同意でボタン押下 → エラーメッセージ表示
[ ] 利用規約同意 → ボタンが有効化される
[ ] /dev-tools/* は認証なしでアクセス可能（DEV環境のみ）
[ ] /auth/callback が存在する
[ ] /onboarding が表示される
```

> **注意:** LINE Login / Apple Login の実際のOAuth動作確認は、
> Task 1 のコンソール設定が完了してから行う。
> ローカル開発環境では Supabase Dashboard のテストユーザーでテスト可能。

- [ ] **Step 4: CLAUDE.md 更新**

「開発状況」セクションに以下を追加:

```markdown
- **認証統合 Plan 2（2026-03-27）**
  - LINE Login + Apple Login（Supabase Auth OAuth）
  - AuthContext + AuthProvider パターン導入
  - LoginPage Soft Companion リデザイン（LINE緑 + Apple黒ボタン）
  - AuthGuard による全画面ログイン必須化
  - OAuth コールバック → line_accounts 自動保存
  - オンボーディングページ（受験年度・目標点数・大学名）
  - 次: Plan 3（localStorage → Supabase データ移行）
```

「コマンド」セクションに変更なし（認証はUIフローのみ）。

「アーキテクチャ」セクションに以下を追加:

```markdown
- 認証: AuthContext + AuthProvider（src/contexts/AuthContext.tsx）。useAuth フックは Context ベース
- AuthGuard: src/components/auth/AuthGuard.tsx（未認証→/login、オンボーディング未完了→/onboarding にリダイレクト）
- LINE Account 保存: src/lib/line-account.ts（extractLineMetadata + saveLineAccount）
```

「開発時の注意事項」セクションに以下を追加:

```markdown
- LINE Login は Supabase Provider 型に含まれないため `'line' as Provider` の型アサーションが必要
- AuthProvider は RouterProvider の外側に配置（Session監視のみで useLocation 不要）
- AuthGuard は RouterProvider の内側（各ルートの element 内）に配置（useLocation 使用のため）
- OAuth コールバック URL: `${origin}/auth/callback`。Supabase Dashboard + LINE/Apple Console で一致させること
- line_accounts の INSERT/UPDATE は RLS ポリシー追加が必要（20260327_006_line_accounts_insert_policy.sql）
```

- [ ] **Step 5: コミット**

```bash
git add CLAUDE.md
git commit -m "docs: CLAUDE.md に認証統合（Plan 2）完了状況を追記"
```

---

## 完了基準

- [ ] LoginPage が Soft Companion デザインで LINE / Apple ボタンを表示
- [ ] 利用規約同意チェックボックスが機能する
- [ ] AuthContext / AuthProvider が認証状態をグローバル管理
- [ ] useAuth フックが Context ベースに移行
- [ ] AuthGuard が全認証必須ルートを保護
- [ ] OAuth コールバックページが LINE Account を自動保存
- [ ] オンボーディングページが受験年度・目標点数・大学名を保存
- [ ] line_accounts 用の RLS ポリシー追加マイグレーションが作成済み
- [ ] `npm run build` 成功
- [ ] `npx vitest run` 全テストパス
- [ ] CLAUDE.md 更新済み

## 次のステップ（Plan 3: Repo移行）

- localStorage → Supabase データ移行スクリプト（初回ログイン時実行）
- SyncRepository パターン導入（LocalRepo + SyncQueue + SupabaseRepo）
- answer_history / bookmarks のリポジトリ統一
- `useAnalytics()` の async 化（localStorage 直接読み → リポジトリ経由）

## 実装上の注意事項

### LINE Login が Supabase のビルトインプロバイダでない場合の代替方式

もし Supabase Dashboard で LINE を Custom OIDC として追加できない場合は、
**方式B（手動 OAuth + signInWithIdToken）** にフォールバックする:

```typescript
// 方式B: 手動 OAuth フロー
// 1. LINE 認証画面にリダイレクト
const lineAuthUrl = new URL('https://access.line.me/oauth2/v2.1/authorize')
lineAuthUrl.searchParams.set('response_type', 'code')
lineAuthUrl.searchParams.set('client_id', import.meta.env.VITE_LINE_CHANNEL_ID)
lineAuthUrl.searchParams.set('redirect_uri', `${window.location.origin}/auth/line-callback`)
lineAuthUrl.searchParams.set('state', crypto.randomUUID())
lineAuthUrl.searchParams.set('scope', 'profile openid email')
lineAuthUrl.searchParams.set('bot_prompt', 'aggressive')
window.location.href = lineAuthUrl.toString()

// 2. コールバックで code を受け取り、サーバーサイドで token 交換
// 3. ID Token を Supabase に渡す
await supabase.auth.signInWithIdToken({
  provider: 'custom:line',
  token: idToken,
  access_token: accessToken,
})
```

この方式は LINE token 交換をサーバーサイド（Supabase Edge Function）で行う必要があり複雑。
まず方式Aを試し、不可能な場合のみ方式Bを採用する。
