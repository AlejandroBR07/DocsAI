import React, { useState, useEffect } from 'react';
import Header from './components/Header.js';
import CreationModal from './components/CreationModal.js';
import DocumentPreview from './components/DocumentPreview.js';
import Onboarding from './components/Onboarding.js';
import { PlusIcon, DocumentIcon } from './components/Icons.js';
import { Team, Document } from './types.ts';
import { generateDocumentContent } from './services/geminiService.ts';

const App: React.FC = () => {
  const [currentTeam, setCurrentTeam] = useState<Team>(Team.Developers);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(true);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedDocs = localStorage.getItem('nexusdocs-documents');
      const savedTeam = localStorage.getItem('nexusdocs-team') as Team;
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

  const handleDocumentCreate = (title: string, content: string) => {
    const newDocument: Document = {
      id: new Date().toISOString(),
      title,
      content,
      team: currentTeam,
      createdAt: new Date().toLocaleString('pt-BR'),
    };
    setDocuments([newDocument, ...documents]);
    setSelectedDocument(newDocument); // Automatically open the new document
  };
  
  const handleCompleteOnboarding = (selectedTeam: Team) => {
    setCurrentTeam(selectedTeam);
    setShowOnboarding(false);
  }

  const filteredDocuments = documents.filter((doc) => doc.team === currentTeam);

  if (showOnboarding) {
    return (
        <div className="bg-gray-900 min-h-screen text-white font-sans">
            <Onboarding onComplete={handleCompleteOnboarding} />
        </div>
    );
  }

  if (selectedDocument) {
    return <DocumentPreview document={selectedDocument} onBack={() => setSelectedDocument(null)} />;
  }

  return (
    <div className="bg-gray-900 min-h-screen text-white font-sans">
      <Header currentTeam={currentTeam} onTeamChange={setCurrentTeam} />
      <main className="container mx-auto p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold">Documentos de {currentTeam}</h2>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 transition-transform transform hover:scale-105"
                aria-label="Criar novo documento"
              >
                <PlusIcon />
                <span>Novo Documento</span>
              </button>
            </div>

            {filteredDocuments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => setSelectedDocument(doc)}
                    className="bg-gray-800 p-6 rounded-lg shadow-lg cursor-pointer hover:bg-gray-700/50 hover:border-indigo-500 border-2 border-transparent transition-all"
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && setSelectedDocument(doc)}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <DocumentIcon />
                      <h3 className="text-xl font-semibold truncate">{doc.title}</h3>
                    </div>
                    <p className="text-sm text-gray-400">Criado em: {doc.createdAt}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-6 bg-gray-800/50 rounded-lg border-2 border-dashed border-gray-700">
                <h3 className="text-xl font-semibold text-white mb-2">Nenhum documento encontrado</h3>
                <p className="text-gray-400 mb-6">Comece criando um novo documento para a equipe de {currentTeam}.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2 mx-auto transition-transform transform hover:scale-105"
                >
                  <PlusIcon />
                  <span>Criar Primeiro Documento</span>
                </button>
              </div>
            )}
      </main>

      {isModalOpen && (
        <CreationModal
          onClose={() => setIsModalOpen(false)}
          onDocumentCreate={handleDocumentCreate}
          generateContent={generateDocumentContent}
          currentTeam={currentTeam}
        />
      )}
    </div>
  );
};

export default App;