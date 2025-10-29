import React, { useState, useEffect } from 'react';
import Header from './components/Header.js';
import CreationModal from './components/CreationModal.js';
import DocumentPreview from './components/DocumentPreview.js';
import Onboarding from './components/Onboarding.js';
import ApiKeySetup from './components/ApiKeySetup.js';
import ConfirmationModal from './components/ConfirmationModal.js';
import { PlusIcon, DocumentIcon, TrashIcon, InfoIcon } from './components/Icons.js';
import { Team } from './types.js';
import { generateDocumentContent, initializeGemini } from './services/geminiService.js';

// Modal para alterar a chave de API, definido localmente.
const ApiKeyChangeModal = ({ isOpen, onClose, onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySet(apiKey.trim());
      onClose();
    }
  };

  return (
    React.createElement('div', {
      className: "fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in",
      onClick: onClose,
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "apikey-change-title"
    },
      React.createElement('div', {
        className: "bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all animate-slide-up border border-gray-700",
        onClick: (e) => e.stopPropagation()
      },
        React.createElement('div', { className: "p-6" },
          React.createElement('h3', { id: "apikey-change-title", className: "text-lg leading-6 font-bold text-white" }, "Alterar Chave de API"),
          React.createElement('p', { className: "text-gray-400 mt-2 text-sm" }, "Insira sua nova chave de API do Google Gemini. A chave anterior será substituída.")
        ),
        React.createElement('form', { onSubmit: handleSubmit },
            React.createElement('div', {className: "p-6 space-y-4"},
                React.createElement('div', null,
                    React.createElement('label', { htmlFor: "api-key-change", className: "block text-sm font-medium text-gray-300 mb-2" }, "Nova Chave de API"),
                    React.createElement('input', {
                        id: "api-key-change",
                        type: "password",
                        value: apiKey,
                        onChange: (e) => setApiKey(e.target.value),
                        className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                        placeholder: "Cole sua nova chave aqui",
                        autoFocus: true
                    })
                ),
                 React.createElement('div', { className: "text-center text-sm text-gray-500" },
                    React.createElement('a', {
                        href: "https://aistudio.google.com/app/apikey",
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "text-indigo-400 hover:text-indigo-300 underline"
                    }, "Obtenha uma chave de API no Google AI Studio")
                )
            ),
            React.createElement('div', { className: "bg-gray-800/50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-gray-700" },
                React.createElement('button', {
                    type: "button",
                    className: "w-full justify-center rounded-md border border-gray-600 px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 sm:w-auto sm:text-sm transition-colors",
                    onClick: onClose
                }, "Cancelar"),
                React.createElement('button', {
                    type: "submit",
                    disabled: !apiKey.trim(),
                    className: "w-full justify-center rounded-md border border-transparent px-4 py-2 bg-indigo-600 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 sm:w-auto sm:text-sm transition-colors disabled:opacity-50",
                }, "Salvar Nova Chave")
            )
        )
      )
    )
  );
};

