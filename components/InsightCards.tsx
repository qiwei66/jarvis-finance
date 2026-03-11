'use client'

import { getPnLTextClass } from '@/lib/calc'

interface Insight {
  title: string
  value: string
  description: string
  type: 'warning' | 'opportunity' | 'success' | 'neutral'
}

interface InsightCardsProps {
  insights: Insight[]
}

export function InsightCards({ insights }: InsightCardsProps) {
  const getValueColor = (type: string, value: string) => {
    switch (type) {
      case 'warning':
        return 'text-[var(--down)]'
      case 'opportunity':
        return 'text-[var(--accent)]'
      case 'success':
        return 'text-[var(--up)]'
      default:
        return 'text-[var(--text-1)]'
    }
  }

  return (
    <section>
      {/* 标题 */}
      <div className="mb-5">
        <span className="overline">JARVIS INSIGHTS</span>
      </div>

      {/* 洞察卡片网格 */}
      <div className="grid grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <div key={index} className="insight text-center py-6 px-4">
            {/* 数值 */}
            <div className={`text-[2rem] font-normal tracking-[-0.03em] mb-1.5 ${getValueColor(insight.type, insight.value)}`}>
              {insight.value}
            </div>
            
            {/* 标题 */}
            <div className="text-[0.8125rem] font-medium text-[var(--text-1)] mb-1">
              {insight.title}
            </div>
            
            {/* 描述 */}
            <div className="caption">
              {insight.description}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

// 默认洞察数据生成器
export function generateDefaultInsights(data: {
  leverageRatio: number
  bestPerformer?: {
    stock: string
    returnPct: number
    profit: number
  }
}): Insight[] {
  const { leverageRatio, bestPerformer } = data

  return [
    {
      title: '杠杆率',
      value: `${leverageRatio.toFixed(1)}%`,
      description: '建议 <120%',
      type: leverageRatio > 120 ? 'warning' : 'success'
    },
    {
      title: '年可节省',
      value: '¥2.2万',
      description: '外卖 + 深夜消费',
      type: 'opportunity'
    },
    {
      title: bestPerformer?.stock || '云维股份',
      value: bestPerformer ? `+${bestPerformer.returnPct.toFixed(1)}%` : '+14.6%',
      description: bestPerformer 
        ? `浮盈 ¥${(bestPerformer.profit / 10000).toFixed(1)}万 · 关注止盈`
        : '浮盈 ¥7.7万 · 关注止盈',
      type: 'success'
    }
  ]
}