export const dynamic = 'force-dynamic'
export const revalidate = 0

import { fetchDashboardData, fetchLatestNetWorth } from '@/lib/data/fetch'

function fmt(n: number, unit = '万') {
  if (Math.abs(n) >= 10000) return (n / 10000).toFixed(1) + unit
  return n.toLocaleString('zh-CN')
}

function fmtPct(n: number) {
  return (n > 0 ? '+' : '') + n.toFixed(1) + '%'
}

function cn(n: number) {
  return n > 0 ? 'num-up' : n < 0 ? 'num-down' : 'num-neutral'
}

export default async function Home() {
  const [data, netWorthRaw] = await Promise.all([
    fetchDashboardData(),
    fetchLatestNetWorth()
  ])

  if (!data) {
    return (
      <div className="py-20 text-center text-white/40">
        <p className="text-lg mb-2">连接数据库中...</p>
        <p className="text-sm">请检查 Supabase 配置</p>
      </div>
    )
  }

  const { summary, cashFlow, returns } = data
  const netWorth = summary?.netWorth || 0
  const totalAssets = summary?.totalAssets || 0
  const totalLiabilities = summary?.totalLiabilities || 0
  const leverageRatio = summary?.leverageRatio || (totalAssets > 0 ? (totalLiabilities / totalAssets * 100) : 0)

  const income = cashFlow?.totalIncome || 0
  const expense = cashFlow?.totalExpenses || 0
  const savingsRate = cashFlow?.savingsRate || 0

  // 直接从net_worth_daily取（单位：人民币）
  const aShareValue = netWorthRaw?.a_share_value || 0
  const usStockValue = netWorthRaw?.us_stock_value || 0  // 已转换为RMB
  const sersValue = netWorthRaw?.sers_value || 324000
  const cashValue = netWorthRaw?.cash || 47182

  return (
    <div className="space-y-5">
      {/* 净资产 - 核心指标 */}
      <div className="card">
        <div className="text-xs text-white/40 mb-1">净资产</div>
        <div className={`text-3xl font-bold tracking-tight ${cn(netWorth)}`}>
          {netWorth < 0 ? '-' : ''}¥{fmt(Math.abs(netWorth))}
        </div>
        <div className="mt-3 flex items-center gap-4 text-xs text-white/50">
          <span>资产 ¥{fmt(totalAssets)}</span>
          <span className="text-white/20">|</span>
          <span>负债 ¥{fmt(totalLiabilities)}</span>
          <span className="text-white/20">|</span>
          <span>杠杆 {leverageRatio.toFixed(0)}%</span>
        </div>
      </div>

      {/* 资产构成 */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <div className="text-[10px] text-white/30 uppercase tracking-wider">A股</div>
          <div className="text-lg font-semibold mt-1">¥{fmt(aShareValue)}</div>
        </div>
        <div className="card">
          <div className="text-[10px] text-white/30 uppercase tracking-wider">美股</div>
          <div className="text-lg font-semibold mt-1">¥{fmt(usStockValue)}</div>
          <div className="text-[10px] text-white/20 mt-0.5">≈${(usStockValue / 7.2).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</div>
        </div>
        <div className="card">
          <div className="text-[10px] text-white/30 uppercase tracking-wider">SERS</div>
          <div className="text-lg font-semibold mt-1">¥{fmt(sersValue)}</div>
        </div>
        <div className="card">
          <div className="text-[10px] text-white/30 uppercase tracking-wider">现金</div>
          <div className="text-lg font-semibold mt-1">¥{fmt(cashValue)}</div>
        </div>
      </div>

      {/* 月度收支 */}
      <div className="card">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-white/40">本月收支</span>
          <span className="tag">{typeof savingsRate === 'number' ? savingsRate.toFixed(1) : savingsRate}% 储蓄率</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-white/30">收入</div>
            <div className="text-lg font-semibold num-up">¥{income.toLocaleString()}</div>
          </div>
          <div className="text-white/10 text-2xl">→</div>
          <div>
            <div className="text-[10px] text-white/30">支出</div>
            <div className="text-lg font-semibold num-down">¥{expense.toLocaleString()}</div>
          </div>
          <div className="text-white/10 text-2xl">→</div>
          <div>
            <div className="text-[10px] text-white/30">结余</div>
            <div className="text-lg font-semibold">¥{(income - expense).toLocaleString()}</div>
          </div>
        </div>

        {/* 支出分类 */}
        {cashFlow?.topCategories && (
          <div className="mt-3 pt-3 border-t border-white/[0.06] space-y-2">
            {cashFlow.topCategories.map((cat: { category: string; amount: number; pct: number }, i: number) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <span className="text-white/50">{cat.category}</span>
                <div className="flex items-center gap-2">
                  <div className="progress-bar w-20">
                    <div className="progress-fill bg-white/20" style={{ width: `${cat.pct}%` }} />
                  </div>
                  <span className="text-white/60 w-16 text-right">¥{cat.amount.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 投资收益 */}
      {returns && (
        <div className="card">
          <div className="text-xs text-white/40 mb-3">持仓收益</div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] text-white/30">A股盈亏</div>
              <div className={`text-base font-semibold ${cn(returns.aShareReturn || 0)}`}>
                {(returns.aShareReturn || 0) > 0 ? '+' : ''}¥{fmt(returns.aShareReturn || 0)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-white/30">美股盈亏</div>
              <div className={`text-base font-semibold ${cn(returns.usStockReturn || 0)}`}>
                {(returns.usStockReturn || 0) > 0 ? '+' : '-'}${Math.abs(returns.usStockReturn || 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="text-center text-[10px] text-white/20 pt-2">
        数据截至 {new Date().toLocaleDateString('zh-CN')}
      </div>
    </div>
  )
}
