# Jarvis Finance

AI-powered personal finance dashboard for wealth management

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **开发语言**: TypeScript
- **样式方案**: Tailwind CSS + 自定义 CSS 变量
- **图表库**: ECharts 5.5.0
- **数据库**: Supabase (PostgreSQL)
- **部署平台**: Vercel

## 功能特性

### 🏠 首页 Dashboard
- **净资产展示**: 金色渐变数字 + 滚动动画
- **里程碑进度**: 距离目标的可视化进度条
- **同龄人对比**: 展示财富排名 (top 3%)
- **月度现金流**: 收入支出分析 + 储蓄率
- **投资收益**: A股美股盈亏 + 收益趋势图
- **Jarvis 洞察**: AI 驱动的财务建议

### 📊 数据可视化
- **净资产趋势**: 月度净资产变化曲线
- **投资收益**: 月度投资盈亏柱状图
- **主题切换**: 深色/浅色主题自动切换

### 🔄 实时数据同步
- **新浪财经 API**: 实时股价数据同步
- **Vercel Cron**: 交易时间段每5分钟自动同步
- **数据缓存**: 优化 API 调用性能

## 设计风格

### 🎨 色彩系统 (Anthropic 暖米色主题)
```css
/* Light Theme */
--bg: #F5F0E8;           /* 暖米色背景 */
--bg-card: #FEFCF9;      /* 卡片背景 */
--text-1: #1A1915;       /* 主要文字 */
--text-2: #6B6560;       /* 次要文字 */
--accent: #C5714B;       /* 强调色 */
--up: #C4391D;           /* 涨（红） */
--down: #2D8A56;         /* 跌（绿） */
```

### ✍️ 字体规范
- **字体族**: Inter (Google Fonts)
- **字重**: 300-600 (避免过粗)
- **层级**: Display → Headline → Title → Body → Caption → Overline

### 🎯 设计原则
- **红涨绿跌**: 符合中国用户习惯
- **简洁优雅**: 去除冗余视觉元素
- **信息密度**: 平衡可读性与信息量
- **响应式**: 适配不同屏幕尺寸

## 项目结构

```
jarvis-finance/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 全局布局
│   ├── page.tsx           # 首页 Dashboard
│   ├── portfolio/         # 持仓详情页
│   ├── cashflow/          # 收支分析页
│   ├── debt/              # 负债管理页
│   └── api/               # API 路由
│       ├── portfolio/     # 持仓数据 API
│       ├── cashflow/      # 收支数据 API
│       └── cron/          # 定时任务
├── components/            # React 组件
│   ├── NetWorth.tsx       # 净资产组件
│   ├── CashFlow.tsx       # 现金流组件
│   ├── Returns.tsx        # 投资收益组件
│   ├── InsightCards.tsx   # 洞察卡片
│   ├── Chart.tsx          # ECharts 封装
│   └── ThemeToggle.tsx    # 主题切换
├── lib/                   # 工具库
│   ├── supabase.ts        # 数据库客户端
│   ├── calc.ts            # 计算函数
│   └── data/
│       └── sina.ts        # 新浪 API 封装
├── styles/                # 样式文件
│   └── theme.ts           # 主题色值
├── supabase/             # 数据库迁移
│   └── migrations/
│       └── 001_init.sql   # 建表脚本
└── vercel.json           # 部署配置
```

## 数据库设计

### 核心表结构
- `portfolio_snapshots`: 每日持仓快照
- `net_worth_daily`: 每日净资产记录
- `monthly_cashflow`: 月度收支数据
- `liabilities`: 负债管理

### 数据源接入
- **A股行情**: 新浪财经 API
- **美股行情**: 新浪财经 API
- **收支数据**: 支付宝导出 + 手动录入
- **持仓数据**: 券商 APP 截图 + 手动录入

## 开发指南

### 环境准备
```bash
# 安装依赖
npm install

# 复制环境变量
cp .env.local.example .env.local
# 填写 Supabase 连接信息

# 启动开发服务器
npm run dev
```

### 数据库初始化
1. 在 Supabase 项目中运行 `supabase/migrations/001_init.sql`
2. 配置 Row Level Security (可选)
3. 初始化测试数据

### API 接口

#### 持仓数据
- `GET /api/portfolio` - 获取聚合持仓数据
- `POST /api/portfolio/sync` - 手动同步股价

#### 收支数据  
- `GET /api/cashflow?month=YYYY-MM` - 获取月度收支
- `POST /api/cashflow` - 新增/更新收支记录

#### 定时任务
- `POST /api/cron/sync-stock` - 股价同步 (Vercel Cron)

## 部署说明

### Vercel 部署
1. 连接 GitHub 仓库到 Vercel
2. 配置环境变量 (Supabase 凭据)
3. 自动部署生效

### 环境变量
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Cron 安全密钥
CRON_SECRET=your-random-secret
```

### Cron 任务
- **股价同步**: 工作日 9:00-15:00，每5分钟执行
- **权限验证**: Bearer Token 保护
- **错误处理**: 完整的日志记录

## 性能优化

- **客户端渲染**: ECharts 动态加载
- **SSR 安全**: 图表组件防服务端渲染
- **缓存策略**: 数据库查询优化
- **CDN 加速**: 静态资源通过 Vercel Edge 缓存

## 后续规划

### 短期目标 (v1.1)
- [ ] 实时股价 WebSocket 连接
- [ ] 持仓详情页完整实现
- [ ] 移动端适配优化

### 中期目标 (v1.2)
- [ ] 收支分析页面
- [ ] 负债管理功能
- [ ] 数据导入导出

### 长期目标 (v2.0)
- [ ] AI 投资建议
- [ ] 风险评估模型
- [ ] 多用户支持

## 许可证

MIT License - 为王总定制