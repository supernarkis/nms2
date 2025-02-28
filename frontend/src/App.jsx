import { useState, useEffect } from 'react'
import axios from 'axios'
import Auth from './components/Auth'

const API_URL = '/api'

function App() {
  const [notes, setNotes] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [strictSearch, setStrictSearch] = useState(false)
  const [selectedNote, setSelectedNote] = useState(null)
  const [saveTimeout, setSaveTimeout] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [user, setUser] = useState(null)

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
    
    const distance = touchEnd - touchStart
    const isLeftSwipe = distance < -minSwipeDistance
    const isRightSwipe = distance > minSwipeDistance
    
    // Если свайп справа налево - закрываем сайдбар
    if (isLeftSwipe && isSidebarOpen) {
      setIsSidebarOpen(false)
    }
    // Если свайп слева направо - открываем сайдбар
    else if (isRightSwipe && !isSidebarOpen) {
      setIsSidebarOpen(true)
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
          setSaveError(false)
        } catch (error) {
          console.error('Ошибка при сохранении заметки:', error)
          setSaveError(true)
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

  // Добавляем обработчик для закрытия сайдбара при клике вне его
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen && !event.target.closest('.sidebar') && !event.target.closest('.menu-button')) {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isSidebarOpen])

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
    setIsSidebarOpen(false) // Закрываем сайдбар после выбора заметки на мобильных
  }

  const startNewNote = () => {
    setSelectedNote(null)
    setTitle('')
    setContent('')
    setIsSidebarOpen(false) // Закрываем сайдбар после создания новой заметки на мобильных
  }

  const clearSearch = () => {
    setSearchQuery('')
  }

  const handleLogin = (userData) => {
    setUser(userData)
    fetchNotes()
  }

  // Форматирование даты
  const formatDate = (dateString) => {
    const options = { 
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
    return new Date(dateString).toLocaleString('ru-RU', options)
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
          Ошибка сохранения. Проверьте подключение к серверу.
        </div>
      )}
      
      <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="user-info">
          {user && (
            <div className="user-details">
              <span className="username">{user.username}</span>
            </div>
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
                      <div className="note-meta">
                        <span className="note-date">
                          Изменено: {formatDate(note.updated_at)}
                        </span>
                      </div>
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