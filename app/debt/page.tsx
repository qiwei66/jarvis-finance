export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getSupabaseAdmin } from '@/lib/supabase'
import { formatCurrency } from '@/lib/calc'

async function fetchDebtData() {
  const supabase = getSupabaseAdmin()
  
  const { data, error } = await supabase
    .from('liabilities')
    .select('*')
    .order('remaining', { ascending: false })

  if (error) {
    console.error('Failed to fetch liabilities:', error)
    return []
  }
  
  return data || []
}

export default async function DebtPage() {
  const debts = await fetchDebtData()
  
  const totalDebt = debts.reduce((sum, d) => sum + (d.remaining || 0), 0)
  const totalMonthlyPayment = debts.reduce((sum, d) => sum + (d.monthly_payment || 0), 0)
  const weightedRate = totalDebt > 0 
    ? debts.reduce((sum, d) => sum + (d.remaining || 0) * (d.interest_rate || 0), 0) / totalDebt
    : 0
  
  // 按类型分组
  const byType = {
    margin: debts.filter(d => d.type === 'margin'),
    loan: debts.filter(d => d.type === 'loan'),
    personal: debts.filter(d => d.type === 'personal'),
  }

  const typeLabels: Record<string, string> = {
    margin: '融资融券',
    loan: '银行贷款',
    personal: '私人借款',
  }

  const typeColors: Record<string, string> = {
    margin: 'var(--down)',
    loan: 'var(--accent)',
    personal: 'var(--text-2)',
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-[var(--text-3)]">
          Liabilities
        </h2>
        <p className="text-[var(--text-2)]">
          负债管理与还款追踪
        </p>
      </div>

      {debts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[var(--text-2)]">暂无负债数据</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 总览 */}
          <section className="card">
            <span className="overline">负债总览</span>
            
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="insight text-center py-5">
                <div className="text-2xl sm:text-3xl font-normal text-[var(--down)] tracking-tight">
                  {formatCurrency(totalDebt)}
                </div>
                <div className="caption mt-1">总负债</div>
              </div>
              <div className="insight text-center py-5">
                <div className="text-2xl sm:text-3xl font-normal text-[var(--accent)] tracking-tight">
                  {formatCurrency(totalMonthlyPayment)}
                </div>
                <div className="caption mt-1">月还款额</div>
              </div>
              <div className="insight text-center py-5">
                <div className="text-2xl sm:text-3xl font-normal text-[var(--text-1)] tracking-tight">
                  {weightedRate.toFixed(2)}%
                </div>
                <div className="caption mt-1">加权利率</div>
              </div>
            </div>
          </section>

          {/* 负债结构 */}
          <section className="card">
            <span className="overline">负债结构</span>
            <div className="mt-4 space-y-3">
              {Object.entries(byType).map(([type, items]) => {
                if (items.length === 0) return null
                const typeTotal = items.reduce((sum, d) => sum + (d.remaining || 0), 0)
                const pct = totalDebt > 0 ? (typeTotal / totalDebt) * 100 : 0
                return (
                  <div key={type}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-[var(--text-1)]">{typeLabels[type] || type}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--text-3)]">{pct.toFixed(1)}%</span>
                        <span className="text-sm font-medium text-[var(--text-1)]">
                          {formatCurrency(typeTotal)}
                        </span>
                      </div>
                    </div>
                    <div className="bar h-1.5">
                      <div 
                        className="bar-fill"
                        style={{
                          width: `${pct}%`,
                          background: typeColors[type] || 'var(--accent)'
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* 明细列表 */}
          <section className="card">
            <span className="overline">负债明细</span>
            
            <div className="mt-4 space-y-0">
              {debts.map((debt, i) => (
                <div key={i} className="data-row">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[var(--text-1)]">{debt.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full border border-[var(--border)] text-[var(--text-3)]">
                        {typeLabels[debt.type] || debt.type}
                      </span>
                    </div>
                    <div className="flex gap-3 mt-1">
                      {debt.interest_rate > 0 && (
                        <span className="text-xs text-[var(--text-3)]">
                          利率 {debt.interest_rate}%
                        </span>
                      )}
                      {debt.monthly_payment > 0 && (
                        <span className="text-xs text-[var(--text-3)]">
                          月供 {formatCurrency(debt.monthly_payment)}
                        </span>
                      )}
                      {debt.interest_rate === 0 && debt.monthly_payment === 0 && (
                        <span className="text-xs text-[var(--text-3)]">免息</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-medium text-[var(--down)]">
                      {formatCurrency(debt.remaining || 0)}
                    </div>
                    {debt.principal !== debt.remaining && (
                      <div className="text-xs text-[var(--text-3)]">
                        原额 {formatCurrency(debt.principal || 0)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 年化利息估算 */}
          <section className="card">
            <span className="overline">年化利息估算</span>
            <div className="mt-4 space-y-0">
              {debts.filter(d => (d.interest_rate || 0) > 0).map((debt, i) => {
                const annualInterest = (debt.remaining || 0) * (debt.interest_rate || 0) / 100
                return (
                  <div key={i} className="data-row">
                    <div>
                      <span className="body">{debt.name}</span>
                      <span className="text-xs text-[var(--text-3)] ml-2">@ {debt.interest_rate}%</span>
                    </div>
                    <span className="text-sm font-medium text-[var(--down)]">
                      ≈ {formatCurrency(Math.round(annualInterest))}/年
                    </span>
                  </div>
                )
              })}
              <div className="data-row">
                <span className="body font-medium">年化利息合计</span>
                <span className="text-lg font-medium text-[var(--down)]">
                  ≈ {formatCurrency(Math.round(
                    debts.reduce((sum, d) => sum + (d.remaining || 0) * (d.interest_rate || 0) / 100, 0)
                  ))}/年
                </span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
