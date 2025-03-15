import React, { useEffect, useRef } from 'react';
import '../styles/EditableContent.css';

const EditableContent = ({ content, onChange }) => {
  const editableRef = useRef(null);

  useEffect(() => {
    if (editableRef.current && content) {
      // Отображаем контент с кликабельными ссылками
      editableRef.current.innerHTML = processContentForDisplay(content);
    }
  }, [content]);

  // Обработка контента для отображения
  const processContentForDisplay = (text) => {
    // Находим все блоки кода в тройных апострофах
    const codeBlocks = [];
    let processedText = text.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push(match);
      return `###CODE_BLOCK_${codeBlocks.length - 1}###`;
    });

    // Находим и оборачиваем ссылки в теги
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    processedText = processedText.replace(urlRegex, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });

    // Возвращаем блоки кода обратно
    processedText = processedText.replace(/###CODE_BLOCK_(\d+)###/g, (_, index) => {
      return codeBlocks[index];
    });

    return processedText;
  };

  // Обработка контента для сохранения
  const processContentForSave = (text) => {
    // Находим все блоки кода в тройных апострофах
    const codeBlocks = [];
    let processedText = text.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push(match);
      return `###CODE_BLOCK_${codeBlocks.length - 1}###`;
    });

    // Удаляем все HTML теги из текста вне блоков кода
    processedText = processedText.replace(/<[^>]*>/g, '');

    // Возвращаем блоки кода обратно
    processedText = processedText.replace(/###CODE_BLOCK_(\d+)###/g, (_, index) => {
      return codeBlocks[index];
    });

    return processedText;
  };

  const handleInput = () => {
    if (editableRef.current) {
      // При изменении сохраняем только чистый текст
      const cleanText = processContentForSave(editableRef.current.innerHTML);
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