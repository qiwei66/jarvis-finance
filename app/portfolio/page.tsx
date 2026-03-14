export const dynamic = 'force-dynamic'
export const revalidate = 0

import { fetchPortfolioDetails } from '@/lib/data/fetch'
import { formatCurrency, formatPercent, getPnLClass, getPnLTextClass } from '@/lib/calc'

interface Stock {
  id: number
  date: string
  market: 'a_share' | 'us_stock'
  code: string
  name: string
  shares: number
  cost_price: number
  market_price: number
  market_value: number
  pnl: number
  pnl_pct: number
}

export default async function PortfolioPage() {
  const portfolioData = await fetchPortfolioDetails()
  
  if (!portfolioData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="title mb-6">持仓详情</h1>
        <div className="insight p-8 text-center">
          <div className="text-lg text-[var(--text-2)]">加载持仓数据中...</div>
        </div>
      </div>
    )
  }

  const { aShare, usStock, date } = portfolioData

  // 计算汇总数据
  const aShareSummary = {
    totalValue: aShare.reduce((sum: number, stock: Stock) => sum + (stock.market_value || 0), 0),
    totalPnL: aShare.reduce((sum: number, stock: Stock) => sum + (stock.pnl || 0), 0),
    count: aShare.length
  }

  const usStockSummary = {
    totalValue: usStock.reduce((sum: number, stock: Stock) => sum + (stock.market_value || 0), 0),
    totalPnL: usStock.reduce((sum: number, stock: Stock) => sum + (stock.pnl || 0), 0),
    count: usStock.length
  }

  const totalSummary = {
    totalValue: aShareSummary.totalValue + usStockSummary.totalValue,
    totalPnL: aShareSummary.totalPnL + usStockSummary.totalPnL,
    count: aShareSummary.count + usStockSummary.count
  }

  aShareSummary.totalPnL = aShareSummary.totalValue > 0 ? (aShareSummary.totalPnL / aShareSummary.totalValue) * 100 : 0
  usStockSummary.totalPnL = usStockSummary.totalValue > 0 ? (usStockSummary.totalPnL / usStockSummary.totalValue) * 100 : 0
  const totalPnLPct = totalSummary.totalValue > 0 ? (totalSummary.totalPnL / totalSummary.totalValue) * 100 : 0

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="title mb-2">持仓详情</h1>
        <p className="subtitle">
          截至 {new Date(date).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })} 的持仓明细
        </p>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="overline mb-2">A股市值</div>
          <div className="display mb-2">{formatCurrency(aShareSummary.totalValue)}</div>
          <div className={`body ${getPnLTextClass(aShareSummary.totalPnL)}`}>
            {aShareSummary.totalPnL > 0 ? '+' : ''}{formatPercent(aShareSummary.totalPnL, false)} · {aShareSummary.count}只
          </div>
        </div>

        <div className="card">
          <div className="overline mb-2">美股市值</div>
          <div className="display mb-2">{formatCurrency(usStockSummary.totalValue)}</div>
          <div className={`body ${getPnLTextClass(usStockSummary.totalPnL)}`}>
            {usStockSummary.totalPnL > 0 ? '+' : ''}{formatPercent(usStockSummary.totalPnL, false)} · {usStockSummary.count}只
          </div>
        </div>

        <div className="card">
          <div className="overline mb-2">总市值</div>
          <div className="display mb-2">{formatCurrency(totalSummary.totalValue)}</div>
          <div className={`body ${getPnLTextClass(totalPnLPct)}`}>
            {totalPnLPct > 0 ? '+' : ''}{formatPercent(totalPnLPct, false)} · {totalSummary.count}只
          </div>
        </div>
      </div>

      {/* A股持仓 */}
      {aShare.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="subtitle">A股持仓</h2>
            <span className="badge">{aShare.length}只</span>
          </div>
          
          <div className="card p-0">
            <div className="hidden md:grid grid-cols-8 gap-4 p-4 text-sm font-medium text-[var(--text-3)] border-b border-[var(--border)]">
              <div>股票</div>
              <div className="text-right">持股数</div>
              <div className="text-right">成本价</div>
              <div className="text-right">现价</div>
              <div className="text-right">市值</div>
              <div className="text-right">盈亏</div>
              <div className="text-right">盈亏%</div>
              <div></div>
            </div>
            
            <div className="divide-y divide-[var(--border)]">
              {aShare.map((stock: Stock, index: number) => (
                <div key={index} className="md:grid md:grid-cols-8 gap-4 p-4 md:items-center">
                  {/* 移动端布局 */}
                  <div className="md:hidden space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-[var(--text-1)]">{stock.name}</div>
                        <div className="text-sm text-[var(--text-3)]">{stock.code}</div>
                      </div>
                      <div className={`text-right ${getPnLTextClass(stock.pnl)}`}>
                        <div className="font-medium">{formatCurrency(stock.market_value)}</div>
                        <div className="text-sm">
                          {stock.pnl > 0 ? '+' : ''}{formatCurrency(stock.pnl)} ({stock.pnl_pct > 0 ? '+' : ''}{formatPercent(stock.pnl_pct, false)})
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-[var(--text-3)]">
                      <div>{stock.shares}股 · 成本 {formatCurrency(stock.cost_price)}</div>
                      <div>现价 {formatCurrency(stock.market_price)}</div>
                    </div>
                  </div>

                  {/* 桌面端布局 */}
                  <div className="hidden md:block">
                    <div className="font-medium text-[var(--text-1)]">{stock.name}</div>
                    <div className="text-sm text-[var(--text-3)]">{stock.code}</div>
                  </div>
                  <div className="hidden md:block text-right body">{stock.shares.toLocaleString()}</div>
                  <div className="hidden md:block text-right body">{formatCurrency(stock.cost_price)}</div>
                  <div className="hidden md:block text-right body">{formatCurrency(stock.market_price)}</div>
                  <div className="hidden md:block text-right body font-medium">{formatCurrency(stock.market_value)}</div>
                  <div className={`hidden md:block text-right body ${getPnLTextClass(stock.pnl)}`}>
                    {stock.pnl > 0 ? '+' : ''}{formatCurrency(stock.pnl)}
                  </div>
                  <div className={`hidden md:block text-right body ${getPnLTextClass(stock.pnl)}`}>
                    {stock.pnl_pct > 0 ? '+' : ''}{formatPercent(stock.pnl_pct, false)}
                  </div>
                  <div className="hidden md:block">
                    <span className={`badge ${getPnLClass(stock.pnl)}`}>
                      {stock.pnl > 0 ? '盈' : stock.pnl < 0 ? '亏' : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 美股持仓 */}
      {usStock.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="subtitle">美股持仓</h2>
            <span className="badge">{usStock.length}只</span>
          </div>
          
          <div className="card p-0">
            <div className="hidden md:grid grid-cols-8 gap-4 p-4 text-sm font-medium text-[var(--text-3)] border-b border-[var(--border)]">
              <div>股票</div>
              <div className="text-right">持股数</div>
              <div className="text-right">成本价</div>
              <div className="text-right">现价</div>
              <div className="text-right">市值</div>
              <div className="text-right">盈亏</div>
              <div className="text-right">盈亏%</div>
              <div></div>
            </div>
            
            <div className="divide-y divide-[var(--border)]">
              {usStock.map((stock: Stock, index: number) => (
                <div key={index} className="md:grid md:grid-cols-8 gap-4 p-4 md:items-center">
                  {/* 移动端布局 */}
                  <div className="md:hidden space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-[var(--text-1)]">{stock.name}</div>
                        <div className="text-sm text-[var(--text-3)]">{stock.code}</div>
                      </div>
                      <div className={`text-right ${getPnLTextClass(stock.pnl)}`}>
                        <div className="font-medium">{formatCurrency(stock.market_value)}</div>
                        <div className="text-sm">
                          {stock.pnl > 0 ? '+' : ''}{formatCurrency(stock.pnl)} ({stock.pnl_pct > 0 ? '+' : ''}{formatPercent(stock.pnl_pct, false)})
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm text-[var(--text-3)]">
                      <div>{stock.shares}股 · 成本 ${stock.cost_price.toFixed(2)}</div>
                      <div>现价 ${stock.market_price.toFixed(2)}</div>
                    </div>
                  </div>

                  {/* 桌面端布局 */}
                  <div className="hidden md:block">
                    <div className="font-medium text-[var(--text-1)]">{stock.name}</div>
                    <div className="text-sm text-[var(--text-3)]">{stock.code}</div>
                  </div>
                  <div className="hidden md:block text-right body">{stock.shares.toLocaleString()}</div>
                  <div className="hidden md:block text-right body">${stock.cost_price.toFixed(2)}</div>
                  <div className="hidden md:block text-right body">${stock.market_price.toFixed(2)}</div>
                  <div className="hidden md:block text-right body font-medium">{formatCurrency(stock.market_value)}</div>
                  <div className={`hidden md:block text-right body ${getPnLTextClass(stock.pnl)}`}>
                    {stock.pnl > 0 ? '+' : ''}{formatCurrency(stock.pnl)}
                  </div>
                  <div className={`hidden md:block text-right body ${getPnLTextClass(stock.pnl)}`}>
                    {stock.pnl_pct > 0 ? '+' : ''}{formatPercent(stock.pnl_pct, false)}
                  </div>
                  <div className="hidden md:block">
                    <span className={`badge ${getPnLClass(stock.pnl)}`}>
                      {stock.pnl > 0 ? '盈' : stock.pnl < 0 ? '亏' : '-'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 空状态 */}
      {aShare.length === 0 && usStock.length === 0 && (
        <div className="insight p-8 text-center">
          <h2 className="text-2xl font-medium text-[var(--text-1)] mb-4">📈 暂无持仓</h2>
          <p className="body">
            当前没有检测到任何持仓数据，请检查数据同步状态。
          </p>
        </div>
      )}
    </div>
  )
}