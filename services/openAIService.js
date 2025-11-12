import { Team } from "../types.js";

let openAIApiKey = null;

export const initializeAiService = (apiKey) => {
  if (!apiKey) {
    console.error("A chave de API é necessária para inicializar o serviço OpenAI.");
    return false;
  }
  openAIApiKey = apiKey;
  return true;
};

export const validateApiKey = async (apiKey) => {
  if (!apiKey) return false;
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      }
    });
    return response.ok;
  } catch (error) {
    console.error("Falha ao validar a chave de API:", error);
    return false;
  }
};

const callOpenAI = async (messages, response_format = { type: "text" }) => {
    const MAX_RETRIES = 3;
    let lastError = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openAIApiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-4o",
                    messages: messages,
                    max_tokens: 4096,
                    response_format: response_format,
                })
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                const defaultMessage = "Ocorreu uma falha inesperada ao tentar se comunicar com a IA.";
                let userMessage = errorData.error?.message || defaultMessage;

                if (userMessage.includes('Incorrect API key')) {
                    userMessage = "Sua chave de API da OpenAI é inválida. Por favor, verifique-a na tela de configuração.";
                } else if (apiResponse.status === 429) {
                    userMessage = "Você excedeu sua cota atual da API OpenAI ou o limite de requisições. Verifique seu plano e detalhes de faturamento.";
                } else if (errorData.error?.code === 'context_length_exceeded') {
                    userMessage = "O contexto fornecido (código, imagens, texto) é muito grande. Tente reduzir a quantidade de arquivos ou o tamanho do texto e tente novamente.";
                } else {
                    userMessage = `Erro da IA: ${userMessage}`;
                }

                if (apiResponse.status >= 400 && apiResponse.status < 500) {
                    console.error("Erro da API OpenAI (Cliente):", errorData);
                    throw new Error(userMessage);
                }

                lastError = new Error(`Erro do servidor da IA (Status ${apiResponse.status}).`);
                console.error("Erro da API OpenAI (Servidor):", errorData);

            } else { 
                const data = await apiResponse.json();
                const aiContent = data.choices[0]?.message?.content?.trim();

                if (aiContent) {
                    console.log("%c[DEBUG] Resposta Bruta da IA:", "color: #ff9800; font-weight: bold;", `\n\n${aiContent}`);
                    return aiContent;
                } else {
                    lastError = new Error("A IA retornou uma resposta vazia. Isso pode ser um problema temporário.");
                }
            }
        } catch (error) {
            if (error.message.includes("API") || error.message.includes("contexto")) {
                throw error;
            }
            lastError = error;
            console.error(`Tentativa ${i + 1} falhou:`, error);
        }

        if (i < MAX_RETRIES - 1) {
            await new Promise(res => setTimeout(res, 1000 * (i + 1)));
        }
    }

    throw new Error(`Falha na comunicação com a IA após ${MAX_RETRIES} tentativas. Erro: ${lastError?.message || 'Desconhecido'}`);
};


const getBaseSystemPersona = (team) => {
  const baseInstruction = "Sua tarefa é criar a documentação mais detalhada e concisa possível, exclusivamente em Português do Brasil. Estruture suas respostas em parágrafos bem escritos e explicativos. Use listas (`-` ou `1.`) apenas quando for a forma mais clara de apresentar informações (ex: múltiplos passos, lista de parâmetros). Dê preferência a texto corrido em vez de listas para descrever conceitos.";

  switch (team) {
    case Team.Developers:
      return `Aja como um engenheiro de software sênior e arquiteto de soluções. ${baseInstruction}`;
    case Team.UXUI:
       return `Aja como um especialista em UX/UI e Product Designer, com foco em clareza para a equipe de desenvolvimento. Analise contextos visuais como designs do Figma, landing pages e screenshots de plataformas (Learnworlds, apps). ${baseInstruction}`;
    case Team.Automations:
      return `Aja como um especialista em automação de processos (RPA e integrações), com conhecimento em N8N, Unnichat e Apps Script. Seu superpoder é traduzir a estrutura de dados de uma automação (JSON do N8N), fluxos de conversa (Unnichat) ou código (Apps Script) em uma explicação clara, funcional e concisa. ${baseInstruction}`;
    case Team.AI:
      return `Aja como um engenheiro de IA especialista em arquitetura de agentes, com foco em plataformas como o Dify. Analise fluxos de trabalho, ferramentas e prompts de sistema para criar documentação técnica detalhada e concisa. ${baseInstruction}`;
    default:
      return `Você é um assistente de IA especialista em criar documentação técnica e de negócios. ${baseInstruction}`;
  }
}

