import React, { useEffect, useRef } from 'react';
import '../styles/EditableContent.css';

const EditableContent = ({ content, onChange }) => {
  const editableRef = useRef(null);

  useEffect(() => {
    if (editableRef.current && content) {
      const displayContent = processContentForDisplay(content);
      editableRef.current.innerHTML = displayContent;
    }
  }, [content]);

  const processContentForDisplay = (text) => {
    if (!text) return '';
    
    // Сохраняем код в тройных кавычках
    const codeBlocks = [];
    let processedText = text.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push(match);
      return `###CODE_BLOCK_${codeBlocks.length - 1}###`;
    });

    // Оборачиваем ссылки в теги
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    processedText = processedText.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    // Возвращаем блоки кода
    processedText = processedText.replace(/###CODE_BLOCK_(\d+)###/g, (_, index) => {
      return codeBlocks[index];
    });

    return processedText;
  };

  const handleInput = () => {
    if (editableRef.current) {
      // Получаем текущий HTML
      let currentHtml = editableRef.current.innerHTML;
      
      // Удаляем все теги, кроме кода в тройных кавычках
      const cleanText = currentHtml.replace(/<[^>]*>/g, '');
      
      // Сохраняем очищенный текст
      onChange(cleanText);
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