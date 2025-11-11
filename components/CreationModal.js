import React, { useState, useEffect, useRef } from 'react';
import { LoadingSpinner, UploadIcon, CodeIcon, JsonIcon, BrainIcon, FileIcon, CloseIcon, CheckIcon, AlertTriangleIcon, TemplateIcon, FolderIcon, InfoIcon, ChevronRightIcon, TrashIcon, PlusIcon, DragHandleIcon } from './Icons.js';
import { Team } from '../types.js';
import { TEMPLATES } from '../constants.js';
import { generateDocumentStructure, generateSupportStructure, generateFullDocumentContent } from '../services/openAIService.js';

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

const getAllDescendantFilePaths = (node) => {
    if (!node) return [];
    if (node.type === 'file') return [node.path];
    if (node.type === 'folder' && node.children) {
        return node.children.flatMap(getAllDescendantFilePaths);
    }
    return [];
};


const FileTree = ({ nodes, selectedPaths, onToggleNode }) => {
    const [expandedFolders, setExpandedFolders] = useState(new Set());
    const checkboxRef = useRef({});

    useEffect(() => {
        // Auto-expand the top-level folder if it's the only one
        if (nodes.length === 1 && nodes[0].type === 'folder') {
            setExpandedFolders(new Set([nodes[0].path]));
        }
    }, [nodes]);

    useEffect(() => {
        // Handle indeterminate state for checkboxes
        Object.values(checkboxRef.current).forEach(checkbox => {
            if (checkbox) {
                const isIndeterminate = checkbox.dataset.indeterminate === 'true';
                checkbox.indeterminate = isIndeterminate;
            }
        });
    }, [selectedPaths, expandedFolders]);

    const toggleFolderExpansion = (path) => {
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
        const descendantFiles = getAllDescendantFilePaths(node);
        const selectedDescendants = descendantFiles.filter(path => selectedPaths.has(path));
        const isChecked = descendantFiles.length > 0 && selectedDescendants.length === descendantFiles.length;
        const isIndeterminate = node.type === 'folder' && selectedDescendants.length > 0 && selectedDescendants.length < descendantFiles.length;

        if (node.type === 'folder') {
            return React.createElement('div', { key: node.path },
                React.createElement('div', { className: "flex items-center p-1 rounded-md hover:bg-gray-700/50" },
                    React.createElement('div', { style: { paddingLeft: `${level * 16}px` }, className: "flex items-center flex-grow min-w-0" },
                        React.createElement('input', {
                            type: 'checkbox',
                            className: 'form-checkbox h-4 w-4 text-indigo-600 bg-gray-600 border-gray-500 rounded focus:ring-indigo-500 mr-2 flex-shrink-0',
                            checked: isChecked,
                            'data-indeterminate': isIndeterminate,
                            ref: (el) => checkboxRef.current[node.path] = el,
                            onChange: () => onToggleNode(node)
                        }),
                        React.createElement('button', { onClick: () => toggleFolderExpansion(node.path), className: "flex items-center flex-grow min-w-0 text-left" },
                            React.createElement(ChevronRightIcon, { className: `h-4 w-4 mr-1 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}` }),
                            React.createElement(FolderIcon, { className: "h-5 w-5 mr-2 text-indigo-400 flex-shrink-0" }),
                            React.createElement('span', { className: "text-gray-300 truncate" }, node.name)
                        )
                    )
                ),
                isExpanded && React.createElement('div', null,
                    node.children.map(child => renderNode(child, level + 1))
                )
            );
        }

        // File node
        return React.createElement('div', {
            key: node.path,
            className: "flex items-center p-1 rounded-md hover:bg-gray-700/50",
            style: { paddingLeft: `${level * 16}px` }
        },
            React.createElement('input', {
                type: 'checkbox',
                className: 'form-checkbox h-4 w-4 text-indigo-600 bg-gray-600 border-gray-500 rounded focus:ring-indigo-500 mr-2 flex-shrink-0',
                checked: selectedPaths.has(node.path),
                onChange: () => onToggleNode(node)
            }),
            React.createElement(FileIcon, { className: "h-5 w-5 mr-2 text-gray-400 flex-shrink-0" }),
            React.createElement('span', { className: "text-gray-300 truncate" }, node.name)
        );
    };

    return React.createElement('div', { className: "max-h-48 overflow-y-auto bg-gray-800 p-2 rounded-md space-y-px font-mono text-sm" },
        nodes.map(node => renderNode(node, 0))
    );
};


