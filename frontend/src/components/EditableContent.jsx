import React, { useEffect, useRef } from 'react';
import MediumEditor from 'medium-editor';
import 'medium-editor/dist/css/medium-editor.css';
import 'medium-editor/dist/css/themes/default.css';
import '../styles/EditableContent.css';

const EditableContent = ({ content, onChange }) => {
  const editableRef = useRef(null);
  const editorRef = useRef(null);

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