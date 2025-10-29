import React, { useState, useRef, useEffect } from 'react';
import { BackIcon, CopyIcon, PencilIcon, BoldIcon, ItalicIcon, ListUlIcon, ListOlIcon, InlineCodeIcon, SidebarOpenIcon, SidebarCloseIcon, ChevronRightIcon, ParagraphIcon, Heading2Icon, Heading3Icon } from './Icons.js';

const FormattingToolbar = ({ onCommand }) => (
    React.createElement('div', { className: "bg-gray-700/50 rounded-md p-1 flex items-center gap-1 border border-gray-600" },
        React.createElement('button', { onMouseDown: (e) => { e.preventDefault(); onCommand('formatBlock', 'h2'); }, className: "p-2 rounded hover:bg-gray-600 text-gray-300" }, React.createElement(Heading2Icon, null)),
        React.createElement('button', { onMouseDown: (e) => { e.preventDefault(); onCommand('formatBlock', 'h3'); }, className: "p-2 rounded hover:bg-gray-600 text-gray-300" }, React.createElement(Heading3Icon, null)),
        React.createElement('button', { onMouseDown: (e) => { e.preventDefault(); onCommand('formatBlock', 'p'); }, className: "p-2 rounded hover:bg-gray-600 text-gray-300" }, React.createElement(ParagraphIcon, null)),
        React.createElement('div', { className: "w-[1px] h-6 bg-gray-600 mx-1" }),
        React.createElement('button', { onMouseDown: (e) => { e.preventDefault(); onCommand('bold'); }, className: "p-2 rounded hover:bg-gray-600 text-gray-300", title: "Negrito (Ctrl+B)" }, React.createElement(BoldIcon, null)),
        React.createElement('button', { onMouseDown: (e) => { e.preventDefault(); onCommand('italic'); }, className: "p-2 rounded hover:bg-gray-600 text-gray-300", title: "Itálico (Ctrl+I)" }, React.createElement(ItalicIcon, null)),
        React.createElement('button', { onMouseDown: (e) => { e.preventDefault(); onCommand('code'); }, className: "p-2 rounded hover:bg-gray-600 text-gray-300", title: "Código" }, React.createElement(InlineCodeIcon, null)),
        React.createElement('div', { className: "w-[1px] h-6 bg-gray-600 mx-1" }),
        React.createElement('button', { onMouseDown: (e) => { e.preventDefault(); onCommand('insertUnorderedList'); }, className: "p-2 rounded hover:bg-gray-600 text-gray-300", title: "Lista não ordenada" }, React.createElement(ListUlIcon, null)),
        React.createElement('button', { onMouseDown: (e) => { e.preventDefault(); onCommand('insertOrderedList'); }, className: "p-2 rounded hover:bg-gray-600 text-gray-300", title: "Lista ordenada" }, React.createElement(ListOlIcon, null))
    )
);

const TableOfContents = ({ nodes, onNavigate, expandedItems, onToggleExpand, isRoot = false }) => {
    const renderNode = (node) => {
        const isExpanded = expandedItems.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        
        const getIndentClass = (level) => {
            switch (level) {
                case 1: return '';
                case 2: return 'pl-4';
                case 3: return 'pl-8';
                default: return 'pl-12';
            }
        };

        return (
            React.createElement('li', { key: node.id },
                React.createElement('div', {
                    className: `flex items-center rounded-md transition-colors text-gray-300 hover:bg-gray-700/50 ${getIndentClass(node.level)}`
                },
                    hasChildren ? (
                        React.createElement('button', {
                            onClick: () => onToggleExpand(node.id),
                            className: 'p-1 mr-1 rounded-full hover:bg-gray-600 flex-shrink-0 transition-transform active:scale-95',
                            'aria-expanded': isExpanded,
                            title: isExpanded ? 'Recolher subseções' : 'Expandir subseções'
                        },
                            React.createElement(ChevronRightIcon, { className: `h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}` })
                        )
                    ) : (
                        React.createElement('div', { className: 'w-6 flex-shrink-0' }) // Spacer to align text with expandable items
                    ),
                    React.createElement('a', {
                        href: `#${node.id}`,
                        onClick: (e) => onNavigate(e, node.id),
                        className: `block text-sm py-1 flex-grow truncate`
                    }, node.text)
                ),
                isExpanded && hasChildren &&
                React.createElement(TableOfContents, {
                    nodes: node.children,
                    onNavigate: onNavigate,
                    expandedItems: expandedItems,
                    onToggleExpand: onToggleExpand,
                    isRoot: false
                })
            )
        );
    };

    const list = React.createElement('ul', { className: "space-y-1" },
        nodes.map(node => renderNode(node))
    );

    if (isRoot) {
        if (nodes.length === 0) return null;
        return (
            React.createElement('nav', { 'aria-label': "Sumário do Documento", className: "py-4 pr-4" },
                React.createElement('h3', { className: "text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2" }, "Neste Documento"),
                list
            )
        );
    }

    return list; // Return just the <ul> for recursive calls
};


