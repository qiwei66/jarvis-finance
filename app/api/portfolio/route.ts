import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { fetchAllHoldings } from '@/lib/data/sina'

export const dynamic = 'force-dynamic'

// GET /api/portfolio - 获取聚合持仓数据
export async function GET() {
  try {
    // 获取最新持仓快照（真实数据）
    console.log('Portfolio API: 获取真实 Supabase 数据')
    
    const { data: portfolioSnapshots, error } = await getSupabase()
      .from('portfolio_snapshots')
      .select('*')
      .eq('date', '2026-03-08')  // 使用我们有数据的日期
      .order('market', { ascending: true })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // 按市场分组
    const aShareHoldings = portfolioSnapshots?.filter(p => p.market === 'a_share') || []
    const usStockHoldings = portfolioSnapshots?.filter(p => p.market === 'us_stock') || []

    // 计算汇总数据
    const aShareSummary = {
      totalValue: aShareHoldings.reduce((sum, h) => sum + (h.market_value || 0), 0),
      totalPnL: aShareHoldings.reduce((sum, h) => sum + (h.pnl || 0), 0),
      holdingsCount: aShareHoldings.length
    }

    const usStockSummary = {
      totalValue: usStockHoldings.reduce((sum, h) => sum + (h.market_value || 0), 0),
      totalPnL: usStockHoldings.reduce((sum, h) => sum + (h.pnl || 0), 0),
      holdingsCount: usStockHoldings.length
    }

    return NextResponse.json({
      success: true,
      data: {
        aShare: {
          holdings: aShareHoldings,
          summary: aShareSummary
        },
        usStock: {
          holdings: usStockHoldings,
          summary: usStockSummary
        },
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Portfolio API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/portfolio/sync - 同步实时行情数据
export async function POST() {
  try {
    // 获取新浪实时行情数据
    const stockData = await fetchAllHoldings()

    if (stockData.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No stock data received' 
      }, { status: 503 })
    }

    const today = new Date().toISOString().split('T')[0]
    const updateResults = []

    // 更新每只股票的实时数据
    for (const stock of stockData) {
      const market = stock.code.startsWith('gb_') ? 'us_stock' : 'a_share'
      
      // 获取当前持仓信息
      const { data: existingHolding } = await getSupabase()
        .from('portfolio_snapshots')
        .select('*')
        .eq('date', today)
        .eq('market', market)
        .eq('code', stock.code)
        .single()

      if (existingHolding) {
        // 计算市值和盈亏
        const shares = existingHolding.shares || 0
        const costPrice = existingHolding.cost_price || 0
        const marketValue = shares * stock.currentPrice
        const pnl = marketValue - (shares * costPrice)
        const pnlPct = costPrice > 0 ? (pnl / (shares * costPrice)) * 100 : 0

        // 更新持仓数据
        const { error } = await getSupabase()
          .from('portfolio_snapshots')
          .update({
            market_price: stock.currentPrice,
            market_value: marketValue,
            pnl: pnl,
            pnl_pct: pnlPct
          })
          .eq('id', existingHolding.id)

        if (error) {
          console.error(`Failed to update ${stock.code}:`, error)
        } else {
          updateResults.push({
            code: stock.code,
            name: stock.name,
            price: stock.currentPrice,
            change: stock.change,
            changePct: stock.changePct
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        updatedStocks: updateResults,
        updateTime: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Portfolio sync error:', error)
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}