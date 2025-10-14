import React, { useState, useRef } from 'react';
import { BackIcon, CopyIcon } from './Icons.js';

const DocumentPreview = ({ document, onBack }) => {
  const [copyStatus, setCopyStatus] = useState('Copiar Conteúdo');
  const contentRef = useRef(null);

  const handleCopy = () => {
    if (contentRef.current) {
      const contentHtml = contentRef.current.innerHTML;
      
      navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([contentHtml], { type: "text/html" }),
          "text/plain": new Blob([contentRef.current.innerText], { type: "text/plain" }),
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
    React.createElement('div', { className: "flex flex-col h-[calc(100vh-80px)]" },
      React.createElement('div', { className: "bg-gray-800/80 backdrop-blur-sm p-4 sticky top-0 z-10 border-b border-gray-700" },
        React.createElement('div', { className: "container mx-auto flex justify-between items-center" },
          React.createElement('button', { onClick: onBack, className: "flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 transition-colors" },
            React.createElement(BackIcon, null),
            React.createElement('span', null, "Voltar para a lista")
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
      ),
      
      React.createElement('div', { className: "flex-grow overflow-y-auto" },
        React.createElement('div', { className: "container mx-auto p-4 md:p-8" },
            React.createElement('div', { className: "bg-gray-800 rounded-lg shadow-lg p-8" },
                React.createElement('article', {
                  ref: contentRef,
                  className: "prose prose-invert max-w-none prose-h1:text-3xl prose-h1:font-bold prose-h1:text-indigo-400 prose-h1:mb-4 prose-h2:text-2xl prose-h2:font-semibold prose-h2:border-b prose-h2:border-gray-600 prose-h2:pb-2 prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-3 prose-p:leading-relaxed prose-a:text-indigo-400 hover:prose-a:text-indigo-300 prose-code:bg-gray-900 prose-code:text-amber-300 prose-code:font-mono prose-code:p-1 prose-code:rounded prose-pre:bg-gray-900 prose-pre:p-4 prose-pre:rounded-lg prose-strong:text-white prose-ul:list-disc prose-ul:pl-6 prose-li:my-1 prose-ol:list-decimal prose-ol:pl-6 prose-blockquote:border-l-4 prose-blockquote:border-indigo-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-300",
                  dangerouslySetInnerHTML: { __html: document.content }
                })
            )
        )
      )
    )
  );
};

export default DocumentPreview;
