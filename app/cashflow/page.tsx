export const dynamic = 'force-dynamic'
export const revalidate = 0

import { fetchCashflowHistory } from '@/lib/data/fetch'
import { formatCurrency, formatPercent } from '@/lib/calc'

interface CashflowData {
  id: number
  month: string
  income: number
  expense: number
  savings: number
  savings_rate: number
  top_categories: Array<{
    category: string
    amount: number
    pct: number
  }>
}

export default async function CashflowPage() {
  const cashflowHistory = await fetchCashflowHistory()
  
  if (!cashflowHistory || cashflowHistory.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="title mb-6">收支分析</h1>
        <div className="insight p-8 text-center">
          <div className="text-lg text-[var(--text-2)]">加载现金流数据中...</div>
        </div>
      </div>
    )
  }

  const latestData = cashflowHistory[0] as CashflowData
  
  // 计算汇总数据
  const totalIncome = cashflowHistory.reduce((sum, data) => sum + (data.income || 0), 0)
  const totalExpense = cashflowHistory.reduce((sum, data) => sum + (data.expense || 0), 0)
  const avgSavingsRate = cashflowHistory.length > 0 
    ? cashflowHistory.reduce((sum, data) => sum + (data.savings_rate || 0), 0) / cashflowHistory.length 
    : 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="title mb-2">收支分析</h1>
        <p className="subtitle">
          最近 {cashflowHistory.length} 个月的现金流动态分析
        </p>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="overline mb-2">本月收入</div>
          <div className="display mb-2">{formatCurrency(latestData.income)}</div>
          <div className="body text-[var(--text-3)]">
            {new Date(latestData.month + '-01').toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long'
            })}
          </div>
        </div>

        <div className="card">
          <div className="overline mb-2">本月支出</div>
          <div className="display mb-2">{formatCurrency(latestData.expense)}</div>
          <div className="body text-[var(--down)]">
            -¥{latestData.expense.toLocaleString()}
          </div>
        </div>

        <div className="card">
          <div className="overline mb-2">本月储蓄</div>
          <div className="display mb-2">{formatCurrency(latestData.savings)}</div>
          <div className="body text-[var(--up)]">
            储蓄率 {formatPercent(latestData.savings_rate, false)}
          </div>
        </div>

        <div className="card">
          <div className="overline mb-2">平均储蓄率</div>
          <div className="display mb-2">{formatPercent(avgSavingsRate, false)}</div>
          <div className="body text-[var(--text-3)]">
            {cashflowHistory.length}月平均
          </div>
        </div>
      </div>

      {/* 支出分类分析 */}
      {latestData.top_categories && latestData.top_categories.length > 0 && (
        <section className="mb-12">
          <h2 className="subtitle mb-4">本月支出分类</h2>
          
          <div className="card">
            <div className="grid gap-4">
              {latestData.top_categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{
                        background: `hsl(${index * 45}, 60%, 55%)`
                      }}
                    />
                    <span className="body font-medium">{category.category}</span>
                  </div>
                  <div className="text-right">
                    <div className="body font-medium">{formatCurrency(category.amount)}</div>
                    <div className="caption text-[var(--text-3)]">{category.pct.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>

            {/* 支出分类可视化条形图 */}
            <div className="mt-6 space-y-3">
              {latestData.top_categories.map((category, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{category.category}</span>
                    <span className="font-medium">{category.pct.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-[var(--border)] rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: `${category.pct}%`,
                        background: `hsl(${index * 45}, 60%, 55%)`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 历史趋势 */}
      <section className="mb-12">
        <h2 className="subtitle mb-4">现金流趋势</h2>
        
        <div className="card p-0">
          <div className="hidden md:grid grid-cols-5 gap-4 p-4 text-sm font-medium text-[var(--text-3)] border-b border-[var(--border)]">
            <div>月份</div>
            <div className="text-right">收入</div>
            <div className="text-right">支出</div>
            <div className="text-right">储蓄</div>
            <div className="text-right">储蓄率</div>
          </div>
          
          <div className="divide-y divide-[var(--border)]">
            {cashflowHistory.map((data: CashflowData, index: number) => {
              const monthName = new Date(data.month + '-01').toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long'
              })
              
              return (
                <div key={index} className="md:grid md:grid-cols-5 gap-4 p-4 md:items-center">
                  {/* 移动端布局 */}
                  <div className="md:hidden space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-[var(--text-1)]">{monthName}</div>
                        <div className="text-sm text-[var(--text-3)]">储蓄率 {formatPercent(data.savings_rate, false)}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-[var(--up)]">{formatCurrency(data.savings)}</div>
                        <div className="text-sm text-[var(--text-3)]">净储蓄</div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-[var(--text-3)]">
                      <div>收入 {formatCurrency(data.income)}</div>
                      <div>支出 {formatCurrency(data.expense)}</div>
                    </div>
                  </div>

                  {/* 桌面端布局 */}
                  <div className="hidden md:block">
                    <div className="font-medium text-[var(--text-1)]">{monthName}</div>
                  </div>
                  <div className="hidden md:block text-right body text-[var(--up)]">
                    {formatCurrency(data.income)}
                  </div>
                  <div className="hidden md:block text-right body text-[var(--down)]">
                    {formatCurrency(data.expense)}
                  </div>
                  <div className="hidden md:block text-right body font-medium">
                    {formatCurrency(data.savings)}
                  </div>
                  <div className="hidden md:block text-right body">
                    <span className={`${data.savings_rate >= 30 ? 'text-[var(--up)]' : data.savings_rate >= 10 ? 'text-[var(--text-1)]' : 'text-[var(--down)]'}`}>
                      {formatPercent(data.savings_rate, false)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Insights */}
      <section>
        <h2 className="subtitle mb-4">财务洞察</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="insight">
            <h3 className="body font-medium mb-2">储蓄表现</h3>
            <p className="caption">
              {avgSavingsRate >= 50 ? (
                `🎉 储蓄率表现优秀！平均${avgSavingsRate.toFixed(1)}%，远超同龄人平均水平。`
              ) : avgSavingsRate >= 30 ? (
                `👍 储蓄率良好，平均${avgSavingsRate.toFixed(1)}%，建议继续保持或优化支出结构。`
              ) : avgSavingsRate >= 10 ? (
                `⚠️ 储蓄率偏低，平均${avgSavingsRate.toFixed(1)}%，建议分析支出并制定储蓄计划。`
              ) : (
                `🚨 储蓄率过低，平均${avgSavingsRate.toFixed(1)}%，需要立即优化财务结构。`
              )}
            </p>
          </div>

          <div className="insight">
            <h3 className="body font-medium mb-2">支出趋势</h3>
            <p className="caption">
              {latestData.top_categories && latestData.top_categories.length > 0 ? (
                `最大支出类别为${latestData.top_categories[0].category}，占比${latestData.top_categories[0].pct.toFixed(1)}%。
                建议关注该类别的支出合理性。`
              ) : (
                '暂无详细支出分类数据，建议完善支出记录。'
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}