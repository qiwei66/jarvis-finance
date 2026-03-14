export const dynamic = 'force-dynamic'
export const revalidate = 0

import { fetchLiabilities } from '@/lib/data/fetch'
import { formatCurrency, formatPercent } from '@/lib/calc'

interface LiabilityData {
  id: number
  name: string
  type: 'loan' | 'margin' | 'personal'
  principal: number
  remaining: number
  interest_rate: number
  monthly_payment: number
  due_date: string
}

export default async function DebtPage() {
  const liabilities = await fetchLiabilities() as LiabilityData[]
  
  if (!liabilities || liabilities.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="title mb-2">负债管理</h1>
          <p className="subtitle">当前负债状况及还款计划</p>
        </div>

        <div className="insight p-8 text-center">
          <h2 className="text-2xl font-medium text-[var(--up)] mb-4">🎉 无负债状态</h2>
          <p className="body">
            恭喜！当前没有任何负债记录，财务状况良好。
            建议继续保持健康的财务习惯，合理规划投资。
          </p>
        </div>
      </div>
    )
  }

  // 按类型分组
  const groupedLiabilities = {
    loan: liabilities.filter(item => item.type === 'loan'),
    margin: liabilities.filter(item => item.type === 'margin'), 
    personal: liabilities.filter(item => item.type === 'personal')
  }

  // 计算汇总数据
  const totalPrincipal = liabilities.reduce((sum, item) => sum + (item.principal || 0), 0)
  const totalRemaining = liabilities.reduce((sum, item) => sum + (item.remaining || 0), 0)
  const totalMonthlyPayment = liabilities.reduce((sum, item) => sum + (item.monthly_payment || 0), 0)
  const avgInterestRate = liabilities.length > 0 
    ? liabilities.reduce((sum, item) => sum + (item.interest_rate || 0), 0) / liabilities.length 
    : 0

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'loan': return '贷款'
      case 'margin': return '融资'
      case 'personal': return '个人借贷'
      default: return '其他'
    }
  }

  const getTypeBadgeClass = (type: string) => {
    switch (type) {
      case 'loan': return 'badge-down'
      case 'margin': return 'badge'
      case 'personal': return 'badge'
      default: return 'badge'
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="title mb-2">负债管理</h1>
        <p className="subtitle">
          当前负债状况及还款计划，共 {liabilities.length} 项负债
        </p>
      </div>

      {/* 汇总卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="overline mb-2">负债总额</div>
          <div className="display mb-2 text-[var(--down)]">{formatCurrency(totalRemaining)}</div>
          <div className="body text-[var(--text-3)]">
            剩余 {liabilities.length} 项
          </div>
        </div>

        <div className="card">
          <div className="overline mb-2">原始本金</div>
          <div className="display mb-2">{formatCurrency(totalPrincipal)}</div>
          <div className="body text-[var(--text-3)]">
            已还 {formatCurrency(totalPrincipal - totalRemaining)}
          </div>
        </div>

        <div className="card">
          <div className="overline mb-2">月供总额</div>
          <div className="display mb-2 text-[var(--down)]">{formatCurrency(totalMonthlyPayment)}</div>
          <div className="body text-[var(--text-3)]">
            每月固定支出
          </div>
        </div>

        <div className="card">
          <div className="overline mb-2">平均利率</div>
          <div className="display mb-2">{formatPercent(avgInterestRate, false)}</div>
          <div className="body text-[var(--text-3)]">
            年化利率
          </div>
        </div>
      </div>

      {/* 按类型展示负债 */}
      {Object.entries(groupedLiabilities).map(([type, items]) => {
        if (items.length === 0) return null
        
        return (
          <section key={type} className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="subtitle">{getTypeLabel(type)}</h2>
              <span className="badge">{items.length}项</span>
            </div>
            
            <div className="card p-0">
              <div className="hidden md:grid grid-cols-7 gap-4 p-4 text-sm font-medium text-[var(--text-3)] border-b border-[var(--border)]">
                <div>名称</div>
                <div className="text-right">原始本金</div>
                <div className="text-right">剩余金额</div>
                <div className="text-right">利率</div>
                <div className="text-right">月供</div>
                <div className="text-right">到期日</div>
                <div className="text-center">进度</div>
              </div>
              
              <div className="divide-y divide-[var(--border)]">
                {items.map((liability: LiabilityData, index: number) => {
                  const repaymentProgress = liability.principal > 0 
                    ? ((liability.principal - liability.remaining) / liability.principal) * 100 
                    : 0
                  const isNearDue = liability.due_date && new Date(liability.due_date) <= new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
                  
                  return (
                    <div key={index} className="md:grid md:grid-cols-7 gap-4 p-4 md:items-center">
                      {/* 移动端布局 */}
                      <div className="md:hidden space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-[var(--text-1)]">{liability.name}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`badge ${getTypeBadgeClass(liability.type)} text-xs`}>
                                {getTypeLabel(liability.type)}
                              </span>
                              {isNearDue && (
                                <span className="badge badge-down text-xs">即将到期</span>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-[var(--down)]">{formatCurrency(liability.remaining)}</div>
                            <div className="text-sm text-[var(--text-3)]">剩余</div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-3)]">还款进度</span>
                            <span className="font-medium">{repaymentProgress.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-[var(--border)] rounded-full h-2">
                            <div 
                              className="h-2 bg-[var(--up)] rounded-full transition-all duration-1000"
                              style={{ width: `${repaymentProgress}%` }}
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm text-[var(--text-3)]">
                          <div>月供 {formatCurrency(liability.monthly_payment)}</div>
                          <div>利率 {formatPercent(liability.interest_rate, false)}</div>
                          {liability.due_date && (
                            <div className="col-span-2">
                              到期 {new Date(liability.due_date).toLocaleDateString('zh-CN')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 桌面端布局 */}
                      <div className="hidden md:block">
                        <div className="font-medium text-[var(--text-1)]">{liability.name}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`badge ${getTypeBadgeClass(liability.type)} text-xs`}>
                            {getTypeLabel(liability.type)}
                          </span>
                          {isNearDue && (
                            <span className="badge badge-down text-xs">即将到期</span>
                          )}
                        </div>
                      </div>
                      <div className="hidden md:block text-right body">{formatCurrency(liability.principal)}</div>
                      <div className="hidden md:block text-right body font-medium text-[var(--down)]">
                        {formatCurrency(liability.remaining)}
                      </div>
                      <div className="hidden md:block text-right body">
                        {formatPercent(liability.interest_rate, false)}
                      </div>
                      <div className="hidden md:block text-right body">
                        {formatCurrency(liability.monthly_payment)}
                      </div>
                      <div className="hidden md:block text-right body">
                        {liability.due_date 
                          ? new Date(liability.due_date).toLocaleDateString('zh-CN')
                          : '-'
                        }
                      </div>
                      <div className="hidden md:block text-center">
                        <div className="w-full bg-[var(--border)] rounded-full h-2 mb-1">
                          <div 
                            className="h-2 bg-[var(--up)] rounded-full transition-all duration-1000"
                            style={{ width: `${repaymentProgress}%` }}
                          />
                        </div>
                        <div className="text-xs text-[var(--text-3)]">{repaymentProgress.toFixed(1)}%</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )
      })}

      {/* 财务分析 */}
      <section>
        <h2 className="subtitle mb-4">债务分析</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="insight">
            <h3 className="body font-medium mb-2">债务健康度</h3>
            <p className="caption">
              {avgInterestRate <= 5 ? (
                `✅ 债务利率较低（平均${avgInterestRate.toFixed(1)}%），债务结构健康。建议保持当前还款计划。`
              ) : avgInterestRate <= 10 ? (
                `⚠️ 债务利率中等（平均${avgInterestRate.toFixed(1)}%），建议优先偿还高利率债务。`
              ) : (
                `🚨 债务利率较高（平均${avgInterestRate.toFixed(1)}%），建议考虑债务重组或加速还款。`
              )}
            </p>
          </div>

          <div className="insight">
            <h3 className="body font-medium mb-2">还款建议</h3>
            <p className="caption">
              当前月供总额 {formatCurrency(totalMonthlyPayment)}，建议确保月收入至少为月供的3倍以上，
              保持良好的现金流管理。优先偿还高利率债务以减少利息支出。
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}