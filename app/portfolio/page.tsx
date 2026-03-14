export const dynamic = 'force-dynamic'
export const revalidate = 0

import { fetchPortfolioDetails } from '@/lib/data/fetch'

interface Stock {
  id: number; date: string; market: 'a_share' | 'us_stock'; code: string; name: string
  shares: number; cost_price: number; market_price: number; market_value: number
  pnl: number; pnl_pct: number
}

function cn(n: number) { return n > 0 ? 'num-up' : n < 0 ? 'num-down' : 'num-neutral' }
function fmt(n: number) { return Math.abs(n) >= 10000 ? (n / 10000).toFixed(1) + '万' : n.toLocaleString() }
function fmtPct(n: number) { return (n > 0 ? '+' : '') + n.toFixed(2) + '%' }

function StockCard({ stock, isCny = true }: { stock: Stock; isCny?: boolean }) {
  const prefix = isCny ? '¥' : '$'
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-white/90 truncate">{stock.name}</div>
        <div className="text-[10px] text-white/30 mt-0.5">
          {stock.code} · {stock.shares.toLocaleString()}股 · 成本{prefix}{stock.cost_price.toFixed(2)}
        </div>
      </div>
      <div className="text-right ml-3 shrink-0">
        <div className="text-sm font-semibold text-white/90">
          {isCny ? '¥' : '$'}{stock.market_value.toLocaleString()}
        </div>
        <div className={`text-[11px] ${cn(stock.pnl)}`}>
          {stock.pnl > 0 ? '+' : ''}{prefix}{Math.abs(stock.pnl).toLocaleString()} ({fmtPct(stock.pnl_pct)})
        </div>
      </div>
    </div>
  )
}

export default async function PortfolioPage() {
  const data = await fetchPortfolioDetails()
  
  if (!data) {
    return <div className="py-20 text-center text-white/40">加载持仓数据中...</div>
  }

  const { aShare, usStock, date } = data

  const aTotal = aShare.reduce((s: number, x: Stock) => s + x.market_value, 0)
  const aPnl = aShare.reduce((s: number, x: Stock) => s + x.pnl, 0)
  const uTotal = usStock.reduce((s: number, x: Stock) => s + x.market_value, 0)
  const uPnl = usStock.reduce((s: number, x: Stock) => s + x.pnl, 0)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-lg font-semibold">持仓详情</h1>
        <p className="text-xs text-white/30 mt-1">
          截至 {new Date(date).toLocaleDateString('zh-CN')}
        </p>
      </div>

      {/* 汇总 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card">
          <div className="text-[10px] text-white/30">A股</div>
          <div className="text-base font-semibold mt-1">¥{fmt(aTotal)}</div>
          <div className={`text-[10px] mt-0.5 ${cn(aPnl)}`}>{aPnl > 0 ? '+' : ''}¥{fmt(aPnl)}</div>
        </div>
        <div className="card">
          <div className="text-[10px] text-white/30">美股</div>
          <div className="text-base font-semibold mt-1">${uTotal.toLocaleString()}</div>
          <div className={`text-[10px] mt-0.5 ${cn(uPnl)}`}>{uPnl > 0 ? '+' : ''}${Math.abs(uPnl).toLocaleString()}</div>
        </div>
        <div className="card">
          <div className="text-[10px] text-white/30">总计</div>
          <div className="text-base font-semibold mt-1">{aShare.length + usStock.length}只</div>
          <div className="text-[10px] text-white/30 mt-0.5">{aShare.length}A + {usStock.length}美</div>
        </div>
      </div>

      {/* A股 */}
      {aShare.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-white/60">A股持仓</span>
            <span className="tag">{aShare.length}只</span>
          </div>
          {(aShare as Stock[]).sort((a, b) => b.market_value - a.market_value).map((stock: Stock) => (
            <StockCard key={stock.code} stock={stock} isCny={true} />
          ))}
        </div>
      )}

      {/* 美股 */}
      {usStock.length > 0 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium text-white/60">美股持仓</span>
            <span className="tag">{usStock.length}只</span>
          </div>
          {(usStock as Stock[]).sort((a, b) => b.market_value - a.market_value).map((stock: Stock) => (
            <StockCard key={stock.code} stock={stock} isCny={false} />
          ))}
        </div>
      )}
    </div>
  )
}
