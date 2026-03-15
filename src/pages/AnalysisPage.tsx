// 分析画面 - Agent C が実装（スケルトン）
import { Card, Typography } from 'antd'
const { Title } = Typography

export function AnalysisPage() {
  return (
    <Card>
      <Title level={3}>📊 分析</Title>
      <p>科目別正答率・苦手論点グラフが表示されます（Agent C が実装予定）</p>
    </Card>
  )
}
