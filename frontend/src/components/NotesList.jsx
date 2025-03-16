import React from 'react';
import { FaTrash } from 'react-icons/fa';
import '../styles/NotesList.css';

const NotesList = ({ notes, activeNote, onSelectNote, onDeleteNote }) => {
  // Сортируем заметки по дате создания (новые сверху)
  const sortedNotes = [...notes].sort((a, b) => {
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return (
    <div className="notes-list">
      {sortedNotes.map(note => (
        <div
          key={note.id}
          className={`note-item ${note.id === activeNote?.id ? 'active' : ''}`}
          onClick={() => onSelectNote(note)}
        >
          <div className="title">{note.title || 'Без названия'}</div>
          <button
            className="delete-button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNote(note.id);
            }}
          >
            <FaTrash size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotesList; 