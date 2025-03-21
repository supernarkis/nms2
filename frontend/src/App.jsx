import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Auth from './components/Auth'
import WelcomePage from './components/WelcomePage'
import EditableContent from './components/EditableContent'
import './App.css'

// Настраиваем axios для отправки куки
axios.defaults.withCredentials = true

const API_URL = '/api'

function App() {
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [strictSearch, setStrictSearch] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [saveTimeout, setSaveTimeout] = useState(null)
  const [connectionError, setConnectionError] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [user, setUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)

  // Минимальное расстояние для свайпа (в пикселях)
  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    // Если свайп справа налево - закрываем сайдбар
    if (isLeftSwipe && isSidebarOpen) {
      setIsSidebarOpen(false)
    }
    // Если свайп слева направо - открываем сайдбар
    else if (isRightSwipe && !isSidebarOpen) {
      setIsSidebarOpen(true)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/check', {
        credentials: 'same-origin'
      })
      const data = await response.json()
      
      if (!data.authenticated) {
        // Пробуем обновить токен
        try {
          await fetch('/auth/refresh', {
            method: 'POST',
            credentials: 'same-origin'
          })
          // Повторяем проверку после обновления
          const retryResponse = await fetch('/api/auth/check', {
            credentials: 'same-origin'
          })
          const retryData = await retryResponse.json()
          setIsAuthenticated(retryData.authenticated)
          if (retryData.authenticated) {
            fetchNotes()
          }
          return
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError)
        }
      }
      
      setIsAuthenticated(data.authenticated)
      if (data.authenticated) {
        fetchNotes()
      }
    } catch (error) {
      console.error('Error checking auth:', error)
      setIsAuthenticated(false)
    }
  }

  // Загружаем начальные заметки только если нет поискового запроса
  useEffect(() => {
    if (!searchQuery) {
      fetchNotes()
    }
  }, [])

  // Выполняем поиск при изменении запроса или режима поиска
  useEffect(() => {
    if (searchQuery) {
      searchNotes()
    } else {
      fetchNotes()
    }
  }, [searchQuery, strictSearch])

  useEffect(() => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }

    if (title.trim() || content.trim()) {
      const timeout = setTimeout(async () => {
        try {
          let updatedNote;
          if (selectedNote) {
            const response = await axios.put(`${API_URL}/notes/${selectedNote.id}`, { title, content })
            updatedNote = response.data.note
            // Обновляем заметку в списке без полной перезагрузки
            setNotes(prevNotes => {
              const newNotes = prevNotes.map(note => 
                note.id === selectedNote.id ? { ...note, title, content } : note
              )
              return sortNotes(newNotes)
            })
          } else {
            const response = await axios.post(`${API_URL}/notes`, { title, content })
            updatedNote = response.data.note
            setSelectedNote(updatedNote)
            // Добавляем новую заметку в список без полной перезагрузки
            setNotes(prevNotes => sortNotes([updatedNote, ...prevNotes]))
          }
          setSaveError(null)
        } catch (error) {
          console.error('Ошибка при сохранении заметки:', error)
          setSaveError('Ошибка сохранения. Проверьте подключение к серверу.')
        }
      }, 1000)

      setSaveTimeout(timeout)
    }

    return () => {
      if (saveTimeout) {
        clearTimeout(saveTimeout)
      }
    }
  }, [title, content])

  const handleApiError = async (error) => {
    if (error.response && error.response.status === 401) {
      try {
        await fetch('/auth/refresh', {
          method: 'POST',
          credentials: 'same-origin'
        })
        return true // Токен обновлен
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError)
        setIsAuthenticated(false)
        return false
      }
    }
    return false
  }

  const sortNotes = (notes) => {
    return [...notes].sort((a, b) => {
      // Сортировка по дате создания (убывание)
      return new Date(b.created_at) - new Date(a.created_at)
    })
  }

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_URL}/notes`)
      setNotes(sortNotes(response.data))  // Применяем сортировку
      setConnectionError(false)
    } catch (error) {
      console.error('Ошибка при загрузке заметок:', error)
      if (await handleApiError(error)) {
        try {
          const retryResponse = await axios.get(`${API_URL}/notes`)
          setNotes(sortNotes(retryResponse.data))  // Применяем сортировку
          setConnectionError(false)
          return
        } catch (retryError) {
          console.error('Ошибка при повторной загрузке заметок:', retryError)
        }
      }
      setConnectionError(true)
      setNotes([])
    }
  }

  const searchNotes = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/notes/search?q=${searchQuery}&strict=${strictSearch}`
      )
      setNotes(sortNotes(response.data))  // Применяем сортировку
      setConnectionError(false)
    } catch (error) {
      console.error('Ошибка при поиске заметок:', error)
      if (await handleApiError(error)) {
        try {
          const retryResponse = await axios.get(
            `${API_URL}/notes/search?q=${searchQuery}&strict=${strictSearch}`
          )
          setNotes(sortNotes(retryResponse.data))  // Применяем сортировку
          setConnectionError(false)
          return
        } catch (retryError) {
          console.error('Ошибка при повторном поиске заметок:', retryError)
        }
      }
      setConnectionError(true)
      setNotes([])
    }
  }

  const deleteNote = async (id, e) => {
    e.stopPropagation()
    try {
      await axios.delete(`${API_URL}/notes/${id}`)
      if (selectedNote?.id === id) {
        setSelectedNote(null)
        setTitle('')
        setContent('')
      }
      if (searchQuery) {
        searchNotes()
      } else {
        fetchNotes()
      }
    } catch (error) {
      console.error('Ошибка при удалении заметки:', error)
    }
  }

  const selectNote = (note) => {
    setSelectedNote(note)
    setTitle(note.title)
    setContent(note.content)
  }

  const startNewNote = () => {
    setSelectedNote(null)
    setTitle('')
    setContent('')
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const handleLogin = (userData) => {
    setUser(userData)
    fetchNotes()
  }

  const handleLogout = async () => {
    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'same-origin'
      });
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Функция для закрытия сайдбара при выборе заметки на мобильных устройствах
  const handleNoteSelect = (note) => {
    selectNote(note);
    setIsSidebarOpen(false);
  };

  if (isAuthenticated === null) {
    return null // Loading state
  }

  if (!isAuthenticated) {
    return <WelcomePage />
  }

  return (
    <div 
      className="app-container"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Auth onLogin={handleLogin} />
      
      {saveError && (
        <div className="save-error">
          {saveError}
        </div>
      )}
      
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          {user && (
            <>
              <span className="username">{user.username}</span>
              <button onClick={handleLogout} className="logout-button" title="Выйти">×</button>
            </>
          )}
        </div>
        
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="Поиск..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                className="clear-search" 
                onClick={clearSearch}
                title="Очистить поиск"
              >
                ×
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="search-options">
              <label>
                <input
                  type="checkbox"
                  checked={strictSearch}
                  onChange={(e) => setStrictSearch(e.target.checked)}
                />
                Строгий поиск
              </label>
            </div>
          )}
        </div>
        
        <div className="notes-list">
          <div className="note-item" onClick={() => { startNewNote(); setIsSidebarOpen(false); }}>
            <div className="note-item-content">
              <h3>+New</h3>
            </div>
          </div>
          
          {notes.map(note => (
            <div
              key={note.id}
              className={`note-item ${selectedNote?.id === note.id ? 'active' : ''}`}
              onClick={() => handleNoteSelect(note)}
            >
              <div className="note-item-content">
                <h3>{note.title || 'Без названия'}</h3>
              </div>
              <button
                className="delete-button"
                onClick={(e) => deleteNote(note.id, e)}
                title="Удалить"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </aside>

      <div className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} onClick={() => setIsSidebarOpen(false)}></div>
      
      <main className="main-content" onClick={() => isSidebarOpen && setIsSidebarOpen(false)}>
        <div className="note-form">
          <input
            type="text"
            placeholder="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <EditableContent
            content={content}
            onChange={(newContent) => setContent(newContent)}
          />
        </div>
      </main>
    </div>
  )
}

export default App