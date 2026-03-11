// 净资产、收益率等计算工具

// 格式化货币
export function formatCurrency(amount: number, currency = '¥'): string {
  if (isNaN(amount)) return currency + '0'
  return currency + amount.toLocaleString('zh-CN')
}

// 格式化百分比
export function formatPercent(pct: number, showSign = true): string {
  if (isNaN(pct)) return '0%'
  const sign = showSign && pct > 0 ? '+' : ''
  return sign + pct.toFixed(2) + '%'
}

// 格式化大额数字（万、千万）
export function formatLargeNumber(amount: number): string {
  if (isNaN(amount)) return '0'
  
  if (Math.abs(amount) >= 100000000) {
    return (amount / 100000000).toFixed(1) + '亿'
  } else if (Math.abs(amount) >= 10000) {
    return (amount / 10000).toFixed(1) + '万'
  } else {
    return amount.toLocaleString('zh-CN')
  }
}

// 获取涨跌颜色类名（红涨绿跌）
export function getPnLClass(value: number): string {
  if (value > 0) return 'badge-up'   // 红色（涨）
  if (value < 0) return 'badge-down' // 绿色（跌）
  return ''
}

// 获取涨跌文本颜色
export function getPnLTextClass(value: number): string {
  if (value > 0) return 'text-[var(--up)]'   // 红色（涨）
  if (value < 0) return 'text-[var(--down)]' // 绿色（跌）
  return 'text-[var(--text-1)]'
}

// 计算净资产
export function calculateNetWorth(totalAssets: number, totalLiabilities: number): number {
  return totalAssets - totalLiabilities
}

// 计算杠杆率
export function calculateLeverageRatio(totalAssets: number, netWorth: number): number {
  if (netWorth <= 0) return 0
  return (totalAssets / netWorth) * 100
}

// 计算储蓄率
export function calculateSavingsRate(income: number, expense: number): number {
  if (income <= 0) return 0
  return ((income - expense) / income) * 100
}

// 计算年化收益率
export function calculateAnnualizedReturn(
  startValue: number,
  endValue: number,
  days: number
): number {
  if (startValue <= 0 || days <= 0) return 0
  const totalReturn = (endValue - startValue) / startValue
  const annualized = Math.pow(1 + totalReturn, 365 / days) - 1
  return annualized * 100
}

// 计算复合年增长率 (CAGR)
export function calculateCAGR(
  startValue: number,
  endValue: number,
  years: number
): number {
  if (startValue <= 0 || years <= 0) return 0
  return (Math.pow(endValue / startValue, 1 / years) - 1) * 100
}

// 计算最大回撤
export function calculateMaxDrawdown(values: number[]): number {
  if (values.length < 2) return 0
  
  let maxDrawdown = 0
  let peak = values[0]
  
  for (let i = 1; i < values.length; i++) {
    if (values[i] > peak) {
      peak = values[i]
    } else {
      const drawdown = (peak - values[i]) / peak
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }
  }
  
  return maxDrawdown * 100
}

// 计算波动率（标准差）
export function calculateVolatility(returns: number[]): number {
  if (returns.length < 2) return 0
  
  const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1)
  
  return Math.sqrt(variance) * 100
}

// 计算夏普比率
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate = 0.03 // 3% 无风险利率
): number {
  if (returns.length < 2) return 0
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const volatility = calculateVolatility(returns) / 100
  
  if (volatility === 0) return 0
  return (avgReturn - riskFreeRate) / volatility
}

// 数字滚动动画辅助函数
export function animateNumber(
  start: number,
  end: number,
  duration: number,
  callback: (value: number) => void
): void {
  const startTime = performance.now()
  
  function update(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // ease-out cubic 缓动函数
    const eased = 1 - Math.pow(1 - progress, 3)
    const current = start + (end - start) * eased
    
    callback(Math.floor(current))
    
    if (progress < 1) {
      requestAnimationFrame(update)
    }
  }
  
  requestAnimationFrame(update)
}

// 计算里程碑进度
export function calculateMilestoneProgress(current: number, target: number): {
  progress: number;
  remaining: number;
  progressPercent: number;
} {
  const progress = Math.min(current / target, 1) * 100
  const remaining = Math.max(target - current, 0)
  
  return {
    progress: current,
    remaining,
    progressPercent: progress
  }
}

// 计算同龄人排名（模拟函数）
export function calculatePeerRanking(netWorth: number, age: number): {
  percentile: number;
  ranking: string;
} {
  // 简化的计算逻辑，实际应该基于真实统计数据
  const baselineByAge: { [key: number]: number } = {
    25: 50000,
    30: 200000,
    35: 500000,
    40: 1000000,
    45: 1500000,
  }
  
  const baseline = baselineByAge[Math.floor(age / 5) * 5] || baselineByAge[30]
  const ratio = netWorth / baseline
  
  let percentile: number
  if (ratio >= 20) percentile = 99
  else if (ratio >= 10) percentile = 97
  else if (ratio >= 5) percentile = 95
  else if (ratio >= 3) percentile = 90
  else if (ratio >= 2) percentile = 80
  else if (ratio >= 1.5) percentile = 70
  else percentile = Math.max(Math.floor(ratio * 50), 10)
  
  let ranking: string
  if (percentile >= 97) ranking = 'top 3%'
  else if (percentile >= 90) ranking = 'top 10%'
  else if (percentile >= 75) ranking = 'top 25%'
  else if (percentile >= 50) ranking = 'top 50%'
  else ranking = `${100 - percentile}% 以下`
  
  return { percentile, ranking }
}