const buildTeamContext = (teamData, options = { includeFileContent: true }) => {
    let context = '';
    
    if (options.includeFileContent && teamData.folderFiles && teamData.folderFiles.length > 0) {
      context += '**Estrutura e Conteúdo do Projeto (Pasta):**\n\n';
      context += teamData.folderFiles.map(file => `--- Arquivo: ${file.path} ---\n${file.content}\n\n`).join('');
    } else if (teamData.folderFiles && teamData.folderFiles.length > 0) {
      context += '**Estrutura de Arquivos do Projeto (Pasta):**\n\n';
      context += teamData.folderFiles.map(file => `- ${file.path}`).join('\n') + '\n\n';
    }

    if (options.includeFileContent && teamData.uploadedCodeFiles && teamData.uploadedCodeFiles.length > 0) {
      context += '**Arquivos Avulsos Anexados:**\n\n';
      context += teamData.uploadedCodeFiles.map(file => `--- Arquivo: ${file.name} ---\n${file.content}\n\n`).join('');
    } else if(teamData.uploadedCodeFiles && teamData.uploadedCodeFiles.length > 0) {
      context += '**Arquivos Avulsos Anexados (Nomes):**\n\n';
      context += teamData.uploadedCodeFiles.map(file => `- ${file.name}`).join('\n') + '\n\n';
    }
    
    if (teamData.pastedCode) context += `**Código Colado Adicional:**\n${teamData.pastedCode}\n\n`;
    if (teamData.databaseSchema) context += `**Esquema do Banco de Dados:**\n${teamData.databaseSchema}\n`;
    if (teamData.dependencies) context += `**Dependências e Bibliotecas:**\n${teamData.dependencies}\n`;
    if (teamData.deploymentInfo) context += `**Informações sobre Deploy:**\n${teamData.deploymentInfo}\n`;
    if (teamData.images && teamData.images.length > 0) context += 'Analise as imagens fornecidas como contexto visual para o projeto (ex: diagramas de fluxo, screenshots de interface do Figma, Learnworlds, etc).\n';
    if (teamData.personas) context += `**Personas:**\n${teamData.personas}\n`;
    if (teamData.userFlows) context += `**Fluxos de Usuário (descrição textual):**\n${teamData.userFlows}\n`;
    if (teamData.json) context += `**Estrutura da Automação (JSON - ex: N8N):**\n${teamData.json}\nInterprete a estrutura JSON acima para detalhar os nós e a lógica.\n`;
    if (teamData.triggerInfo) context += `**Informações do Gatilho (Trigger):**\n${teamData.triggerInfo}\n`;
    if (teamData.externalApis) context += `**APIs Externas Envolvidas:**\n${teamData.externalApis}\n`;
    if (teamData.systemPrompt) context += `**System Prompt (Agente Dify):**\n${teamData.systemPrompt}\n`;
    if (teamData.workflow) context += `**Fluxo de Trabalho/Conversa (Dify):**\n${teamData.workflow}\n`;
    if (teamData.tools) context += `**Ferramentas (Tools - Dify):**\n${teamData.tools}\n`;
    if (teamData.exampleIO) context += `**Exemplos de Entrada/Saída (Dify):**\n${teamData.exampleIO}\n`;
    if (teamData.guardrails) context += `**Guardrails e Regras de Segurança (Dify):**\n${teamData.guardrails}\n`;

    return context || "Nenhum contexto adicional foi fornecido. Crie a estrutura com base nas melhores práticas para um projeto com a descrição fornecida.";
};

