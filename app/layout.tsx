import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import './globals.css'
import { ThemeToggle } from '@/components/ThemeToggle'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap'
})

export const metadata: Metadata = {
  title: 'Jarvis Finance',
  description: 'AI-powered personal finance dashboard for wealth management',
  keywords: ['finance', 'wealth', 'investment', 'dashboard', 'AI'],
  authors: [{ name: 'Jarvis AI' }],
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
      <body className="font-inter antialiased">
        <div className="min-h-screen">
          {/* Header */}
          <header className="container max-w-[920px] mx-auto px-4 sm:px-10 py-6 sm:py-14">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 sm:gap-10">
                {/* Logo */}
                <span className="text-base font-medium tracking-[0.02em] text-[var(--text-1)]">
                  Jarvis
                </span>
                
                {/* Navigation */}
                <nav className="flex gap-3 sm:gap-7">
                  <Link href="/" className="nav-item">概览</Link>
                  <Link href="/portfolio" className="nav-item">持仓</Link>
                  <Link href="/cashflow" className="nav-item">收支</Link>
                  <Link href="/debt" className="nav-item">负债</Link>
                </nav>
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="caption hidden sm:inline">
                  {new Date().toLocaleString('zh-CN', {
                    month: 'numeric',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
                <ThemeToggle />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="container max-w-[920px] mx-auto px-4 sm:px-10 pb-14">
            {children}
          </main>

          {/* Footer */}
          <footer className="container max-w-[920px] mx-auto px-4 sm:px-10 pb-14">
            <div className="pt-6 border-t border-[var(--border)] flex justify-between">
              <span className="caption">Jarvis Finance · 为王总定制</span>
              <span className="caption">
                数据更新于 {new Date().toLocaleString('zh-CN', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
