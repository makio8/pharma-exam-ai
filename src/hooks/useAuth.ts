// 認証フック — AuthContext ベース
// AuthProvider で管理される認証状態を各コンポーネントから参照するためのフック
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
