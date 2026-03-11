'use client'

import { Chart, createReturnsChartOption } from './Chart'
import { formatCurrency, formatPercent, getPnLClass, getPnLTextClass } from '@/lib/calc'

interface ReturnsData {
  totalReturn: number
  aShareReturn: number
  usStockReturn: number
  aShareValue: number
  usStockValue: number
}

interface ReturnsProps {
  data: ReturnsData
}

export function Returns({ data }: ReturnsProps) {
  const {
    totalReturn,
    aShareReturn,
    usStockReturn,
    aShareValue,
    usStockValue
  } = data

  const isPositive = totalReturn > 0

  // 模拟收益趋势数据（后续从数据库获取）
  const returnsData = [
    { month: '4月', value: 52000 },
    { month: '5月', value: -31000 },
    { month: '6月', value: 84000 },
    { month: '7月', value: -28000 },
    { month: '8月', value: 121000 },
    { month: '9月', value: -15000 },
    { month: '10月', value: 63000 },
    { month: '11月', value: -42000 },
    { month: '12月', value: 91000 },
    { month: '1月', value: -85000 },
    { month: '2月', value: 32000 },
    { month: '3月', value: totalReturn }
  ]

  const chartOption = createReturnsChartOption(returnsData)

  // 计算 A 股杠杆率
  const aShareLeverage = (aShareValue && aShareValue > 0) ? ((aShareValue + 1920000) / aShareValue * 100).toFixed(1) + '%' : '0%'

  return (
    <section className="card">
      {/* 头部 */}
      <span className="overline">INVESTMENT RETURNS · 本月</span>
      
      {/* 总收益 */}
      <div className="flex items-end gap-3 mt-4 mb-2">
        <span 
          className={`headline ${getPnLTextClass(totalReturn)}`}
        >
          {totalReturn > 0 ? '+' : ''}{formatCurrency(totalReturn)}
        </span>
        <span className="caption mb-1.5">CNY</span>
      </div>
      
      {/* 状态标签 */}
      <div className="flex gap-2 mb-7">
        <span className={`badge ${getPnLClass(totalReturn)}`}>
          {totalReturn > 0 ? '↑' : '↓'} {Math.abs(totalReturn).toLocaleString('zh-CN')}
        </span>
      </div>

      {/* 投资明细 */}
      <div className="space-y-0">
        <div className="data-row">
          <div>
            <span className="body">A 股</span>
            <div className="caption mt-0.5">融资仓位 {aShareLeverage}</div>
          </div>
          <span className={`text-xl font-normal tracking-[-0.01em] ${getPnLTextClass(aShareReturn)}`}>
            {aShareReturn > 0 ? '+' : ''}{formatCurrency(aShareReturn)}
          </span>
        </div>
        
        <div className="data-row">
          <div>
            <span className="body">美股</span>
            <div className="caption mt-0.5">
              {formatCurrency(usStockValue)}
            </div>
          </div>
          <span className={`text-xl font-normal tracking-[-0.01em] ${getPnLTextClass(usStockReturn)}`}>
            {usStockReturn > 0 ? '+' : ''}{formatCurrency(usStockReturn)}
          </span>
        </div>
      </div>

      {/* 收益趋势图 */}
      <div className="chart-area mt-6">
        <Chart 
          id="chart-returns"
          option={chartOption}
          height={100}
        />
      </div>
    </section>
  )
}