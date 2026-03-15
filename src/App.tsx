import { RouterProvider } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import jaJP from 'antd/locale/ja_JP'
import { router } from './routes'

export default function App() {
  return (
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
  )
}
