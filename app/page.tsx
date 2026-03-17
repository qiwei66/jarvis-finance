export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NetWorth } from '@/components/NetWorth'
import { CashFlow } from '@/components/CashFlow'
import { Returns } from '@/components/Returns'
import { InsightCards } from '@/components/InsightCards'
import { fetchDashboardData } from '@/lib/data/fetch'

export default async function Home() {
  const financeData = await fetchDashboardData()

  if (!financeData) {
    return (
      <div className="text-center py-12">
        <div className="text-lg text-[var(--text-2)]">加载数据中...</div>
        <div className="mt-4 text-sm text-[var(--text-3)]">正在连接 Supabase 数据库</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-[var(--text-3)]">
          Dashboard
        </h2>
        <p className="text-[var(--text-2)]">
          你的个人财务仪表盘，实时追踪资产、现金流与投资回报。
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左侧：净资产 */}
        <div className="lg:col-span-2">
          <NetWorth data={financeData.summary} />
        </div>

        {/* 右侧：现金流 */}
        <div>
          <CashFlow data={financeData.cashFlow} />
        </div>

        {/* 中间：收益 */}
        <div className="lg:col-span-2">
          <Returns data={financeData.returns} />
        </div>

        {/* 右侧：Jarvis Insights */}
        <div>
          <InsightCards insights={financeData.insights} />
        </div>
      </div>

      <div className="mt-8 text-center text-sm text-[var(--text-3)]">
        数据最后更新于 {new Date().toLocaleString('zh-CN')}
      </div>
    </div>
  )
}
