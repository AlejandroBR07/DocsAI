import React, { useState, useEffect } from 'react';
import Header from './components/Header.js';
import CreationModal from './components/CreationModal.js';
import DocumentPreview from './components/DocumentPreview.js';
import Onboarding from './components/Onboarding.js';
import ApiKeySetup from './components/ApiKeySetup.js';
import ConfirmationModal from './components/ConfirmationModal.js';
import { PlusIcon, DocumentIcon, TrashIcon, InfoIcon, SearchIcon, LoadingSpinner, SettingsIcon, UserIcon } from './components/Icons.js';
import { Team } from './types.js';
import { initializeAiService, validateApiKey } from './services/openAIService.js';

const ResponsibleModal = ({ isOpen, onClose, currentResponsible, onResponsibleSave }) => {
  const [responsibleName, setResponsibleName] = useState(currentResponsible || '');
  
  useEffect(() => {
    if (isOpen) {
      setResponsibleName(currentResponsible || '');
    }
  }, [isOpen, currentResponsible]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (responsibleName.trim()) {
      onResponsibleSave(responsibleName.trim());
    }
    onClose();
  };

  return (
    React.createElement('div', {
      className: "fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in",
      onClick: onClose, role: "dialog", "aria-modal": "true", "aria-labelledby": "responsible-title"
    },
      React.createElement('div', {
        className: "bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all animate-slide-up border border-gray-700",
        onClick: (e) => e.stopPropagation()
      },
        React.createElement('div', { className: "p-6 flex items-center gap-3" },
          React.createElement(UserIcon, { className: "h-6 w-6 text-indigo-400" }),
          React.createElement('h3', { id: "responsible-title", className: "text-lg leading-6 font-bold text-white" }, "Alterar Responsável")
        ),
        React.createElement('form', { onSubmit: handleSave },
          React.createElement('div', { className: "p-6" },
            React.createElement('label', { htmlFor: "responsible-name", className: "block text-sm font-medium text-gray-300 mb-2" }, "Seu Nome (Responsável)"),
            React.createElement('input', {
              id: "responsible-name", type: "text", value: responsibleName,
              onChange: (e) => setResponsibleName(e.target.value),
              className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
              placeholder: "Digite seu nome completo", autoFocus: true
            })
          ),
          React.createElement('div', { className: "bg-gray-800/50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-gray-700" },
            React.createElement('button', { type: "button", className: "w-full justify-center rounded-md border border-gray-600 px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 shadow-sm hover:bg-gray-600 sm:w-auto sm:text-sm", onClick: onClose }, "Cancelar"),
            React.createElement('button', { type: "submit", className: "w-full justify-center rounded-md border border-transparent px-4 py-2 bg-indigo-600 text-base font-medium text-white shadow-sm hover:bg-indigo-700 sm:w-auto sm:text-sm" }, 'Salvar')
          )
        )
      )
    )
  );
};


