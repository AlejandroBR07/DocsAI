import React, { useState, useRef, useEffect } from 'react';
import { BackIcon, CopyIcon } from './Icons.js';

const DocumentPreview = ({ document, onBack, onUpdateContent }) => {
  const [copyStatus, setCopyStatus] = useState('Copiar Conteúdo');
  const [saveStatus, setSaveStatus] = useState('Salvo');
  
  const [currentTitle, setCurrentTitle] = useState(document.title);
  const [currentContent, setCurrentContent] = useState(document.content);
  
  const contentRef = useRef(null);
  const saveTimeoutRef = useRef(null);
  const isComponentMounted = useRef(true);

  // Sync state and imperative DOM when the document prop changes
  useEffect(() => {
    setCurrentTitle(document.title);
    setCurrentContent(document.content);
    // When the document ID changes, we need to update the content of our editable div
    if (contentRef.current) {
        contentRef.current.innerHTML = document.content;
    }

    isComponentMounted.current = true;
    return () => {
        isComponentMounted.current = false;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    }
  }, [document.id]);


  // Debounced save function
  const saveChanges = () => {
    if (!isComponentMounted.current) return;
    
    setSaveStatus('Salvando...');
    
    const updates = {
        title: currentTitle,
        content: currentContent
    };

    onUpdateContent(document.id, updates);
    
    setTimeout(() => {
        if(isComponentMounted.current) setSaveStatus('Salvo')
    }, 500);
  };

  const handleInput = () => {
    setSaveStatus('Alterações não salvas');
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(saveChanges, 2000);
  };
  
  const handleTitleChange = (e) => {
      setCurrentTitle(e.target.value);
      handleInput();
  }
  
  const handleContentChange = (e) => {
      setCurrentContent(e.currentTarget.innerHTML);
      handleInput();
  }

  const handleBack = () => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    // Final save on leaving if there are pending changes
    if (saveStatus !== 'Salvo') {
        saveChanges();
    }
    onBack();
  };

  const handleCopy = () => {
    if (contentRef.current) {
      const contentHtml = `<h1>${currentTitle}</h1>${currentContent}`;
      const plainText = `${currentTitle}\n\n${contentRef.current.innerText}`;
      
      navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([contentHtml], { type: "text/html" }),
          "text/plain": new Blob([plainText], { type: "text/plain" }),
        })
      ]).then(() => {
        setCopyStatus('Copiado!');
        setTimeout(() => setCopyStatus('Copiar Conteúdo'), 2000);
      }).catch(err => {
        console.error('Falha ao copiar conteúdo: ', err);
        setCopyStatus('Erro ao copiar');
        setTimeout(() => setCopyStatus('Copiar Conteúdo'), 2000);
      });
    }
  };


  return (
    React.createElement('div', { className: "flex flex-col h-[calc(100vh-80px)] animate-fade-in" },
      React.createElement('div', { className: "bg-gray-800/80 backdrop-blur-sm p-4 sticky top-0 z-10 border-b border-gray-700" },
        React.createElement('div', { className: "container mx-auto flex justify-between items-center gap-4" },
          React.createElement('button', { onClick: handleBack, className: "flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 transition-colors" },
            React.createElement(BackIcon, null),
            React.createElement('span', null, "Voltar para a lista")
          ),
          React.createElement('div', { className: "flex items-center gap-4" },
            React.createElement('div', { className: "text-right" },
                React.createElement('span', { className: `text-sm transition-opacity duration-300 ${saveStatus === 'Salvando...' ? 'text-amber-400 animate-pulse' : 'text-gray-400'}` }, saveStatus),
                React.createElement('p', { className: "text-xs text-gray-500 hidden sm:block" }, "Salvo apenas neste navegador")
            ),
            React.createElement('button', {
              onClick: handleCopy,
              className: `flex items-center space-x-2 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 ${
                copyStatus === 'Copiado!' ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'
              }`
            },
              React.createElement(CopyIcon, null),
              React.createElement('span', null, copyStatus)
            )
          )
        )
      ),
      
      React.createElement('div', { className: "flex-grow overflow-y-auto" },
        React.createElement('div', { className: "container mx-auto p-4 md:p-8" },
            React.createElement('div', { className: "bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8" },
                React.createElement('input', {
                    type: "text",
                    value: currentTitle,
                    onChange: handleTitleChange,
                    className: "w-full bg-transparent text-3xl font-bold text-indigo-400 mb-6 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-md p-2 -mx-2",
                    "aria-label": "Título do Documento"
                }),
                React.createElement('article', {
                  ref: contentRef,
                  contentEditable: true,
                  onInput: handleContentChange,
                  suppressContentEditableWarning: true,
                  className: "prose prose-invert max-w-none prose-h2:text-2xl prose-h2:font-semibold prose-h2:border-b prose-h2:border-gray-600 prose-h2:pb-2 prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-3 prose-p:leading-relaxed prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-code:bg-gray-900 prose-code:text-amber-300 prose-code:font-mono prose-code:p-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:p-4 prose-pre:rounded-lg prose-strong:text-white prose-ul:list-disc prose-ul:pl-6 prose-li:my-1 prose-ol:list-decimal prose-ol:pl-6 prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-2 -m-2"
                })
            )
        )
      )
    )
  );
};

export default DocumentPreview;