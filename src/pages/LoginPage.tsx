// ログイン・サインアップ画面
import { useState } from 'react'
import { Card, Form, Input, Button, Typography, Alert, Tabs, Space } from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const { Title, Text } = Typography

export function LoginPage() {
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login')
  const [form] = Form.useForm()

  const handleSubmit = async (values: { email: string; password: string }) => {
    setLoading(true)
    setError(null)
    try {
      const fn = activeTab === 'login' ? signIn : signUp
      const { error: authError } = await fn(values.email, values.password)
      if (authError) {
        setError(authError)
      } else {
        if (activeTab === 'signup') {
          setError('確認メールを送信しました。メールのリンクをクリックしてください。')
        } else {
          navigate('/')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const tabItems = [
    { key: 'login', label: 'ログイン' },
    { key: 'signup', label: '新規登録' },
  ]

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
        padding: 16,
      }}
    >
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <Space orientation="vertical" style={{ width: '100%', textAlign: 'center' }}>
          <Title level={3} style={{ marginBottom: 0 }}>💊 国試ノート</Title>
          <Text type="secondary">薬剤師国試演習プラットフォーム</Text>
        </Space>

        <Tabs
          activeKey={activeTab}
          onChange={(key) => {
            setActiveTab(key as 'login' | 'signup')
            setError(null)
            form.resetFields()
          }}
          items={tabItems}
          centered
          style={{ marginTop: 16 }}
        />

        {error && (
          <Alert
            type={error.includes('確認メール') ? 'success' : 'error'}
            message={error}
            style={{ marginBottom: 16 }}
            showIcon
          />
        )}

        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'メールアドレスを入力してください' },
              { type: 'email', message: '有効なメールアドレスを入力してください' },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="メールアドレス"
              size="large"
              autoComplete="email"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'パスワードを入力してください' },
              { min: 8, message: '8文字以上で入力してください' },
            ]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="パスワード（8文字以上）"
              size="large"
              autoComplete={activeTab === 'login' ? 'current-password' : 'new-password'}
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              block
              loading={loading}
            >
              {activeTab === 'login' ? 'ログイン' : 'アカウント作成'}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center' }}>
          <Button type="link" onClick={() => navigate('/')}>
            ログインなしで続ける（データはこの端末のみ保存）
          </Button>
        </div>
      </Card>
    </div>
  )
}
