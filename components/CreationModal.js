import React, { useState, useEffect, useRef } from 'react';
import { LoadingSpinner, UploadIcon, CodeIcon, JsonIcon, BrainIcon, FileIcon, CloseIcon, CheckIcon, AlertTriangleIcon, TemplateIcon, FolderIcon, InfoIcon, ChevronRightIcon } from './Icons.js';
import { Team } from '../types.js';
import { TEMPLATES } from '../constants.js';

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

const shuffleArray = (array) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const LOADING_MESSAGES = {
  general: [
    'Sintetizando informações...',
    'Estruturando o documento...',
    'Estabelecendo o contexto...',
    'Analisando os requisitos...',
    'Dando vida às suas ideias...',
    'Organizando o conhecimento...',
    'Construindo a estrutura...',
    'Aplicando melhores práticas...',
  ],
  code: [
    'Analisando a estrutura do código...',
    'Identificando componentes...',
    'Interpretando a lógica do código...',
    'Mapeando os endpoints da API...',
    'Rastreando dependências...',
    'Construindo o grafo de chamadas...',
    'Verificando esquema do BD...',
    'Extraindo comentários do código...',
  ],
  images: [
    'Processando os dados das imagens...',
    'Analisando elementos da UI...',
    'Identificando cores e fontes...',
    'Analisando fluxos visuais...',
    'Mapeando a jornada visual...',
    'Criando hierarquia visual...',
    'Inferindo intenções do design...',
  ],
  json: [
    'Processando lógica do JSON...',
    'Mapeando os nós da automação...',
    'Validando o fluxo de dados...',
    'Simulando a automação...',
    'Analisando lógica condicional...',
    'Identificando APIs externas...',
  ],
  ai: [
    'Analisando o System Prompt...',
    'Mapeando as ferramentas (Tools)...',
    'Interpretando as guardrails...',
    'Analisando fluxo da conversa...',
    'Criando cenários de teste...',
    'Avaliando exemplos de I/O...',
    'Verificando as guardrails de segurança...',
  ],
  writing: [
    'Rascunhando a introdução...',
    'Elaborando as seções técnicas...',
    'Detalhando a arquitetura...',
    'Adicionando exemplos práticos...',
    'Garantindo a consistência...',
    'Escrevendo os guias de uso...',
    'Revisando clareza e coesão...',
    'Gerando a seção de suporte...',
    'Criando exemplos de código...',
  ],
  finalizing: [
    'Finalizando a geração...',
    'Aplicando formatação final...',
    'Otimizando a legibilidade...',
    'Polindo os últimos detalhes...',
    'Preparando para a sua revisão...',
    'Verificação final...',
  ],
};

// Helper function to process directory handle
async function processDirectory(directoryHandle, path = '') {
    const files = [];
    for await (const entry of directoryHandle.values()) {
        const currentPath = path ? `${path}/${entry.name}` : entry.name;
        if (entry.kind === 'file') {
            try {
              const file = await entry.getFile();
              const content = await file.text();
              files.push({ path: currentPath, content });
            } catch (e) {
              console.warn(`Não foi possível ler o arquivo: ${currentPath}`, e);
            }
        } else if (entry.kind === 'directory') {
            files.push(...await processDirectory(entry, currentPath));
        }
    }
    return files;
}

const buildFileTree = (files) => {
  const root = { children: [] }; 

  for (const file of files) {
    const parts = file.path.split('/');
    let currentNode = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const isFile = i === parts.length - 1;

      let childNode = currentNode.children.find(child => child.name === part);

      if (!childNode) {
        childNode = {
          name: part,
          path: parts.slice(0, i + 1).join('/'),
          type: isFile ? 'file' : 'folder',
          children: isFile ? undefined : [],
        };
        currentNode.children.push(childNode);
      }
      currentNode = childNode;
    }
  }
  const sortNodes = (nodes) => {
      nodes.sort((a, b) => {
          if (a.type === 'folder' && b.type === 'file') return -1;
          if (a.type === 'file' && b.type === 'folder') return 1;
          return a.name.localeCompare(b.name);
      });
      nodes.forEach(node => {
          if (node.type === 'folder') {
              sortNodes(node.children);
          }
      });
  };
  sortNodes(root.children);
  return root.children;
};

