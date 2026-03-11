'use client'

import { useEffect, useRef } from 'react'

// ECharts 类型定义
interface EChartsOption {
  grid?: any
  xAxis?: any
  yAxis?: any
  series?: any[]
  [key: string]: any
}

interface ChartProps {
  id: string
  option: EChartsOption
  height?: number
  className?: string
}

declare global {
  interface Window {
    echarts?: any
  }
}

export function Chart({ id, option, height = 140, className = '' }: ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<any>(null)

  useEffect(() => {
    // 动态加载 ECharts
    const loadECharts = async () => {
      if (typeof window === 'undefined') return

      // 如果 ECharts 已经加载，直接使用
      if (window.echarts) {
        initChart()
        return
      }

      // 动态加载 ECharts 脚本
      try {
        const script = document.createElement('script')
        script.src = 'https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js'
        script.async = true
        
        script.onload = () => {
          if (window.echarts) {
            initChart()
          }
        }
        
        document.head.appendChild(script)
      } catch (error) {
        console.error('Failed to load ECharts:', error)
      }
    }

    const initChart = () => {
      if (!chartRef.current || !window.echarts) return

      // 销毁现有图表实例
      if (chartInstance.current) {
        chartInstance.current.dispose()
      }

      // 创建新的图表实例
      chartInstance.current = window.echarts.init(chartRef.current)
      chartInstance.current.setOption(option)

      // 监听窗口大小变化
      const handleResize = () => {
        if (chartInstance.current) {
          chartInstance.current.resize()
        }
      }

      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }

    loadECharts()

    // 清理函数
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose()
        chartInstance.current = null
      }
    }
  }, [option])

  // 当 option 变化时更新图表
  useEffect(() => {
    if (chartInstance.current && window.echarts) {
      chartInstance.current.setOption(option)
    }
  }, [option])

  return (
    <div 
      ref={chartRef}
      id={id}
      className={`w-full ${className}`}
      style={{ height: `${height}px` }}
    />
  )
}

// 预定义的图表配置
export const createNetWorthChartOption = (data: { month: string; value: number }[]): EChartsOption => ({
  grid: { top: 10, bottom: 10, left: 0, right: 0 },
  xAxis: {
    type: 'category',
    show: true,
    data: data.map(d => d.month),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#A39E96', fontSize: 11, interval: 2 }
  },
  yAxis: { type: 'value', show: false, min: 95 },
  series: [{
    type: 'line',
    smooth: 0.3,
    symbol: 'none',
    lineStyle: { width: 1.5, color: '#6B6560' },
    areaStyle: {
      color: {
        type: 'linear',
        x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: 'rgba(26,25,21,0.08)' },
          { offset: 1, color: 'rgba(26,25,21,0)' }
        ]
      }
    },
    data: data.map(d => d.value / 10000) // 转换为万元单位
  }]
})

export const createReturnsChartOption = (data: { month: string; value: number }[]): EChartsOption => ({
  grid: { top: 8, bottom: 8, left: 0, right: 0 },
  xAxis: {
    type: 'category',
    show: true,
    data: data.map(d => d.month),
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#A39E96', fontSize: 10, interval: 2 }
  },
  yAxis: { type: 'value', show: false },
  series: [{
    type: 'bar',
    barWidth: '45%',
    itemStyle: {
      borderRadius: [3, 3, 0, 0],
      color: function(params: any) {
        return params.data >= 0 ? '#C4391D' : '#2D8A56'
      }
    },
    data: data.map(d => d.value / 10000) // 转换为万元单位
  }]
})