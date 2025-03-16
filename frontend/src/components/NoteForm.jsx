import React from 'react';
import EditableContent from './EditableContent';
import '../styles/NoteForm.css';

const NoteForm = ({ content, onChange }) => {
  return (
    <div className="note-form">
      <EditableContent 
        content={content} 
        onChange={onChange}
      />
    </div>
  );
};

export default NoteForm; 