const App = () => {
  const [currentTeam, setCurrentTeam] = useState(Team.Developers);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isApiInitialized, setIsApiInitialized] = useState(false);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const [isApiKeyChangeModalOpen, setIsApiKeyChangeModalOpen] = useState(false);
  const [lastViewedDocId, setLastViewedDocId] = useState(null);
  const [isExitingPreview, setIsExitingPreview] = useState(false);


  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedApiKey = localStorage.getItem('synapsedocs-apikey');
      if (savedApiKey && initializeGemini(savedApiKey)) {
        setIsApiInitialized(true);
      }

      const savedDocs = localStorage.getItem('synapsedocs-documents');
      const savedTeam = localStorage.getItem('synapsedocs-team');
      const hasOnboarded = localStorage.getItem('synapsedocs-onboarded');

      if (savedDocs) {
        setDocuments(JSON.parse(savedDocs));
      }
      if (savedTeam && Object.values(Team).includes(savedTeam)) {
        setCurrentTeam(savedTeam);
      }
      if (hasOnboarded) {
        setShowOnboarding(false);
      }
    } catch (error) {
        console.error("Failed to load from local storage", error);
    }
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    try {
        localStorage.setItem('synapsedocs-documents', JSON.stringify(documents));
        localStorage.setItem('synapsedocs-team', currentTeam);
        if (!showOnboarding) {
          localStorage.setItem('synapsedocs-onboarded', 'true');
        }
    } catch (error) {
        console.error("Failed to save to local storage", error);
    }
  }, [documents, currentTeam, showOnboarding]);

  // Effect to clear the highlight on the document list after a delay
  useEffect(() => {
    let timer;
    if (!selectedDocument && lastViewedDocId) {
        timer = setTimeout(() => {
            setLastViewedDocId(null);
        }, 2500); // Keep highlight for 2.5 seconds
    }
    return () => clearTimeout(timer);
  }, [selectedDocument, lastViewedDocId]);


  const handleApiKeySet = (apiKey) => {
    localStorage.setItem('synapsedocs-apikey', apiKey);
    if (initializeGemini(apiKey)) {
      setIsApiInitialized(true);
    } else {
        // You could add some user-facing error handling here
        console.error("Failed to initialize API with provided key.");
    }
  };

  const handleDocumentCreate = (title, content) => {
    const newDocument = {
      id: new Date().toISOString(),
      title,
      content,
      team: currentTeam,
      createdAt: new Date().toLocaleString('pt-BR'),
    };
    const newDocs = [newDocument, ...documents];
    setDocuments(newDocs);
    handleSelectDocument(newDocument); // Automatically open the new document
  };
  
  const handleDocumentUpdate = (docId, updates) => {
    let updatedDocument = null;
    const updatedDocs = documents.map(doc => {
      if (doc.id === docId) {
        updatedDocument = { ...doc, ...updates };
        return updatedDocument;
      }
      return doc;
    });
    setDocuments(updatedDocs);
    if (updatedDocument && selectedDocument && selectedDocument.id === docId) {
      setSelectedDocument(updatedDocument);
    }
  };
  
  const handleRequestDelete = (doc) => {
      setDocToDelete(doc);
      setIsDeleteConfirmOpen(true);
  }

  const handleConfirmDelete = () => {
    if (docToDelete) {
        setDocuments(documents.filter(doc => doc.id !== docToDelete.id));
    }
    setIsDeleteConfirmOpen(false);
    setDocToDelete(null);
  };
  
  const handleSelectDocument = (doc) => {
      setSelectedDocument(doc);
      setLastViewedDocId(doc.id);
  };

  const handleBackFromPreview = () => {
      setIsExitingPreview(true);
      setTimeout(() => {
          setSelectedDocument(null);
          setIsExitingPreview(false);
      }, 300); // Match animation duration
  };


  const handleCompleteOnboarding = (selectedTeam) => {
    setCurrentTeam(selectedTeam);
    setShowOnboarding(false);
  }

  const filteredDocuments = documents.filter((doc) => doc.team === currentTeam);

  if (!isApiInitialized) {
      return React.createElement('div', { className: "animate-fade-in"}, React.createElement(ApiKeySetup, { onApiKeySet: handleApiKeySet }));
  }

  if (showOnboarding) {
    return (
        React.createElement('div', { className: "bg-gray-900 min-h-screen text-white font-sans" },
            React.createElement(Onboarding, { onComplete: handleCompleteOnboarding })
        )
    );
  }

  if (selectedDocument) {
    return React.createElement(DocumentPreview, { 
        doc: selectedDocument, 
        onBack: handleBackFromPreview,
        onUpdateContent: handleDocumentUpdate,
        isExiting: isExitingPreview,
    });
  }

  return (
    React.createElement('div', { className: "bg-gray-900 min-h-screen text-white font-sans" },
      React.createElement(Header, { 
        currentTeam: currentTeam, 
        onTeamChange: setCurrentTeam, 
        onOpenSettings: () => setIsApiKeyChangeModalOpen(true)
      }),
       React.createElement('div', { className: "bg-amber-900/50 text-amber-200 text-sm text-center p-2 border-b border-amber-800 flex items-center justify-center gap-2" },
        React.createElement(InfoIcon, null),
        "Seus documentos são salvos localmente no seu navegador. Para maior segurança, copie o conteúdo para o Google Docs ou outro local seguro."
      ),
      React.createElement('main', { className: "container mx-auto p-4 md:p-8 animate-fade-in" },
            React.createElement('div', { className: "flex justify-between items-center mb-6" },
              React.createElement('h2', { className: "text-3xl font-bold" }, `Documentos de ${currentTeam}`),
              React.createElement('button', {
                onClick: () => setIsModalOpen(true),
                className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-transform transform hover:scale-105",
                "aria-label": "Criar novo documento"
              },
                React.createElement(PlusIcon, null),
                React.createElement('span', null, "Novo Documento")
              )
            ),

            filteredDocuments.length > 0 ? (
              React.createElement('div', { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" },
                filteredDocuments.map((doc) => (
                  React.createElement('div', {
                    key: doc.id,
                    onClick: () => handleSelectDocument(doc),
                    className: `bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700/50 hover:border-indigo-500 border-2 transition-all group relative ${doc.id === lastViewedDocId ? 'border-indigo-500 bg-gray-700/50' : 'border-transparent'}`,
                    role: "button",
                    tabIndex: 0,
                    onKeyPress: (e) => e.key === 'Enter' && handleSelectDocument(doc)
                  },
                    React.createElement('div', { className: "flex items-center space-x-3 mb-3" },
                      React.createElement(DocumentIcon, null),
                      React.createElement('h3', { className: "text-xl font-semibold truncate" }, doc.title)
                    ),
                    React.createElement('p', { className: "text-sm text-gray-400" }, `Criado em: ${doc.createdAt}`),
                    React.createElement('button', {
                        onClick: (e) => {
                            e.stopPropagation();
                            handleRequestDelete(doc);
                        },
                        className: "absolute top-4 right-4 text-gray-500 hover:text-red-500 bg-gray-700/50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity",
                        "aria-label": "Excluir documento"
                      },
                      React.createElement(TrashIcon, null)
                    )
                  )
                ))
              )
            ) : (
              React.createElement('div', { className: "text-center py-16 px-6 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700" },
                React.createElement('h3', { className: "text-xl font-semibold text-white mb-2" }, "Nenhum documento encontrado"),
                React.createElement('p', { className: "text-gray-400 mb-6" }, `Sua jornada começa aqui. Crie seu primeiro documento para a equipe de ${currentTeam}.`),
                React.createElement('button', {
                  onClick: () => setIsModalOpen(true),
                  className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 mx-auto transition-transform transform hover:scale-105"
                },
                  React.createElement(PlusIcon, null),
                  React.createElement('span', null, "Criar Primeiro Documento")
                )
              )
            )
      ),

      isModalOpen && (
        React.createElement(CreationModal, {
          onClose: () => setIsModalOpen(false),
          onDocumentCreate: handleDocumentCreate,
          generateContent: generateDocumentContent,
          currentTeam: currentTeam
        })
      ),
      
      isDeleteConfirmOpen && (
        React.createElement(ConfirmationModal, {
            isOpen: isDeleteConfirmOpen,
            onClose: () => setIsDeleteConfirmOpen(false),
            onConfirm: handleConfirmDelete,
            title: "Excluir Documento",
            message: `Você tem certeza que deseja excluir "${docToDelete?.title}"? Esta ação não pode ser desfeita.`
        })
      ),
      
      React.createElement(ApiKeyChangeModal, {
        isOpen: isApiKeyChangeModalOpen,
        onClose: () => setIsApiKeyChangeModalOpen(false),
        onApiKeySet: handleApiKeySet
      })
    )
  );
};

export default App;