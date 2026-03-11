'use client'

import { formatCurrency, formatPercent, getPnLClass } from '@/lib/calc'

interface CashFlowData {
  totalIncome: number
  totalExpenses: number
  netCashFlow: number
  savingsRate: number
  topCategories: Array<{
    category: string
    amount: number
    pct: number
  }>
}

interface CashFlowProps {
  data: CashFlowData
}

export function CashFlow({ data }: CashFlowProps) {
  const { 
    totalIncome, 
    totalExpenses, 
    netCashFlow, 
    savingsRate,
    topCategories 
  } = data

  const isPositive = netCashFlow > 0
  const expenseRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0

  return (
    <section className="card">
      {/* 头部 */}
      <span className="overline">CASH FLOW · 本月</span>
      
      {/* 净现金流 */}
      <div className="flex items-end gap-3 mt-4 mb-2">
        <span 
          className={`headline ${isPositive ? 'text-[var(--up)]' : 'text-[var(--down)]'}`}
        >
          {isPositive ? '+' : ''}{formatCurrency(netCashFlow)}
        </span>
        <span className="caption mb-1.5">CNY</span>
      </div>
      
      {/* 状态标签 */}
      <div className="flex gap-2 mb-7">
        <span className={`badge ${getPnLClass(netCashFlow)}`}>
          {isPositive ? '正向' : '负向'}
        </span>
        <span className="badge">
          储蓄率 {savingsRate.toFixed(1)}%
        </span>
      </div>

      {/* 收支明细 */}
      <div className="space-y-0">
        <div className="data-row">
          <span className="body">总收入</span>
          <span className="text-xl font-normal text-[var(--text-1)] tracking-[-0.01em]">
            {formatCurrency(totalIncome)}
          </span>
        </div>
        
        <div className="data-row">
          <span className="body">总支出</span>
          <span className="text-xl font-normal text-[var(--text-1)] tracking-[-0.01em]">
            {formatCurrency(totalExpenses)}
          </span>
        </div>
      </div>

      {/* 支出分类 */}
      {topCategories.length > 0 && (
        <div className="mt-6">
          <span className="caption block mb-3">主要支出分类</span>
          <div className="space-y-2">
            {topCategories.map((cat, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="body">{cat.category}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-[var(--text-2)]">{cat.pct.toFixed(1)}%</span>
                  <span className="text-sm font-medium text-[var(--text-1)]">
                    {formatCurrency(cat.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 收支比例条 */}
      <div className="mt-6">
        <div className="flex justify-between mb-2">
          <span className="caption">
            支出 {formatCurrency(totalExpenses)}
          </span>
          <span className="caption">
            收入 {formatCurrency(totalIncome)}
          </span>
        </div>
        
        <div className="bar">
          <div 
            className="bar-fill"
            style={{
              width: `${expenseRatio}%`,
              background: 'var(--accent)'
            }}
          />
        </div>
      </div>
    </section>
  )
}