const DocumentPreview = ({ doc, onBack, onUpdateContent, isExiting }) => {
  const [copyStatus, setCopyStatus] = useState('Copiar Conteúdo');
  const [isEditing, setIsEditing] = useState(false);
  const [currentTitle, setCurrentTitle] = useState(doc.title);
  
  const [toc, setToc] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedTocItems, setExpandedTocItems] = useState(new Set());


  const contentRef = useRef(null);
  const isComponentMounted = useRef(true);

  // Sync state and generate Table of Contents when the document prop changes
  useEffect(() => {
    isComponentMounted.current = true;
    setCurrentTitle(doc.title);
    setExpandedTocItems(new Set()); // Reset expanded items on doc change

    if (contentRef.current) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = doc.content;

        const headers = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const flatToc = [];

        headers.forEach((header, index) => {
            const text = header.textContent.trim();
            if(text) {
                const id = `section-${text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')}-${index}`;
                header.id = id;
                flatToc.push({
                    id: id,
                    text: text,
                    level: parseInt(header.tagName.substring(1), 10),
                    children: []
                });
            }
        });
        
        const buildTocTree = (list) => {
            const tree = [];
            const path = []; 
            list.forEach(node => {
                while (path.length > 0 && path[path.length - 1].level >= node.level) {
                    path.pop();
                }
                const parent = path.length > 0 ? path[path.length - 1] : null;
                if (parent) {
                    parent.children.push(node);
                } else {
                    tree.push(node);
                }
                path.push(node);
            });
            return tree;
        };

        const tocTree = buildTocTree(flatToc);
        setToc(tocTree);
        contentRef.current.innerHTML = tempDiv.innerHTML;
    }

    setIsEditing(false); // Exit edit mode if the doc changes
    return () => { isComponentMounted.current = false; }
  }, [doc]);
  
  const handleToggleTocExpand = (id) => {
    setExpandedTocItems(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        return newSet;
    });
  };

  const toggleInlineFormat = (tag) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const editor = contentRef.current;
    
    let parentNode = range.commonAncestorContainer;
    if (parentNode.nodeType === Node.TEXT_NODE) {
        parentNode = parentNode.parentNode;
    }

    // Check if the selection or its ancestor is already formatted with the tag
    const existingElement = parentNode.closest(tag);

    if (existingElement && editor.contains(existingElement)) {
        // Unwrap the element
        const parent = existingElement.parentNode;
        while (existingElement.firstChild) {
            parent.insertBefore(existingElement.firstChild, existingElement);
        }
        parent.removeChild(existingElement);
        parent.normalize();
    } else {
        // Wrap the selection
        if (range.collapsed) return; // Don't wrap empty selections
        const newNode = document.createElement(tag);
        try {
            range.surroundContents(newNode);
            selection.collapseToEnd();
        } catch (e) {
            console.error(`Falha ao envolver a seleção com <${tag}>:`, e);
             // Fallback for complex selections
            document.execCommand('insertHTML', false, `<${tag}>${selection.toString()}</${tag}>`);
        }
    }
  };


  const handleFormat = (command, value = null) => {
    if (!isEditing || !contentRef.current) return;
    
    contentRef.current.focus();

    if (command === 'code') {
        toggleInlineFormat('code');
    } else {
        document.execCommand(command, false, value);
    }
  };
  
  const handleTocNavigate = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if(element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSave = () => {
      const newContent = contentRef.current ? contentRef.current.innerHTML : doc.content;
      onUpdateContent(doc.id, { title: currentTitle, content: newContent });
      setIsEditing(false);
  }

  const handleCancel = () => {
      setCurrentTitle(doc.title);
      if (contentRef.current) {
          contentRef.current.innerHTML = doc.content;
      }
      setIsEditing(false);
  }

  const handleCopy = () => {
    if (contentRef.current) {
      const titleToCopy = isEditing ? currentTitle : doc.title;
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
  
  const articleClasses = [
    'prose prose-invert max-w-none prose-h2:text-2xl prose-h2:font-semibold',
    'prose-h2:border-b prose-h2:border-gray-600 prose-h2:pb-2 prose-h2:mt-8',
    'prose-h2:mb-4 prose-h3:text-xl prose-h3:font-semibold prose-h3:mb-3',
    'prose-p:leading-relaxed prose-a:text-indigo-400 hover:prose-a:text-indigo-300',
    'prose-code:text-amber-300 prose-code:font-mono prose-pre:bg-gray-900',
    'prose-strong:text-white prose-ul:list-disc prose-ul:pl-6 prose-li:my-1',
    'prose-ol:list-decimal prose-ol:pl-6 prose-blockquote:border-l-4',
    'prose-blockquote:border-indigo-500 prose-blockquote:pl-4 prose-blockquote:italic',
    'prose-blockquote:text-gray-300',
  ];
  if (isEditing) {
    articleClasses.push('focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-md p-2 -m-2 editing-prose');
  }

  return (
    React.createElement('div', { className: `flex flex-col h-[calc(100vh-80px)] ${animationClass}` },
      React.createElement('div', { className: "bg-gray-800/80 backdrop-blur-sm p-4 sticky top-0 z-20 border-b border-gray-700" },
        React.createElement('div', { className: "container mx-auto flex justify-between items-center gap-2" },
          React.createElement('div', { className: "flex items-center gap-2" },
            React.createElement('button', { onClick: onBack, className: "flex items-center space-x-2 text-indigo-400 hover:text-indigo-300 transition-colors p-2 rounded-md hover:bg-gray-700/50" },
              React.createElement(BackIcon, null)
            ),
             !isEditing && React.createElement('button', {
              onClick: () => setIsSidebarOpen(!isSidebarOpen),
              className: "p-2 rounded-md hover:bg-gray-700/50 text-gray-300 hover:text-white"
            },
              isSidebarOpen ? React.createElement(SidebarCloseIcon, null) : React.createElement(SidebarOpenIcon, null)
            )
          ),

          isEditing && React.createElement(FormattingToolbar, { onCommand: handleFormat }),

          React.createElement('div', { className: "flex items-center gap-2 sm:gap-4" },
            isEditing ? (
                 React.createElement(React.Fragment, null,
                    React.createElement('button', { onClick: handleCancel, className: "text-gray-300 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg transition-colors" }, "Cancelar"),
                    React.createElement('button', { onClick: handleSave, className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors" }, "Salvar")
                )
            ) : (
                React.createElement(React.Fragment, null,
                    React.createElement('button', { onClick: () => setIsEditing(true), className: "flex items-center space-x-2 text-gray-300 hover:bg-gray-700 font-bold py-2 px-4 rounded-lg transition-colors" }, 
                        React.createElement(PencilIcon, null), React.createElement('span', null, "Editar")
                    ),
                    React.createElement('button', { onClick: handleCopy, className: `flex items-center space-x-2 text-white font-bold py-2 px-4 rounded-lg transition-all duration-300 ${copyStatus === 'Copiado!' ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-700'}`},
                      React.createElement(CopyIcon, null), React.createElement('span', { className: "hidden sm:inline" }, copyStatus)
                    )
                )
            )
          )
        )
      ),
      
      React.createElement('div', { className: "flex-1 flex flex-row overflow-y-hidden" },
          !isEditing && React.createElement('aside', {
            className: `flex-shrink-0 bg-gray-800/50 border-r border-gray-700 overflow-y-auto transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-0'}`
          }, 
            React.createElement('div', { className: "w-64" }, React.createElement(TableOfContents, { nodes: toc, isRoot: true, onNavigate: handleTocNavigate, expandedItems: expandedTocItems, onToggleExpand: handleToggleTocExpand }))
          ),

          React.createElement('div', { className: "flex-1 overflow-y-auto" },
              React.createElement('div', { className: "container mx-auto p-4 md:p-8" },
                  React.createElement('div', { className: `bg-gray-800 rounded-lg shadow-lg ${isEditing ? 'ring-2 ring-indigo-500/50' : ''}` },
                      React.createElement('div', { className: "p-6 sm:p-8" },
                          isEditing ? (
                              React.createElement('input', {
                                  type: "text",
                                  value: currentTitle,
                                  onChange: (e) => setCurrentTitle(e.target.value),
                                  className: "w-full bg-gray-900/50 text-3xl font-bold text-indigo-400 mb-6 focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded-md p-2 -mx-2",
                                  "aria-label": "Título do Documento"
                              })
                          ) : (
                              React.createElement('h1', { className: "text-3xl font-bold text-indigo-400 mb-6 p-2 -mx-2" }, doc.title)
                          ),
                          React.createElement('article', {
                            ref: contentRef,
                            contentEditable: isEditing,
                            suppressContentEditableWarning: true,
                            className: articleClasses.join(' ')
                          })
                      )
                  )
              )
          )
      )
    )
  );
};

export default DocumentPreview;