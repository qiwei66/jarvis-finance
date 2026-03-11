'use client'

import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // 检查本地存储或系统偏好
    const savedTheme = localStorage.getItem('jarvis-theme')
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && systemDark)
    setIsDark(shouldBeDark)
    
    // 应用主题
    if (shouldBeDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    
    if (newIsDark) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('jarvis-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('jarvis-theme', 'light')
    }
  }

  return (
    <button 
      onClick={toggleTheme}
      className="toggle"
      type="button"
      aria-label="切换主题"
    >
      {isDark ? '☀️ 浅色' : '🌙 深色'}
    </button>
  )
}