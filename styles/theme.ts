// Anthropic 暖米色主题色值 - 从 option-b2.html 提取

export const theme = {
  // Light theme colors
  light: {
    bg: '#F5F0E8',           // 背景 - 暖米色
    bgCard: '#FEFCF9',       // 卡片背景
    bgElevated: '#FFFFFF',   // 提升背景
    bgMuted: '#EDE8DE',      // 静音背景
    text1: '#1A1915',        // 主要文字
    text2: '#6B6560',        // 次要文字  
    text3: '#A39E96',        // 三级文字
    border: '#E5DFD5',       // 边框
    borderStrong: '#D5CDC2', // 强边框
    accent: '#C5714B',       // 强调色
    up: '#C4391D',          // 涨（红）
    down: '#2D8A56',        // 跌（绿）
    upBg: 'rgba(196,57,29,0.08)',     // 涨背景
    downBg: 'rgba(45,138,86,0.08)',   // 跌背景
    shadow: '0 1px 2px rgba(26,25,21,0.04)', // 阴影
  },
  
  // Dark theme colors
  dark: {
    bg: '#1A1915',
    bgCard: '#242320',
    bgElevated: '#2E2D29',
    bgMuted: '#2E2D29',
    text1: '#F5F0E8',
    text2: '#A39E96',
    text3: '#6B6560',
    border: '#3A3832',
    borderStrong: '#4A4842',
    accent: '#C5714B',
    up: '#C4391D',
    down: '#2D8A56',
    upBg: 'rgba(196,57,29,0.15)',
    downBg: 'rgba(45,138,86,0.15)',
    shadow: '0 1px 2px rgba(0,0,0,0.2)',
  },

  // 金色渐变（净资产数字）
  goldGradient: 'linear-gradient(135deg, #1A1915 0%, #8B6914 50%, #C5944A 100%)',
  darkGoldGradient: 'linear-gradient(135deg, #F5F0E8 0%, #D4A853 50%, #F0D68A 100%)',

  // 字体权重
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
  }
};

// CSS 变量映射
export const cssVariables = {
  light: {
    '--bg': theme.light.bg,
    '--bg-card': theme.light.bgCard,
    '--bg-elevated': theme.light.bgElevated,
    '--bg-muted': theme.light.bgMuted,
    '--text-1': theme.light.text1,
    '--text-2': theme.light.text2,
    '--text-3': theme.light.text3,
    '--border': theme.light.border,
    '--border-strong': theme.light.borderStrong,
    '--accent': theme.light.accent,
    '--up': theme.light.up,
    '--down': theme.light.down,
    '--up-bg': theme.light.upBg,
    '--down-bg': theme.light.downBg,
    '--shadow': theme.light.shadow,
  },
  dark: {
    '--bg': theme.dark.bg,
    '--bg-card': theme.dark.bgCard,
    '--bg-elevated': theme.dark.bgElevated,
    '--bg-muted': theme.dark.bgMuted,
    '--text-1': theme.dark.text1,
    '--text-2': theme.dark.text2,
    '--text-3': theme.dark.text3,
    '--border': theme.dark.border,
    '--border-strong': theme.dark.borderStrong,
    '--accent': theme.dark.accent,
    '--up': theme.dark.up,
    '--down': theme.dark.down,
    '--up-bg': theme.dark.upBg,
    '--down-bg': theme.dark.downBg,
    '--shadow': theme.dark.shadow,
  }
};