const FileTree = ({ nodes }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  useEffect(() => {
    if (nodes.length === 1 && nodes[0].type === 'folder') {
        setExpandedFolders(new Set([nodes[0].path]));
    }
  }, [nodes]);

  const toggleFolder = (path) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const renderNode = (node, level = 0) => {
    const isExpanded = expandedFolders.has(node.path);

    if (node.type === 'folder') {
      return React.createElement('div', { key: node.path },
        React.createElement('div', {
          className: "flex items-center p-1 rounded-md hover:bg-gray-700/50 cursor-pointer",
          style: { paddingLeft: `${level * 16}px` },
          onClick: () => toggleFolder(node.path)
        },
          React.createElement(ChevronRightIcon, { className: `h-4 w-4 mr-1 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}` }),
          React.createElement(FolderIcon, { className: "h-5 w-5 mr-2 text-indigo-400 flex-shrink-0" }),
          React.createElement('span', { className: "text-gray-300 truncate" }, node.name)
        ),
        isExpanded && React.createElement('div', null,
          node.children.map(child => renderNode(child, level + 1))
        )
      );
    }

    return React.createElement('div', {
      key: node.path,
      className: "flex items-center p-1",
      style: { paddingLeft: `${level * 16}px` }
    },
      React.createElement('div', { className: "w-4 mr-1 flex-shrink-0" }),
      React.createElement(FileIcon, { className: "h-5 w-5 mr-2 text-gray-400 flex-shrink-0" }),
      React.createElement('span', { className: "text-gray-300 truncate" }, node.name)
    );
  };

  return React.createElement('div', { className: "max-h-48 overflow-y-auto bg-gray-800 p-2 rounded-md space-y-px font-mono text-sm" },
    nodes.map(node => renderNode(node, 0))
  );
};


