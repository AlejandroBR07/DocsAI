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
        const defaultMessage = "Ocorreu uma falha inesperada ao tentar se comunicar com a IA. Por favor, tente novamente mais tarde.";
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
        console.error("Erro da API OpenAI:", errorData);
        throw new Error(userMessage);
    }

    const data = await apiResponse.json();
    const aiContent = data.choices[0]?.message?.content || "";
    console.log("%c[DEBUG] Resposta Bruta da IA:", "color: #ff9800; font-weight: bold;", `\n\n${aiContent}`);
    return aiContent;
};

const getBaseSystemPersona = (team) => {
  switch (team) {
    case Team.Developers:
      return 'Aja como um engenheiro de software sênior e arquiteto de soluções. Sua tarefa é criar a documentação mais detalhada possível, exclusivamente em Português do Brasil.';
    case Team.UXUI:
       return 'Aja como um especialista em UX/UI e Product Designer, com foco em clareza para a equipe de desenvolvimento. Analise contextos visuais como designs do Figma, landing pages e screenshots de plataformas (Learnworlds, apps). Sua tarefa é criar a documentação mais detalhada possível, exclusivamente em Português do Brasil.';
    case Team.Automations:
      return 'Aja como um especialista em automação de processos (RPA e integrações), com conhecimento em N8N, Unnichat e Apps Script. Seu superpoder é traduzir a estrutura de dados de uma automação (JSON do N8N), fluxos de conversa (Unnichat) ou código (Apps Script) em uma explicação clara e funcional. Sua tarefa é criar a documentação mais detalhada possível, exclusivamente em Português do Brasil.';
    case Team.AI:
      return 'Aja como um engenheiro de IA especialista em arquitetura de agentes, com foco em plataformas como o Dify. Analise fluxos de trabalho, ferramentas e prompts de sistema para criar documentação técnica detalhada. Sua tarefa é criar a documentação mais detalhada possível, exclusivamente em Português do Brasil.';
    default:
      return 'Você é um assistente de IA especialista em criar documentação técnica e de negócios. Sua resposta deve ser exclusivamente em Português do Brasil.';
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

    const blocks = markdown.split('\n\n');

    const htmlBlocks = blocks.map(block => {
        block = block.trim();
        if (block.length === 0) return '';

        // Code Blocks (```)
        if (block.startsWith('```')) {
            const code = block.replace(/```\w*\n?/, '').replace(/```$/, '').trim();
            const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            return `<pre style="background-color: #2d3748; color: #e2e8f0; padding: 1em; border-radius: 8px; white-space: pre-wrap; word-wrap: break-word; font-family: 'Courier New', Courier, monospace; font-size: 14px; line-height: 1.5;"><code>${escapedCode}</code></pre>`;
        }
        
        // Headers (#, ##, ###)
        if (block.startsWith('### ')) return `<h3>${block.substring(4)}</h3>`;
        if (block.startsWith('## ')) return `<h2>${block.substring(3)}</h2>`;
        if (block.startsWith('# ')) return `<h1>${block.substring(2)}</h1>`;
        
        // Blockquotes (>)
        if (block.startsWith('> ')) {
             const quoteContent = block.split('\n').map(line => line.replace(/^\> ?/, '')).join('<br>');
             return `<blockquote style="border-left: 4px solid #6366f1; padding-left: 1em; margin-left: 0; color: #d1d5db; font-style: italic;">${quoteContent}</blockquote>`;
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
                    listHtml += `<li>${ulMatch[1]}</li>`;
                } else if (olMatch) {
                     if (listType !== 'ol') {
                        if (listType) listHtml += `</${listType}>`;
                        listHtml += '<ol>';
                        listType = 'ol';
                    }
                    listHtml += `<li>${olMatch[1]}</li>`;
                }
            });
            if (listType) listHtml += `</${listType}>`;
            return listHtml;
        }

        // Paragraphs
        return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    });

    let fullHtml = htmlBlocks.join('');

    // Inline elements
    fullHtml = fullHtml
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code style="background-color: #4a5568; color: #e2e8f0; padding: 0.2em 0.4em; border-radius: 4px; font-family: \'Courier New\', Courier, monospace; font-size: 0.9em;">$1</code>');

    return fullHtml;
};

const summarizeCodeInChunks = async (teamContext, persona, teamData, progressCallback, totalSteps) => {
    const allFiles = teamData.folderFiles || [];
    const allContent = allFiles.map(file => `--- Arquivo: ${file.path} ---\n${file.content}\n\n`).join('');
    
    const CHUNK_SIZE = 80000; // Approx characters for a chunk
    const chunks = [];
    for (let i = 0; i < allContent.length; i += CHUNK_SIZE) {
        chunks.push(allContent.substring(i, i + CHUNK_SIZE));
    }

    const summaries = [];
    const baseProgress = 10;
    const progressPerChunk = (80 - baseProgress) / (chunks.length || 1);
    
    if (chunks.length > 1) {
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            progressCallback({ progress: baseProgress + (i * progressPerChunk), message: `Resumindo parte ${i + 1} de ${chunks.length} do código...` });
            
            const summaryPrompt = `Aja como um engenheiro sênior. O texto a seguir é uma parte de um projeto de software maior. Resuma o propósito técnico desta parte específica do código, focando em suas funcionalidades, responsabilidades e interações. Responda em Português do Brasil.\n\n${chunk}`;
            
            const messages = [
                { role: "system", content: persona },
                { role: "user", content: buildUserMessageContent(summaryPrompt, teamData) }
            ];
            
            const summary = await callOpenAI(messages);
            summaries.push(summary);
        }
    } else {
         progressCallback({ progress: baseProgress, message: `Analisando o código...` });
         const summaryPrompt = `Aja como um engenheiro sênior. O texto a seguir representa um projeto de software. Resuma o propósito técnico deste código, focando em suas funcionalidades, responsabilidades e interações. Responda em Português do Brasil.\n\n${allContent}`;
         const messages = [
            { role: "system", content: persona },
            { role: "user", content: buildUserMessageContent(summaryPrompt, teamData) }
         ];
         const summary = await callOpenAI(messages);
         summaries.push(summary);
    }
    
    return summaries.join('\n\n---\n\n');
};

