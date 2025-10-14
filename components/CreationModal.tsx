import React, { useState, ClipboardEvent } from 'react';
import { LoadingSpinner, UploadIcon, CodeIcon, JsonIcon, BrainIcon, FileIcon, CloseIcon } from './Icons.js';
import { Team } from '../types.ts';
import { DOCUMENT_STRUCTURES } from '../constants.ts';
import { GenerationParams } from '../services/geminiService.ts';

interface CreationModalProps {
  onClose: () => void;
  onDocumentCreate: (title: string, content: string) => void;
  generateContent: (params: GenerationParams) => Promise<string>;
  currentTeam: Team;
}

const fileToBase64 = (file: File): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const data = result.split(',')[1];
      resolve({ mimeType: file.type, data });
    };
    reader.onerror = error => reject(error);
  });
};

const fileToText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
}


const CreationModal: React.FC<CreationModalProps> = ({ onClose, onDocumentCreate, generateContent, currentTeam }) => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [docType, setDocType] = useState<'tech' | 'tech_support'>('tech');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Team specific state
  const [codeFile, setCodeFile] = useState<{name: string, content: string} | null>(null);
  const [jsonFile, setJsonFile] = useState<{name: string, content: string} | null>(null);
  const [uploadedImages, setUploadedImages] = useState<{file: File, preview: string}[]>([]);

  // Team AI
  const [systemPrompt, setSystemPrompt] = useState('');
  const [workflow, setWorkflow] = useState('');
  const [tools, setTools] = useState('');
  const [exampleIO, setExampleIO] = useState('');
  const [guardrails, setGuardrails] = useState('');
  
  // Team Devs
  const [databaseSchema, setDatabaseSchema] = useState('');
  const [dependencies, setDependencies] = useState('');

  // Team UX/UI
  const [personas, setPersonas] = useState('');
  const [userFlows, setUserFlows] = useState('');

  // Team Automations
  const [triggerInfo, setTriggerInfo] = useState('');
  const [externalApis, setExternalApis] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      try {
          const textContent = await fileToText(file);
          const newFile = { name: file.name, content: textContent };
          if (currentTeam === Team.Developers) setCodeFile(newFile);
          if (currentTeam === Team.Automations) setJsonFile(newFile);
      } catch (err) {
          setError('Falha ao ler o arquivo.');
      }
  }
  
  const handleCodePaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCodeFile({ name: 'código_colado.txt', content: e.target.value });
  }

  const handleJsonPaste = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setJsonFile({ name: 'automacao_colada.json', content: e.target.value });
  }

  const addImages = (files: FileList | null) => {
      if (!files) return;
      const imageFiles = Array.from(files)
        .filter(file => file.type.startsWith('image/'))
        .map(file => ({
            file: file,
            preview: URL.createObjectURL(file)
        }));
      setUploadedImages(prev => [...prev, ...imageFiles]);
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => addImages(e.target.files);
  
  const handleImagePaste = (e: ClipboardEvent<HTMLDivElement>) => {
      addImages(e.clipboardData.files);
  }


  const canGenerate = () => !!projectName && !!description;

  const handleGenerate = async () => {
    if (!canGenerate()) {
      setError('Por favor, preencha o nome do projeto e a descrição.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const teamData: GenerationParams['teamData'] = {
        code: codeFile?.content,
        databaseSchema,
        dependencies,
        json: jsonFile?.content,
        triggerInfo,
        externalApis,
        systemPrompt,
        workflow,
        tools,
        exampleIO,
        guardrails,
        personas,
        userFlows,
      };
      
      if (currentTeam === Team.UXUI && uploadedImages.length > 0) {
        teamData.images = await Promise.all(
          uploadedImages.map(img => fileToBase64(img.file))
        );
      }
      
      const params: GenerationParams = {
        projectName,
        description,
        team: currentTeam,
        includeSupportSection: docType === 'tech_support',
        teamData,
      };

      const content = await generateContent(params);
      onDocumentCreate(projectName, content);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUseBlankTemplate = () => {
    if (!projectName) {
      setError('Por favor, forneça um nome para o projeto.');
      return;
    }
    const blankContent = DOCUMENT_STRUCTURES[currentTeam]
        .replace(/NOME_DO_PROJETO/g, projectName)
        .replace(/\[(.*?)\]/g, '...')
        .replace(/\n/g, '<br />');

    onDocumentCreate(projectName, blankContent);
    onClose();
  }
  
  const FileChip = ({ file, onRemove }: { file: {name: string}, onRemove: () => void }) => (
    <div className="bg-gray-700 p-2 rounded-md flex items-center justify-between">
      <div className="flex items-center gap-2 text-gray-300">
        <FileIcon />
        <span className="text-sm font-mono truncate">{file.name}</span>
      </div>
      <button onClick={onRemove} className="text-gray-400 hover:text-white p-1 rounded-full bg-gray-600 hover:bg-red-500">
        <CloseIcon />
      </button>
    </div>
  );

  const renderTeamSpecificInputs = () => {
      switch (currentTeam) {
          case Team.Developers:
              return (
                <>
                  <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                    <h3 className="flex items-center gap-2 text-sm font-medium text-indigo-300"><CodeIcon /> Contexto de Código (Opcional)</h3>
                    {codeFile ? <FileChip file={codeFile} onRemove={() => setCodeFile(null)} /> : (
                      <>
                        <textarea rows={6} onChange={handleCodePaste} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm" placeholder="Cole o código fonte aqui..."></textarea>
                        <div className="text-center text-sm text-gray-400">ou</div>
                        <label className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md cursor-pointer hover:bg-gray-600">
                            <UploadIcon />
                            <span>Enviar Arquivo de Código</span>
                            <input type="file" className="hidden" onChange={handleFileChange} accept=".js,.ts,.tsx,.py,.java,.cs,.go,.rs,.php,.html,.css,.scss" />
                        </label>
                      </>
                    )}
                  </div>
                   <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                     <h3 className="text-sm font-medium text-indigo-300">Contexto Adicional (Opcional)</h3>
                     <textarea rows={3} value={databaseSchema} onChange={e => setDatabaseSchema(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Cole o esquema do banco de dados (SQL, Prisma, etc)..."></textarea>
                     <textarea rows={3} value={dependencies} onChange={e => setDependencies(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Liste as dependências ou bibliotecas mais importantes..."></textarea>
                  </div>
                </>
              )
          case Team.UXUI:
              return (
                <>
                   <div onPaste={handleImagePaste} className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <h3 className="flex items-center gap-2 text-sm font-medium text-indigo-300"><UploadIcon /> Imagens da Interface (Opcional)</h3>
                      <label className="w-full flex flex-col items-center justify-center gap-2 px-4 py-6 bg-gray-700 text-gray-300 rounded-md cursor-pointer hover:bg-gray-600 border-2 border-dashed border-gray-500">
                          <UploadIcon />
                          <span>Clique para enviar ou cole imagens aqui</span>
                          <input type="file" multiple className="hidden" onChange={handleImageChange} accept="image/*" />
                      </label>
                      {uploadedImages.length > 0 && (
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                              {uploadedImages.map((img, index) => <img key={index} src={img.preview} alt="preview" className="w-full h-20 object-cover rounded" />)}
                          </div>
                      )}
                  </div>
                  <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                     <h3 className="text-sm font-medium text-indigo-300">Contexto Adicional (Opcional)</h3>
                     <textarea rows={3} value={personas} onChange={e => setPersonas(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Descreva as personas dos usuários..."></textarea>
                     <textarea rows={3} value={userFlows} onChange={e => setUserFlows(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Descreva os principais fluxos de usuário em texto..."></textarea>
                  </div>
                </>
              )
          case Team.Automations:
              return (
                <>
                   <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                      <h3 className="flex items-center gap-2 text-sm font-medium text-indigo-300"><JsonIcon /> Estrutura da Automação (Opcional)</h3>
                       {jsonFile ? <FileChip file={jsonFile} onRemove={() => setJsonFile(null)} /> : (
                        <>
                          <textarea rows={6} onChange={handleJsonPaste} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm" placeholder="Cole o JSON dos nós (N8N) aqui..."></textarea>
                          <div className="text-center text-sm text-gray-400">ou</div>
                           <label className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md cursor-pointer hover:bg-gray-600">
                              <UploadIcon />
                              <span>Enviar Arquivo JSON</span>
                              <input type="file" className="hidden" onChange={handleFileChange} accept=".json" />
                          </label>
                        </>
                       )}
                  </div>
                   <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                     <h3 className="text-sm font-medium text-indigo-300">Contexto Adicional (Opcional)</h3>
                     <textarea rows={3} value={triggerInfo} onChange={e => setTriggerInfo(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Descreva o gatilho (trigger) da automação..."></textarea>
                     <textarea rows={3} value={externalApis} onChange={e => setExternalApis(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Liste as APIs externas envolvidas..."></textarea>
                  </div>
                </>
              )
          case Team.AI:
              return (
                   <div className="space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                       <h3 className="flex items-center gap-2 text-sm font-medium text-indigo-300"><BrainIcon /> Componentes da IA (Opcional)</h3>
                       <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={4} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="System Prompt..."></textarea>
                       <textarea value={workflow} onChange={e => setWorkflow(e.target.value)} rows={3} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Fluxo de Trabalho / Conversa..."></textarea>
                       <textarea value={tools} onChange={e => setTools(e.target.value)} rows={3} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ferramentas (Tools)..."></textarea>
                       <textarea value={exampleIO} onChange={e => setExampleIO(e.target.value)} rows={3} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Exemplos de Entrada/Saída..."></textarea>
                       <textarea value={guardrails} onChange={e => setGuardrails(e.target.value)} rows={3} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Guardrails e Regras de Segurança..."></textarea>
                  </div>
              )
          default:
              return null;
      }
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl transform transition-all max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-700">
          <h2 id="modal-title" className="text-2xl font-bold text-white">Criar Documento para <span className="text-indigo-400">{currentTeam}</span></h2>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
            {/* Common Inputs */}
            <div>
              <label htmlFor="project-name" className="block text-sm font-medium text-gray-300 mb-2">Nome do Projeto</label>
              <input type="text" id="project-name" value={projectName} onChange={(e) => setProjectName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Ex: Novo Sistema de Autenticação" />
            </div>
             <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">Descrição Breve ou Objetivo</label>
              <textarea id="description" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Descreva o objetivo principal do projeto ou da funcionalidade..."></textarea>
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Tipo de Documentação</label>
              <div className="flex gap-4">
                 <label className="flex items-center space-x-2 text-gray-300"><input type="radio" name="docType" value="tech" checked={docType === 'tech'} onChange={() => setDocType('tech')} className="form-radio text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500" /><span>Técnica (para equipe)</span></label>
                <label className="flex items-center space-x-2 text-gray-300"><input type="radio" name="docType" value="tech_support" checked={docType === 'tech_support'} onChange={() => setDocType('tech_support')} className="form-radio text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500" /><span>Técnica + Suporte (para usuário)</span></label>
              </div>
            </div>
             <hr className="border-gray-600" />
            {/* Team Specific Inputs */}
            {renderTeamSpecificInputs()}
        </div>

          {error && <p className="text-red-400 text-sm text-center px-6 pb-4">{error}</p>}

          <div className="flex flex-col sm:flex-row justify-between items-center mt-auto p-6 bg-gray-800/50 border-t border-gray-700 gap-4">
            <button 
                onClick={handleUseBlankTemplate}
                disabled={!projectName || isLoading}
                className="w-full sm:w-auto py-2 px-4 rounded-md text-indigo-400 border border-indigo-500 hover:bg-indigo-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Usar Template Vazio
            </button>
            <div className="w-full sm:w-auto flex flex-col sm:flex-row-reverse gap-4">
                <button
                onClick={handleGenerate}
                disabled={!canGenerate() || isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
                >
                {isLoading ? <><LoadingSpinner /><span className="ml-2">Gerando...</span></> : 'Gerar com IA'}
                </button>
                 <button onClick={onClose} className="w-full sm:w-auto py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 transition-colors">Cancelar</button>
            </div>
          </div>
      </div>
    </div>
  );
};

export default CreationModal;