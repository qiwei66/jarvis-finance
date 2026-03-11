import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// GET /api/cashflow - 获取收支数据
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month') // 格式: YYYY-MM
    
    let query = getSupabase().from('monthly_cashflow').select('*')
    
    if (month) {
      // 查询特定月份
      const monthStart = `${month}-01`
      query = query.eq('month', monthStart)
    } else {
      // 查询最近12个月，确保覆盖范围足够
      query = query
        .gte('month', '2025-01-01') // 固定从2025年开始，避免日期计算问题
        .order('month', { ascending: false })
        .limit(12)
    }

    const { data: cashflowData, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // 计算趋势数据
    const trends = cashflowData?.map(record => ({
      month: new Date(record.month).toLocaleDateString('zh-CN', { month: 'numeric' }) + '月',
      income: record.income || 0,
      expense: record.expense || 0,
      savings: record.savings || 0,
      savingsRate: record.savings_rate || 0
    })) || []

    // 当前月份数据
    const currentMonth = cashflowData?.[0] || null

    return NextResponse.json({
      success: true,
      data: {
        current: currentMonth,
        trends: trends.reverse(), // 按时间正序
        lastUpdated: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Cashflow API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/cashflow - 新增或更新收支数据
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      month, // 格式: YYYY-MM-01
      income,
      expense,
      topCategories
    } = body

    // 验证必需字段
    if (!month || income === undefined || expense === undefined) {
      return NextResponse.json({ 
        error: 'Missing required fields: month, income, expense' 
      }, { status: 400 })
    }

    // 计算储蓄和储蓄率
    const savings = income - expense
    const savingsRate = income > 0 ? (savings / income) * 100 : 0

    // 插入或更新数据
    const { data, error } = await getSupabase()
      .from('monthly_cashflow')
      .upsert({
        month,
        income,
        expense,
        savings,
        savings_rate: savingsRate,
        top_categories: topCategories || null
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('Cashflow POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/cashflow?month=YYYY-MM-01 - 删除收支记录
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')

    if (!month) {
      return NextResponse.json({ error: 'Month parameter required' }, { status: 400 })
    }

    const { error } = await getSupabase()
      .from('monthly_cashflow')
      .delete()
      .eq('month', month)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Cashflow record deleted'
    })
  } catch (error) {
    console.error('Cashflow DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}