import React, { useState, useRef, useEffect } from 'react';
import { BackIcon, CopyIcon, PencilIcon } from './Icons.js';

const DocumentPreview = ({ document, onBack, onUpdateContent, isExiting }) => {
  const [copyStatus, setCopyStatus] = useState('Copiar Conteúdo');
  const [isEditing, setIsEditing] = useState(false);
  
  const [currentTitle, setCurrentTitle] = useState(document.title);
  
  const contentRef = useRef(null);
  const isComponentMounted = useRef(true);

  // Sync state when the document prop changes
  useEffect(() => {
    isComponentMounted.current = true;
    setCurrentTitle(document.title);
    if (contentRef.current) {
        contentRef.current.innerHTML = document.content;
    }
    // Exit edit mode if the document is changed from the outside
    setIsEditing(false);
    return () => {
        isComponentMounted.current = false;
    }
  }, [document]);

  // Add event listeners for copy buttons
  useEffect(() => {
    if (!contentRef.current) return;

    const copyButtons = contentRef.current.querySelectorAll('.copy-code-btn');
    
    const handleCodeCopy = (e) => {
        const button = e.currentTarget;
        const pre = button.nextElementSibling;
        if (pre && pre.tagName === 'PRE') {
            const code = pre.querySelector('code');
            if (code) {
                navigator.clipboard.writeText(code.innerText).then(() => {
                    button.textContent = 'Copiado!';
                    button.classList.add('copied');
                    setTimeout(() => {
                        button.textContent = 'Copiar';
                        button.classList.remove('copied');
                    }, 2000);
                }).catch(err => {
                    button.textContent = 'Erro';
                    console.error('Falha ao copiar código: ', err);
                });
            }
        }
    };

    copyButtons.forEach(button => {
      button.addEventListener('click', handleCodeCopy);
    });

    return () => {
      copyButtons.forEach(button => {
        button.removeEventListener('click', handleCodeCopy);
      });
    };
  }, [document.content, isEditing]); // Rerun when content is set or we enter/exit edit mode


  const handleSave = () => {
      const newContent = contentRef.current ? contentRef.current.innerHTML : document.content;
      onUpdateContent(document.id, { title: currentTitle, content: newContent });
      setIsEditing(false);
  }

  const handleCancel = () => {
      setCurrentTitle(document.title);
      if (contentRef.current) {
          contentRef.current.innerHTML = document.content;
      }
      setIsEditing(false);
  }

  const handleCopy = () => {
    if (contentRef.current) {
      const titleToCopy = isEditing ? currentTitle : document.title;
      const contentHtml = `<h1>${titleToCopy}</h1>${contentRef.current.innerHTML}`;
      const plainText = `${titleToCopy}\n\n${contentRef.current.innerText}`;
      
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

  const animationClass = isExiting ? 'animate-fade-out' : 'animate-fade-in';

  return (
    React.createElement('div', { className: `flex flex-col h-[calc(100vh-80px)] ${animationClass}` },
      React.createElement('div', { className: "bg-gray-800/80 backdrop-blur-sm p-4 sticky top-0 z-10 border-b border-gray-700" },
        React.createElement('div', { className: "container mx-auto flex justify-between items-center gap-4" },
          React.createElement('button', { onClick: onBack, className: "flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 transition-colors" },
            React.createElement(BackIcon, null),
            React.createElement('span', null, "Voltar para a lista")
          ),
          React.createElement('div', { className: "flex items-center gap-2 sm:gap-4" },
            isEditing ? (
                 React.createElement(React.Fragment, null,
                    React.createElement('button', {
                        onClick: handleCancel,
                        className: "text-gray-300 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg transition-colors"
                    }, "Cancelar"),
                    React.createElement('button', {
                        onClick: handleSave,
                        className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    }, "Salvar")
                )
            ) : (
                React.createElement(React.Fragment, null,
                    React.createElement('button', {
                        onClick: () => setIsEditing(true),
                        className: "flex items-center space-x-2 text-gray-300 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg transition-colors"
                    }, 
                        React.createElement(PencilIcon, null),
                        React.createElement('span', null, "Editar")
                    ),
                    React.createElement('button', {
                      onClick: handleCopy,
                      className: `flex items-center space-x-2 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 ${
                        copyStatus === 'Copiado!' ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'
                      }`
                    },
                      React.createElement(CopyIcon, null),
                      React.createElement('span', { className: "hidden sm:inline" }, copyStatus)
                    )
                )
            )
          )
        )
      ),
      
      React.createElement('div', { className: "flex-grow overflow-y-auto" },
        React.createElement('div', { className: "container mx-auto p-4 md:p-8" },
            React.createElement('div', { className: `bg-gray-800 rounded-lg shadow-lg p-6 sm:p-8 ${isEditing ? 'ring-2 ring-indigo-500/50' : ''}` },
                isEditing ? (
                    React.createElement('input', {
                        type: "text",
                        value: currentTitle,
                        onChange: (e) => setCurrentTitle(e.target.value),
                        className: "w-full bg-gray-900/50 text-3xl font-bold text-indigo-400 mb-6 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-md p-2 -mx-2",
                        "aria-label": "Título do Documento"
                    })
                ) : (
                    React.createElement('h1', { className: "text-3xl font-bold text-indigo-400 mb-6 p-2 -mx-2" }, document.title)
                ),

                React.createElement('article', {
                  ref: contentRef,
                  contentEditable: isEditing,
                  suppressContentEditableWarning: true,
                  dangerouslySetInnerHTML: { __html: document.content },
                  className: `prose prose-invert max-w-none prose-h2:text-2xl prose-h2:font-semibold prose-h2:border-b prose-h2:border-gray-600 prose-h2:pb-2 prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-3 prose-p:leading-relaxed prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-code:text-amber-300 prose-code:font-mono prose-pre:bg-gray-900 prose-strong:text-white prose-ul:list-disc prose-ul:pl-6 prose-li:my-1 prose-ol:list-decimal prose-ol:pl-6 prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-300 ${isEditing ? 'focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-2 -m-2' : ''}`
                })
            )
        )
      )
    )
  );
};

export default DocumentPreview;