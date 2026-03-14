import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Jarvis Finance',
  description: '王总的个人财务仪表盘',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className="font-inter antialiased bg-[#0a0a0a] text-white">
        <div className="min-h-screen flex flex-col">
          {/* 顶部导航 - 移动端横向滚动不折行 */}
          <header className="sticky top-0 z-50 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/[0.06]">
            <div className="max-w-3xl mx-auto px-4 sm:px-6">
              <div className="flex items-center justify-between h-12">
                <span className="text-sm font-semibold tracking-wide text-white/90 shrink-0">Jarvis</span>
                <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
                  <Link href="/" className="nav-link">概览</Link>
                  <Link href="/portfolio" className="nav-link">持仓</Link>
                  <Link href="/cashflow" className="nav-link">收支</Link>
                  <Link href="/debt" className="nav-link">负债</Link>
                </nav>
              </div>
            </div>
          </header>

          {/* 主内容区 */}
          <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-5">
            {children}
          </main>

          {/* 底部 */}
          <footer className="max-w-3xl mx-auto px-4 sm:px-6 pb-6">
            <div className="pt-4 border-t border-white/[0.06] text-xs text-white/30 text-center">
              Jarvis Finance · 为王总定制
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
