import React, { useState, useEffect } from 'react';
import Header from './components/Header.js';
import CreationModal from './components/CreationModal.js';
import DocumentPreview from './components/DocumentPreview.js';
import Onboarding from './components/Onboarding.js';
import { PlusIcon, DocumentIcon } from './components/Icons.js';
import { Team } from './types.js';
import { generateDocumentContent } from './services/geminiService.js';

const App = () => {
  const [currentTeam, setCurrentTeam] = useState(Team.Developers);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedDocs = localStorage.getItem('nexusdocs-documents');
      const savedTeam = localStorage.getItem('nexusdocs-team');
      const hasOnboarded = localStorage.getItem('nexusdocs-onboarded');

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
        localStorage.setItem('nexusdocs-documents', JSON.stringify(documents));
        localStorage.setItem('nexusdocs-team', currentTeam);
        if (!showOnboarding) {
          localStorage.setItem('nexusdocs-onboarded', 'true');
        }
    } catch (error) {
        console.error("Failed to save to local storage", error);
    }
  }, [documents, currentTeam, showOnboarding]);

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
  
  const handleCompleteOnboarding = (selectedTeam) => {
    setCurrentTeam(selectedTeam);
    setShowOnboarding(false);
  }

  const filteredDocuments = documents.filter((doc) => doc.team === currentTeam);

  if (showOnboarding) {
    return (
        React.createElement('div', { className: "bg-gray-900 min-h-screen text-white font-sans" },
            React.createElement(Onboarding, { onComplete: handleCompleteOnboarding })
        )
    );
  }

  if (selectedDocument) {
    return React.createElement(DocumentPreview, { document: selectedDocument, onBack: () => setSelectedDocument(null) });
  }

  return (
    React.createElement('div', { className: "bg-gray-900 min-h-screen text-white font-sans" },
      React.createElement(Header, { currentTeam: currentTeam, onTeamChange: setCurrentTeam }),
      React.createElement('main', { className: "container mx-auto p-4 md:p-8" },
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
                    className: "bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700/50 hover:border-indigo-500 border-2 border-transparent transition-all",
                    role: "button",
                    tabIndex: 0,
                    onKeyPress: (e) => e.key === 'Enter' && setSelectedDocument(doc)
                  },
                    React.createElement('div', { className: "flex items-center space-x-3 mb-3" },
                      React.createElement(DocumentIcon, null),
                      React.createElement('h3', { className: "text-xl font-semibold truncate" }, doc.title)
                    ),
                    React.createElement('p', { className: "text-sm text-gray-400" }, `Criado em: ${doc.createdAt}`)
                  )
                ))
              )
            ) : (
              React.createElement('div', { className: "text-center py-16 px-6 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700" },
                React.createElement('h3', { className: "text-xl font-semibold text-white mb-2" }, "Nenhum documento encontrado"),
                React.createElement('p', { className: "text-gray-400 mb-6" }, `Comece criando um novo documento para a equipe de ${currentTeam}.`),
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
      )
    )
  );
};

export default App;