export const generateFullDocumentContent = async (params, structures, progressCallback) => {
    if (!openAIApiKey) throw new Error("A API OpenAI não foi inicializada.");
    
    const { projectName, description, team, teamData, docType } = params;
    const persona = getBaseSystemPersona(team);
    
    progressCallback({ progress: 5, message: 'Construindo contexto inicial...' });
    let teamContext = buildTeamContext(teamData, { includeFileContent: false }); // Start with file list

    let knowledgeBase = teamContext;
    const hasCodeContext = teamData.folderFiles || teamData.uploadedCodeFiles || teamData.pastedCode;

    if (hasCodeContext) {
        const fullCodeContext = buildTeamContext(teamData);
        const codeSummaries = await summarizeCodeInChunks(fullCodeContext, persona, teamData, progressCallback, 100);
        knowledgeBase += '\n\n**Resumo Técnico do Código-Fonte:**\n' + codeSummaries;
    }
    
    const META_SUMMARY_THRESHOLD = 90000;
    if (knowledgeBase.length > META_SUMMARY_THRESHOLD) {
        progressCallback({ progress: 85, message: 'Base de conhecimento muito grande, criando meta-resumo...' });
        const metaSummaryPrompt = `Você é um arquiteto de software sênior. Sua tarefa é sintetizar os seguintes resumos técnicos detalhados de várias partes de um projeto em um único resumo coeso de alto nível. Este meta-resumo será usado para escrever a documentação final. Capture a essência da arquitetura, as principais funcionalidades e as interações entre os componentes. Responda em Português do Brasil.\n\nResumos a serem sintetizados:\n${knowledgeBase}`;
        
        const messages = [{ role: "system", content: persona }, { role: "user", content: buildUserMessageContent(metaSummaryPrompt, teamData) }];
        knowledgeBase = await callOpenAI(messages);
    }

    const allSections = [];
    if (docType !== 'support') allSections.push(...structures.technicalStructure.flatMap(item => [item, ...(item.children || [])]));
    if (docType !== 'technical') allSections.push(...structures.supportStructure.flatMap(item => [item, ...(item.children || [])]));
    
    let fullHtmlContent = '';
    const baseProgress = 90;
    const progressPerSection = (100 - baseProgress) / (allSections.length || 1);

    for (let i = 0; i < allSections.length; i++) {
        const section = allSections[i];
        progressCallback({ progress: baseProgress + (i * progressPerSection), message: `Escrevendo seção: "${section.title}"...` });
        
        const isSupportTopic = structures.supportStructure.some(s => s.title === section.title || s.children?.some(c => c.title === section.title));
        const audiencePrompt = isSupportTopic
            ? "Escreva de forma clara e simples, como se estivesse explicando para um usuário final não-técnico."
            : "Escreva de forma detalhada e técnica, como se estivesse explicando para outro desenvolvedor.";

        const sectionPrompt = `
            Você é um escritor técnico contribuindo para uma seção de um documento maior. O documento completo já possui uma estrutura de tópicos. Sua única tarefa é escrever o corpo do texto para a seção específica: "**${section.title}**".

            **REGRAS CRÍTICAS:**
            1.  **FOCO ABSOLUTO:** Escreva *apenas* sobre o tópico "${section.title}". Não adicione introduções sobre o projeto, resumos gerais, ou conteúdo de outras seções. Vá direto ao ponto.
            2.  **CONTEÚDO, NÃO ESTRUTURA:** Sua resposta deve ser o conteúdo textual da seção. **NÃO crie uma nova lista de tópicos ou subtópicos** dentro da sua resposta, a menos que seja uma lista de itens pertinente ao conteúdo (ex: uma lista de parâmetros).
            3.  **SEM TÍTULO:** Não repita o título "**${section.title}**" no início da sua resposta. Comece diretamente com o primeiro parágrafo ou elemento de conteúdo.
            4.  **FORMATO:** Use Markdown simples (listas com \`-\` ou \`1.\`, negrito com \`**\`, etc.).
            5.  **AUDIÊNCIA:** ${audiencePrompt}
            6.  **IDIOMA:** Responda exclusivamente em Português do Brasil.
            
            **Contexto de Conhecimento (Use isso para informar sua escrita):**
            - Nome do Projeto: ${projectName}
            - Descrição Geral: ${description}
            - Resumos Técnicos e Arquitetura:
            ${knowledgeBase}

            Agora, escreva o conteúdo para a seção "${section.title}".
        `;
        
        const messages = [{ role: "system", content: persona }, { role: "user", content: buildUserMessageContent(sectionPrompt, teamData) }];
        const sectionContent = await callOpenAI(messages);
        
        const isSubItem = structures.technicalStructure.some(s => s.children?.some(c => c.id === section.id)) || structures.supportStructure.some(s => s.children?.some(c => c.id === section.id));
        const headingLevel = isSubItem ? 2 : 1;
        
        fullHtmlContent += `<h${headingLevel}>${section.title}</h${headingLevel}>\n${markdownToHtml(sectionContent)}\n\n`;
    }

    return {
        title: projectName,
        content: fullHtmlContent
    };
};
