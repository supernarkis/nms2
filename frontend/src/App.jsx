import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Auth from './components/Auth'
import WelcomePage from './components/WelcomePage'
import EditableContent from './components/EditableContent'
import './App.css'

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
        credentials: 'include'
      })
      const data = await response.json()
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
          if (selectedNote) {
            await axios.put(`${API_URL}/notes/${selectedNote.id}`, { title, content })
          } else {
            const response = await axios.post(`${API_URL}/notes`, { title, content })
            setSelectedNote({ id: response.data.id })
          }
          if (searchQuery) {
            searchNotes()
          } else {
            fetchNotes()
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

  const fetchNotes = async () => {
    try {
      const response = await axios.get(`${API_URL}/notes`)
      setNotes(response.data)
      setConnectionError(false)
    } catch (error) {
      console.error('Ошибка при загрузке заметок:', error)
      setConnectionError(true)
      setNotes([])
    }
  }

  const searchNotes = async () => {
    try {
      const response = await axios.get(
        `${API_URL}/notes/search?q=${searchQuery}&strict=${strictSearch}`
      )
      setNotes(response.data)
      setConnectionError(false)
    } catch (error) {
      console.error('Ошибка при поиске заметок:', error)
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
      await fetch('/api/auth/logout', {
        credentials: 'include'
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
      
      <main className={`main-content ${isSidebarOpen ? 'sidebar-open' : ''}`} onClick={() => isSidebarOpen && setIsSidebarOpen(false)}>
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