const buildUserMessageContent = (prompt, teamData) => {
    const content = [{ type: "text", text: prompt }];
    if (teamData.images && teamData.images.length > 0) {
        teamData.images.forEach(img => {
            content.push({
                type: "image_url",
                image_url: { url: `data:${img.mimeType};base64,${img.data}` }
            });
        });
    }
    return content;
};

const structurePromptTemplate = (promptType) => `
    Sua primeira tarefa é atuar como um arquiteto de documentação. Analise de forma holística TODO o contexto fornecido abaixo e proponha a melhor estrutura possível para ${promptType}.

    **REGRAS CRÍTICAS PARA A ESTRUTURA:**
    1.  **UNICIDADE E RELEVÂNCIA:** A estrutura deve ser **100% única e adaptada** ao contexto. ${promptType === 'um documento técnico' ? 'Crie seções que sejam genuinamente úteis com base no que você pode inferir do código, imagens e textos.' : 'Pense como um usuário final que não conhece o sistema. Crie seções como "Primeiros Passos", "Como Fazer X", "Solução de Problemas Comuns". NÃO use um template genérico.'}
    2.  **LÓGICA:** Os tópicos devem seguir uma ordem lógica que facilite o entendimento.
    3.  **FORMATO JSON:** Sua resposta DEVE ser um objeto JSON válido, contendo uma única chave "structure" que é um array de objetos. Cada objeto deve ter uma chave "title" (string) e opcionalmente uma chave "children" (um array de objetos com o mesmo formato, para sub-tópicos).
    4.  **PROFUNDIDADE:** Crie no máximo 2 níveis de profundidade (tópicos e sub-tópicos).
    5.  **IDIOMA:** Todos os títulos devem ser em Português do Brasil.

    **Exemplo de formato de saída JSON:**
    {
      "structure": [
        { "title": "Visão Geral do Projeto" },
        { 
          "title": "Análise dos Componentes Principais",
          "children": [
            { "title": "Componente de Login" },
            { "title": "Componente de Dashboard" }
          ]
        },
        { "title": "Fluxo de Autenticação" }
      ]
    }
`;

const generateStructure = async (params, promptType) => {
  if (!openAIApiKey) throw new Error("A API OpenAI não foi inicializada.");
  
  const { projectName, description, team, teamData } = params;
  const persona = getBaseSystemPersona(team);
  const teamContext = buildTeamContext(teamData, { includeFileContent: false });

  const structurePrompt = `
    ${structurePromptTemplate(promptType)}
    
    **Informações do Projeto para Análise:**
    - Nome do Projeto: ${projectName}
    - Descrição/Objetivo Principal: ${description}
    - Equipe Alvo da Documentação: ${team}
    
    **Contexto Completo Fornecido:**
    ${teamContext}

    Agora, gere a estrutura JSON para este projeto. Responda APENAS com o objeto JSON e nada mais.
  `;

  const messages = [
    { role: "system", content: persona },
    { role: "user", content: buildUserMessageContent(structurePrompt, teamData) }
  ];
  
  const response = await callOpenAI(messages, { type: "json_object" });
  try {
    const parsed = JSON.parse(response);
    return parsed.structure || [];
  } catch (e) {
    console.error("Falha ao parsear a estrutura JSON da IA:", e);
    throw new Error("A IA retornou uma estrutura inválida. Tente novamente.");
  }
};

export const generateDocumentStructure = (params) => generateStructure(params, 'um documento técnico');
export const generateSupportStructure = (params) => generateStructure(params, 'um Guia do Usuário Final');

