import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_supabase) return _supabase
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables')
  }
  
  _supabase = createClient(url, key)
  return _supabase
}

// 向后兼容的导出（延迟求值）
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as any)[prop]
  }
})

// Types
export interface PortfolioSnapshot {
  id: number; date: string; market: 'a_share' | 'us_stock'; code: string; name: string
  shares?: number; cost_price?: number; market_price?: number; market_value?: number
  pnl?: number; pnl_pct?: number; created_at: string
}

export interface NetWorthDaily {
  id: number; date: string; total_assets?: number; total_liabilities?: number
  net_worth?: number; a_share_value?: number; us_stock_value?: number
  cash?: number; sers_value?: number; created_at: string
}

export interface MonthlyCashflow {
  id: number; month: string; income?: number; expense?: number
  savings?: number; savings_rate?: number; top_categories?: any; created_at: string
}

export interface Liabilities {
  id: number; name: string; type?: 'loan' | 'margin' | 'personal'
  principal?: number; remaining?: number; interest_rate?: number
  monthly_payment?: number; due_date?: string; updated_at: string
}