import { Layout, Menu, Typography, Button, Avatar, Tooltip } from 'antd'
import {
  HomeOutlined,
  ReadOutlined,
  CreditCardOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { Link, useLocation, useNavigate, matchPath } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const { Header, Content, Footer } = Layout
const { Text } = Typography

const NAV_ITEMS = [
  { key: '/', label: 'ホーム', icon: <HomeOutlined /> },
  { key: '/practice', label: '演習', icon: <ReadOutlined /> },
  { key: '/cards', label: 'カード', icon: <CreditCardOutlined /> },
  { key: '/analysis', label: '分析', icon: <BarChartOutlined /> },
]

interface AppLayoutProps {
  children: React.ReactNode
}

/** リデザイン済みページ（Soft Companion）はAnt Designのヘッダー/フッターを非表示 */
const REDESIGNED_EXACT = ['/', '/practice', '/analysis', '/notes']

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  // リデザイン済みページ判定: 完全一致 + QuestionPage（matchPathでパラメータ対応）
  const isRedesigned =
    REDESIGNED_EXACT.includes(location.pathname) ||
    matchPath('/practice/:questionId', location.pathname) !== null ||
    matchPath('/notes/:fusenId', location.pathname) !== null

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ヘッダー（デスクトップ）— リデザイン済みページでは非表示 */}
      {!isRedesigned && <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          padding: '0 24px',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <Text strong style={{ color: '#fff', fontSize: 18, whiteSpace: 'nowrap' }}>
          💊 国試ノート
        </Text>
        <Menu
          theme="dark"
          mode="horizontal"
          selectedKeys={[location.pathname]}
          style={{ flex: 1, minWidth: 0 }}
          items={NAV_ITEMS.map(item => ({
            key: item.key,
            icon: item.icon,
            label: <Link to={item.key}>{item.label}</Link>,
          }))}
        />
        {/* 認証ステータス */}
        <div style={{ flexShrink: 0 }}>
          {user ? (
            <Tooltip title={`${user.email} でログイン中`}>
              <Avatar
                icon={<UserOutlined />}
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
          ) : (
            <Button
              size="small"
              onClick={() => navigate('/login')}
              style={{ color: '#8c8c8c', borderColor: '#434343' }}
            >
              ログイン
            </Button>
          )}
        </div>
      </Header>}

      {/* メインコンテンツ */}
      <Content style={isRedesigned ? { padding: 0 } : { padding: '24px 16px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        {children}
      </Content>

      {/* フッター（モバイルナビ）— リデザイン済みページでは非表示（FloatingNav を各ページが描画） */}
      {!isRedesigned && <Footer
        style={{
          padding: 0,
          position: 'sticky',
          bottom: 0,
          zIndex: 100,
          background: '#001529',
        }}
      >
        {/* モバイル用ボトムナビ */}
        <nav
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            padding: '8px 0',
          }}
        >
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.key
            return (
              <Link
                key={item.key}
                to={item.key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  color: isActive ? '#1890ff' : '#8c8c8c',
                  fontSize: 10,
                  minWidth: 56,
                  textDecoration: 'none',
                }}
              >
                <span style={{ fontSize: 20 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </Footer>}
    </Layout>
  )
}