const ApiSettingsModal = ({ isOpen, onClose, onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [apiError, setApiError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setApiKey('');
      setApiError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleVerifyAndSave = async (e) => {
    e.preventDefault();
    if (!apiKey.trim() || isVerifying) return;
    setIsVerifying(true);
    setApiError('');
    const isValid = await validateApiKey(apiKey.trim());
    setIsVerifying(false);
    if (isValid) {
      onApiKeySet(apiKey.trim());
      onClose();
    } else {
      setApiError('A chave de API fornecida é inválida. Verifique e tente novamente.');
    }
  };

  return (
    React.createElement('div', {
      className: "fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in",
      onClick: onClose, role: "dialog", "aria-modal": "true", "aria-labelledby": "api-settings-title"
    },
      React.createElement('div', {
        className: "bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transform transition-all animate-slide-up border border-gray-700",
        onClick: (e) => e.stopPropagation()
      },
        React.createElement('div', { className: "p-6 flex items-center gap-3" },
          React.createElement(SettingsIcon, { className: "h-6 w-6 text-indigo-400" }),
          React.createElement('h3', { id: "api-settings-title", className: "text-lg leading-6 font-bold text-white" }, "Configurar Chave de API")
        ),
        React.createElement('form', { onSubmit: handleVerifyAndSave },
          React.createElement('div', { className: "p-6 space-y-4" },
            React.createElement('label', { htmlFor: "api-key-change", className: "block text-sm font-medium text-gray-300 mb-2" }, "Nova Chave de API da OpenAI"),
            React.createElement('input', {
              id: "api-key-change", type: "password", value: apiKey,
              onChange: (e) => setApiKey(e.target.value),
              className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
              placeholder: "Cole sua nova chave para configurá-la ou alterá-la", autoFocus: true
            }),
            apiError && React.createElement('p', { className: 'text-sm text-red-400' }, apiError),
            React.createElement('div', { className: "text-center text-sm text-gray-500" },
              React.createElement('a', { href: "https://platform.openai.com/account/api-keys", target: "_blank", rel: "noopener noreferrer", className: "text-indigo-400 hover:text-indigo-300 underline" }, "Obtenha uma chave de API no painel da OpenAI")
            )
          ),
          React.createElement('div', { className: "bg-gray-800/50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-gray-700" },
            React.createElement('button', { type: "button", className: "w-full justify-center rounded-md border border-gray-600 px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 shadow-sm hover:bg-gray-600 sm:w-auto sm:text-sm", onClick: onClose }, "Cancelar"),
            React.createElement('button', { type: "submit", disabled: isVerifying || !apiKey.trim(), className: "w-full justify-center rounded-md border border-transparent px-4 py-2 bg-indigo-600 text-base font-medium text-white shadow-sm hover:bg-indigo-700 sm:w-auto sm:text-sm disabled:opacity-50 flex items-center gap-2" },
              isVerifying ? React.createElement(LoadingSpinner, null) : null, isVerifying ? 'Verificando...' : 'Salvar Chave'
            )
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
  const [apiKeyStatus, setApiKeyStatus] = useState('unknown'); // 'unknown', 'valid', 'invalid'
  
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState(null);

  const [isApiSettingsModalOpen, setIsApiSettingsModalOpen] = useState(false);
  const [isResponsibleModalOpen, setIsResponsibleModalOpen] = useState(false);
  const [lastViewedDocId, setLastViewedDocId] = useState(null);
  const [isExitingPreview, setIsExitingPreview] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [responsiblePerson, setResponsiblePerson] = useState('');

  // Load state from localStorage on mount
  useEffect(() => {
    const APP_VERSION = "v1.3.4";
    const LATEST_CHANGE = "Corrigido o bug que exibia a tag <br> como texto puro no cabeçalho do documento.";

    console.log(
        `%c TradeSynapse %c ${APP_VERSION} %c ${LATEST_CHANGE}`,
        'background: #3b82f6; color: white; padding: 2px 4px; border-radius: 3px 0 0 3px; font-weight: bold;',
        'background: #1f2937; color: white; padding: 2px 4px; border-radius: 0 3px 3px 0;',
        'color: #9ca3af; padding: 2px;'
    );
      
    const loadData = async () => {
      try {
        const savedApiKey = localStorage.getItem('synapsedocs-apikey');
        if (savedApiKey) {
          const isValid = await validateApiKey(savedApiKey);
          setApiKeyStatus(isValid ? 'valid' : 'invalid');
          if (initializeAiService(savedApiKey)) {
            setIsApiInitialized(true);
          }
        } else {
            setApiKeyStatus('invalid');
        }

        const savedDocs = localStorage.getItem('synapsedocs-documents');
        const savedTeam = localStorage.getItem('synapsedocs-team');
        const hasOnboarded = localStorage.getItem('synapsedocs-onboarded');
        const savedResponsible = localStorage.getItem('synapsedocs-responsible');

        if (savedDocs) {
          setDocuments(JSON.parse(savedDocs));
        }
        if (savedTeam && Object.values(Team).includes(savedTeam)) {
          setCurrentTeam(savedTeam);
        }
        if (savedResponsible) {
          setResponsiblePerson(savedResponsible);
        }
        if (hasOnboarded && savedResponsible) { // Require both to skip onboarding
          setShowOnboarding(false);
        }
      } catch (error) {
          console.error("Failed to load from local storage", error);
      }
    };
    loadData();
  }, []);

  // Save state to localStorage on change
  useEffect(() => {
    try {
        localStorage.setItem('synapsedocs-documents', JSON.stringify(documents));
        localStorage.setItem('synapsedocs-team', currentTeam);
        localStorage.setItem('synapsedocs-responsible', responsiblePerson);
        if (!showOnboarding) {
          localStorage.setItem('synapsedocs-onboarded', 'true');
        }
    } catch (error) {
        console.error("Failed to save to local storage", error);
    }
  }, [documents, currentTeam, showOnboarding, responsiblePerson]);

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

  // Effect to perform search when query changes
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults(null);
      return;
    }

    const tempDiv = document.createElement('div');
    const lowerCaseQuery = searchQuery.toLowerCase();

    const results = documents
      .map(doc => {
        tempDiv.innerHTML = doc.content;
        const plainTextContent = tempDiv.innerText || "";
        const lowerCaseTitle = doc.title.toLowerCase();
        const lowerCaseContent = plainTextContent.toLowerCase();
        
        const titleMatch = lowerCaseTitle.includes(lowerCaseQuery);
        const contentMatchIndex = lowerCaseContent.indexOf(lowerCaseQuery);

        if (titleMatch || contentMatchIndex > -1) {
            let snippet = '';
            if (contentMatchIndex > -1) {
                const start = Math.max(0, contentMatchIndex - 50);
                const end = Math.min(plainTextContent.length, contentMatchIndex + lowerCaseQuery.length + 80);
                snippet = plainTextContent.substring(start, end);
                if (start > 0) snippet = '...' + snippet;
                if (end < plainTextContent.length) snippet = snippet + '...';
                
                // Highlight the query in the snippet
                const regex = new RegExp(`(${searchQuery})`, 'gi');
                snippet = snippet.replace(regex, `<span class="bg-amber-400 text-gray-900 font-bold px-1 rounded-sm">$1</span>`);
            } else {
                snippet = plainTextContent.substring(0, 150) + '...';
            }
          return { doc, snippet };
        }
        return null;
      })
      .filter(Boolean); // Remove null entries
      
    setSearchResults(results);
  }, [searchQuery, documents]);


  const handleApiKeySet = (apiKey) => {
    localStorage.setItem('synapsedocs-apikey', apiKey);
    setApiKeyStatus('valid');
    if (initializeAiService(apiKey)) {
      setIsApiInitialized(true);
    } else {
        setApiKeyStatus('invalid');
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


  const handleCompleteOnboarding = (selectedTeam, name) => {
    setCurrentTeam(selectedTeam);
    setResponsiblePerson(name);
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

  return (
    React.createElement('div', { className: "bg-gray-900 min-h-screen text-white font-sans" },
      selectedDocument ? (
        React.createElement(DocumentPreview, {
          doc: selectedDocument,
          onBack: handleBackFromPreview,
          onUpdateContent: handleDocumentUpdate,
          isExiting: isExitingPreview,
        })
      ) : (
        React.createElement(React.Fragment, null,
          React.createElement(Header, { 
            currentTeam: currentTeam, 
            onTeamChange: (team) => {
              setCurrentTeam(team);
              setSearchQuery(''); // Clear search when changing teams
            }, 
            onOpenApiSettings: () => setIsApiSettingsModalOpen(true),
            onOpenResponsibleSettings: () => setIsResponsibleModalOpen(true),
            apiKeyStatus: apiKeyStatus,
            responsiblePerson: responsiblePerson
          }),
          React.createElement('div', { className: "bg-amber-900/50 text-amber-200 text-sm text-center p-2 border-b border-amber-800 flex items-center justify-center gap-2" },
            React.createElement(InfoIcon, null),
            "Seus documentos são salvos localmente no seu navegador. Para maior segurança, copie o conteúdo para o Google Docs ou outro local seguro."
          ),
          React.createElement('main', { className: "container mx-auto p-4 md:p-8 animate-fade-in" },
            React.createElement('div', { className: "relative mb-8" },
              React.createElement('input', {
                type: "text",
                value: searchQuery,
                onChange: (e) => setSearchQuery(e.target.value),
                placeholder: "Pesquisar em todos os documentos...",
                className: "w-full bg-gray-700/50 border border-gray-600 text-white rounded-lg p-3 pl-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              }),
              React.createElement('div', { className: "absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" },
                React.createElement(SearchIcon, { className: "text-gray-400" })
              )
            ),
            searchResults ? (
              React.createElement('div', null,
                React.createElement('h2', { className: "text-2xl font-bold mb-4" }, `Resultados da busca por "${searchQuery}"`),
                searchResults.length > 0 ? (
                  React.createElement('div', { className: "space-y-4" },
                    searchResults.map(({ doc, snippet }) => (
                      React.createElement('div', {
                        key: doc.id,
                        onClick: () => handleSelectDocument(doc),
                        className: "bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700/50"
                      },
                        React.createElement('h3', { className: "text-lg font-semibold text-indigo-400" }, doc.title),
                        React.createElement('p', { className: "text-sm text-gray-400 mb-2" }, `Equipe: ${doc.team}`),
                        React.createElement('p', {
                          className: "text-sm text-gray-300",
                          dangerouslySetInnerHTML: { __html: snippet }
                        })
                      )
                    ))
                  )
                ) : (
                  React.createElement('div', { className: "text-center py-16 px-6 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700" },
                    React.createElement('h3', { className: "text-xl font-semibold text-white mb-2" }, "Nenhum resultado encontrado"),
                    React.createElement('p', { className: "text-gray-400" }, `Não encontramos documentos que correspondam à sua busca.`)
                  )
                )
              )
            ) : (
              React.createElement('div', null,
                React.createElement('div', { className: "flex justify-between items-center mb-6" },
                  React.createElement('h2', { className: "text-3xl font-bold" }, `Documentos de ${currentTeam}`),
                  React.createElement('button', {
                    onClick: () => setIsModalOpen(true),
                    disabled: apiKeyStatus !== 'valid',
                    className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
                    "aria-label": "Criar novo documento",
                    title: apiKeyStatus !== 'valid' ? 'Configure uma chave de API válida para criar documentos.' : 'Criar novo documento'
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
                      disabled: apiKeyStatus !== 'valid',
                      className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 mx-auto transition-transform transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed",
                      title: apiKeyStatus !== 'valid' ? 'Configure uma chave de API válida para criar documentos.' : 'Criar primeiro documento'
                    },
                      React.createElement(PlusIcon, null),
                      React.createElement('span', null, "Criar Primeiro Documento")
                    )
                  )
                )
              )
            )
          )
        )
      ),

      isModalOpen && (
        React.createElement(CreationModal, {
          onClose: () => setIsModalOpen(false),
          onDocumentCreate: handleDocumentCreate,
          currentTeam: currentTeam,
          responsiblePerson: responsiblePerson
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
      
      React.createElement(ResponsibleModal, {
        isOpen: isResponsibleModalOpen,
        onClose: () => setIsResponsibleModalOpen(false),
        currentResponsible: responsiblePerson,
        onResponsibleSave: setResponsiblePerson
      }),

      React.createElement(ApiSettingsModal, {
        isOpen: isApiSettingsModalOpen,
        onClose: () => setIsApiSettingsModalOpen(false),
        onApiKeySet: handleApiKeySet
      })
    )
  );
};

export default App;