import React, { useEffect, useRef } from 'react';
import MediumEditor from 'medium-editor';
import 'medium-editor/dist/css/medium-editor.css';
import 'medium-editor/dist/css/themes/default.css';
import '../styles/EditableContent.css';

const EditableContent = ({ content, onChange }) => {
  const editableRef = useRef(null);
  const editorRef = useRef(null);

  // Обработчик клика по ссылке
  const handleLinkClick = (e) => {
    const target = e.target;
    if (target.tagName === 'A') {
      e.preventDefault();
      window.open(target.href, '_blank', 'noopener,noreferrer');
    }
  };

  // Обработчик горячих клавиш
  const handleKeyDown = (e) => {
    if (e.altKey && e.key === 'Enter') {
      e.preventDefault();
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const node = range.commonAncestorContainer;
      
      // Ищем ближайшую ссылку
      const link = node.nodeType === 1 ? 
        (node.tagName === 'A' ? node : node.querySelector('a')) : 
        node.parentElement.closest('a');

      if (link) {
        window.open(link.href, '_blank', 'noopener,noreferrer');
      }
    }
  };

  useEffect(() => {
    if (editableRef.current) {
      // Инициализируем редактор
      editorRef.current = new MediumEditor(editableRef.current, {
        toolbar: false,
        placeholder: false,
        paste: {
          forcePlainText: true,
          cleanPastedHTML: true
        },
        anchor: {
          targetCheckbox: false,
          customClassOption: null,
          customClassOptionText: null,
          linkValidation: true,
          placeholderText: null
        },
        autoLink: true,
        imageDragging: false
      });

      // Подписываемся на изменения
      editableRef.current.addEventListener('input', handleInput);
      // Добавляем обработчики для ссылок
      editableRef.current.addEventListener('click', handleLinkClick);
      editableRef.current.addEventListener('keydown', handleKeyDown);

      // Устанавливаем начальный контент
      if (content) {
        editableRef.current.innerHTML = content;
      }
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.destroy();
      }
      if (editableRef.current) {
        editableRef.current.removeEventListener('input', handleInput);
        editableRef.current.removeEventListener('click', handleLinkClick);
        editableRef.current.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, []);

  useEffect(() => {
    if (editableRef.current && content !== editableRef.current.innerHTML) {
      editableRef.current.innerHTML = content || '';
    }
  }, [content]);

  const handleInput = () => {
    if (editableRef.current) {
      const text = editableRef.current.innerHTML;
      onChange(text);
    }
  };

  return (
    <div
      ref={editableRef}
      className="editable-content"
      spellCheck={false}
    />
  );
};

export default EditableContent; 