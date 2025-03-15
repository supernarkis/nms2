import React, { useEffect, useRef } from 'react';
import '../styles/EditableContent.css';

const EditableContent = ({ content, onChange }) => {
  const textareaRef = useRef(null);
  const displayRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current && displayRef.current && content) {
      // Обновляем textarea чистым текстом
      textareaRef.current.value = content;
      
      // Обновляем div с кликабельными ссылками
      const displayContent = processContentForDisplay(content);
      displayRef.current.innerHTML = displayContent;
    }
  }, [content]);

  const processContentForDisplay = (text) => {
    if (!text) return '';
    
    // Находим и оборачиваем ссылки в теги
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  };

  const handleInput = (e) => {
    const newText = e.target.value;
    
    // Обновляем отображение с кликабельными ссылками
    if (displayRef.current) {
      displayRef.current.innerHTML = processContentForDisplay(newText);
    }
    
    // Отправляем чистый текст для сохранения
    onChange(newText);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      const { selectionStart, selectionEnd, value } = e.target;
      const newValue = value.substring(0, selectionStart) + '\n' + value.substring(selectionEnd);
      e.target.value = newValue;
      e.target.selectionStart = e.target.selectionEnd = selectionStart + 1;
      handleInput(e);
    }
  };

  return (
    <div className="editable-container">
      <textarea
        ref={textareaRef}
        className="editable-textarea"
        value={content}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      />
      <div
        ref={displayRef}
        className="editable-display"
      />
    </div>
  );
};

export default EditableContent; 