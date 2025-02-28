import { useEffect } from 'react'
import axios from 'axios'

function Auth({ onLogin }) {
  useEffect(() => {
    // Проверяем статус авторизации при загрузке
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await axios.get('/api/auth/user', { withCredentials: true })
      onLogin(response.data)
    } catch (error) {
      window.location.href = '/api/auth/login'
    }
  }

  const handleLogout = async () => {
    try {
      await axios.get('/api/auth/logout', { withCredentials: true })
      window.location.reload()
    } catch (error) {
      console.error('Ошибка при выходе:', error)
    }
  }

  return (
    <div className="auth-container">
      <button onClick={handleLogout} className="logout-button">
        Выйти
      </button>
    </div>
  )
}

export default Auth 