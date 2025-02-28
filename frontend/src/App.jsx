import { useState, useEffect } from 'react'
import axios from 'axios'

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
      const response = await axios.get(`