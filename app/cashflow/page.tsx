export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getSupabaseAdmin } from '@/lib/supabase'
import { formatCurrency } from '@/lib/calc'

async function fetchCashflowData() {
  const supabase = getSupabaseAdmin()
  
  const { data, error } = await supabase
    .from('monthly_cashflow')
    .select('*')
    .order('month', { ascending: false })
    .limit(12)

  if (error) {
    console.error('Failed to fetch cashflow:', error)
    return []
  }
  
  return data || []
}

export default async function CashflowPage() {
  const cashflowData = await fetchCashflowData()
  
  const currentMonth = cashflowData[0]
  const totalIncome = cashflowData.reduce((sum, m) => sum + (m.income || 0), 0)
  const totalExpense = cashflowData.reduce((sum, m) => sum + (m.expense || 0), 0)

  return (
    <div>
      <div className="mb-8">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-[var(--text-3)]">
          Cash Flow
        </h2>
        <p className="text-[var(--text-2)]">
          收支分析与趋势追踪
        </p>
      </div>

      {cashflowData.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[var(--text-2)]">暂无收支数据</p>
          <p className="text-sm text-[var(--text-3)] mt-2">通过 API 添加月度收支记录</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 当月概览 */}
          {currentMonth && (
            <section className="card">
              <span className="overline">本月概览 · {currentMonth.month?.substring(0, 7)}</span>
              
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="insight text-center py-5">
                  <div className="text-2xl font-normal text-[var(--up)] tracking-tight">
                    {formatCurrency(currentMonth.income || 0)}
                  </div>
                  <div className="caption mt-1">收入</div>
                </div>
                <div className="insight text-center py-5">
                  <div className="text-2xl font-normal text-[var(--text-1)] tracking-tight">
                    {formatCurrency(currentMonth.expense || 0)}
                  </div>
                  <div className="caption mt-1">支出</div>
                </div>
                <div className="insight text-center py-5">
                  <div className={`text-2xl font-normal tracking-tight ${(currentMonth.savings || 0) >= 0 ? 'text-[var(--up)]' : 'text-[var(--down)]'}`}>
                    {formatCurrency(currentMonth.savings || 0)}
                  </div>
                  <div className="caption mt-1">净储蓄</div>
                </div>
                <div className="insight text-center py-5">
                  <div className="text-2xl font-normal text-[var(--accent)] tracking-tight">
                    {(currentMonth.savings_rate || 0).toFixed(1)}%
                  </div>
                  <div className="caption mt-1">储蓄率</div>
                </div>
              </div>
            </section>
          )}

          {/* 支出分类 */}
          {currentMonth?.top_categories && currentMonth.top_categories.length > 0 && (
            <section className="card">
              <span className="overline">支出分类</span>
              <div className="mt-4 space-y-3">
                {currentMonth.top_categories.map((cat: any, idx: number) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-[var(--text-1)]">{cat.category}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-[var(--text-3)]">{(cat.pct || 0).toFixed(1)}%</span>
                        <span className="text-sm font-medium text-[var(--text-1)]">
                          {formatCurrency(cat.amount || 0)}
                        </span>
                      </div>
                    </div>
                    <div className="bar h-1">
                      <div 
                        className="bar-fill"
                        style={{
                          width: `${cat.pct || 0}%`,
                          background: 'var(--accent)'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 历史记录 */}
          <section className="card">
            <span className="overline">历史记录</span>
            
            <div className="hidden sm:grid grid-cols-5 gap-2 px-2 py-2 mt-4 text-xs text-[var(--text-3)] font-medium uppercase tracking-wider border-b border-[var(--border)]">
              <div>月份</div>
              <div className="text-right">收入</div>
              <div className="text-right">支出</div>
              <div className="text-right">净储蓄</div>
              <div className="text-right">储蓄率</div>
            </div>
            
            {cashflowData.map((month, i) => (
              <div key={i} className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-2 py-3 border-b border-[var(--border)] last:border-b-0 items-center">
                <div className="text-sm font-medium text-[var(--text-1)]">
                  {month.month?.substring(0, 7)}
                </div>
                <div className="text-right text-sm text-[var(--up)] hidden sm:block">
                  {formatCurrency(month.income || 0)}
                </div>
                <div className="text-right text-sm text-[var(--text-2)] hidden sm:block">
                  {formatCurrency(month.expense || 0)}
                </div>
                <div className={`text-right text-sm font-medium hidden sm:block ${(month.savings || 0) >= 0 ? 'text-[var(--up)]' : 'text-[var(--down)]'}`}>
                  {(month.savings || 0) >= 0 ? '+' : ''}{formatCurrency(month.savings || 0)}
                </div>
                <div className="text-right text-sm text-[var(--accent)]">
                  {(month.savings_rate || 0).toFixed(1)}%
                </div>
                {/* Mobile details */}
                <div className="col-span-2 sm:hidden flex justify-between text-xs text-[var(--text-3)]">
                  <span>收入 {formatCurrency(month.income || 0)}</span>
                  <span>支出 {formatCurrency(month.expense || 0)}</span>
                  <span className={`${(month.savings || 0) >= 0 ? 'text-[var(--up)]' : 'text-[var(--down)]'}`}>
                    净 {formatCurrency(month.savings || 0)}
                  </span>
                </div>
              </div>
            ))}
          </section>

          {/* 年度汇总 */}
          <section className="card">
            <span className="overline">累计汇总</span>
            <div className="mt-4 space-y-0">
              <div className="data-row">
                <span className="body">累计收入</span>
                <span className="text-lg font-medium text-[var(--up)]">{formatCurrency(totalIncome)}</span>
              </div>
              <div className="data-row">
                <span className="body">累计支出</span>
                <span className="text-lg font-medium text-[var(--text-1)]">{formatCurrency(totalExpense)}</span>
              </div>
              <div className="data-row">
                <span className="body">累计储蓄</span>
                <span className={`text-lg font-medium ${(totalIncome - totalExpense) >= 0 ? 'text-[var(--up)]' : 'text-[var(--down)]'}`}>
                  {formatCurrency(totalIncome - totalExpense)}
                </span>
              </div>
              <div className="data-row">
                <span className="body">平均储蓄率</span>
                <span className="text-lg font-medium text-[var(--accent)]">
                  {totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : '0'}%
                </span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
