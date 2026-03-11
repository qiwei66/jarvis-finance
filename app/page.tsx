export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NetWorth } from '@/components/NetWorth'
import { CashFlow } from '@/components/CashFlow'
import { Returns } from '@/components/Returns'
import { InsightCards } from '@/components/InsightCards'
import { ThemeToggle } from '@/components/ThemeToggle'
import { fetchDashboardData } from '@/lib/data/fetch'

export default async function Home() {
  const financeData = await fetchDashboardData()

  if (!financeData) {
    return (
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] transition-colors duration-300">
        <header className="mobile-header sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
          <div className="container mx-auto px-6 py-4">
            <div className="header-flex flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--up)]"></div>
                <h1 className="text-xl font-medium tracking-tight">Jarvis Finance</h1>
              </div>
              <div className="user-info flex items-center gap-4">
                <ThemeToggle />
                <div className="text-sm text-[var(--text-2)]">王总 · 27岁</div>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-6 py-8">
          <div className="text-center py-12">
            <div className="text-lg text-[var(--text-2)]">加载数据中...</div>
            <div className="mt-4 text-sm text-[var(--text-3)]">正在连接 Supabase 数据库</div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-1)] transition-colors duration-300">
      <header className="mobile-header sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="header-flex flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[var(--accent)] to-[var(--up)]"></div>
              <h1 className="text-xl font-medium tracking-tight">Jarvis Finance</h1>
            </div>
            <div className="user-info flex items-center gap-4">
              <ThemeToggle />
              <div className="text-sm text-[var(--text-2)]">王总 · 27岁</div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
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
      </main>
    </div>
  )
}