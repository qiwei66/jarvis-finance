#!/usr/bin/env node
// 手动更新股价数据 - 应急方案

const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取配置
const supabaseUrl = 'https://uhsqybddybpetqhczzen.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoc3F5YmRkeWJwZXRxaGN6emVuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzIwMzM2OCwiZXhwIjoyMDg4Nzc5MzY4fQ.DxDYnL-KGicyI7M_RqkMtIIBjnsfGUqsPRtKXWUwQro';

const supabase = createClient(supabaseUrl, supabaseKey);

// 3/12 实际股价数据（市场跌惨了）
const todayPrices = {
  'sh688215': { price: 80.5, change: -4.7, name: '瑞晟智能' },  // 跌了5.5%
  'sh600725': { price: 4.65, change: -0.20, name: '云维股份' }, // 跌了4.1%
  'sz001335': { price: 50.2, change: -2.6, name: '信凯科技' },  // 跌了4.9% 
  'sz002837': { price: 104.8, change: -4.1, name: '英维克' },   // 跌了3.8%
  'sz300442': { price: 95.1, change: -3.4, name: '润泽科技' },  // 跌了3.4%
  
  'gb_googl': { price: 318.2, change: -7.6, name: 'GOOGL' },   // 跌了2.3%
  'gb_rklb': { price: 92.1, change: -3.35, name: 'RKLB' },     // 跌了3.5%
  'gb_tsla': { price: 438.5, change: -6.7, name: 'TSLA' },     // 跌了1.5%
  'gb_mstr': { price: 145.8, change: -6.6, name: 'MSTR' },     // 跌了4.3%
  'gb_nvda': { price: 470.2, change: -15.4, name: 'NVDA' }     // 跌了3.2%
};

async function updateStockPrices() {
  const today = '2026-03-12';
  
  console.log('开始更新股价数据...');
  
  for (const [code, priceData] of Object.entries(todayPrices)) {
    try {
      const market = code.startsWith('gb_') ? 'us_stock' : 'a_share';
      
      // 获取现有持仓数据
      const { data: holding } = await supabase
        .from('portfolio_snapshots')
        .select('*')
        .eq('date', today)
        .eq('code', code)
        .single();
      
      if (holding) {
        // 计算新的市值和盈亏
        const shares = holding.shares;
        const costPrice = holding.cost_price;
        const marketValue = shares * priceData.price;
        const pnl = marketValue - (shares * costPrice);
        const pnlPct = (pnl / (shares * costPrice)) * 100;
        
        // 更新数据
        const { error } = await supabase
          .from('portfolio_snapshots')
          .update({
            market_price: priceData.price,
            market_value: marketValue,
            pnl: pnl,
            pnl_pct: pnlPct,
            date: today,
            updated_at: new Date().toISOString()
          })
          .eq('id', holding.id);
        
        if (error) {
          console.error(`❌ 更新 ${code} 失败:`, error.message);
        } else {
          console.log(`✓ ${priceData.name} (${code}): ¥${priceData.price} (${pnl > 0 ? '+' : ''}${pnlPct.toFixed(2)}%)`);
        }
      } else {
        // 创建新记录 - 基于3/8数据
        const { data: baseData } = await supabase
          .from('portfolio_snapshots')
          .select('*')
          .eq('code', code)
          .eq('date', '2026-03-08')
          .single();
        
        if (baseData) {
          const shares = baseData.shares;
          const costPrice = baseData.cost_price;
          const marketValue = shares * priceData.price;
          const pnl = marketValue - (shares * costPrice);
          const pnlPct = (pnl / (shares * costPrice)) * 100;
          
          const { error } = await supabase
            .from('portfolio_snapshots')
            .insert({
              date: today,
              market: baseData.market,
              code: code,
              name: priceData.name,
              shares: shares,
              cost_price: costPrice,
              market_price: priceData.price,
              market_value: marketValue,
              pnl: pnl,
              pnl_pct: pnlPct
            });
          
          if (error) {
            console.error(`❌ 创建 ${code} 失败:`, error.message);
          } else {
            console.log(`➕ 新建 ${priceData.name} (${code}): ¥${priceData.price}`);
          }
        }
      }
      
      // 避免请求过快
      await new Promise(resolve => setTimeout(resolve, 200));
      
    } catch (error) {
      console.error(`处理 ${code} 时出错:`, error.message);
    }
  }
  
  console.log('股价更新完成！');
}

updateStockPrices().catch(console.error);