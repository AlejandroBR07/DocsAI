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

const App = () => {
  const [currentTeam, setCurrentTeam] = useState(Team.Developers);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [isApiInitialized, setIsApiInitialized] = useState(false);
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);


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
    setDocuments([newDocument, ...documents]);
    setSelectedDocument(newDocument); // Automatically open the new document
  };
  
  const handleDocumentUpdate = (docId, updates) => {
    const updatedDocs = documents.map(doc =>
      doc.id === docId ? { ...doc, ...updates } : doc
    );
    setDocuments(updatedDocs);
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
        document: selectedDocument, 
        onBack: () => setSelectedDocument(null),
        onUpdateContent: handleDocumentUpdate,
    });
  }

  return (
    React.createElement('div', { className: "bg-gray-900 min-h-screen text-white font-sans" },
      React.createElement(Header, { currentTeam: currentTeam, onTeamChange: setCurrentTeam }),
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
                    onClick: () => setSelectedDocument(doc),
                    className: "bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700/50 hover:border-indigo-500 border-2 border-transparent transition-all group relative",
                    role: "button",
                    tabIndex: 0,
                    onKeyPress: (e) => e.key === 'Enter' && setSelectedDocument(doc)
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
      )
    )
  );
};

export default App;