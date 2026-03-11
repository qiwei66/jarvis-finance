// Yahoo Finance API 替代方案
// 免费且稳定的股价数据源

interface StockData {
  code: string
  name: string
  currentPrice: number
  change: number
  changePct: number
  volume?: number
  marketValue?: number
}

// 股票代码映射
const STOCK_MAPPING = {
  // A股 - Yahoo格式
  'sh688215': '688215.SS', // 瑞晟智能
  'sh600725': '600725.SS', // 云维股份 
  'sz001335': '001335.SZ', // 信凯科技
  'sz002837': '002837.SZ', // 英维克
  'sz300442': '300442.SZ', // 润泽科技
  
  // 美股 - Yahoo格式
  'gb_googl': 'GOOGL',     // GOOGL
  'gb_rklb': 'RKLB',       // RKLB
  'gb_tsla': 'TSLA',       // TSLA
  'gb_mstr': 'MSTR',       // MSTR
  'gb_nvda': 'NVDA',       // NVDA
}

// 获取单只股票实时数据（Yahoo Finance）
async function fetchYahooStock(code: string): Promise<StockData | null> {
  try {
    const yahooCode = STOCK_MAPPING[code as keyof typeof STOCK_MAPPING]
    if (!yahooCode) {
      console.error(`No Yahoo mapping for ${code}`)
      return null
    }

    // 使用 Yahoo Finance API
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooCode}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      console.error(`Yahoo API failed for ${yahooCode}: ${response.status}`)
      return null
    }
    
    const data = await response.json()
    const result = data.chart?.result?.[0]
    
    if (!result) {
      console.error(`No data in response for ${yahooCode}`)
      return null
    }
    
    const meta = result.meta
    const currentPrice = meta.regularMarketPrice || 0
    const previousClose = meta.previousClose || 0
    const change = currentPrice - previousClose
    const changePct = previousClose > 0 ? (change / previousClose) * 100 : 0
    
    return {
      code,
      name: meta.longName || meta.symbol || yahooCode,
      currentPrice,
      change,
      changePct,
    }
    
  } catch (error) {
    console.error(`Error fetching Yahoo data for ${code}:`, error)
    return null
  }
}

// 批量获取所有股票数据
export async function fetchAllHoldings(): Promise<StockData[]> {
  const codes = Object.keys(STOCK_MAPPING)
  const results: StockData[] = []
  
  console.log(`Fetching ${codes.length} stocks from Yahoo Finance...`)
  
  // 并发请求但限制数量
  const batchSize = 3
  for (let i = 0; i < codes.length; i += batchSize) {
    const batch = codes.slice(i, i + batchSize)
    const promises = batch.map(code => fetchYahooStock(code))
    const batchResults = await Promise.all(promises)
    
    for (const result of batchResults) {
      if (result && result.currentPrice > 0) {
        results.push(result)
        console.log(`✓ ${result.code}: $${result.currentPrice} (${result.changePct.toFixed(2)}%)`)
      }
    }
    
    // 避免请求过快
    if (i + batchSize < codes.length) {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  
  console.log(`Successfully fetched ${results.length}/${codes.length} stocks`)
  return results
}

// 获取特定股票数据
export async function fetchStockByCode(code: string): Promise<StockData | null> {
  return fetchYahooStock(code)
}

// 测试函数
export async function testYahooAPI(): Promise<boolean> {
  try {
    const testResult = await fetchYahooStock('gb_googl')
    return testResult !== null && testResult.currentPrice > 0
  } catch (error) {
    console.error('Yahoo API test failed:', error)
    return false
  }
}