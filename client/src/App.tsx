import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './components/Login'
import Dashboard from './components/Dashboard'

// 禁用 React Router v7 升级警告
const routerFuture = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const res = await fetch('/api/auth/check', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setIsAuthenticated(data.authenticated)
    } catch (err) {
      setIsAuthenticated(false)
    }
  }

  return (
    <BrowserRouter future={routerFuture}>
      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login setAuth={setIsAuthenticated} /> : <Navigate to="/" />}
        />
        <Route
          path="/*"
          element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
