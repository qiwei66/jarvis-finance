#!/usr/bin/env node

/**
 * 股票价格同步脚本
 * 从新浪财经获取实时行情，更新到 Supabase 数据库
 * 可配置为 cron 任务（如每 5 分钟执行一次）
 */

import { createClient } from '@supabase/supabase-js'
import { fetchAllHoldings } from '../lib/data/sina.js'

// 加载环境变量
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function syncStockPrices() {
  console.log(`[${new Date().toISOString()}] Starting stock price sync...`)
  
  try {
    // 1. 获取实时行情数据
    const stockData = await fetchAllHoldings()
    
    if (stockData.length === 0) {
      console.log('No stock data received')
      return
    }
    
    console.log(`Fetched ${stockData.length} stocks`)
    
    const today = new Date().toISOString().split('T')[0]
    let updatedCount = 0
    let errorCount = 0
    
    // 2. 更新每只股票的实时数据
    for (const stock of stockData) {
      const market = stock.code.startsWith('gb_') ? 'us_stock' : 'a_share'
      
      try {
        // 查找当前持仓记录
        const { data: existingHolding, error: fetchError } = await supabase
          .from('portfolio_snapshots')
          .select('*')
          .eq('date', today)
          .eq('market', market)
          .eq('code', stock.code)
          .single()
        
        if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = not found
          console.error(`Failed to fetch ${stock.code}:`, fetchError)
          errorCount++
          continue
        }
        
        if (existingHolding) {
          // 计算市值和盈亏
          const shares = existingHolding.shares || 0
          const costPrice = existingHolding.cost_price || 0
          const marketValue = shares * stock.currentPrice
          const pnl = marketValue - (shares * costPrice)
          const pnlPct = costPrice > 0 ? (pnl / (shares * costPrice)) * 100 : 0
          
          // 更新持仓数据
          const { error: updateError } = await supabase
            .from('portfolio_snapshots')
            .update({
              market_price: stock.currentPrice,
              market_value: marketValue,
              pnl: pnl,
              pnl_pct: pnlPct,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingHolding.id)
          
          if (updateError) {
            console.error(`Failed to update ${stock.code}:`, updateError)
            errorCount++
          } else {
            updatedCount++
            console.log(`Updated ${stock.code}: ¥${stock.currentPrice} (${stock.changePct.toFixed(2)}%)`)
          }
        } else {
          console.log(`No holding found for ${stock.code} on ${today}`)
        }
      } catch (error) {
        console.error(`Error processing ${stock.code}:`, error)
        errorCount++
      }
    }
    
    // 3. 更新净资产数据（如果持仓有变化）
    if (updatedCount > 0) {
      await updateNetWorth(today)
    }
    
    console.log(`[${new Date().toISOString()}] Sync completed: ${updatedCount} updated, ${errorCount} errors`)
    
  } catch (error) {
    console.error('Sync failed:', error)
    process.exit(1)
  }
}

async function updateNetWorth(date) {
  try {
    // 计算最新的资产总值
    const { data: portfolioData, error: portfolioError } = await supabase
      .from('portfolio_snapshots')
      .select('market, market_value')
      .eq('date', date)
    
    if (portfolioError) {
      console.error('Failed to fetch portfolio for net worth:', portfolioError)
      return
    }
    
    const aShareValue = portfolioData
      .filter(p => p.market === 'a_share')
      .reduce((sum, h) => sum + (h.market_value || 0), 0)
    
    const usStockValue = portfolioData
      .filter(p => p.market === 'us_stock')
      .reduce((sum, h) => sum + (h.market_value || 0), 0)
    
    // 获取负债数据（假设负债不变）
    const { data: liabilitiesData, error: liabilitiesError } = await supabase
      .from('liabilities')
      .select('remaining')
    
    if (liabilitiesError) {
      console.error('Failed to fetch liabilities:', liabilitiesError)
      return
    }
    
    const totalLiabilities = liabilitiesData.reduce((sum, l) => sum + (l.remaining || 0), 0)
    
    // 其他资产（现金、SERS 等） - 从现有记录获取或使用默认值
    const { data: existingNetWorth, error: netWorthError } = await supabase
      .from('net_worth_daily')
      .select('*')
      .eq('date', date)
      .single()
    
    const cash = existingNetWorth?.cash || 47182
    const sersValue = existingNetWorth?.sers_value || 324000
    
    const totalAssets = aShareValue + usStockValue + cash + sersValue
    const netWorth = totalAssets - totalLiabilities
    
    // 计算月度变化（与前一天比较）
    const yesterday = new Date(date)
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    const { data: yesterdayNetWorth } = await supabase
      .from('net_worth_daily')
      .select('net_worth')
      .eq('date', yesterdayStr)
      .single()
    
    const yesterdayValue = yesterdayNetWorth?.net_worth || netWorth
    const monthlyChange = netWorth - yesterdayValue
    const monthlyChangePct = yesterdayValue > 0 ? (monthlyChange / yesterdayValue) * 100 : 0
    
    // 更新或插入净资产记录
    const { error: upsertError } = await supabase
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
    
    if (upsertError) {
      console.error('Failed to update net worth:', upsertError)
    } else {
      console.log(`Updated net worth: ¥${netWorth.toLocaleString('zh-CN')} (${monthlyChangePct.toFixed(2)}%)`)
    }
    
  } catch (error) {
    console.error('Error updating net worth:', error)
  }
}

// 执行同步
syncStockPrices().then(() => {
  console.log('Stock price sync finished')
  process.exit(0)
}).catch(error => {
  console.error('Sync failed:', error)
  process.exit(1)
})