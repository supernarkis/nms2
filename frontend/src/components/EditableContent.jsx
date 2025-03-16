import React, { useEffect, useRef } from 'react';
import '../styles/EditableContent.css';

const EditableContent = ({ content, onChange }) => {
  const editableRef = useRef(null);

  useEffect(() => {
    if (editableRef.current && content) {
      // При первой загрузке или обновлении контента извне
      editableRef.current.innerHTML = processContentForDisplay(content);
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

  const handleInput = () => {
    if (editableRef.current) {
      // Получаем текущий текст, удаляя все HTML теги
      const plainText = editableRef.current.innerText;
      
      // Сохраняем чистый текст
      onChange(plainText);
      
      // Обновляем отображение с кликабельными ссылками
      const displayContent = processContentForDisplay(plainText);
      if (displayContent !== editableRef.current.innerHTML) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        const startOffset = range.startOffset;
        
        editableRef.current.innerHTML = displayContent;
        
        // Восстанавливаем позицию курсора
        const newRange = document.createRange();
        newRange.setStart(editableRef.current.firstChild || editableRef.current, Math.min(startOffset, (editableRef.current.firstChild || editableRef.current).length));
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertLineBreak');
    }
  };

  return (
    <div
      ref={editableRef}
      className="editable-content"
      contentEditable
      suppressContentEditableWarning={true}
      onInput={handleInput}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      spellCheck={false}
    />
  );
};

export default EditableContent; 