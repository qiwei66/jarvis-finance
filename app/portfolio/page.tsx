export const dynamic = 'force-dynamic'
export const revalidate = 0

import { getSupabaseAdmin } from '@/lib/supabase'
import { formatCurrency, getPnLTextClass } from '@/lib/calc'

async function fetchPortfolioData() {
  const supabase = getSupabaseAdmin()
  
  // 获取最新日期
  const { data: latestDate } = await supabase
    .from('portfolio_snapshots')
    .select('date')
    .order('date', { ascending: false })
    .limit(1)
    .single()
  
  const queryDate = latestDate?.date || new Date().toISOString().split('T')[0]
  
  const { data: holdings, error } = await supabase
    .from('portfolio_snapshots')
    .select('*')
    .eq('date', queryDate)
    .order('market_value', { ascending: false })
  
  if (error) {
    console.error('Failed to fetch portfolio:', error)
    return { holdings: [], date: queryDate }
  }
  
  return { holdings: holdings || [], date: queryDate }
}

export default async function PortfolioPage() {
  const { holdings, date } = await fetchPortfolioData()
  
  const aShareHoldings = holdings.filter(h => h.market === 'a_share')
  const usStockHoldings = holdings.filter(h => h.market === 'us_stock')
  
  const aShareTotal = aShareHoldings.reduce((sum, h) => sum + (h.market_value || 0), 0)
  const aSharePnL = aShareHoldings.reduce((sum, h) => sum + (h.pnl || 0), 0)
  const usStockTotal = usStockHoldings.reduce((sum, h) => sum + (h.market_value || 0), 0)
  const usStockPnL = usStockHoldings.reduce((sum, h) => sum + (h.pnl || 0), 0)

  return (
    <div>
      <div className="mb-8">
        <h2 className="mb-2 text-sm font-medium uppercase tracking-wider text-[var(--text-3)]">
          Portfolio
        </h2>
        <p className="text-[var(--text-2)]">
          持仓明细 · 数据日期 {date}
        </p>
      </div>

      {holdings.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[var(--text-2)]">暂无持仓数据</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* A股持仓 */}
          {aShareHoldings.length > 0 && (
            <section className="card">
              <div className="flex items-center justify-between mb-4">
                <span className="overline">A 股持仓</span>
                <div className="flex gap-2">
                  <span className="badge">
                    市值 {formatCurrency(aShareTotal)}
                  </span>
                  <span className={`badge ${aSharePnL >= 0 ? 'badge-up' : 'badge-down'}`}>
                    {aSharePnL >= 0 ? '+' : ''}{formatCurrency(aSharePnL)}
                  </span>
                </div>
              </div>
              
              {/* 表头 */}
              <div className="hidden sm:grid grid-cols-6 gap-2 px-2 py-2 text-xs text-[var(--text-3)] font-medium uppercase tracking-wider border-b border-[var(--border)]">
                <div>股票</div>
                <div className="text-right">持股</div>
                <div className="text-right">成本</div>
                <div className="text-right">现价</div>
                <div className="text-right">市值</div>
                <div className="text-right">盈亏</div>
              </div>
              
              {aShareHoldings.map((h, i) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-6 gap-2 px-2 py-3 border-b border-[var(--border)] last:border-b-0 items-center">
                  <div>
                    <div className="text-sm font-medium text-[var(--text-1)]">{h.name}</div>
                    <div className="text-xs text-[var(--text-3)]">{h.code}</div>
                  </div>
                  <div className="text-right sm:text-right text-sm text-[var(--text-2)]">
                    {(h.shares || 0).toLocaleString()}股
                  </div>
                  <div className="text-right text-sm text-[var(--text-2)] hidden sm:block">
                    ¥{(h.cost_price || 0).toFixed(2)}
                  </div>
                  <div className="text-right text-sm text-[var(--text-1)] hidden sm:block">
                    ¥{(h.market_price || 0).toFixed(2)}
                  </div>
                  <div className="text-right text-sm font-medium text-[var(--text-1)] hidden sm:block">
                    {formatCurrency(h.market_value || 0)}
                  </div>
                  <div className={`text-right text-sm font-medium hidden sm:block ${getPnLTextClass(h.pnl || 0)}`}>
                    {(h.pnl || 0) >= 0 ? '+' : ''}{formatCurrency(h.pnl || 0)}
                    <div className="text-xs">
                      {(h.pnl_pct || 0) >= 0 ? '+' : ''}{(h.pnl_pct || 0).toFixed(2)}%
                    </div>
                  </div>
                  {/* Mobile-only: show value and PnL */}
                  <div className="col-span-2 sm:hidden flex justify-between mt-1">
                    <span className="text-xs text-[var(--text-3)]">
                      成本 ¥{(h.cost_price || 0).toFixed(2)} → 现价 ¥{(h.market_price || 0).toFixed(2)}
                    </span>
                    <span className={`text-xs font-medium ${getPnLTextClass(h.pnl || 0)}`}>
                      {(h.pnl || 0) >= 0 ? '+' : ''}{formatCurrency(h.pnl || 0)} ({(h.pnl_pct || 0).toFixed(2)}%)
                    </span>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* 美股持仓 */}
          {usStockHoldings.length > 0 && (
            <section className="card">
              <div className="flex items-center justify-between mb-4">
                <span className="overline">美股持仓</span>
                <div className="flex gap-2">
                  <span className="badge">
                    市值 ${usStockTotal.toLocaleString()}
                  </span>
                  <span className={`badge ${usStockPnL >= 0 ? 'badge-up' : 'badge-down'}`}>
                    {usStockPnL >= 0 ? '+' : ''}${usStockPnL.toLocaleString()}
                  </span>
                </div>
              </div>
              
              {/* 表头 */}
              <div className="hidden sm:grid grid-cols-6 gap-2 px-2 py-2 text-xs text-[var(--text-3)] font-medium uppercase tracking-wider border-b border-[var(--border)]">
                <div>股票</div>
                <div className="text-right">持股</div>
                <div className="text-right">成本</div>
                <div className="text-right">现价</div>
                <div className="text-right">市值</div>
                <div className="text-right">盈亏</div>
              </div>
              
              {usStockHoldings.map((h, i) => (
                <div key={i} className="grid grid-cols-2 sm:grid-cols-6 gap-2 px-2 py-3 border-b border-[var(--border)] last:border-b-0 items-center">
                  <div>
                    <div className="text-sm font-medium text-[var(--text-1)]">{h.name}</div>
                    <div className="text-xs text-[var(--text-3)]">{h.code}</div>
                  </div>
                  <div className="text-right text-sm text-[var(--text-2)]">
                    {(h.shares || 0).toLocaleString()}股
                  </div>
                  <div className="text-right text-sm text-[var(--text-2)] hidden sm:block">
                    ${(h.cost_price || 0).toFixed(2)}
                  </div>
                  <div className="text-right text-sm text-[var(--text-1)] hidden sm:block">
                    ${(h.market_price || 0).toFixed(2)}
                  </div>
                  <div className="text-right text-sm font-medium text-[var(--text-1)] hidden sm:block">
                    ${(h.market_value || 0).toLocaleString()}
                  </div>
                  <div className={`text-right text-sm font-medium hidden sm:block ${getPnLTextClass(h.pnl || 0)}`}>
                    {(h.pnl || 0) >= 0 ? '+' : ''}${(h.pnl || 0).toLocaleString()}
                    <div className="text-xs">
                      {(h.pnl_pct || 0) >= 0 ? '+' : ''}{(h.pnl_pct || 0).toFixed(2)}%
                    </div>
                  </div>
                  {/* Mobile */}
                  <div className="col-span-2 sm:hidden flex justify-between mt-1">
                    <span className="text-xs text-[var(--text-3)]">
                      成本 ${(h.cost_price || 0).toFixed(2)} → 现价 ${(h.market_price || 0).toFixed(2)}
                    </span>
                    <span className={`text-xs font-medium ${getPnLTextClass(h.pnl || 0)}`}>
                      {(h.pnl || 0) >= 0 ? '+' : ''}${(h.pnl || 0).toLocaleString()} ({(h.pnl_pct || 0).toFixed(2)}%)
                    </span>
                  </div>
                </div>
              ))}
            </section>
          )}

          {/* 汇总 */}
          <section className="card">
            <span className="overline">持仓汇总</span>
            <div className="mt-4 space-y-0">
              <div className="data-row">
                <span className="body">A股总市值</span>
                <span className="text-lg font-medium text-[var(--text-1)]">{formatCurrency(aShareTotal)}</span>
              </div>
              <div className="data-row">
                <span className="body">美股总市值</span>
                <span className="text-lg font-medium text-[var(--text-1)]">${usStockTotal.toLocaleString()}</span>
              </div>
              <div className="data-row">
                <span className="body">总盈亏</span>
                <span className={`text-lg font-medium ${getPnLTextClass(aSharePnL + usStockPnL)}`}>
                  {(aSharePnL + usStockPnL) >= 0 ? '+' : ''}{formatCurrency(aSharePnL + usStockPnL)}
                </span>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
