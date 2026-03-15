import { Layout, Menu, Typography } from 'antd'
import {
  HomeOutlined,
  ReadOutlined,
  BulbOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { Link, useLocation } from 'react-router-dom'

const { Header, Content, Footer } = Layout
const { Text } = Typography

const NAV_ITEMS = [
  { key: '/', label: 'ホーム', icon: <HomeOutlined /> },
  { key: '/practice', label: '演習', icon: <ReadOutlined /> },
  { key: '/notes', label: '付箋', icon: <BulbOutlined /> },
  { key: '/analysis', label: '分析', icon: <BarChartOutlined /> },
]

interface AppLayoutProps {
  children: React.ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* ヘッダー（デスクトップ） */}
      <Header
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
      </Header>

      {/* メインコンテンツ */}
      <Content style={{ padding: '24px 16px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        {children}
      </Content>

      {/* フッター（モバイルナビ） */}
      <Footer
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
      </Footer>
    </Layout>
  )
}
