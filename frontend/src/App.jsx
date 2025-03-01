import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Auth from './components/Auth'
import WelcomePage from './components/WelcomePage'

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
  const [isSearchFocused, setIsSearchFocused] = useState(false)

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

  if (isAuthenticated === null) {
    return null // Loading state
  }

  if (!isAuthenticated) {
    return <WelcomePage />
  }

  return (
    <div className="app-container">
      <Auth onLogin={handleLogin} />
      
      {saveError && (
        <div className="save-error">
          {saveError}
        </div>
      )}
      
      <aside className="sidebar">
        <div className="sidebar-header">
          {user && (
            <>
              <span className="username">{user.username}</span>
              <button onClick={handleLogout} className="logout-button" title="Выйти">×</button>
            </>
          )}
        </div>
        
        <div className="search-container">
          <div className="search-bar">
            <div className="search-input-wrapper">
              <input
                type="text"
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
              />
              {searchQuery && (
                <button 
                  className="clear-search" 
                  onClick={clearSearch}
                  title="Очистить поиск"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          {(searchQuery || isSearchFocused) && (
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
          {connectionError ? (
            <div className="connection-error">
              Нет подключения к серверу. Проверьте, что сервер запущен и доступен.
            </div>
          ) : (
            <>
              <div className="note-item new-note-item" onClick={startNewNote}>
                <div className="note-item-content">
                  <h3>+ Новая заметка</h3>
                </div>
              </div>
              {notes.length === 0 ? (
                <div className="no-notes">
                  {searchQuery ? 'Заметки не найдены' : 'Нет заметок'}
                </div>
              ) : (
                notes.map((note) => (
                  <div
                    key={note.id}
                    className={`note-item ${selectedNote?.id === note.id ? 'active' : ''}`}
                    onClick={() => selectNote(note)}
                  >
                    <div className="note-item-content">
                      <h3>{note.title || 'noname'}</h3>
                    </div>
                    <button
                      className="delete-button"
                      onClick={(e) => deleteNote(note.id, e)}
                      title="Удалить"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </aside>
      
      <main className="main-content">
        <form className="note-form" onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            placeholder="Заголовок"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="Начните писать..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </form>
      </main>
    </div>
  )
}

export default App