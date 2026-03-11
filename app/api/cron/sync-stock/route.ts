import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { fetchAllHoldings } from '@/lib/data/multi-source'

// 验证 cron 密钥（从环境变量读取）
const CRON_SECRET = process.env.CRON_SECRET

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    // 验证请求（可选）
    const authHeader = request.headers.get('authorization')
    if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log(`[${new Date().toISOString()}] Starting stock price sync via API...`)
    
    // 获取实时行情数据
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
            pnl_pct: pnlPct,
            updated_at: new Date().toISOString()
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
            changePct: stock.changePct,
            marketValue,
            pnl,
            pnlPct
          })
        }
      }
    }
    
    // 如果更新了持仓，重新计算净资产
    if (updateResults.length > 0) {
      await updateNetWorth(today)
    }
    
    return NextResponse.json({
      success: true,
      data: {
        updatedStocks: updateResults,
        updateTime: new Date().toISOString(),
        count: updateResults.length
      }
    })
    
  } catch (error) {
    console.error('Stock sync API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function updateNetWorth(date: string) {
  try {
    const { data: portfolioData } = await getSupabase()
      .from('portfolio_snapshots')
      .select('market, market_value')
      .eq('date', date)
    
    if (!portfolioData) return
    
    const aShareValue = portfolioData
      .filter(p => p.market === 'a_share')
      .reduce((sum, h) => sum + (h.market_value || 0), 0)
    
    const usStockValue = portfolioData
      .filter(p => p.market === 'us_stock')
      .reduce((sum, h) => sum + (h.market_value || 0), 0)
    
    // 获取负债数据
    const { data: liabilitiesData } = await getSupabase()
      .from('liabilities')
      .select('remaining')
    
    const totalLiabilities = liabilitiesData?.reduce((sum, l) => sum + (l.remaining || 0), 0) || 1920000
    
    // 其他资产
    const { data: existingNetWorth } = await getSupabase()
      .from('net_worth_daily')
      .select('*')
      .eq('date', date)
      .single()
    
    const cash = existingNetWorth?.cash || 47182
    const sersValue = existingNetWorth?.sers_value || 324000
    
    const totalAssets = aShareValue + usStockValue + cash + sersValue
    const netWorth = totalAssets - totalLiabilities
    
    // 计算月度变化
    const yesterday = new Date(date)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    const { data: yesterdayNetWorth } = await getSupabase()
      .from('net_worth_daily')
      .select('net_worth')
      .eq('date', yesterdayStr)
      .single()
    
    const yesterdayValue = yesterdayNetWorth?.net_worth || netWorth
    const monthlyChange = netWorth - yesterdayValue
    const monthlyChangePct = yesterdayValue > 0 ? (monthlyChange / yesterdayValue) * 100 : 0
    
    // 更新净资产记录
    await getSupabase()
      .from('net_worth_daily')
      .upsert({
        date,
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: netWorth,
        a_share_value: aShareValue,
        us_stock_value: usStockValue,
        cash,
        sers_value: sersValue,
        monthly_change: monthlyChange,
        monthly_change_pct: monthlyChangePct,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'date'
      })
    
    console.log(`Net worth updated: ¥${netWorth.toLocaleString('zh-CN')}`)
    
  } catch (error) {
    console.error('Error updating net worth:', error)
  }
}