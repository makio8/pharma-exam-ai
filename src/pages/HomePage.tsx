// ホーム画面 - Agent C が実装（スケルトン）
import { Card, Typography } from 'antd'
const { Title } = Typography

export function HomePage() {
  return (
    <Card>
      <Title level={3}>🏠 ホーム</Title>
      <p>今日のおすすめ問題・進捗サマリーが表示されます（Agent C が実装予定）</p>
    </Card>
  )
}
