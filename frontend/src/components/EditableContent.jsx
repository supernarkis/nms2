import React, { useEffect, useRef, useCallback } from 'react';
import debounce from 'lodash/debounce';
import '../styles/EditableContent.css';

const EditableContent = ({ content, onChange, className }) => {
  const editableRef = useRef(null);
  const isComposing = useRef(false);

  // Обработка ссылок в тексте
  const processLinks = useCallback((text) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const textNodes = [];
    const walk = document.createTreeWalker(
      text,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walk.nextNode()) {
      if (!node.parentElement.closest('a') && !node.parentElement.closest('code')) {
        textNodes.push(node);
      }
    }

    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      const matches = text.match(urlRegex);
      
      if (matches) {
        let lastIndex = 0;
        const fragment = document.createDocumentFragment();
        
        matches.forEach(url => {
          const urlIndex = text.indexOf(url, lastIndex);
          
          if (urlIndex > lastIndex) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex, urlIndex)));
          }
          
          const link = document.createElement('a');
          link.href = url;
          link.textContent = url;
          fragment.appendChild(link);
          
          lastIndex = urlIndex + url.length;
        });
        
        if (lastIndex < text.length) {
          fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }
        
        textNode.parentNode.replaceChild(fragment, textNode);
      }
    });
  }, []);

  // Дебаунсированный обработчик изменений
  const handleChange = debounce(() => {
    if (editableRef.current && onChange) {
      onChange(editableRef.current.innerHTML);
    }
  }, 300);

  // Обработчик ввода
  const handleInput = useCallback((e) => {
    if (!isComposing.current) {
      processLinks(editableRef.current);
      handleChange();
    }
  }, [handleChange, processLinks]);

  // Обработчик вставки (только plain text)
  const handlePaste = useCallback((e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  // Обработчик двойного клика по ссылке
  const handleDoubleClick = useCallback((e) => {
    const link = e.target.closest('a');
    if (link) {
      e.preventDefault();
      e.stopPropagation();
      window.open(link.href, '_blank', 'noopener,noreferrer');
    }
  }, []);

  // Обработчик нажатия клавиш
  const handleKeyDown = useCallback((e) => {
    // Alt+Enter для открытия ссылки
    if (e.altKey && e.key === 'Enter') {
      const selection = window.getSelection();
      const node = selection.anchorNode;
      if (node) {
        const link = node.parentElement.closest('a');
        if (link) {
          e.preventDefault();
          window.open(link.href, '_blank', 'noopener,noreferrer');
        }
      }
      return;
    }

    // Enter для переноса строки
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      document.execCommand('insertLineBreak');
    }
  }, []);

  // Обработчики IME
  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = () => {
    isComposing.current = false;
    handleInput();
  };

  // Инициализация и очистка
  useEffect(() => {
    const editor = editableRef.current;
    if (editor) {
      editor.addEventListener('dblclick', handleDoubleClick, true);
      editor.addEventListener('compositionstart', handleCompositionStart);
      editor.addEventListener('compositionend', handleCompositionEnd);

      return () => {
        editor.removeEventListener('dblclick', handleDoubleClick, true);
        editor.removeEventListener('compositionstart', handleCompositionStart);
        editor.removeEventListener('compositionend', handleCompositionEnd);
        handleChange.cancel();
      };
    }
  }, [handleDoubleClick, handleChange]);

  // Обновление контента и обработка ссылок
  useEffect(() => {
    if (editableRef.current && content !== editableRef.current.innerHTML) {
      editableRef.current.innerHTML = content || '';
      processLinks(editableRef.current);
    }
  }, [content, processLinks]);

  return (
    <div
      ref={editableRef}
      className={`editable-content ${className || ''}`}
      contentEditable
      onInput={handleInput}
      onPaste={handlePaste}
      onKeyDown={handleKeyDown}
      spellCheck={false}
    />
  );
};

export default EditableContent; 