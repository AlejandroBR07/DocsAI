import React, { useState, useEffect } from 'react';
import { LoadingSpinner, UploadIcon, CodeIcon, JsonIcon, BrainIcon, FileIcon, CloseIcon, CheckIcon, AlertTriangleIcon } from './Icons.js';
import { Team } from '../types.js';
import { DOCUMENT_STRUCTURES } from '../constants.js';

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const data = result.split(',')[1];
        resolve({ mimeType: file.type, data });
      } else {
        reject(new Error('Failed to read file as data URL string.'));
      }
    };
    reader.onerror = error => reject(error);
  });
};

const fileToText = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsText(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}


const CreationModal = ({ onClose, onDocumentCreate, generateContent, currentTeam }) => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [docType, setDocType] = useState('tech');
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingWithImages, setIsGeneratingWithImages] = useState(false);
  const [error, setError] = useState('');

  // Team specific state
  const [codeFiles, setCodeFiles] = useState([]);
  const [jsonFiles, setJsonFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [pastedCode, setPastedCode] = useState('');
  const [pastedJson, setPastedJson] = useState('');
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [isDragging, setIsDragging] = useState(false);


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

  useEffect(() => {
    if (pastedJson.trim() === '') {
      setIsJsonValid(true);
      return;
    }
    try {
      JSON.parse(pastedJson);
      setIsJsonValid(true);
    } catch (e) {
      setIsJsonValid(false);
    }
  }, [pastedJson]);

  const handleFileChange = async (e) => {
      const files = e.target.files;
      if (!files) return;

      try {
          const newFilesPromises = Array.from(files).map(file => 
            fileToText(file).then(content => ({ name: file.name, content }))
          );
          const newFiles = await Promise.all(newFilesPromises);

          if (currentTeam === Team.Developers) setCodeFiles(prev => [...prev, ...newFiles]);
          if (currentTeam === Team.Automations) setJsonFiles(prev => [...prev, ...newFiles]);
      } catch (err) {
          setError('Falha ao ler um ou mais arquivos.');
      }
  }

  const addImages = (files) => {
      if (!files) return;
      const imageFiles = Array.from(files)
        .filter(file => file.type.startsWith('image/'))
        .map(file => ({
            id: `${file.name}-${file.lastModified}`,
            file: file,
            preview: URL.createObjectURL(file)
        }));
      setUploadedImages(prev => [...prev, ...imageFiles]);
  }
  
  const removeImage = (idToRemove) => {
      setUploadedImages(prev => prev.filter(img => img.id !== idToRemove));
  }

  const handleImageChange = (e) => addImages(e.target.files);
  
  const handleImagePaste = (e) => addImages(e.clipboardData.files);

  const handleDragEvents = (e, isEntering) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(isEntering);
  };
  
  const handleDrop = (e) => {
    handleDragEvents(e, false);
    addImages(e.dataTransfer.files);
  };

  const canGenerate = () => !!projectName && !!description;

  const handleGenerate = async () => {
    if (!canGenerate()) {
      setError('Por favor, preencha o nome do projeto e a descrição.');
      return;
    }
    
    const hasImages = currentTeam === Team.UXUI && uploadedImages.length > 0;
    setIsGeneratingWithImages(hasImages);
    setIsLoading(true);
    setError('');

    try {
        const codeFromFiles = codeFiles.map(f => `--- Código do arquivo: ${f.name} ---\n${f.content}`).join('\n\n');
        const allCode = [pastedCode, codeFromFiles].filter(Boolean).join('\n\n');

        const jsonFromFiles = jsonFiles.map(f => `--- JSON do arquivo: ${f.name} ---\n${f.content}`).join('\n\n');
        const allJson = [pastedJson, jsonFromFiles].filter(Boolean).join('\n\n');

        let teamData = {
            code: allCode || undefined,
            databaseSchema,
            dependencies,
            json: allJson || undefined,
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
      
      if (hasImages) {
        teamData.images = await Promise.all(
          uploadedImages.map(img => fileToBase64(img.file))
        );
      }
      
      const params = {
        projectName,
        description,
        team: currentTeam,
        includeSupportSection: docType === 'tech_support',
        teamData,
      };

      const { title, content } = await generateContent(params);
      onDocumentCreate(title, content);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
    } finally {
      setIsLoading(false);
      setIsGeneratingWithImages(false);
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
  
  const FileChip = ({ file, onRemove }) => (
    React.createElement('div', { className: "bg-gray-700 p-2 rounded-md flex items-center justify-between" },
      React.createElement('div', { className: "flex items-center gap-2 text-gray-300" },
        React.createElement(FileIcon, null),
        React.createElement('span', { className: "text-sm font-mono truncate" }, file.name)
      ),
      React.createElement('button', { onClick: onRemove, className: "text-gray-400 hover:text-white p-1 rounded-full bg-gray-600 hover:bg-red-500" },
        React.createElement(CloseIcon, null)
      )
    )
  );

  const renderTeamSpecificInputs = () => {
      switch (currentTeam) {
          case Team.Developers:
              return (
                React.createElement(React.Fragment, null,
                  React.createElement('div', { className: "space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700" },
                    React.createElement('h3', { className: "flex items-center gap-2 text-sm font-medium text-indigo-300" }, React.createElement(CodeIcon, null), " Contexto de Código (Opcional)"),
                    React.createElement('div', { className: "space-y-2" },
                        codeFiles.map((file, index) => React.createElement(FileChip, { key: index, file: file, onRemove: () => setCodeFiles(prev => prev.filter((_, i) => i !== index)) }))
                    ),
                    React.createElement('textarea', { rows: 6, value: pastedCode, onChange: e => setPastedCode(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm", placeholder: "Cole o código fonte aqui..." }),
                    React.createElement('div', { className: "text-center text-sm text-gray-400" }, "e/ou"),
                    React.createElement('label', { className: "w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md cursor-pointer hover:bg-gray-600" },
                        React.createElement(UploadIcon, null),
                        React.createElement('span', null, "Enviar Arquivo(s) de Código"),
                        React.createElement('input', { type: "file", className: "hidden", multiple: true, onChange: handleFileChange, accept: ".js,.ts,.tsx,.py,.java,.cs,.go,.rs,.php,.html,.css,.scss" })
                    )
                  ),
                   React.createElement('div', { className: "space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700" },
                     React.createElement('h3', { className: "text-sm font-medium text-indigo-300" }, "Contexto Adicional (Opcional)"),
                     React.createElement('textarea', { rows: 3, value: databaseSchema, onChange: e => setDatabaseSchema(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Cole o esquema do banco de dados (SQL, Prisma, etc)..." }),
                     React.createElement('textarea', { rows: 3, value: dependencies, onChange: e => setDependencies(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Liste as dependências ou bibliotecas mais importantes..." })
                  )
                )
              )
          case Team.UXUI:
              return (
                React.createElement(React.Fragment, null,
                   React.createElement('div', { 
                      onPaste: handleImagePaste,
                      onDragEnter: (e) => handleDragEvents(e, true),
                      onDragLeave: (e) => handleDragEvents(e, false),
                      onDragOver: (e) => handleDragEvents(e, true),
                      onDrop: handleDrop,
                      className: "space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700"
                    },
                      React.createElement('h3', { className: "flex items-center gap-2 text-sm font-medium text-indigo-300" }, React.createElement(UploadIcon, null), " Imagens da Interface (Opcional)"),
                      React.createElement('label', { className: `w-full flex flex-col items-center justify-center gap-2 px-4 py-6 bg-gray-700 text-gray-300 rounded-md cursor-pointer hover:bg-gray-600 border-2 border-dashed transition-colors ${isDragging ? 'border-indigo-500 bg-gray-600' : 'border-gray-500'}` },
                          React.createElement(UploadIcon, null),
                          React.createElement('span', null, "Arraste e solte, cole, ou clique para enviar"),
                          React.createElement('input', { type: "file", multiple: true, className: "hidden", onChange: handleImageChange, accept: "image/*" })
                      ),
                      uploadedImages.length > 0 && (
                          React.createElement('div', { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2" },
                              uploadedImages.map((img) => (
                                React.createElement('div', { key: img.id, className: "relative group" },
                                  React.createElement('img', { src: img.preview, alt: "preview", className: "w-full h-20 object-cover rounded" }),
                                  React.createElement('button', { 
                                      onClick: () => removeImage(img.id), 
                                      className: "absolute top-1 right-1 text-white bg-red-600/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                                    }, 
                                    React.createElement(CloseIcon, null)
                                  )
                                )
                              ))
                          )
                      )
                  ),
                  React.createElement('div', { className: "space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700" },
                     React.createElement('h3', { className: "text-sm font-medium text-indigo-300" }, "Contexto Adicional (Opcional)"),
                     React.createElement('textarea', { rows: 3, value: personas, onChange: e => setPersonas(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Descreva as personas dos usuários..." }),
                     React.createElement('textarea', { rows: 3, value: userFlows, onChange: e => setUserFlows(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Descreva os principais fluxos de usuário em texto..." })
                  )
                )
              )
          case Team.Automations:
              return (
                React.createElement(React.Fragment, null,
                   React.createElement('div', { className: "space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700" },
                      React.createElement('h3', { className: "flex items-center gap-2 text-sm font-medium text-indigo-300" }, 
                          React.createElement(JsonIcon, null), 
                          " Estrutura da Automação (Opcional)",
                          pastedJson.trim() && (
                            isJsonValid 
                              ? React.createElement('span', { className: 'text-green-400', title: 'JSON Válido'}, React.createElement(CheckIcon, null))
                              : React.createElement('span', { className: 'text-red-400', title: 'JSON Inválido'}, React.createElement(AlertTriangleIcon, null))
                          )
                      ),
                       React.createElement('div', { className: "space-y-2" },
                        jsonFiles.map((file, index) => React.createElement(FileChip, { key: index, file: file, onRemove: () => setJsonFiles(prev => prev.filter((_, i) => i !== index)) }))
                       ),
                        React.createElement('textarea', { rows: 6, value: pastedJson, onChange: e => setPastedJson(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm", placeholder: "Cole o JSON dos nós (N8N) aqui..." }),
                        React.createElement('div', { className: "text-center text-sm text-gray-400" }, "e/ou"),
                         React.createElement('label', { className: "w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md cursor-pointer hover:bg-gray-600" },
                            React.createElement(UploadIcon, null),
                            React.createElement('span', null, "Enviar Arquivo(s) JSON"),
                            React.createElement('input', { type: "file", className: "hidden", multiple: true, onChange: handleFileChange, accept: ".json" })
                        )
                  ),
                   React.createElement('div', { className: "space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700" },
                     React.createElement('h3', { className: "text-sm font-medium text-indigo-300" }, "Contexto Adicional (Opcional)"),
                     React.createElement('textarea', { rows: 3, value: triggerInfo, onChange: e => setTriggerInfo(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Descreva o gatilho (trigger) da automação..." }),
                     React.createElement('textarea', { rows: 3, value: externalApis, onChange: e => setExternalApis(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Liste as APIs externas envolvidas..." })
                  )
                )
              )
          case Team.AI:
              return (
                   React.createElement('div', { className: "space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700" },
                       React.createElement('h3', { className: "flex items-center gap-2 text-sm font-medium text-indigo-300" }, React.createElement(BrainIcon, null), " Componentes da IA (Opcional)"),
                       React.createElement('textarea', { value: systemPrompt, onChange: e => setSystemPrompt(e.target.value), rows: 4, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "System Prompt: 'Você é um assistente prestativo que...' " }),
                       React.createElement('textarea', { value: workflow, onChange: e => setWorkflow(e.target.value), rows: 3, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Fluxo de Trabalho: '1. Usuário pergunta sobre o produto X. 2. O agente usa a ferramenta Y para buscar detalhes...'" }),
                       React.createElement('textarea', { value: tools, onChange: e => setTools(e.target.value), rows: 3, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Ferramentas: 'getProductInfo(productId: string): Product - Retorna informações de um produto.'" }),
                       React.createElement('textarea', { value: exampleIO, onChange: e => setExampleIO(e.target.value), rows: 3, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Exemplos I/O: 'Entrada: Qual o preço do item X? Saída: { name: X, price: 19.99 }'" }),
                       React.createElement('textarea', { value: guardrails, onChange: e => setGuardrails(e.target.value), rows: 3, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Guardrails: 'Não responda a perguntas sobre tópicos sensíveis. Se o usuário insistir, encerre a conversa.'" })
                  )
              )
          default:
              return null;
      }
  }


  return (
    React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in", onClick: onClose, role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title" },
      React.createElement('div', { className: "bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl transform transition-all max-h-[90vh] flex flex-col animate-slide-up", onClick: (e) => e.stopPropagation() },
        React.createElement('div', { className: "p-6 border-b border-gray-700" },
          React.createElement('h2', { id: "modal-title", className: "text-2xl font-bold text-white" }, "Criar Documento para ", React.createElement('span', { className: "text-indigo-400" }, currentTeam))
        ),
        React.createElement('div', { className: "p-6 space-y-4 overflow-y-auto" },
            // Common Inputs
            React.createElement('div', null,
              React.createElement('label', { htmlFor: "project-name", className: "block text-sm font-medium text-gray-300 mb-2" }, "Nome do Projeto"),
              React.createElement('input', { type: "text", id: "project-name", value: projectName, onChange: (e) => setProjectName(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Ex: Novo Sistema de Autenticação" })
            ),
             React.createElement('div', null,
              React.createElement('label', { htmlFor: "description", className: "block text-sm font-medium text-gray-300 mb-2" }, "Descrição Breve ou Objetivo"),
              React.createElement('textarea', { id: "description", rows: 3, value: description, onChange: (e) => setDescription(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Descreva o objetivo principal do projeto ou da funcionalidade..." })
            ),
             React.createElement('div', null,
              React.createElement('label', { className: "block text-sm font-medium text-gray-300 mb-2" }, "Tipo de Documentação"),
              React.createElement('div', { className: "flex gap-4" },
                 React.createElement('label', { className: "flex items-center space-x-2 text-gray-300" }, React.createElement('input', { type: "radio", name: "docType", value: "tech", checked: docType === 'tech', onChange: () => setDocType('tech'), className: "form-radio text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500" }), React.createElement('span', null, "Técnica (para equipe)")),
                React.createElement('label', { className: "flex items-center space-x-2 text-gray-300" }, React.createElement('input', { type: "radio", name: "docType", value: "tech_support", checked: docType === 'tech_support', onChange: () => setDocType('tech_support'), className: "form-radio text-indigo-600 bg-gray-700 border-gray-600 focus:ring-indigo-500" }), React.createElement('span', null, "Técnica + Suporte (para usuário)"))
              )
            ),
             React.createElement('hr', { className: "border-gray-600" }),
            // Team Specific Inputs
            renderTeamSpecificInputs()
        ),

          error && React.createElement('p', { className: "text-red-400 text-sm text-center px-6 pb-4" }, error),

          React.createElement('div', { className: "flex flex-col sm:flex-row justify-between items-center mt-auto p-6 bg-gray-800/50 border-t border-gray-700 gap-4" },
            React.createElement('button', {
                onClick: handleUseBlankTemplate,
                disabled: !projectName || isLoading,
                className: "w-full sm:w-auto py-2 px-4 rounded-md text-indigo-400 border border-indigo-500 hover:bg-indigo-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              },
                "Usar Template Vazio"
            ),
            React.createElement('div', { className: "w-full sm:w-auto flex flex-col sm:flex-row-reverse gap-4" },
                React.createElement('button', {
                    onClick: handleGenerate,
                    disabled: !canGenerate() || isLoading || !isJsonValid,
                    className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed min-w-[150px]"
                  },
                  isLoading 
                    ? React.createElement(React.Fragment, null, 
                        React.createElement(LoadingSpinner, null), 
                        React.createElement('span', { className: "ml-2" }, isGeneratingWithImages ? "Analisando imagens..." : "Gerando...")
                      ) 
                    : 'Gerar com IA'
                ),
                 React.createElement('button', { onClick: onClose, className: "w-full sm:w-auto py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 transition-colors" }, "Cancelar")
            )
          )
      )
    )
  );
};

export default CreationModal;