const markdownToHtml = (markdown) => {
    if (!markdown) return '';

    const processInline = (text) => {
        return text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code style="background-color: #4a5568; color: #e2e8f0; padding: 0.2em 0.4em; border-radius: 4px; font-family: \'Courier New\', Courier, monospace; font-size: 0.9em;">$1</code>');
    };

    const blocks = markdown.replace(/\r\n/g, '\n').split(/\n{2,}/);

    const htmlBlocks = blocks.map(block => {
        block = block.trim();
        if (block.length === 0) return '';

        // Code Blocks (```)
        if (block.startsWith('```')) {
            const code = block.replace(/^```(?:\w*\n)?/, '').replace(/\n```$/, '').trim();
            const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<pre style="background-color: #1f2937; color: #e5e7eb; padding: 1em; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word; font-family: 'Courier New', Courier, monospace; font-size: 14px; line-height: 1.5;"><code>${escapedCode}</code></pre>`;
        }
        
        // Headers (#, ##, ###, ####)
        if (block.startsWith('#### ')) return `<h4>${processInline(block.substring(5))}</h4>`;
        if (block.startsWith('### ')) return `<h3>${processInline(block.substring(4))}</h3>`;
        if (block.startsWith('## ')) return `<h2>${processInline(block.substring(3))}</h2>`;
        if (block.startsWith('# ')) return `<h1>${processInline(block.substring(2))}</h1>`;
        
        // Blockquotes (>)
        if (block.startsWith('> ')) {
             const quoteContent = block.split('\n').map(line => line.replace(/^\> ?/, '')).join('<br>');
             return `<blockquote style="border-left: 4px solid #6366f1; padding-left: 1em; margin-left: 0; color: #d1d5db; font-style: italic;">${processInline(quoteContent)}</blockquote>`;
        }

        // Lists (*, -, 1.)
        if (block.match(/^(\s*[-*] .*|\s*\d+\. .*)/m)) {
            const lines = block.split('\n');
            let listHtml = '';
            let listType = null;

            lines.forEach(line => {
                const ulMatch = line.match(/^\s*[-*] (.*)/);
                const olMatch = line.match(/^\s*\d+\. (.*)/);

                if (ulMatch) {
                    if (listType !== 'ul') {
                        if (listType) listHtml += `</${listType}>`;
                        listHtml += '<ul>';
                        listType = 'ul';
                    }
                    listHtml += `<li>${processInline(ulMatch[1])}</li>`;
                } else if (olMatch) {
                     if (listType !== 'ol') {
                        if (listType) listHtml += `</${listType}>`;
                        listHtml += '<ol>';
                        listType = 'ol';
                    }
                    listHtml += `<li>${processInline(olMatch[1])}</li>`;
                } else if (listHtml.endsWith('</li>')) {
                    listHtml = listHtml.slice(0, -5) + ` ${processInline(line.trim())}</li>`;
                }
            });
            if (listType) listHtml += `</${listType}>`;
            return listHtml;
        }

        // Paragraphs
        return `<p>${processInline(block.replace(/\n/g, '<br>'))}</p>`;
    });

    return htmlBlocks.join('');
};

const generateInSingleCall = async (params, structures, persona, knowledgeBase, progressCallback) => {
    const { projectName, description, docType } = params;
    
    progressCallback({ progress: 20, message: 'Analisando todo o contexto...' });

    const allSections = [];
    if (docType !== 'support') allSections.push(...structures.technicalStructure.flatMap(item => [item, ...(item.children || [])]));
    if (docType !== 'technical') allSections.push(...structures.supportStructure.flatMap(item => [item, ...(item.children || [])]));

    const sectionTitles = allSections.map(s => s.title);

    const isSupportHeavy = docType === 'support' || (docType === 'both' && structures.supportStructure.length > structures.technicalStructure.length);
    const audiencePrompt = isSupportHeavy
        ? "O foco principal é o usuário final. Mantenha a linguagem simples e direta. Use exemplos práticos."
        : "O foco principal é a equipe técnica. Seja detalhado e preciso sobre a arquitetura e implementação.";

    const singleCallPrompt = `
        Sua tarefa é gerar o conteúdo para TODAS as seções de um documento de uma só vez. Analise o 'Contexto do Projeto' abaixo e escreva o conteúdo para cada um dos tópicos listados.

        **REGRAS CRÍTICAS E INEGOCIÁVEIS:**
        1.  **FORMATO DE SAÍDA:** Você DEVE formatar sua resposta usando separadores especiais. Para cada seção, use este formato exato:
            <--SECTION_START: [O Título Exato da Seção]-->
            (Aqui vai o conteúdo da seção em Markdown)
            <--SECTION_END-->
        2.  **CONCISÃO E OBJETIVIDADE:** Seja informativo e detalhado, mas evite verbosidade desnecessária. Vá direto ao ponto e foque nos aspectos mais importantes de cada tópico.
        3.  **CONTEXTO É REI:** Baseie TODA a sua escrita no 'Contexto do Projeto' fornecido. Não invente funcionalidades.
        4.  **AUDIÊNCIA:** ${audiencePrompt}
        5.  **IDIOMA:** Responda exclusivamente em Português do Brasil.

        **Tópicos a serem escritos:**
        ${sectionTitles.map(title => `- ${title}`).join('\n')}

        **Contexto do Projeto (Sua fonte de verdade):**
        - Nome do Projeto: ${projectName}
        - Descrição Geral: ${description}
        - Arquivos, código e outras informações:
        ${knowledgeBase}

        Agora, gere o conteúdo para todas as seções, seguindo o formato de separador obrigatório.
    `;

    progressCallback({ progress: 50, message: 'Gerando rascunho de todo o documento...' });

    const messages = [{ role: "system", content: persona }, { role: "user", content: buildUserMessageContent(singleCallPrompt, params.teamData) }];
    const combinedResponse = await callOpenAI(messages);

    progressCallback({ progress: 85, message: 'Formatando documento final...' });

    let fullHtmlContent = '';
    const sectionMap = new Map();

    const sectionsRegex = /<--SECTION_START: (.*?)-->(.*?)<--SECTION_END-->/gs;
    let match;
    while ((match = sectionsRegex.exec(combinedResponse)) !== null) {
        const title = match[1].trim();
        const content = match[2].trim();
        sectionMap.set(title, content);
    }

    // Reconstruct in the correct order
    for (const section of allSections) {
        const markdownContent = sectionMap.get(section.title);
        if (markdownContent) {
            const isSubItem = structures.technicalStructure.some(s => s.children?.some(c => c.id === section.id)) || structures.supportStructure.some(s => s.children?.some(c => c.id === section.id));
            const headingLevel = isSubItem ? 2 : 1;
            fullHtmlContent += `<h${headingLevel}>${section.title}</h${headingLevel}>\n${markdownToHtml(markdownContent)}\n\n`;
        } else {
             console.warn(`A IA não gerou conteúdo para a seção: "${section.title}"`);
        }
    }
    
    if (fullHtmlContent.trim() === '') {
        throw new Error("A IA não retornou o conteúdo no formato esperado. A resposta pode estar incompleta ou mal formatada. Tente novamente.");
    }

    return fullHtmlContent;
};

const generateInChunks = async (params, structures, persona, knowledgeBase, progressCallback) => {
    const { projectName, description, docType, teamData } = params;

    const allSections = [];
    if (docType !== 'support') allSections.push(...structures.technicalStructure.flatMap(item => [item, ...(item.children || [])]));
    if (docType !== 'technical') allSections.push(...structures.supportStructure.flatMap(item => [item, ...(item.children || [])]));
    
    let fullHtmlContent = '';
    const baseProgress = 20;
    const progressPerSection = (100 - baseProgress) / (allSections.length || 1);

    for (let i = 0; i < allSections.length; i++) {
        const section = allSections[i];
        const currentProgress = Math.round(baseProgress + (i * progressPerSection));
        progressCallback({ progress: currentProgress, message: `Escrevendo seção: "${section.title}"...` });
        
        const isSupportTopic = structures.supportStructure.some(s => s.title === section.title || s.children?.some(c => c.title === section.title));
        const audiencePrompt = isSupportTopic
            ? "Escreva de forma clara e simples, como se estivesse explicando para um usuário final não-técnico. Use exemplos práticos."
            : "Escreva de forma detalhada e técnica, como se estivesse explicando para outro desenvolvedor. Elabore sobre a arquitetura e as decisões de implementação.";

        const sectionPrompt = `
            Sua tarefa é escrever uma seção detalhada, **mas concisa e objetiva**, para um documento. O tópico da seção é "**${section.title}**". Use o 'Contexto do Projeto' abaixo como sua fonte principal.

            **REGRAS CRÍTICAS E INEGOCIÁVEIS:**
            1.  **FOCO E OBJETIVIDADE:** Elabore sobre o tópico, mas evite verbosidade desnecessária. Vá direto ao ponto, focando nas informações essenciais.
            2.  **BASEADO NO CONTEXTO:** Baseie sua resposta fortemente no 'Contexto do Projeto' fornecido.
            3.  **FOCO NO TÓPICO:** Sua resposta deve ser exclusivamente sobre "**${section.title}**".
            4.  **SEM REDUNDÂNCIA:** Não adicione introduções ou conclusões. Comece diretamente com o conteúdo da seção.
            5.  **FORMATO:** Use Markdown simples. Dê PREFERÊNCIA a parágrafos bem escritos.
            6.  **AUDIÊNCIA:** ${audiencePrompt}
            7.  **IDIOMA:** Responda exclusivamente em Português do Brasil.
            
            **Contexto do Projeto (Sua fonte de verdade):**
            - Nome do Projeto: ${projectName}
            - Descrição Geral: ${description}
            - Arquivos, código e outras informações:
            ${knowledgeBase}

            Agora, escreva o conteúdo conciso e objetivo para a seção "${section.title}".
        `;
        
        const messages = [{ role: "system", content: persona }, { role: "user", content: buildUserMessageContent(sectionPrompt, teamData) }];
        const sectionContent = await callOpenAI(messages);
        
        const isSubItem = structures.technicalStructure.some(s => s.children?.some(c => c.id === section.id)) || structures.supportStructure.some(s => s.children?.some(c => c.id === section.id));
        const headingLevel = isSubItem ? 2 : 1;
        
        fullHtmlContent += `<h${headingLevel}>${section.title}</h${headingLevel}>\n${markdownToHtml(sectionContent)}\n\n`;
    }

    return fullHtmlContent;
};

export const generateFullDocumentContent = async (params, structures, progressCallback) => {
    if (!openAIApiKey) throw new Error("A API OpenAI não foi inicializada.");
    
    const { projectName } = params;
    const persona = getBaseSystemPersona(params.team);
    
    progressCallback({ progress: 10, message: 'Construindo base de conhecimento...' });
    const knowledgeBase = buildTeamContext(params.teamData, { includeFileContent: true });
    
    // Heuristic: 1 token ~ 4 chars. Threshold set to 80k to be safe with a 128k context window.
    const TOKEN_THRESHOLD = 80000; 
    const estimatedTokens = Math.round(knowledgeBase.length / 4);

    let fullHtmlContent = '';

    if (estimatedTokens < TOKEN_THRESHOLD) {
        // --- Single Call Strategy (Fast Path) ---
        console.log(`[INFO] Contexto pequeno (${estimatedTokens} tokens). Usando estratégia de chamada única.`);
        fullHtmlContent = await generateInSingleCall(params, structures, persona, knowledgeBase, progressCallback);
    } else {
        // --- Multi-Call/Chunk Strategy (Safe Path for large contexts) ---
        console.log(`[INFO] Contexto grande (${estimatedTokens} tokens). Usando estratégia de chamada por seção.`);
        fullHtmlContent = await generateInChunks(params, structures, persona, knowledgeBase, progressCallback);
    }

    return {
        title: projectName,
        content: fullHtmlContent
    };
};
