import React, { useEffect, useRef } from 'react';
import MediumEditor from 'medium-editor';
import 'medium-editor/dist/css/medium-editor.css';
import 'medium-editor/dist/css/themes/default.css';
import '../styles/EditableContent.css';

const EditableContent = ({ content, onChange }) => {
  const editableRef = useRef(null);
  const editorRef = useRef(null);

  // Функция для открытия ссылки с предотвращением редиректа
  const openLink = (url) => {
    // Пытаемся предотвратить редирект для imgur
    if (url.includes('i.imgur.com')) {
      const win = window.open('about:blank', '_blank', 'noopener,noreferrer');
      if (win) {
        win.document.write(`
          <html>
            <head>
              <title>Image</title>
              <style>
                body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #2d2d2d; }
                img { max-width: 100%; max-height: 100vh; object-fit: contain; }
              </style>
            </head>
            <body>
              <img src="${url}" alt="Image" />
            </body>
          </html>
        `);
      }
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
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
        openLink(link.href);
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
        imageDragging: false,
        disableClickEditing: false
      });

      // Подписываемся на изменения
      editableRef.current.addEventListener('input', handleInput);
      // Добавляем обработчик для горячих клавиш
      editableRef.current.addEventListener('keydown', handleKeyDown);

      // Обработка кликов по ссылкам
      editableRef.current.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
          e.preventDefault();
        }
      });

      // Обработка двойного клика
      editableRef.current.addEventListener('dblclick', (e) => {
        if (e.target.tagName === 'A') {
          e.preventDefault();
          openLink(e.target.href);
        }
      });

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