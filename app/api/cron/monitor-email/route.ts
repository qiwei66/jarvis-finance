import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

// 简单的邮箱监控API
// 实际部署时应该用后台worker，这里只是示例

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    console.log(`[${new Date().toISOString()}] Starting email monitor...`)
    
    // 这里应该调用Python脚本或直接实现IMAP监控
    // 由于在Vercel上无法运行Python，这里只记录日志
    
    const result = {
      success: true,
      message: 'Email monitor triggered (实际监控需要在服务器端运行Python脚本)',
      timestamp: new Date().toISOString(),
      recommended: {
        method: '在服务器上运行cron job执行 monitor-gmail.py',
        frequency: '每5分钟',
        output: '保存到Supabase或发送通知'
      }
    }
    
    // 记录到Supabase（可选）
    const { error: logError } = await getSupabaseAdmin()
      .from('system_logs')
      .insert({
        type: 'email_monitor', 
        message: 'Email monitor triggered',
        data: result,
        created_at: new Date().toISOString()
      })
    
    if (logError) {
      console.error('Failed to log:', logError)
    }
    
    return NextResponse.json(result)
    
  } catch (error) {
    console.error('Email monitor error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}