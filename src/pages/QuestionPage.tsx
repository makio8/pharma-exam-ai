// 問題演習画面 - Agent A が実装（スケルトン）
import { Card, Typography } from 'antd'
const { Title } = Typography

export function QuestionPage() {
  return (
    <Card>
      <Title level={3}>❓ 問題</Title>
      <p>4択演習・正誤判定・解説・付箋作成が表示されます（Agent A が実装予定）</p>
    </Card>
  )
}