const CreationModal = ({ onClose, onDocumentCreate, currentTeam }) => {
  // Step 1: Form state
  const [projectName, setProjectName] = useState('');
  const [description, setDescription] = useState('');
  const [docType, setDocType] = useState('both');
  
  // Structure Review state
  const [technicalStructure, setTechnicalStructure] = useState([]);
  const [supportStructure, setSupportStructure] = useState([]);
  
  // General state
  const [generationStep, setGenerationStep] = useState('form'); // 'form', 'structuringTechnical', 'reviewTechnical', 'structuringSupport', 'reviewSupport', 'generating'
  const [loadingMessage, setLoadingMessage] = useState('Iniciando...');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [folderError, setFolderError] = useState('');

  // Team specific context state
  const [jsonFiles, setJsonFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [pastedJson, setPastedJson] = useState('');
  const [isJsonValid, setIsJsonValid] = useState(true);
  const [jsonErrorMessage, setJsonErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Team Devs
  const [allFolderFiles, setAllFolderFiles] = useState([]);
  const [selectedFilePaths, setSelectedFilePaths] = useState(new Set());
  const [fileTreeData, setFileTreeData] = useState([]);
  const [uploadedCodeFiles, setUploadedCodeFiles] = useState([]);
  const [pastedCode, setPastedCode] = useState('');
  const [databaseSchema, setDatabaseSchema] = useState('');
  const [dependencies, setDependencies] = useState('');
  const [deploymentInfo, setDeploymentInfo] = useState('');

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

  const isLoading = ['structuringTechnical', 'structuringSupport', 'generating'].includes(generationStep);

  useEffect(() => { return () => { isCancelled.current = true; }; }, []);
  useEffect(() => {
    if (pastedJson.trim() === '') { setIsJsonValid(true); setJsonErrorMessage(''); return; }
    try { JSON.parse(pastedJson); setIsJsonValid(true); setJsonErrorMessage(''); } catch (e) { setIsJsonValid(false); setJsonErrorMessage(`Erro no JSON: ${e.message}`); }
  }, [pastedJson]);
  
  const handleJsonFileChange = async (e) => {
      const files = e.target.files; if (!files) return;
      try {
          const newFiles = await Promise.all(Array.from(files).map(file => fileToText(file).then(content => ({ name: file.name, content }))));
          if (currentTeam === Team.Automations) setJsonFiles(prev => [...prev, ...newFiles]);
      } catch (err) { setError('Falha ao ler um ou mais arquivos.'); }
  }
  const handleCodeFileChange = async (e) => {
    const files = e.target.files; if (!files) return;
     try {
        const newFiles = await Promise.all(Array.from(files).map(file => fileToText(file).then(content => ({ name: file.name, content }))));
        setUploadedCodeFiles(prev => [...prev, ...newFiles]);
     } catch (err) { setError('Falha ao ler um ou mais arquivos de código.'); }
  };
  const addImages = (files) => {
      if (!files) return;
      const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/')).map(file => ({ id: `${file.name}-${file.lastModified}`, file: file, preview: URL.createObjectURL(file) }));
      setUploadedImages(prev => [...prev, ...imageFiles]);
  }
  const removeImage = (idToRemove) => setUploadedImages(prev => prev.filter(img => img.id !== idToRemove));
  const handleImageChange = (e) => addImages(e.target.files);
  const handleImagePaste = (e) => addImages(e.clipboardData.files);
  const handleDragEvents = (e, isEntering) => { e.preventDefault(); e.stopPropagation(); setIsDragging(isEntering); };
  const handleDrop = (e) => { handleDragEvents(e, false); addImages(e.dataTransfer.files); };
  const canGenerate = () => !!projectName && !!description && !!docType;

  const handleSelectFolder = async () => {
    setFolderError('');
    const hasAistudioPicker = window.aistudio && typeof window.aistudio.showDirectoryPicker === 'function';
    const hasNativePicker = 'showDirectoryPicker' in window;
    try {
        let directoryHandle = null;
        if (hasAistudioPicker) { directoryHandle = await window.aistudio.showDirectoryPicker(); }
        else if (hasNativePicker) { directoryHandle = await window.showDirectoryPicker(); }
        else { setFolderError("Seu navegador não suporta a seleção de pastas. Por favor, use um navegador como Chrome ou Edge."); return; }
        if (!directoryHandle) return;
        setLoadingMessage('Processando pasta...');
        const files = await processDirectory(directoryHandle);
        const codeFileExtensions = ['.js', '.ts', '.tsx', '.py', '.java', '.cs', '.go', '.rs', '.php', '.html', '.css', '.scss', '.json', '.md', 'Dockerfile', '.yml', '.yaml'];
        const filteredFiles = files.filter(file => codeFileExtensions.some(ext => file.path.endsWith(ext)));
        setAllFolderFiles(filteredFiles);
        setFileTreeData(buildFileTree(filteredFiles));
        setSelectedFilePaths(new Set(filteredFiles.map(f => f.path)));
    } catch (err) {
        if (err.name === 'AbortError') return;
        console.error("Erro ao selecionar a pasta:", err);
        if (err.name === 'SecurityError' || (err.message && err.message.toLowerCase().includes("cross origin"))) {
            setFolderError("A seleção de pastas é bloqueada por segurança neste ambiente. Use a opção 'Enviar Arquivos Avulsos' como alternativa.");
        } else { setFolderError("Não foi possível acessar a pasta. Verifique as permissões do navegador."); }
    } finally { setLoadingMessage(''); }
  };
  const handleToggleNodeSelection = (node) => {
    const descendantFiles = getAllDescendantFilePaths(node);
    setSelectedFilePaths(currentPaths => {
        const newPaths = new Set(currentPaths);
        const areAllSelected = descendantFiles.every(p => newPaths.has(p));
        if (areAllSelected) { descendantFiles.forEach(p => newPaths.delete(p)); }
        else { descendantFiles.forEach(p => newPaths.add(p)); }
        return newPaths;
    });
  };

  const getTeamDataContext = async () => {
      const jsonFromFiles = jsonFiles.map(f => `--- JSON do arquivo: ${f.name} ---\n${f.content}`).join('\n\n');
      const allJson = [pastedJson, jsonFromFiles].filter(Boolean).join('\n\n');
      const selectedFolderFiles = allFolderFiles.filter(file => selectedFilePaths.has(file.path));

      let teamData = {
          folderFiles: selectedFolderFiles.length > 0 ? selectedFolderFiles : undefined,
          uploadedCodeFiles: uploadedCodeFiles.length > 0 ? uploadedCodeFiles : undefined,
          pastedCode: pastedCode || undefined, databaseSchema, dependencies, deploymentInfo: deploymentInfo || undefined,
          json: allJson || undefined, triggerInfo, externalApis, systemPrompt, workflow, tools, exampleIO, guardrails, personas, userFlows,
      };
      if (uploadedImages.length > 0) {
          teamData.images = await Promise.all(uploadedImages.map(img => fileToBase64(img.file)));
      }
      return teamData;
  }

  const handleGenerateTechnicalStructure = async () => {
    if (!canGenerate()) { setError('Por favor, preencha o nome do projeto e a descrição.'); return; }
    setError(''); setFolderError(''); isCancelled.current = false;
    setGenerationStep('structuringTechnical'); setLoadingMessage('Analisando contexto técnico...');
    try {
        const teamData = await getTeamDataContext();
        const params = { projectName, description, team: currentTeam, teamData };
        const structure = await generateDocumentStructure(params);
        if (!isCancelled.current) {
            setTechnicalStructure(structure.map((item, index) => ({ ...item, id: Date.now() + index })));
            setGenerationStep('reviewTechnical');
        }
    } catch (err) {
      if (!isCancelled.current) {
        setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
        setGenerationStep('form');
      }
    }
  };

  const handleGenerateSupportStructure = async () => {
    isCancelled.current = false;
    setGenerationStep('structuringSupport'); setLoadingMessage('Criando estrutura de suporte...');
    try {
        const teamData = await getTeamDataContext();
        const params = { projectName, description, team: currentTeam, teamData };
        const structure = await generateSupportStructure(params);
        if (!isCancelled.current) {
            setSupportStructure(structure.map((item, index) => ({ ...item, id: Date.now() + 1000 + index })));
            setGenerationStep('reviewSupport');
        }
    } catch (err) {
        if (!isCancelled.current) {
            setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
            setGenerationStep('reviewTechnical'); // Go back
        }
    }
  };
  
  const handleAdvanceFromTechnicalReview = () => {
      if (docType === 'support' || docType === 'both') {
          handleGenerateSupportStructure();
      } else {
          handleGenerateFullContent();
      }
  }

  const handleGenerateFullContent = async () => {
      setGenerationStep('generating');
      setError('');
      isCancelled.current = false;
      setProgress(0);
      setLoadingMessage('Iniciando geração...');

      const progressCallback = (update) => {
          if (isCancelled.current) return;
          setLoadingMessage(update.message);
          setProgress(update.progress);
      };

      try {
          const teamData = await getTeamDataContext();
          const params = { projectName, description, team: currentTeam, docType, teamData };
          const structures = { technicalStructure, supportStructure };
          const result = await generateFullDocumentContent(params, structures, progressCallback);

          if (!isCancelled.current) {
              setLoadingMessage('Documento pronto!'); setProgress(100);
              setTimeout(() => { if (!isCancelled.current) { onDocumentCreate(result.title, result.content); onClose(); } }, 500);
          }
      } catch (err) {
          if (!isCancelled.current) {
              setError(err instanceof Error ? err.message : 'Ocorreu um erro desconhecido.');
              setGenerationStep('reviewSupport'); // Go back to the last review step
              setProgress(0);
          }
      }
  }

  const handleSelectTemplate = (template) => {
    setActiveTemplate(template.name);
    setDescription(template.content.description || ''); setPastedCode(template.content.pastedCode || '');
    setDatabaseSchema(template.content.databaseSchema || ''); setDependencies(template.content.dependencies || '');
    setDeploymentInfo(template.content.deploymentInfo || ''); setPersonas(template.content.personas || '');
    setUserFlows(template.content.userFlows || ''); setPastedJson(template.content.pastedJson || '');
    setTriggerInfo(template.content.triggerInfo || ''); setExternalApis(template.content.externalApis || '');
    setSystemPrompt(template.content.systemPrompt || ''); setWorkflow(template.content.workflow || '');
    setTools(template.content.tools || ''); setExampleIO(template.content.exampleIO || '');
    setGuardrails(template.content.guardrails || '');
    setAllFolderFiles([]); setFileTreeData([]); setSelectedFilePaths(new Set());
    setUploadedCodeFiles([]); setUploadedImages([]);
  };

  const FileChip = ({ file, onRemove, isPath = false }) => (
    React.createElement('div', { className: "bg-gray-700 p-2 rounded-md flex items-center justify-between text-gray-300" },
      React.createElement('div', { className: "flex items-center gap-2 min-w-0" }, React.createElement(FileIcon, null), React.createElement('span', { className: "text-sm font-mono truncate", title: isPath ? file.path : file.name }, isPath ? file.path : file.name)),
      onRemove && React.createElement('button', { onClick: onRemove, className: "text-gray-400 hover:text-white p-1 rounded-full bg-gray-600 hover:bg-red-500 ml-2 flex-shrink-0" }, React.createElement(CloseIcon, null))
    )
  );
  
  const ImageUploader = () => (
    React.createElement('div', { onPaste: handleImagePaste, onDragEnter: (e) => handleDragEvents(e, true), onDragLeave: (e) => handleDragEvents(e, false), onDragOver: (e) => handleDragEvents(e, true), onDrop: handleDrop, className: "space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700" },
        React.createElement('h3', { className: "flex items-center gap-2 text-sm font-medium text-indigo-300" }, React.createElement(UploadIcon, null), " Imagens de Contexto (Opcional)"),
        React.createElement('label', { className: `w-full flex flex-col items-center justify-center gap-2 px-4 py-6 bg-gray-700 text-gray-300 rounded-md cursor-pointer hover:bg-gray-600 border-2 border-dashed transition-colors ${isDragging ? 'border-indigo-500 bg-gray-600' : 'border-gray-500'}` },
            React.createElement(UploadIcon, null), React.createElement('span', null, "Arraste e solte, cole, ou clique para enviar"),
            React.createElement('input', { type: "file", multiple: true, className: "hidden", onChange: handleImageChange, accept: "image/*" })
        ),
        uploadedImages.length > 0 && (
            React.createElement('div', { className: "grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2" },
                uploadedImages.map((img) => (
                  React.createElement('div', { key: img.id, className: "relative group" },
                    React.createElement('img', { src: img.preview, alt: "preview", className: "w-full h-20 object-cover rounded" }),
                    React.createElement('button', { onClick: () => removeImage(img.id), className: "absolute top-1 right-1 text-white bg-red-600/80 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500" }, React.createElement(CloseIcon, null))
                  )
                ))
            )
        )
    )
  );
  const PastedCodeInput = () => (
      React.createElement('div', { className: "space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700" },
          React.createElement('h4', { className: "flex items-center gap-2 text-sm font-medium text-gray-300" }, React.createElement(CodeIcon, null), "Colar Código (Opcional)"),
          React.createElement('textarea', { rows: 4, value: pastedCode, onChange: e => setPastedCode(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm", placeholder: "Cole trechos de código, logs, ou outros contextos de texto aqui..." })
      )
  );
  const renderTeamSpecificInputs = () => {
      switch (currentTeam) {
          case Team.Developers:
              return (
                React.createElement('div', { className: "space-y-4" },
                  React.createElement('h3', { className: "text-lg font-semibold text-indigo-300 border-b border-gray-700 pb-2" }, "Central de Contexto do Código"),
                  React.createElement('div', { className: "space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700" },
                    React.createElement('h4', { className: "flex items-center gap-2 text-sm font-medium text-gray-300" }, React.createElement(FolderIcon, null), "Pasta do Projeto (Recomendado)"),
                    fileTreeData.length > 0 ? (
                        React.createElement(React.Fragment, null,
                            React.createElement('p', { className: "text-xs text-gray-400" }, "Desmarque os arquivos ou pastas que deseja excluir do contexto."),
                            React.createElement(FileTree, { nodes: fileTreeData, selectedPaths: selectedFilePaths, onToggleNode: handleToggleNodeSelection }),
                            React.createElement('button', { onClick: () => { setAllFolderFiles([]); setFileTreeData([]); setSelectedFilePaths(new Set()); }, className: "w-full text-center text-sm text-red-400 hover:text-red-300 py-1 mt-2" }, "Limpar Pasta")
                        )
                    ) : ( React.createElement('button', { onClick: handleSelectFolder, className: "w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md cursor-pointer hover:bg-gray-600 mt-2" }, React.createElement(FolderIcon, null), React.createElement('span', null, "Selecionar Pasta"))),
                    folderError && React.createElement('div', {className: 'text-xs text-amber-400 mt-2 flex items-start gap-1.5 text-left p-2 bg-amber-900/40 border border-amber-500/30 rounded-md'}, React.createElement(InfoIcon, {className: 'h-4 w-4 flex-shrink-0 mt-0.5'}), React.createElement('span', null, folderError))
                  ),
                  React.createElement('div', { className: "space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700" },
                      React.createElement('h4', { className: "flex items-center gap-2 text-sm font-medium text-gray-300" }, React.createElement(UploadIcon, null), "Arquivos Avulsos"),
                      uploadedCodeFiles.length > 0 && ( React.createElement('div', { className: 'max-h-28 overflow-y-auto space-y-1' }, uploadedCodeFiles.map((file, index) => React.createElement(FileChip, { key: index, file: file, onRemove: () => setUploadedCodeFiles(prev => prev.filter((_, i) => i !== index)) })))),
                      React.createElement('label', { className: "w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md cursor-pointer hover:bg-gray-600" }, React.createElement(UploadIcon, null),React.createElement('span', null, "Enviar Arquivo(s) de Código"),React.createElement('input', { type: "file", className: "hidden", multiple: true, onChange: handleCodeFileChange }))
                  ),
                  React.createElement('div', { className: "space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700" },
                      React.createElement('h4', { className: "flex items-center gap-2 text-sm font-medium text-gray-300" }, React.createElement(CodeIcon, null), "Colar Código"),
                      React.createElement('textarea', { rows: 4, value: pastedCode, onChange: e => setPastedCode(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm", placeholder: "Cole trechos de código, logs, ou outros contextos de texto aqui..." })
                  ),
                   React.createElement('div', { className: "space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700" },
                     React.createElement('h4', { className: "text-sm font-medium text-gray-300" }, "Contexto Adicional"),
                     React.createElement('textarea', { rows: 2, value: databaseSchema, onChange: e => setDatabaseSchema(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Esquema do banco de dados (SQL, Prisma, etc)..." }),
                     React.createElement('textarea', { rows: 2, value: dependencies, onChange: e => setDependencies(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Dependências ou bibliotecas importantes..." })
                  ),
                  React.createElement('div', { className: "space-y-2 p-3 bg-gray-900/50 rounded-lg border border-gray-700" },
                    React.createElement('h4', { className: "text-sm font-medium text-gray-300" }, "Informações de Deploy (Opcional)"),
                    React.createElement('textarea', { rows: 2, value: deploymentInfo, onChange: e => setDeploymentInfo(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Como este projeto é publicado ou utilizado?" })
                  ), React.createElement(ImageUploader, null))
              );
          case Team.UXUI: return ( React.createElement('div', { className: "space-y-4" }, React.createElement(ImageUploader, null), React.createElement('div', { className: "space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700" }, React.createElement('h3', { className: "text-sm font-medium text-indigo-300" }, "Contexto de UX (Opcional)"), React.createElement('textarea', { rows: 3, value: personas, onChange: e => setPersonas(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Descreva as personas dos usuários..." }), React.createElement('textarea', { rows: 3, value: userFlows, onChange: e => setUserFlows(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Descreva os principais fluxos de usuário em texto..." })), React.createElement(PastedCodeInput, null)));
          case Team.Automations: return ( React.createElement('div', { className: "space-y-4" }, React.createElement(ImageUploader, null), React.createElement('div', { className: "space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700" }, React.createElement('h3', { className: "flex items-center gap-2 text-sm font-medium text-indigo-300" }, React.createElement(JsonIcon, null), " Estrutura da Automação (Opcional)", pastedJson.trim() && ( isJsonValid ? React.createElement('span', { className: 'text-green-400', title: 'JSON Válido'}, React.createElement(CheckIcon, null)) : React.createElement('span', { className: 'text-red-400', title: 'JSON Inválido'}, React.createElement(AlertTriangleIcon, null)))), React.createElement('div', { className: "space-y-2" }, jsonFiles.map((file, index) => React.createElement(FileChip, { key: index, file: file, onRemove: () => setJsonFiles(prev => prev.filter((_, i) => i !== index)) }))), React.createElement('textarea', { rows: 6, value: pastedJson, onChange: e => setPastedJson(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm", placeholder: "Cole o JSON dos nós (N8N) aqui..." }), !isJsonValid && jsonErrorMessage && React.createElement('p', { className: "text-xs text-red-400 mt-1 font-mono" }, jsonErrorMessage), React.createElement('div', { className: "text-center text-sm text-gray-400" }, "e/ou"), React.createElement('label', { className: "w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 text-gray-300 rounded-md cursor-pointer hover:bg-gray-600" }, React.createElement(UploadIcon, null), React.createElement('span', null, "Enviar Arquivo(s) JSON"), React.createElement('input', { type: "file", className: "hidden", multiple: true, onChange: handleJsonFileChange, accept: ".json" }))), React.createElement('div', { className: "space-y-4 p-4 bg-gray-900/50 rounded-lg border border-gray-700" }, React.createElement('h3', { className: "text-sm font-medium text-indigo-300" }, "Contexto Adicional (Opcional)"), React.createElement('textarea', { rows: 3, value: triggerInfo, onChange: e => setTriggerInfo(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Descreva o gatilho (trigger) da automação..." }), React.createElement('textarea', { rows: 3, value: externalApis, onChange: e => setExternalApis(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Liste as APIs externas envolvidas..." })), React.createElement(PastedCodeInput, null)));
          case Team.AI: return ( React.createElement('div', { className: "space-y-4" }, React.createElement(ImageUploader, null), React.createElement('div', { className: "p-4 bg-gray-900/50 rounded-lg border border-gray-700 space-y-4" }, React.createElement('h3', { className: "flex items-center gap-2 text-sm font-medium text-indigo-300" }, React.createElement(BrainIcon, null), " Componentes da IA (Opcional)"), React.createElement('textarea', { value: systemPrompt, onChange: e => setSystemPrompt(e.target.value), rows: 4, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "System Prompt: 'Você é um assistente prestativo que...' " }), React.createElement('textarea', { value: workflow, onChange: e => setWorkflow(e.target.value), rows: 3, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Fluxo de Trabalho: '1. Usuário pergunta...'" }), React.createElement('textarea', { value: tools, onChange: e => setTools(e.target.value), rows: 3, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Ferramentas: '[{ name: 'X', ... }]'" }), React.createElement('textarea', { value: exampleIO, onChange: e => setExampleIO(e.target.value), rows: 3, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Exemplos I/O: 'Entrada: ... Saída: ...'" }), React.createElement('textarea', { value: guardrails, onChange: e => setGuardrails(e.target.value), rows: 3, className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Guardrails: 'Não responda a perguntas sobre X.'" })), React.createElement(PastedCodeInput, null)));
          default: return null;
      }
  }

  const teamTemplates = TEMPLATES[currentTeam] || [];
  const docTypeOptions = [ { id: 'technical', label: 'Técnica' }, { id: 'support', label: 'Suporte' }, { id: 'both', label: 'Ambas' }];

  const StructureEditor = ({ structure, setStructure, title, description }) => {
    const draggedItem = useRef(null);
    const [dropIndicator, setDropIndicator] = useState(null);

    const handleStructureChange = (newTitle, index, subIndex = null) => {
        const newStructure = JSON.parse(JSON.stringify(structure));
        if (subIndex === null) { newStructure[index].title = newTitle; } 
        else { newStructure[index].children[subIndex].title = newTitle; }
        setStructure(newStructure);
    };
    const addStructureItem = (parentIndex = null) => {
        const newStructure = JSON.parse(JSON.stringify(structure));
        const newItem = { title: 'Novo Tópico', id: Date.now() };
        if (parentIndex === null) { newStructure.push(newItem); } 
        else {
            if (!newStructure[parentIndex].children) newStructure[parentIndex].children = [];
            newStructure[parentIndex].children.push({ ...newItem, id: Date.now() + 1 });
        }
        setStructure(newStructure);
    };
    const removeStructureItem = (index, subIndex = null) => {
        let newStructure = JSON.parse(JSON.stringify(structure));
        if (subIndex === null) { newStructure.splice(index, 1); } 
        else { newStructure[index].children.splice(subIndex, 1); }
        setStructure(newStructure);
    };

    const handleDragStart = (e, index, parentIndex = null) => {
        draggedItem.current = { index, parentIndex };
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', e.target.parentNode); // for firefox
        setTimeout(() => { e.target.closest('.structure-item').style.opacity = '0.5'; }, 0);
    };
    const handleDragEnd = (e) => {
        e.target.closest('.structure-item').style.opacity = '1';
        draggedItem.current = null;
        setDropIndicator(null);
    };
    const handleDragOver = (e, index, parentIndex = null) => {
        e.preventDefault();
        if (draggedItem.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const isAfter = e.clientY > rect.top + rect.height / 2;
            setDropIndicator({ index, parentIndex, isAfter });
        }
    };
    const handleDrop = (e, dropIndex, dropParentIndex = null) => {
        e.preventDefault();
        if (!draggedItem.current) return;

        const { index: dragIndex, parentIndex: dragParentIndex } = draggedItem.current;

        // Prevent dropping onto itself
        if (dragIndex === dropIndex && dragParentIndex === dropParentIndex) return;

        const newStructure = JSON.parse(JSON.stringify(structure));
        let itemToMove;

        // Remove item from its original position
        if (dragParentIndex === null) {
            [itemToMove] = newStructure.splice(dragIndex, 1);
        } else {
            [itemToMove] = newStructure[dragParentIndex].children.splice(dragIndex, 1);
        }

        const rect = e.currentTarget.getBoundingClientRect();
        const isAfter = e.clientY > rect.top + rect.height / 2;
        let finalDropIndex = dropIndex;
        if (isAfter) finalDropIndex++;

        // Add item to its new position
        if (dropParentIndex === null) {
            // Adjust index if moving within the same list downwards
            if (dragParentIndex === null && dragIndex < dropIndex) {
                 finalDropIndex--;
            }
            newStructure.splice(finalDropIndex, 0, itemToMove);
        } else {
            // Adjust index if moving within the same sublist downwards
            if (dragParentIndex === dropParentIndex && dragIndex < dropIndex) {
                finalDropIndex--;
            }
            if (!newStructure[dropParentIndex].children) newStructure[dropParentIndex].children = [];
            newStructure[dropParentIndex].children.splice(finalDropIndex, 0, itemToMove);
        }
        setStructure(newStructure);
        setDropIndicator(null);
    };

    const StructureItem = ({ item, index, parentIndex = null, isLast }) => {
        const showDropIndicator = dropIndicator && dropIndicator.index === index && dropIndicator.parentIndex === parentIndex;
        const isChild = parentIndex !== null;

        return React.createElement('div', { className: `structure-item relative ${isChild ? 'ml-6' : ''}`},
          showDropIndicator && !dropIndicator.isAfter && React.createElement('div', { className: 'absolute -top-1 left-0 w-full h-1 bg-indigo-500 rounded-full' }),
          isChild && React.createElement('div', { className: "absolute -left-3 top-4 h-full w-px bg-gray-700" }),
          isChild && React.createElement('div', { className: `absolute -left-3 ${isLast ? 'h-4' : 'h-full'} w-3 border-b border-l border-gray-700 rounded-bl-md top-0` }),
          React.createElement('div', {
              draggable: true,
              onDragStart: (e) => handleDragStart(e, index, parentIndex),
              onDragEnd: handleDragEnd,
              onDragOver: (e) => handleDragOver(e, index, parentIndex),
              onDrop: (e) => handleDrop(e, index, parentIndex),
              onDragLeave: () => setDropIndicator(null),
              className: 'flex items-center gap-2 p-1.5 rounded-lg bg-gray-800/70 border border-gray-700/50 hover:border-gray-600 transition-all my-1.5'
          },
              React.createElement(DragHandleIcon, { className: 'h-5 w-5 cursor-grab text-gray-500 flex-shrink-0' }),
              React.createElement('input', { type: 'text', value: item.title, onChange: (e) => handleStructureChange(e.target.value, parentIndex === null ? index : parentIndex, parentIndex === null ? null : index), className: 'w-full bg-transparent text-white text-sm focus:outline-none focus:ring-0 border-0 p-0' }),
              !isChild && React.createElement('button', { onClick: () => addStructureItem(index), title: "Adicionar sub-tópico", className: 'p-1 text-gray-400 hover:text-white bg-gray-700/50 hover:bg-gray-600 rounded flex-shrink-0' }, React.createElement(PlusIcon, { className: 'h-4 w-4' })),
              React.createElement('button', { onClick: () => removeStructureItem(index, parentIndex), title: "Remover", className: 'p-1 text-gray-400 hover:text-white bg-gray-700/50 hover:bg-red-500 rounded flex-shrink-0' }, React.createElement(TrashIcon, { className: 'h-4 w-4' }))
          ),
          item.children && item.children.length > 0 && 
          React.createElement('div', { className: "mt-1 space-y-1.5 relative" },
              item.children.map((child, subIndex) => React.createElement(StructureItem, {
                  key: child.id,
                  item: child,
                  index: subIndex,
                  parentIndex: index,
                  isLast: subIndex === item.children.length - 1
              }))
          ),
          showDropIndicator && dropIndicator.isAfter && React.createElement('div', { className: 'absolute -bottom-1 left-0 w-full h-1 bg-indigo-500 rounded-full' })
        );
    };
    
    return React.createElement('div', { className: "p-6 space-y-4" },
      React.createElement('h3', { className: "text-lg font-semibold text-indigo-300 border-b border-gray-700 pb-2" }, title),
      React.createElement('p', { className: "text-sm text-gray-400" }, description),
      React.createElement('div', { className: "max-h-96 overflow-y-auto pr-2" },
          structure.map((item, index) => React.createElement(StructureItem, {
              key: item.id,
              item: item,
              index: index,
              isLast: index === structure.length - 1,
          }))
      ),
      React.createElement('button', { onClick: () => addStructureItem(null), className: 'text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-2' }, React.createElement(PlusIcon, { className: 'h-4 w-4' }), "Adicionar Tópico Principal")
    );
  };
  
  const renderContent = () => {
    switch(generationStep) {
        case 'structuringTechnical':
        case 'structuringSupport':
        case 'generating':
             return React.createElement('div', { className: 'p-6 flex flex-col items-center justify-center text-center h-64' },
                React.createElement(LoadingSpinner, { className: 'h-12 w-12 text-indigo-400' }),
                React.createElement('p', { className: 'mt-4 text-lg text-white' }, loadingMessage),
                generationStep === 'generating' && React.createElement('div', { className: "w-full mt-4 max-w-sm" },
                     React.createElement('div', { className: "w-full bg-gray-600 rounded-full h-1.5" },
                        React.createElement('div', {
                            className: "bg-indigo-500 h-1.5 rounded-full transition-all duration-1000 ease-out",
                            style: { width: `${progress}%` }
                        })
                    )
                )
            );
        case 'reviewTechnical':
             return React.createElement(StructureEditor, {
                structure: technicalStructure,
                setStructure: setTechnicalStructure,
                title: "Revise a Estrutura Técnica",
                description: "A IA analisou seu contexto e sugere a estrutura abaixo. Você pode editar, remover, adicionar ou reordenar os tópicos antes de continuar."
             });
        case 'reviewSupport':
            return React.createElement(StructureEditor, {
                structure: supportStructure,
                setStructure: setSupportStructure,
                title: "Revise a Estrutura do Guia do Usuário",
                description: "Baseado no contexto, esta é a estrutura sugerida para o guia de suporte. Ajuste conforme necessário."
            });
        case 'form':
        default:
            return (
                React.createElement('div', { className: "p-6 space-y-4" },
                    React.createElement('div', null,
                      React.createElement('label', { htmlFor: "project-name", className: "block text-sm font-medium text-gray-300 mb-2" }, "Nome do Projeto"),
                      React.createElement('input', { type: "text", id: "project-name", value: projectName, onChange: (e) => setProjectName(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Ex: Novo Sistema de Autenticação" })
                    ),
                     React.createElement('div', null,
                      React.createElement('label', { htmlFor: "description", className: "block text-sm font-medium text-gray-300 mb-2" }, "Descrição Breve ou Objetivo"),
                      React.createElement('textarea', { id: "description", rows: 3, value: description, onChange: (e) => setDescription(e.target.value), className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-2 focus:ring-indigo-500 focus:border-indigo-500", placeholder: "Descreva o objetivo principal do projeto ou da funcionalidade..." })
                    ),
                    teamTemplates.length > 0 && React.createElement('div', { className: "space-y-3" },
                        React.createElement('h3', { className: "flex items-center gap-2 text-sm font-medium text-indigo-300" }, React.createElement(TemplateIcon, null), "Começar com um Template (Opcional)"),
                        React.createElement('div', { className: "flex flex-wrap gap-2" },
                            teamTemplates.map(template => ( React.createElement('button', { key: template.name, onClick: () => handleSelectTemplate(template), className: `px-3 py-1.5 text-sm rounded-full transition-colors ${activeTemplate === template.name ? 'bg-indigo-600 text-white font-semibold' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}` }, template.name)))
                        )
                    ),
                     React.createElement('div', { className: "pt-2" },
                        React.createElement('label', { className: "block text-sm font-medium text-gray-300 mb-2" }, "Tipo de Documento (Obrigatório)"),
                         React.createElement('div', { className: "flex rounded-md shadow-sm", role:"group" },
                            docTypeOptions.map((option, index) => (
                                React.createElement('button', { key: option.id, type: 'button', onClick: () => setDocType(option.id),
                                    className: `relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-1/3 transition-colors ${index === 0 ? 'rounded-l-md' : ''} ${index === docTypeOptions.length - 1 ? 'rounded-r-md' : ''} ${docType === option.id ? 'bg-indigo-600 text-white border border-indigo-500' : 'bg-gray-700 text-gray-300 border border-gray-600 hover:bg-gray-600'}`
                                }, option.label)
                            ))
                        )
                    ),
                     React.createElement('hr', { className: "border-gray-600" }),
                    renderTeamSpecificInputs()
                )
            );
    }
  }
  
  const renderFooter = () => {
      let backButton = null;
      let primaryButton = null;
      let isPrimaryDisabled = isLoading;

      switch(generationStep) {
          case 'reviewTechnical':
              backButton = { label: "Voltar", action: () => setGenerationStep('form') };
              primaryButton = { label: (docType === 'support' || docType === 'both') ? "Avançar" : "Gerar Conteúdo", action: handleAdvanceFromTechnicalReview };
              isPrimaryDisabled = isLoading || technicalStructure.length === 0;
              break;
          case 'reviewSupport':
              backButton = { label: "Voltar", action: () => setGenerationStep('reviewTechnical') };
              primaryButton = { label: "Gerar Conteúdo Completo", action: handleGenerateFullContent };
              isPrimaryDisabled = isLoading || supportStructure.length === 0;
              break;
          case 'form':
              backButton = { label: "Cancelar", action: onClose };
              primaryButton = { label: "Gerar Estrutura com IA", action: handleGenerateTechnicalStructure };
              isPrimaryDisabled = !canGenerate() || !isJsonValid || isLoading;
              break;
          case 'structuringTechnical':
          case 'structuringSupport':
          case 'generating':
              backButton = { label: "Cancelar", action: () => { isCancelled.current = true; setGenerationStep('form'); }};
              const buttonText = {
                  structuringTechnical: 'Analisando...',
                  structuringSupport: 'Estruturando...',
                  generating: 'Gerando...'
              }[generationStep];
              primaryButton = { label: buttonText, action: () => {}, showSpinner: true };
              isPrimaryDisabled = true;
              break;
      }

      return (
         React.createElement('div', { className: "mt-auto p-6 bg-gray-800/50 border-t border-gray-700" },
           React.createElement('div', { className: "flex flex-col sm:flex-row justify-end items-center gap-4" },
                React.createElement('button', { onClick: backButton.action, disabled: isLoading, className: "w-full sm:w-auto py-2 px-4 rounded-md text-gray-300 hover:bg-gray-700 transition-colors disabled:opacity-50" }, backButton.label),
                React.createElement('button', { onClick: primaryButton.action, disabled: isPrimaryDisabled, className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto min-h-[40px] transition-all duration-300"},
                    primaryButton.showSpinner ? React.createElement(LoadingSpinner, null) : null,
                    React.createElement('span', { className: primaryButton.showSpinner ? 'ml-3' : ''}, primaryButton.label)
                )
            )
        )
      );
  }

  const getModalTitle = () => {
      const baseTitle = `Criar Documento para ${currentTeam}`;
      if (generationStep === 'reviewTechnical') return "Etapa 1 de 2: Estrutura Técnica";
      if (generationStep === 'reviewSupport') return "Etapa 2 de 2: Guia do Usuário";
      return "Nova Documentação";
  };
  
  const getProgressIndicator = () => {
    let steps = [];
    if (docType === 'both') steps = ['form', 'reviewTechnical', 'reviewSupport', 'done'];
    else if (docType === 'technical') steps = ['form', 'reviewTechnical', 'done'];
    else if (docType === 'support') steps = ['form', 'reviewSupport', 'done'];
    
    let currentStepIndex = 0;
    if (generationStep.startsWith('review')) currentStepIndex = steps.indexOf(generationStep);
    else if (generationStep === 'form') currentStepIndex = 0;
    else if (generationStep === 'generating') currentStepIndex = steps.length -1;
    
    const stepLabels = {'form': 'Início', 'reviewTechnical': 'Técnica', 'reviewSupport': 'Suporte'};

    if (steps.length <=2 || generationStep === 'form' || isLoading) return null;
    
    return (
        React.createElement('div', { className: 'flex items-center gap-2' },
            steps.slice(1, -1).map((step, index) => {
                const stepNumber = index + 1;
                const isCompleted = currentStepIndex > stepNumber;
                const isCurrent = currentStepIndex === stepNumber;

                return React.createElement(React.Fragment, { key: step },
                    index > 0 && React.createElement('div', { className: `h-px w-4 ${isCompleted || isCurrent ? 'bg-indigo-500' : 'bg-gray-600'}` }),
                    React.createElement('div', { className: 'flex items-center gap-2' },
                        React.createElement('div', { className: `w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isCurrent ? 'bg-indigo-600 text-white ring-2 ring-offset-2 ring-offset-gray-800 ring-indigo-500' : isCompleted ? 'bg-indigo-500/50 text-indigo-200' : 'bg-gray-700 text-gray-400'}`}, stepNumber),
                        React.createElement('span', { className: `text-sm font-medium ${isCurrent ? 'text-white' : 'text-gray-400'}`}, stepLabels[step])
                    )
                );
            })
        )
    );
  };


  return (
    React.createElement('div', { className: "fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in", onClick: isLoading ? undefined : onClose, role: "dialog", "aria-modal": "true", "aria-labelledby": "modal-title" },
      React.createElement('div', { className: "bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl transform transition-all max-h-[90vh] flex flex-col animate-slide-up", onClick: (e) => e.stopPropagation() },
        React.createElement('div', { className: "p-6 border-b border-gray-700 flex justify-between items-center" },
          React.createElement('h2', { id: "modal-title", className: "text-2xl font-bold text-white" }, getModalTitle()),
          getProgressIndicator()
        ),
        React.createElement('div', { className: "overflow-y-auto" },
            error && React.createElement('div', { className: 'p-4 m-6 mb-0 bg-red-900/50 border border-red-500/30 rounded-md text-red-300 text-sm' }, error),
            renderContent()
        ),
        renderFooter()
      )
    )
  );
};

export default CreationModal;