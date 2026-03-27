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
