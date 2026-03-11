'use client'

import { useEffect, useState, useRef } from 'react'
import { Chart, createNetWorthChartOption } from './Chart'
import { formatCurrency, formatPercent, animateNumber, calculateMilestoneProgress, calculatePeerRanking } from '@/lib/calc'

interface NetWorthProps {
  data: {
    netWorth: number
    totalAssets: number
    totalLiabilities: number
    leverageRatio: number
    monthlyChange: number
    monthlyChangePct: number
  }
}

export function NetWorth({ data }: NetWorthProps) {
  const { netWorth, totalAssets, totalLiabilities, leverageRatio, monthlyChange, monthlyChangePct } = data
  
  const [displayValue, setDisplayValue] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const counterRef = useRef<HTMLSpanElement>(null)

  // 计算里程碑进度（目标 200 万）
  const milestoneTarget = 2000000
  const milestone = calculateMilestoneProgress(netWorth, milestoneTarget)

  // 计算同龄人排名
  const age = 27
  const peerRanking = calculatePeerRanking(netWorth, age)

  useEffect(() => {
    // 延迟启动动画
    const timer = setTimeout(() => {
      setIsAnimating(true)
      
      // 数字滚动动画
      animateNumber(0, netWorth, 2000, (value) => {
        setDisplayValue(value)
      })

      // 进度条动画
      const progressBar = document.getElementById('milestone-bar')
      if (progressBar) {
        progressBar.style.width = `${milestone.progressPercent}%`
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [netWorth, milestone.progressPercent])

  // 模拟趋势数据（后续从数据库获取）
  const trendData = [
    { month: '4月', value: 1050000 },
    { month: '5月', value: 1120000 },
    { month: '6月', value: 1180000 },
    { month: '7月', value: 1150000 },
    { month: '8月', value: 1250000 },
    { month: '9月', value: 1280000 },
    { month: '10月', value: 1220000 },
    { month: '11月', value: 1320000 },
    { month: '12月', value: 1350000 },
    { month: '1月', value: 1280000 },
    { month: '2月', value: 1340000 },
    { month: '3月', value: netWorth }
  ]

  const chartOption = createNetWorthChartOption(trendData)

  return (
    <section className="card">
      {/* 头部信息 */}
      <div className="flex items-center justify-between mb-4">
        <span className="overline">NET WORTH · 净资产</span>
        <div className="flex gap-2">
          <span className={`badge ${monthlyChangePct > 0 ? 'badge-up' : 'badge-down'}`}>
            {monthlyChangePct > 0 ? '↑' : '↓'} {Math.abs(monthlyChangePct).toFixed(2)}%
          </span>
          <span className="badge">
            本月 {monthlyChange > 0 ? '+' : ''}{formatCurrency(monthlyChange / 10000)}万
          </span>
        </div>
      </div>

      {/* 净资产数字 - 金色渐变 + 滚动动画 */}
      <div className="mb-3">
        <div 
          className="display mb-3"
          style={{
            background: 'linear-gradient(135deg, #1A1915 0%, #8B6914 50%, #C5944A 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}
        >
          ¥<span ref={counterRef}>{displayValue.toLocaleString('en-US')}</span>
        </div>
      </div>

      {/* 里程碑进度 */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <span className="caption">距 ¥200 万目标</span>
          <span className="text-[0.8125rem] font-medium text-[var(--accent)]">
            {milestone.progressPercent.toFixed(1)}%
          </span>
        </div>
        
        <div className="bar h-1">
          <div 
            id="milestone-bar"
            className="bar-fill"
            style={{
              width: '0%',
              background: 'linear-gradient(90deg, #C5944A, #8B6914)',
              transition: 'width 1.5s ease-out'
            }}
          />
        </div>
        
        <div className="flex justify-between mt-1.5">
          <span className="caption">同龄人 {peerRanking.ranking}</span>
          <span className="caption">
            还差 {formatCurrency(milestone.remaining / 10000)}万
          </span>
        </div>
      </div>

      {/* 资产负债概况 */}
      <div className="flex gap-8 body mb-6">
        <span>
          资产 <span className="text-[var(--text-1)] font-medium">
            {formatCurrency(totalAssets)}
          </span>
        </span>
        <span>
          负债 <span className="text-[var(--text-1)] font-medium">
            {formatCurrency(totalLiabilities)}
          </span>
        </span>
        <span>
          杠杆 <span className="text-[var(--down)] font-medium">
            {leverageRatio.toFixed(1)}%
          </span>
        </span>
      </div>

      {/* 净资产趋势图表 */}
      <div className="chart-area">
        <Chart 
          id="chart-net-worth"
          option={chartOption}
          height={140}
        />
      </div>
    </section>
  )
}