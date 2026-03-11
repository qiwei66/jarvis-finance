-- Jarvis Finance 数据库初始化脚本
-- 创建时间: 2026-03-11

-- 每日持仓快照
CREATE TABLE portfolio_snapshots (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  market TEXT NOT NULL CHECK (market IN ('a_share', 'us_stock')),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  shares NUMERIC,
  cost_price NUMERIC,
  market_price NUMERIC,
  market_value NUMERIC,
  pnl NUMERIC,
  pnl_pct NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date, market, code)
);

-- 每日净资产
CREATE TABLE net_worth_daily (
  id BIGSERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  total_assets NUMERIC,
  total_liabilities NUMERIC,
  net_worth NUMERIC,
  a_share_value NUMERIC,
  us_stock_value NUMERIC,
  cash NUMERIC,
  sers_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 月度收支
CREATE TABLE monthly_cashflow (
  id BIGSERIAL PRIMARY KEY,
  month DATE NOT NULL, -- 每月1号
  income NUMERIC,
  expense NUMERIC,
  savings NUMERIC,
  savings_rate NUMERIC,
  top_categories JSONB, -- [{category, amount, pct}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(month)
);

-- 负债
CREATE TABLE liabilities (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('loan', 'margin', 'personal')),
  principal NUMERIC,
  remaining NUMERIC,
  interest_rate NUMERIC,
  monthly_payment NUMERIC,
  due_date DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_portfolio_snapshots_date ON portfolio_snapshots(date);
CREATE INDEX idx_portfolio_snapshots_market ON portfolio_snapshots(market);
CREATE INDEX idx_net_worth_daily_date ON net_worth_daily(date);
CREATE INDEX idx_monthly_cashflow_month ON monthly_cashflow(month);
CREATE INDEX idx_liabilities_type ON liabilities(type);

-- 插入初始数据（基于现有数据文件）

-- 初始净资产数据
INSERT INTO net_worth_daily (date, total_assets, total_liabilities, net_worth, a_share_value, us_stock_value, cash, sers_value)
VALUES ('2026-03-08', 3302000, 1920000, 1382000, 2017400, 22329, 47182, 324000);

-- 初始 A股持仓数据（2026-03-08）
INSERT INTO portfolio_snapshots (date, market, code, name, shares, cost_price, market_price, market_value, pnl, pnl_pct) VALUES
('2026-03-08', 'a_share', 'sh688215', '瑞晟智能', 13697, 78.380, 69.14, 946900, -127300, -11.801),
('2026-03-08', 'a_share', 'sh600725', '云维股份', 115300, 4.626, 5.30, 611100, 77289.10, 14.559),
('2026-03-08', 'a_share', 'sz001335', '信凯科技', 9600, 51.043, 43.81, 420600, -69693.36, -14.171),
('2026-03-08', 'a_share', 'sz002837', '英维克', 200, 103.355, 101.30, 20260, -426.13, -1.988),
('2026-03-08', 'a_share', 'sz300442', '润泽科技', 200, 95.335, 93.16, 18632, -449.32, -2.281);

-- 初始美股持仓数据（2026-03-08）
INSERT INTO portfolio_snapshots (date, market, code, name, shares, cost_price, market_price, market_value, pnl, pnl_pct) VALUES
('2026-03-08', 'us_stock', 'gb_googl', 'GOOGL', 40, 314.58, 298.52, 11940.80, -1623.40, -5.11),
('2026-03-08', 'us_stock', 'gb_rklb', 'RKLB', 70, 89.92, 70.11, 4907.70, -1386.70, -22.03),
('2026-03-08', 'us_stock', 'gb_tsla', 'TSLA', 10, 425.87, 396.73, 3967.30, -291.40, -6.84),
('2026-03-08', 'us_stock', 'gb_mstr', 'MSTR', 10, 138.89, 133.53, 1335.30, -53.60, -3.86),
('2026-03-08', 'us_stock', 'gb_nvda', 'NVDA', 1, 454.03, 177.82, 177.82, -276.21, -60.84);

-- 初始月度收支数据（2026年3月）
INSERT INTO monthly_cashflow (month, income, expense, savings, savings_rate, top_categories) VALUES
('2026-03-01', 36200, 12870, 23330, 64.4, '[
  {"category": "餐饮美食", "amount": 6337, "pct": 49.2},
  {"category": "服装配饰", "amount": 6159, "pct": 47.8},
  {"category": "文化娱乐", "amount": 187, "pct": 1.5}
]'::jsonb);

-- 初始负债数据
INSERT INTO liabilities (name, type, principal, remaining, interest_rate, monthly_payment, due_date) VALUES
('融资余额', 'margin', 1920000, 1920000, 8.35, 0, NULL),
('信用卡', 'personal', 50000, 0, 18.0, 0, NULL);

-- 创建 RLS (Row Level Security) 策略（如果需要）
-- ALTER TABLE portfolio_snapshots ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE net_worth_daily ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE monthly_cashflow ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE liabilities ENABLE ROW LEVEL SECURITY;

-- 创建视图：当前持仓汇总
CREATE VIEW current_portfolio AS
SELECT 
  market,
  SUM(market_value) as total_value,
  SUM(pnl) as total_pnl,
  ROUND(AVG(pnl_pct), 2) as avg_pnl_pct,
  COUNT(*) as holdings_count
FROM portfolio_snapshots 
WHERE date = (SELECT MAX(date) FROM portfolio_snapshots)
GROUP BY market;

-- 创建函数：计算净资产趋势
CREATE OR REPLACE FUNCTION get_net_worth_trend(days INTEGER DEFAULT 30)
RETURNS TABLE(date DATE, net_worth NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT nwd.date, nwd.net_worth
  FROM net_worth_daily nwd
  WHERE nwd.date >= CURRENT_DATE - INTERVAL '%s days' DAYS
  ORDER BY nwd.date;
END;
$$ LANGUAGE plpgsql;