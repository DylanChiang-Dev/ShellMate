import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// 禁用 React DevTools 提示
if (typeof window !== 'undefined') {
  const originalConsoleWarn = console.warn
  console.warn = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Download the React DevTools')
    ) {
      return
    }
    originalConsoleWarn.apply(console, args)
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
