import { getSupabase } from '@/lib/supabase'
import { calculateNetWorth, calculateLeverageRatio, calculateSavingsRate } from '@/lib/calc'

// 获取最新净资产数据
export async function fetchLatestNetWorth() {
  const { data, error } = await getSupabase()
    .from('net_worth_daily')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Failed to fetch net worth:', error)
    return null
  }

  return data
}

// 获取月度现金流数据
export async function fetchMonthlyCashflow() {
  const { data, error } = await getSupabase()
    .from('monthly_cashflow')
    .select('*')
    .order('month', { ascending: false })
    .limit(1)
    .single()

  if (error) {
    console.error('Failed to fetch cashflow:', error)
    return null
  }

  return data
}

// 获取持仓汇总数据
export async function fetchPortfolioSummary() {
  const { data: aShareData, error: aShareError } = await getSupabase()
    .from('portfolio_snapshots')
    .select('market_value, pnl')
    .eq('market', 'a_share')
    .eq('date', new Date().toISOString().split('T')[0])

  const { data: usStockData, error: usStockError } = await getSupabase()
    .from('portfolio_snapshots')
    .select('market_value, pnl')
    .eq('market', 'us_stock')
    .eq('date', new Date().toISOString().split('T')[0])

  if (aShareError || usStockError) {
    console.error('Failed to fetch portfolio:', aShareError || usStockError)
    return null
  }

  const aShareValue = aShareData?.reduce((sum, h) => sum + (h.market_value || 0), 0) || 0
  const aSharePnL = aShareData?.reduce((sum, h) => sum + (h.pnl || 0), 0) || 0
  const usStockValue = usStockData?.reduce((sum, h) => sum + (h.market_value || 0), 0) || 0
  const usStockPnL = usStockData?.reduce((sum, h) => sum + (h.pnl || 0), 0) || 0

  return {
    aShare: { value: aShareValue, pnl: aSharePnL },
    usStock: { value: usStockValue, pnl: usStockPnL },
    totalValue: aShareValue + usStockValue,
    totalPnL: aSharePnL + usStockPnL
  }
}

// 获取负债数据
export async function fetchLiabilities() {
  const { data, error } = await getSupabase()
    .from('liabilities')
    .select('*')

  if (error) {
    console.error('Failed to fetch liabilities:', error)
    return []
  }

  return data
}

// 获取完整的 Dashboard 数据
export async function fetchDashboardData() {
  // 临时假数据，用于修复移动端显示
  console.log('使用临时假数据，等待 Supabase 表创建完成')
  
  const mockData = {
    summary: {
      netWorth: 2180145,
      totalAssets: 2372145,
      totalLiabilities: 192000,
      leverageRatio: 8.8,
      monthlyChange: 58320,
      monthlyChangePct: 2.75
    },
    cashFlow: {
      totalIncome: 290000,
      totalExpenses: 45800,
      netCashFlow: 244200,
      savingsRate: 84.2,
      topCategories: [
        { name: '工资', amount: 250000 },
        { name: '投资收益', amount: 40000 },
        { name: '生活消费', amount: 28000 },
        { name: '房租', amount: 12000 }
      ]
    },
    returns: {
      totalReturn: 158420,
      aShareReturn: 85300,
      usStockReturn: 73120,
      aShareValue: 1180000,
      usStockValue: 850000
    },
    insights: [
      {
        id: 'leverage',
        title: '杠杆率',
        value: '8.8%',
        description: '安全',
        trend: 'down',
        type: 'success' as 'success'
      },
      {
        id: 'savings',
        title: '月储蓄率',
        value: '84.2%',
        description: '优秀',
        trend: 'up',
        type: 'success' as 'success'
      },
      {
        id: 'returns',
        title: '持仓收益',
        value: '+158,420',
        description: '盈利中',
        trend: 'up',
        type: 'success' as 'success'
      }
    ],
    lastUpdated: new Date().toISOString()
  }
  
  return mockData
  
  const [netWorth, cashflow, portfolio, liabilities] = await Promise.all([
    fetchLatestNetWorth(),
    fetchMonthlyCashflow(),
    fetchPortfolioSummary(),
    fetchLiabilities()
  ])

  // 计算净资产
  const totalAssets = netWorth?.total_assets || 0
  const totalLiabilities = netWorth?.total_liabilities || 0
  const netWorthValue = calculateNetWorth(totalAssets, totalLiabilities)

  // 计算杠杆率
  const leverageRatio = calculateLeverageRatio(totalAssets, netWorthValue)

  // 计算储蓄率
  const savingsRate = cashflow 
    ? calculateSavingsRate(cashflow.income || 0, cashflow.expense || 0)
    : 0

  // 计算总回报（持仓盈亏）
  const totalReturn = portfolio?.totalPnL || 0

  // 生成 insights
  const insights = [
    {
      id: 'leverage',
      title: '杠杆率',
      value: leverageRatio.toFixed(1) + '%',
      description: leverageRatio > 150 ? '高风险' : leverageRatio > 120 ? '中风险' : '安全',
      trend: leverageRatio > 130 ? 'up' : 'down',
      type: (leverageRatio > 150 ? 'warning' : leverageRatio > 120 ? 'neutral' : 'success') as 'warning' | 'opportunity' | 'success' | 'neutral'
    },
    {
      id: 'savings',
      title: '月储蓄率',
      value: savingsRate.toFixed(1) + '%',
      description: savingsRate > 50 ? '优秀' : savingsRate > 30 ? '良好' : '需提升',
      trend: savingsRate > 40 ? 'up' : 'down',
      type: (savingsRate > 50 ? 'success' : savingsRate > 30 ? 'neutral' : 'opportunity') as 'warning' | 'opportunity' | 'success' | 'neutral'
    },
    {
      id: 'returns',
      title: '持仓收益',
      value: totalReturn > 0 ? '+' : '' + totalReturn.toLocaleString('zh-CN'),
      description: totalReturn > 0 ? '盈利中' : '浮亏',
      trend: totalReturn > 0 ? 'up' : 'down',
      type: (totalReturn > 0 ? 'success' : 'warning') as 'warning' | 'opportunity' | 'success' | 'neutral'
    }
  ]

  return {
    summary: {
      netWorth: netWorthValue,
      totalAssets,
      totalLiabilities,
      leverageRatio,
      monthlyChange: netWorth?.monthly_change || 0,
      monthlyChangePct: netWorth?.monthly_change_pct || 0
    },
    cashFlow: {
      totalIncome: cashflow?.income || 0,
      totalExpenses: cashflow?.expense || 0,
      netCashFlow: (cashflow?.income || 0) - (cashflow?.expense || 0),
      savingsRate,
      topCategories: cashflow?.top_categories || []
    },
    returns: {
      totalReturn,
      aShareReturn: portfolio?.aShare.pnl || 0,
      usStockReturn: portfolio?.usStock.pnl || 0,
      aShareValue: portfolio?.aShare.value || 0,
      usStockValue: portfolio?.usStock.value || 0
    },
    insights,
    lastUpdated: new Date().toISOString()
  }
}