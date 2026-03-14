export const dynamic = 'force-dynamic'
export const revalidate = 0

import { fetchLiabilities } from '@/lib/data/fetch'

interface Liability {
  id: number; name: string; type: 'loan' | 'margin' | 'personal'
  principal: number; remaining: number; interest_rate: number
  monthly_payment: number; due_date: string
}

function fmt(n: number) { return Math.abs(n) >= 10000 ? (n / 10000).toFixed(1) + '万' : n.toLocaleString() }

const typeMap: Record<string, { label: string; emoji: string }> = {
  loan: { label: '银行贷款', emoji: '🏦' },
  margin: { label: '融资融券', emoji: '📈' },
  personal: { label: '亲属借款', emoji: '👨‍👩‍👦' },
}

export default async function DebtPage() {
  const liabilities = await fetchLiabilities() as Liability[]

  if (!liabilities || liabilities.length === 0) {
    return (
      <div className="py-20 text-center">
        <div className="text-3xl mb-3">🎉</div>
        <div className="text-white/60">无负债，财务状况良好</div>
      </div>
    )
  }

  const totalRemaining = liabilities.reduce((s, x) => s + x.remaining, 0)
  const totalMonthly = liabilities.reduce((s, x) => s + x.monthly_payment, 0)
  
  // 加权平均利率（排除0利率的母亲借款）
  const interestBearing = liabilities.filter(x => x.interest_rate > 0)
  const weightedRate = interestBearing.length > 0
    ? interestBearing.reduce((s, x) => s + x.interest_rate * x.remaining, 0) / interestBearing.reduce((s, x) => s + x.remaining, 0)
    : 0

  // 分组
  const groups = [
    { key: 'margin', items: liabilities.filter(x => x.type === 'margin') },
    { key: 'loan', items: liabilities.filter(x => x.type === 'loan') },
    { key: 'personal', items: liabilities.filter(x => x.type === 'personal') },
  ].filter(g => g.items.length > 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">负债管理</h1>
        <p className="text-xs text-white/30 mt-1">共{liabilities.length}项负债</p>
      </div>

      {/* 汇总 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <div className="text-[10px] text-white/30">负债总额</div>
          <div className="text-base font-semibold num-down mt-1">¥{fmt(totalRemaining)}</div>
        </div>
        <div className="card">
          <div className="text-[10px] text-white/30">月供合计</div>
          <div className="text-base font-semibold mt-1">¥{totalMonthly.toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-[10px] text-white/30">加权利率</div>
          <div className="text-base font-semibold mt-1">{weightedRate.toFixed(2)}%</div>
        </div>
      </div>

      {/* 负债构成条形图 */}
      <div className="card">
        <div className="text-xs text-white/40 mb-3">负债构成</div>
        <div className="flex h-4 rounded-full overflow-hidden bg-white/[0.04]">
          {groups.map(g => {
            const groupTotal = g.items.reduce((s, x) => s + x.remaining, 0)
            const pct = (groupTotal / totalRemaining) * 100
            const colors: Record<string, string> = {
              margin: 'bg-amber-500/60',
              loan: 'bg-red-400/50',
              personal: 'bg-blue-400/40',
            }
            return (
              <div key={g.key} className={`${colors[g.key]} transition-all`} style={{ width: `${pct}%` }} />
            )
          })}
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px] text-white/40">
          {groups.map(g => {
            const groupTotal = g.items.reduce((s, x) => s + x.remaining, 0)
            const pct = ((groupTotal / totalRemaining) * 100).toFixed(0)
            const dots: Record<string, string> = {
              margin: 'bg-amber-500/60',
              loan: 'bg-red-400/50',
              personal: 'bg-blue-400/40',
            }
            return (
              <span key={g.key} className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${dots[g.key]}`} />
                {typeMap[g.key].label} {pct}%
              </span>
            )
          })}
        </div>
      </div>

      {/* 各类负债 */}
      {groups.map(g => (
        <div key={g.key} className="card">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">{typeMap[g.key].emoji}</span>
            <span className="text-xs font-medium text-white/60">{typeMap[g.key].label}</span>
            <span className="tag">{g.items.length}项</span>
          </div>
          
          {g.items.sort((a, b) => b.remaining - a.remaining).map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2.5 border-b border-white/[0.04] last:border-0">
              <div className="min-w-0 flex-1">
                <div className="text-sm text-white/90">{item.name}</div>
                <div className="text-[10px] text-white/30 mt-0.5">
                  {item.interest_rate > 0 ? `${item.interest_rate}%年利率` : '无息'}
                  {item.monthly_payment > 0 ? ` · 月供¥${item.monthly_payment.toLocaleString()}` : ''}
                </div>
              </div>
              <div className="text-right ml-3 shrink-0">
                <div className="text-sm font-semibold num-down">¥{fmt(item.remaining)}</div>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* 风险提示 */}
      <div className="card bg-amber-500/[0.04] border-amber-500/10">
        <div className="text-xs text-amber-400/80 space-y-1">
          <p>⚠️ 融资融券余额¥192万，利率8.35%，年利息约¥16万</p>
          <p>⚠️ A股总市值¥216万中，融资占比89%，杠杆率极高</p>
          <p>💡 银行贷款年利率3-4.5%，成本较低，可维持</p>
        </div>
      </div>
    </div>
  )
}
