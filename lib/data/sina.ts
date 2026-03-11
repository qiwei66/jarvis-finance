// 新浪财经实时行情 API 接口
// 支持 A 股和美股实时价格获取

interface StockData {
  code: string
  name: string
  currentPrice: number
  change: number
  changePct: number
  volume?: number
  marketValue?: number
}

// A 股代码映射（新浪格式）
const A_SHARE_CODES = [
  'sh688215', // 瑞晟智能
  'sh600725', // 云维股份
  'sz001335', // 信凯科技
  'sz002837', // 英维克
  'sz300442', // 润泽科技
]

// 美股代码映射（新浪格式）
const US_STOCK_CODES = [
  'gb_googl', // GOOGL
  'gb_rklb',  // RKLB
  'gb_tsla',  // TSLA
  'gb_mstr',  // MSTR
  'gb_nvda',  // NVDA
]

// 获取单只股票实时数据
async function fetchStockRealTime(code: string): Promise<StockData | null> {
  try {
    const url = `https://hq.sinajs.cn/list=${code}`
    
    const response = await fetch(url, {
      headers: {
        'Referer': 'https://finance.sina.com.cn',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch ${code}: ${response.status}`)
      return null
    }
    
    const text = await response.text()
    // 解析新浪财经数据格式
    const match = text.match(/="([^"]+)"/)
    if (!match) {
      console.error(`Invalid response for ${code}`)
      return null
    }
    
    const data = match[1].split(',')
    
    // 新浪数据格式：
    // A股: [股票名,今开,昨收,当前价,最高,最低,买一,卖一,成交量,成交额,买一量,卖一量,...]
    // 美股: [股票名,当前价,涨跌,涨跌幅,时间,昨收,今开,最高,最低,成交量,...]
    
    let currentPrice = 0
    let change = 0
    let changePct = 0
    let name = data[0]
    
    if (code.startsWith('gb_')) {
      // 美股格式
      currentPrice = parseFloat(data[1]) || 0
      change = parseFloat(data[2]) || 0
      changePct = parseFloat(data[3]) || 0
    } else {
      // A股格式
      currentPrice = parseFloat(data[3]) || 0
      const prevClose = parseFloat(data[2]) || 0
      change = currentPrice - prevClose
      changePct = prevClose > 0 ? (change / prevClose) * 100 : 0
    }
    
    return {
      code,
      name,
      currentPrice,
      change,
      changePct,
    }
  } catch (error) {
    console.error(`Error fetching ${code}:`, error)
    return null
  }
}

// 批量获取股票数据
export async function fetchAllHoldings(): Promise<StockData[]> {
  const allCodes = [...A_SHARE_CODES, ...US_STOCK_CODES]
  const results: StockData[] = []
  
  // 分批请求，避免一次性请求太多
  const batchSize = 5
  for (let i = 0; i < allCodes.length; i += batchSize) {
    const batch = allCodes.slice(i, i + batchSize)
    const promises = batch.map(code => fetchStockRealTime(code))
    const batchResults = await Promise.all(promises)
    
    for (const result of batchResults) {
      if (result) {
        results.push(result)
      }
    }
    
    // 避免请求过快
    if (i + batchSize < allCodes.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return results
}

// 获取特定股票数据
export async function fetchStockByCode(code: string): Promise<StockData | null> {
  return fetchStockRealTime(code)
}

// 测试函数
export async function testSinaAPI(): Promise<boolean> {
  try {
    const testCode = 'sh000001' // 上证指数
    const data = await fetchStockRealTime(testCode)
    return data !== null
  } catch (error) {
    console.error('Sina API test failed:', error)
    return false
  }
}