const CreationModal = ({ onClose, onDocumentCreate, generateContent, currentTeam }) => {
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [includeSupportSection, setIncludeSupportSection] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Iniciando...');
  const [displayedLoadingMessage, setDisplayedLoadingMessage] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [generationResult, setGenerationResult] = useState(null);

  // Team specific state
  const [jsonFiles, setJsonFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [pastedJson, setPastedJson] = useState('');
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [jsonErrorMessage, setJsonErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Team Devs
  const [folderFiles, setFolderFiles] = useState([]);
  const [fileTreeData, setFileTreeData] = useState([]);
  const [uploadedCodeFiles, setUploadedCodeFiles] = useState([]);
  const [pastedCode, setPastedCode] = useState('');
  const [databaseSchema, setDatabaseSchema] = useState('');
  const [dependencies, setDependencies] = useState('');

  // Team AI
  const [systemPrompt, setSystemPrompt] = useState('');
  const [workflow, setWorkflow] = useState('');
  const [tools, setTools] = useState('');
  const [exampleIO, setExampleIO] = useState('');
  const [guardrails, setGuardrails] = useState('');
  
  // Team UX/UI
  const [personas, setPersonas] = useState('');
  const [userFlows, setUserFlows] = useState('');

  // Team Automations
  const [triggerInfo, setTriggerInfo] = useState('');
  const [externalApis, setExternalApis] = useState('');
  
  const isCancelled = useRef(false);
  const [activeTemplate, setActiveTemplate] = useState(null);

  // Handle cancellation
  useEffect(() => {
    return () => {
      isCancelled.current = true;
    };
  }, []);

  useEffect(() => {
    if (pastedJson.trim() === '') {
      setIsJsonValid(true);
      setJsonErrorMessage('');
      return;
    }
    try {
      JSON.parse(pastedJson);
      setIsJsonValid(true);
      setJsonErrorMessage('');
    } catch (e) {
      setIsJsonValid(false);
      setJsonErrorMessage(`Erro no JSON: ${e.message}`);
    }
  }, [pastedJson]);

  // Effect for typing animation
  useEffect(() => {
    if (!isLoading) {
      setDisplayedLoadingMessage('');
      return;
    }

    let currentText = '';
    let charIndex = 0;
    // Reset message before starting to type
    setDisplayedLoadingMessage('');

    const intervalId = setInterval(() => {
      if (charIndex < loadingMessage.length) {
        currentText += loadingMessage.charAt(charIndex);
        setDisplayedLoadingMessage(currentText);
        charIndex++;
      } else {
        clearInterval(intervalId);
      }
    }, 50); // Typing speed in ms

    return () => clearInterval(intervalId);
  }, [loadingMessage, isLoading]);

  // Loading message and progress effect
  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setLoadingMessage('Iniciando...');
      return;
    }

    isCancelled.current = false;
    let timeoutId;

    const hasImages = [Team.UXUI, Team.Automations, Team.AI].includes(currentTeam) && uploadedImages.length > 0;
    const hasCode = currentTeam === Team.Developers && (folderFiles.length > 0 || uploadedCodeFiles.length > 0 || pastedCode.length > 0);
    const hasJson = currentTeam === Team.Automations && (pastedJson.length > 0 || jsonFiles.length > 0);
    const hasAiContext = currentTeam === Team.AI && (systemPrompt || workflow || tools || exampleIO || guardrails);

    const stages = [{
        messages: ['Conectando com o modelo de IA...'],
        duration: 2500,
        progressTarget: 10
    }];

    let contextMessages = [];
    if (hasCode) contextMessages.push(...LOADING_MESSAGES.code);
    if (hasImages) contextMessages.push(...LOADING_MESSAGES.images);
    if (hasJson) contextMessages.push(...LOADING_MESSAGES.json);
    if (hasAiContext) contextMessages.push(...LOADING_MESSAGES.ai);
    if (contextMessages.length === 0) {
      contextMessages.push(...LOADING_MESSAGES.general);
    }
    
    stages.push({
      messages: shuffleArray(contextMessages).slice(0, 3), // Pick 3 random context messages
      duration: 8000,
      progressTarget: 45
    });

    stages.push({
      messages: shuffleArray(LOADING_MESSAGES.writing).slice(0, 4), // Pick 4 random writing messages
      duration: 12000,
      progressTarget: 90
    });

    stages.push({
      messages: shuffleArray(LOADING_MESSAGES.finalizing).slice(0, 2),
      duration: 5000,
      progressTarget: 95
    });
    
    let currentStageIndex = 0;
    let messageInStageIndex = 0;

    const runStages = () => {
        if (isCancelled.current || currentStageIndex >= stages.length) {
            return;
        }

        const stage = stages[currentStageIndex];
        const message = stage.messages[messageInStageIndex];
        setLoadingMessage(message);

        const progressStartOfStage = currentStageIndex > 0 ? stages[currentStageIndex - 1].progressTarget : 0;
        const progressTargetForStage = stage.progressTarget;
        const messagesInStage = stage.messages.length;
        const progressIncrement = (progressTargetForStage - progressStartOfStage) / messagesInStage;
        
        const currentProgress = progressStartOfStage + (progressIncrement * (messageInStageIndex + 1));
        setProgress(currentProgress);

        messageInStageIndex++;
        if (messageInStageIndex >= stage.messages.length) {
            currentStageIndex++;
            messageInStageIndex = 0;
        }

        timeoutId = setTimeout(runStages, stage.duration / stage.messages.length);
    };

    runStages();

    return () => {
      isCancelled.current = true;
      clearTimeout(timeoutId);
    };
  }, [isLoading]);

  // Effect to finish progress bar when generation is complete
  useEffect(() => {
    if (generationResult && !isCancelled.current) {
      setLoadingMessage('Documento pronto!');
      setProgress(100);
    }
  }, [generationResult]);
  
  // Effect to trigger document creation after animation and generation are complete
  useEffect(() => {
    if (progress >= 100 && generationResult && !isCancelled.current) {
        onDocumentCreate(generationResult.title, generationResult.content);
        onClose();
    }
  }, [progress, generationResult, onDocumentCreate, onClose]);


  const handleJsonFileChange = async (e) => {
      const files = e.target.files;
      if (!files) return;

      try {
          const newFilesPromises = Array.from(files).map(file => 
            fileToText(file).then(content => ({ name: file.name, content }))
          );
          const newFiles = await Promise.all(newFilesPromises);

          if (currentTeam === Team.Automations) setJsonFiles(prev => [...prev, ...newFiles]);
      } catch (err) {
          setError('Falha ao ler um ou mais arquivos.');
      }
  }

  const handleCodeFileChange = async (e) => {
    const files = e.target.files;
    if (!files) return;
     try {
        const newFilesPromises = Array.from(files).map(file => 
          fileToText(file).then(content => ({ name: file.name, content }))
        );
        const newFiles = await Promise.all(newFilesPromises);
        setUploadedCodeFiles(prev => [...prev, ...newFiles]);
     } catch (err) {
        setError('Falha ao ler um ou mais arquivos de código.');
     }
  };


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

  const handleSelectFolder = async () => {
    setError('');

    const hasAistudioPicker = window.aistudio && typeof window.aistudio.showDirectoryPicker === 'function';
    const hasNativePicker = 'showDirectoryPicker' in window;
    
    try {
        let directoryHandle = null;
        if (hasAistudioPicker) {
            directoryHandle = await window.aistudio.showDirectoryPicker();
        } else if (hasNativePicker) {
            directoryHandle = await window.showDirectoryPicker();
        } else {
            setError("Seu navegador não suporta a seleção de pastas. Por favor, use um navegador como Chrome ou Edge.");
            return;
        }

        if (!directoryHandle) {
            return; // User cancelled
        }

        setLoadingMessage('Processando pasta...');
        const files = await processDirectory(directoryHandle);
        const codeFileExtensions = ['.js', '.ts', '.tsx', '.py', '.java', '.cs', '.go', '.rs', '.php', '.html', '.css', '.scss', '.json', '.md', 'Dockerfile', '.yml', '.yaml'];
        const filteredFiles = files.filter(file => codeFileExtensions.some(ext => file.path.endsWith(ext)));
        
        setFolderFiles(filteredFiles);
        setFileTreeData(buildFileTree(filteredFiles));

    } catch (err) {
        if (err.name === 'AbortError') {
            return;
        }
        console.error("Erro ao selecionar a pasta:", err);
        
        if (err.name === 'SecurityError' || (err.message && err.message.toLowerCase().includes("cross origin"))) {
            setError("A seleção de pastas é bloqueada neste ambiente por segurança (cross-origin). Por favor, use a opção 'Enviar Arquivos Avulsos' como alternativa.");
        } else {
            setError("Não foi possível acessar a pasta. Verifique as permissões do navegador ou tente novamente.");
        }
    } finally {
        setLoadingMessage('');
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate() || isLoading) {
      setError('Por favor, preencha o nome do projeto e a descrição.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    setGenerationResult(null);
    isCancelled.current = false;

    try {
        const jsonFromFiles = jsonFiles.map(f => `--- JSON do arquivo: ${f.name} ---\n${f.content}`).join('\n\n');
        const allJson = [pastedJson, jsonFromFiles].filter(Boolean).join('\n\n');

        let teamData = {
            folderFiles: folderFiles.length > 0 ? folderFiles : undefined,
            uploadedCodeFiles: uploadedCodeFiles.length > 0 ? uploadedCodeFiles : undefined,
            pastedCode: pastedCode || undefined,
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
      
      const teamsWithImageUpload = [Team.UXUI, Team.Automations, Team.AI];
      if (teamsWithImageUpload.includes(currentTeam) && uploadedImages.length > 0) {
        teamData.images = await Promise.all(
          uploadedImages.map(img => fileToBase64(img.file))
        );
      }
      
      const params = {
        projectName,
        description,
        team: currentTeam,
        includeSupportSection,
        teamData,
      };

      const result = await generateContent(params);
      
      if (!isCancelled.current) {
        setGenerationResult(result);
      }

    } catch (err) {
      if (!isCancelled.current) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        setIsLoading(false); // Stop loading on error
      }
    }
  };

  const handleSelectTemplate = (template) => {
    setActiveTemplate(template.name);
    // Set state based on template content, using empty string as fallback
    setDescription(template.content.description || '');
    setPastedCode(template.content.pastedCode || '');
    setDatabaseSchema(template.content.databaseSchema || '');
    setDependencies(template.content.dependencies || '');
    setPersonas(template.content.personas || '');
    setUserFlows(template.content.userFlows || '');
    setPastedJson(template.content.pastedJson || '');
    setTriggerInfo(template.content.triggerInfo || '');
    setExternalApis(template.content.externalApis || '');
    setSystemPrompt(template.content.systemPrompt || '');
    setWorkflow(template.content.workflow || '');
    setTools(template.content.tools || '');
    setExampleIO(template.content.exampleIO || '');
    setGuardrails(template.content.guardrails || '');
    // Reset folder/file inputs when using a template
    setFolderFiles([]);
    setFileTreeData([]);
    setUploadedCodeFiles([]);
    setUploadedImages([]);
  };

  const FileChip = ({ file, onRemove, isPath = false }) => (
    React.createElement('div', { className: "bg-gray-700 p-2 rounded-md flex items-center justify-between text-gray-300" },
      React.createElement('div', { className: "flex items-center gap-2 min-w-0" },
        React.createElement(FileIcon, null),
        React.createElement('span', { className: "text-sm font-mono truncate", title: isPath ? file.path : file.name }, isPath ? file.path : file.name)
      ),
      onRemove && React.createElement('button', { onClick: onRemove, className: "text-gray-400 hover:text-white p-1 rounded-full bg-gray-600 hover:bg-red-500 ml-2 flex-shrink-0" },
        React.createElement(CloseIcon, null)
      )
    )
  );
  
  const ImageUploader = () => (
    React.createElement('div', { 
        onPaste: handleImagePaste,
        onDragEnter: (e) => handleDragEvents(e, true),
        onDragLeave: (e) => handleDragEvents(e, false),
        onDragOver: (e) => handleDragEvents(e, true),
        onDrop: handleDrop,
        className: "space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700"
      },
        React.createElement('h3', { className: "flex items-center gap-2 text-sm font-medium text-indigo-300" }, React.createElement(UploadIcon, null), " Imagens de Contexto (Opcional)"),
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
    )
  );

  const renderTeamSpecificInputs = () => {
      switch (currentTeam) {
          case Team.Developers:
              return (
                React.createElement('div', { className: "space-y-4" },
                  React.createElement('h3', { className: "text-lg font-semibold text-indigo-300 border-b border-gray-700 pb-2" }, "Central de Contexto do Código"),
                  
                  // 1. Select Folder
                  React.createElement('div', { className: "space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700" },
                    React.createElement('h4', { className: "flex items-center gap-2 text-sm font-medium text-gray-300" }, React.createElement(FolderIcon, null), "Pasta do Projeto (Recomendado)"),
                    folderFiles.length > 0 ? (
                        React.createElement(React.Fragment, null,
                            React.createElement(FileTree, { nodes: fileTreeData }),
                            React.createElement('button', { onClick: () => { setFolderFiles([]); setFileTreeData([]); }, className: "w-full text-center text-sm text-red-400 hover:text-red-300 py-1 mt-2" }, "Limpar Pasta")
                        )
                    ) : (
                      React.createElement('button', { onClick: handleSelectFolder, className: "w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md cursor-pointer hover:bg-gray-600" }, React.createElement(FolderIcon, null), React.createElement('span', null, "Selecionar Pasta"))
                    )
                  ),

                  // 2. Upload Files
                  React.createElement('div', { className: "space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700" },
                      React.createElement('h4', { className: "flex items-center gap-2 text-sm font-medium text-gray-300" }, React.createElement(UploadIcon, null), "Arquivos Avulsos"),
                      uploadedCodeFiles.length > 0 && (
                          React.createElement('div', { className: 'max-h-28 overflow-y-auto space-y-1' },
                              uploadedCodeFiles.map((file, index) => React.createElement(FileChip, { key: index, file: file, onRemove: () => setUploadedCodeFiles(prev => prev.filter((_, i) => i !== index)) }))
                          )
                      ),
                      React.createElement('label', { className: "w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md cursor-pointer hover:bg-gray-600" }, React.createElement(UploadIcon, null),React.createElement('span', null, "Enviar Arquivo(s) de Código"),React.createElement('input', { type: "file", className: "hidden", multiple: true, onChange: handleCodeFileChange }))
                  ),

                  // 3. Paste Code
                  React.createElement('div', { className: "space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700" },
                      React.createElement('h4', { className: "flex items-center gap-2 text-sm font-medium text-gray-300" }, React.createElement(CodeIcon, null), "Colar Código"),
                      React.createElement('textarea', { rows: 4, value: pastedCode, onChange: e => setPastedCode(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm", placeholder: "Cole trechos de código, logs, ou outros contextos de texto aqui..." })
                  ),

                   React.createElement('div', { className: "space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700" },
                     React.createElement('h4', { className: "text-sm font-medium text-gray-300" }, "Contexto Adicional"),
                     React.createElement('textarea', { rows: 2, value: databaseSchema, onChange: e => setDatabaseSchema(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Esquema do banco de dados (SQL, Prisma, etc)..." }),
                     React.createElement('textarea', { rows: 2, value: dependencies, onChange: e => setDependencies(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Dependências ou bibliotecas importantes..." })
                  )
                )
              )
          case Team.UXUI:
              return (
                React.createElement(React.Fragment, null,
                   React.createElement(ImageUploader, null),
                  React.createElement('div', { className: "space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700" },
                     React.createElement('h3', { className: "text-sm font-medium text-indigo-300" }, "Contexto Adicional (Opcional)"),
                     React.createElement('textarea', { rows: 3, value: personas, onChange: e => setPersonas(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Descreva as personas dos usuários..." }),
                     React.createElement('textarea', { rows: 3, value: userFlows, onChange: e => setUserFlows(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Descreva os principais fluxos de usuário em texto..." })
                  )
                )
              )
          case Team.Automations:
              return (
                React.createElement('div', { className: "space-y-4" },
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
                        !isJsonValid && jsonErrorMessage && React.createElement('p', { className: "text-xs text-red-400 mt-1 font-mono" }, jsonErrorMessage),
                        React.createElement('div', { className: "text-center text-sm text-gray-400" }, "e/ou"),
                         React.createElement('label', { className: "w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md cursor-pointer hover:bg-gray-600" },
                            React.createElement(UploadIcon, null),
                            React.createElement('span', null, "Enviar Arquivo(s) JSON"),
                            React.createElement('input', { type: "file", className: "hidden", multiple: true, onChange: handleJsonFileChange, accept: ".json" })
                        )
                  ),
                   React.createElement('div', { className: "space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700" },
                     React.createElement('h3', { className: "text-sm font-medium text-indigo-300" }, "Contexto Adicional (Opcional)"),
                     React.createElement('textarea', { rows: 3, value: triggerInfo, onChange: e => setTriggerInfo(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Descreva o gatilho (trigger) da automação..." }),
                     React.createElement('textarea', { rows: 3, value: externalApis, onChange: e => setExternalApis(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Liste as APIs externas envolvidas..." })
                  ),
                  React.createElement(ImageUploader, null)
                )
              )
          case Team.AI:
              return (
                   React.createElement('div', { className: "space-y-4" },
                       React.createElement('div', { className: "p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-4" },
                           React.createElement('h3', { className: "flex items-center gap-2 text-sm font-medium text-indigo-300" }, React.createElement(BrainIcon, null), " Componentes da IA (Opcional)"),
                           React.createElement('textarea', { value: systemPrompt, onChange: e => setSystemPrompt(e.target.value), rows: 4, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "System Prompt: 'Você é um assistente prestativo que...' " }),
                           React.createElement('textarea', { value: workflow, onChange: e => setWorkflow(e.target.value), rows: 3, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Fluxo de Trabalho: '1. Usuário pergunta sobre o produto X. 2. O agente usa a ferramenta Y para buscar detalhes...'" }),
                           React.createElement('textarea', { value: tools, onChange: e => setTools(e.target.value), rows: 3, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Ferramentas: 'getProductInfo(productId: string): Product - Retorna informações de um produto.'" }),
                           React.createElement('textarea', { value: exampleIO, onChange: e => setExampleIO(e.target.value), rows: 3, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Exemplos I/O: 'Entrada: Qual o preço do item X? Saída: { name: X, price: 19.99 }'" }),
                           React.createElement('textarea', { value: guardrails, onChange: e => setGuardrails(e.target.value), rows: 3, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Guardrails: 'Não responda a perguntas sobre tópicos sensíveis. Se o usuário insistir, encerre a conversa.'" })
                       ),
                       React.createElement(ImageUploader, null)
                  )
              )
          default:
              return null;
      }
  }

  const teamTemplates = TEMPLATES[currentTeam] || [];

  return (
    React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in", onClick: isLoading ? undefined : onClose, role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title" },
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
            
            // Templates section
            teamTemplates.length > 0 && React.createElement('div', { className: "space-y-3" },
                React.createElement('h3', { className: "flex items-center gap-2 text-sm font-medium text-indigo-300" }, React.createElement(TemplateIcon, null), "Começar com um Template (Opcional)"),
                React.createElement('div', { className: "flex flex-wrap gap-2" },
                    teamTemplates.map(template => (
                        React.createElement('button', {
                            key: template.name,
                            onClick: () => handleSelectTemplate(template),
                            className: `px-3 py-1.5 text-sm rounded-full transition-colors ${activeTemplate === template.name ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`
                        }, template.name)
                    ))
                )
            ),

             React.createElement('div', { className: "pt-2" },
                React.createElement('label', { className: "flex items-center space-x-3 text-gray-300 cursor-pointer" },
                    React.createElement('input', { 
                        type: "checkbox", 
                        checked: includeSupportSection, 
                        onChange: (e) => setIncludeSupportSection(e.target.checked), 
                        className: "form-checkbox h-5 w-5 text-indigo-600 bg-gray-700 border-gray-600 rounded focus:ring-indigo-500" 
                    }),
                    React.createElement('span', { className: "text-sm font-medium" }, "Adicionar Seção de Suporte ao Usuário Final")
                )
            ),
             React.createElement('hr', { className: "border-gray-600" }),
            // Team Specific Inputs
            renderTeamSpecificInputs()
        ),

          error && React.createElement('p', { className: "text-red-400 text-sm text-center px-6 pb-4" }, error),
          
        React.createElement('div', { className: "mt-auto p-6 bg-gray-800/50 border-t border-gray-700" },
           React.createElement('div', { className: "flex flex-col sm:flex-row justify-end items-center gap-4" },
                React.createElement('button', { onClick: onClose, disabled: isLoading, className: "w-full sm:w-auto py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50" }, "Cancelar"),
                React.createElement('button', {
                    onClick: handleGenerate,
                    disabled: !canGenerate() || !isJsonValid || isLoading,
                    className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-start disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-64 min-h-[40px] transition-all duration-300"
                },
                    isLoading 
                        ? React.createElement(React.Fragment, null, 
                            React.createElement(LoadingSpinner, null), 
                            React.createElement('span', { className: 'ml-3 text-left w-full typing-cursor' }, displayedLoadingMessage)
                          )
                        : React.createElement('span', {className: 'mx-auto'}, 'Gerar com IA')
                )
            ),
            isLoading && React.createElement('div', { className: "w-full mt-4" },
                 React.createElement('div', { className: "w-full bg-gray-600 rounded-full h-1.5" },
                    React.createElement('div', {
                        className: "bg-indigo-500 h-1.5 rounded-full transition-all duration-1000 ease-out",
                        style: { width: `${progress}%` }
                    })
                )
            )
        )
      )
    )
  );
};

export default CreationModal;