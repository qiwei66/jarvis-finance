export const dynamic = 'force-dynamic'
export const revalidate = 0

import { fetchMonthlyCashflow } from '@/lib/data/fetch'

export default async function CashflowPage() {
  const data = await fetchMonthlyCashflow()

  if (!data) {
    return <div className="py-20 text-center text-white/40">加载收支数据中...</div>
  }

  const { income, expense, savings, savings_rate, top_categories, month } = data
  const monthStr = new Date(month).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">收支明细</h1>
        <p className="text-xs text-white/30 mt-1">{monthStr}（到手收入）</p>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <div className="text-[10px] text-white/30">月收入</div>
          <div className="text-base font-semibold num-up mt-1">¥{income.toLocaleString()}</div>
          <div className="text-[10px] text-white/20 mt-0.5">税后到手</div>
        </div>
        <div className="card">
          <div className="text-[10px] text-white/30">月支出</div>
          <div className="text-base font-semibold num-down mt-1">¥{expense.toLocaleString()}</div>
          <div className="text-[10px] text-white/20 mt-0.5">含房租贷款</div>
        </div>
        <div className="card">
          <div className="text-[10px] text-white/30">月结余</div>
          <div className="text-base font-semibold mt-1">¥{savings.toLocaleString()}</div>
          <div className="text-[10px] text-white/20 mt-0.5">储蓄率{savings_rate}%</div>
        </div>
      </div>

      {/* 储蓄率可视化 */}
      <div className="card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-white/40">储蓄率</span>
          <span className="text-sm font-semibold">{savings_rate}%</span>
        </div>
        <div className="progress-bar h-3 rounded-lg">
          <div 
            className="progress-fill bg-gradient-to-r from-emerald-500/80 to-emerald-400/60 rounded-lg"
            style={{ width: `${savings_rate}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-white/20 mt-1">
          <span>0%</span>
          <span>目标 60%</span>
          <span>100%</span>
        </div>
      </div>

      {/* 支出明细 */}
      {top_categories && top_categories.length > 0 && (
        <div className="card">
          <div className="text-xs text-white/40 mb-3">支出构成</div>
          <div className="space-y-3">
            {top_categories.map((cat: { category: string; amount: number; pct: number }, i: number) => (
              <div key={i}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/70">{cat.category}</span>
                  <span className="text-white/50">¥{cat.amount.toLocaleString()} · {cat.pct}%</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill bg-white/15" style={{ width: `${cat.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 说明 */}
      <div className="card bg-white/[0.02]">
        <div className="text-xs text-white/30 space-y-1">
          <p>💡 收入为税后到手（含公积金提取¥4,000）</p>
          <p>💡 税前月薪¥46,000，五险一金¥8,400/月</p>
          <p>💡 信用卡消费已在支出中体现，全额还清</p>
        </div>
      </div>
    </div>
  )
}
