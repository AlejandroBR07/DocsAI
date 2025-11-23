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
                    model: "gpt-5.1",
                    messages: messages,
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
      return `Aja como um engenheiro de software sênior e arquiteto de soluções, especialista em full-stack. Sua principal habilidade é analisar um projeto completo (arquivos de frontend e backend) e documentá-los de forma clara e separada. ${baseInstruction}`;
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

const buildTeamContext = (teamData) => {
    let context = '';
    
    if (teamData.folderFiles && teamData.folderFiles.length > 0) {
      context += '**Estrutura e Conteúdo do Projeto (Pasta):**\n\n';
      context += teamData.folderFiles.map(file => `--- Arquivo: ${file.path} ---\n${file.content}\n\n`).join('');
    }

    if (teamData.uploadedCodeFiles && teamData.uploadedCodeFiles.length > 0) {
      context += '**Arquivos Avulsos Anexados:**\n\n';
      context += teamData.uploadedCodeFiles.map(file => `--- Arquivo: ${file.name} ---\n${file.content}\n\n`).join('');
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

const generateStructure = async (params, promptType) => {
  if (!openAIApiKey) throw new Error("A API OpenAI não foi inicializada.");
  
  const { projectName, description, team, teamData, responsiblePerson, creationDate, platformLink } = params;
  const persona = getBaseSystemPersona(team);
  const teamContext = buildTeamContext(teamData);

  let promptTypeInstruction = promptType === 'um documento técnico' 
    ? 'Crie seções que sejam genuinamente úteis com base no que você pode inferir do código, imagens e textos.'
    : 'Pense como um usuário final que não conhece o sistema. Crie seções como "Primeiros Passos", "Como Fazer X", "Solução de Problemas Comuns". NÃO use um template genérico.';
  
  if (team === Team.Developers && promptType === 'um documento técnico') {
      promptTypeInstruction += ' Se o projeto tiver componentes de frontend e backend, crie seções separadas para cada um (ex: "Arquitetura Frontend", "Arquitetura Backend").';
  }

  const structurePromptText = `
    Sua primeira tarefa é atuar como um arquiteto de documentação. Analise de forma holística TODO o contexto fornecido abaixo e proponha a melhor estrutura possível para ${promptType}.

    **REGRAS CRÍTICAS PARA A ESTRUTURA:**
    1.  **UNICIDADE E RELEVÂNCIA:** A estrutura deve ser **100% única e adaptada** ao contexto. ${promptTypeInstruction}
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

  const structurePrompt = `
    ${structurePromptText}
    
    **Informações do Projeto para Análise:**
    - Nome do Projeto: ${projectName}
    - Descrição/Objetivo Principal: ${description}
    - Responsável: ${responsiblePerson}
    - Data: ${creationDate}
    ${platformLink ? `- Link da Plataforma: ${platformLink}` : ''}
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
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.*?)__/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/_(.*?)_/g, '<em>$1</em>')
            // First, handle the incorrect double backticks by converting them to code
            .replace(/``(.*?)``/g, '<code>$1</code>')
            // Then, handle the correct single backticks
            .replace(/`([^`]+)`/g, '<code>$1</code>')
            .replace(/\[(Coloque aqui.*?)\]/g, '<span style="background-color: #4f46e5; color: white; padding: 2px 6px; border-radius: 4px; font-weight: 500;">$1</span>'); // Style placeholders
    };

    const lines = markdown.split('\n');
    let html = '';
    let currentBlock = { type: null, content: [] };

    const flushBlock = () => {
        if (currentBlock.type === null) return;
        switch (currentBlock.type) {
            case 'p':
                 const processedContent = currentBlock.content.map(processInline).join('<br>');
                 html += `<p>${processedContent}</p>\n`;
                 break;
            case 'ul':
            case 'ol':
                html += `<${currentBlock.type}>\n`;
                for (const item of currentBlock.content) { html += `  <li>${processInline(item)}</li>\n`; }
                html += `</${currentBlock.type}>\n`;
                break;
            case 'pre':
                const code = currentBlock.content.join('\n');
                const escapedCode = code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                html += `<pre><code>${escapedCode}</code></pre>\n`;
                break;
            case 'blockquote': html += `<blockquote>${processInline(currentBlock.content.join('<br>'))}</blockquote>\n`; break;
        }
        currentBlock = { type: null, content: [] };
    };

    for (const line of lines) {
        if (line.trim().startsWith('```')) {
            if (currentBlock.type === 'pre') { flushBlock(); } else { flushBlock(); currentBlock.type = 'pre'; }
            continue;
        }
        if (currentBlock.type === 'pre') { currentBlock.content.push(line); continue; }
        if (line.trim() === '') { flushBlock(); continue; }

        if (line.trim().match(/^(---|___|\*\*\*)\s*$/)) {
            flushBlock();
            html += '<hr />\n';
            continue;
        }
        
        const headingMatch = line.match(/^(#+)\s+(.*)/);
        if (headingMatch) {
            flushBlock();
            const level = headingMatch[1].length;
            const content = processInline(headingMatch[2].trim());
            html += `<h${level}>${content}</h${level}>\n`;
            continue;
        }
        const bqMatch = line.match(/^>\s?(.*)/);
        if (bqMatch) {
            if (currentBlock.type !== 'blockquote') { flushBlock(); currentBlock.type = 'blockquote'; }
            currentBlock.content.push(bqMatch[1]);
            continue;
        }
        const ulMatch = line.match(/^\s*[-*+]\s+(.*)/);
        const olMatch = line.match(/^\s*\d+\.\s+(.*)/);
        if (ulMatch || olMatch) {
            const listType = ulMatch ? 'ul' : 'ol';
            const itemContent = ulMatch ? ulMatch[1] : olMatch[1];
            if (currentBlock.type !== listType) { flushBlock(); currentBlock.type = listType; }
            currentBlock.content.push(itemContent.trim());
            continue;
        }
        if (currentBlock.type !== 'p') { flushBlock(); currentBlock.type = 'p'; }
        currentBlock.content.push(line);
    }

    flushBlock();
    return html;
};

const buildGenerationPrompt = (params, structures, knowledgeBase) => {
    const { projectName, description, docType, team, responsiblePerson, creationDate, platformLink } = params;

    const header = `
**CABEÇALHO OBRIGATÓRIO:**
Sua primeira ação DEVE ser gerar um cabeçalho formatado com as seguintes informações, seguido por uma linha horizontal em Markdown (\`---\`). Se um campo não for fornecido (como o Link), omita a linha inteira.
**Nome do Projeto:** ${projectName}
**Responsável:** ${responsiblePerson}
**Data de Atualização:** ${creationDate}
${platformLink ? `**Link da Plataforma:** ${platformLink}` : ''}
---
    `.trim();

    const generalRules = `
**REGRAS GERAIS E INEGOCIÁVEIS (APLICAM-SE A AMBAS AS SEÇÕES):**
1.  **MARKDOWN PURO E COMPLETO:** Sua resposta DEVE ser um único documento em Markdown. Você vai receber uma lista de títulos. Use a sintaxe correta do Markdown para recriar essa estrutura (\`# Título Principal\`, \`## Sub-título\`, etc.) e, em seguida, preencha o conteúdo abaixo de cada título.
2.  **PARÁGRAFOS CURTOS:** SEMPRE quebre ideias complexas em múltiplos parágrafos pequenos. Um parágrafo NUNCA deve ter mais de 4 ou 5 frases. Priorize a legibilidade e o espaço em branco.
3.  **QUEBRA DE LINHA:** **Use quebras de linha duplas (uma linha em branco) para separar parágrafos.**
4.  **NÃO REPITA TÍTULOS:** **NÃO** inclua o título da seção no corpo do texto que você escreve. Comece a escrever o parágrafo diretamente.
5.  **DESTAQUES VISUAIS:** **Use negrito (\`**texto**\`) EXTENSIVAMENTE** para destacar **TODAS** as palavras-chave, nomes de funcionalidades (ex: **Guia do Aluno**), e conceitos importantes. Use código em linha com **UM ÚNICO ACENTO GRAVE** (\`código\`) para nomes de arquivos, variáveis, e trechos de código. **NUNCA** use acentos graves duplos (\`\`código\`\`) para código em linha.
6.  **PLACEHOLDERS DE IMAGEM:** Onde for apropriado, especialmente no Guia do Usuário, insira placeholders para imagens para que o usuário possa adicionar screenshots. Use o formato \`[Coloque aqui uma imagem mostrando o botão 'Salvar']\`. Seja específico sobre o que a imagem deve mostrar.
7.  **CONTEÚDO FIEL AO CONTEXTO:** Baseie TODA a sua escrita no 'Contexto do Projeto' fornecido.
8.  **IDIOMA:** Responda exclusivamente em Português do Brasil.
    `.trim();

    const contextBlock = `
**Contexto do Projeto (Sua fonte de verdade):**
- Nome do Projeto: ${projectName}
- Descrição Geral: ${description}
- Arquivos, código e outras informações:
${knowledgeBase}
    `.trim();

    let technicalRules = `
**REGRAS PARA DOCUMENTAÇÃO TÉCNICA:**
- **Foco no Desenvolvedor:** A linguagem deve ser técnica e precisa.
- **Seja Fiel ao Código:** Você DEVE ativamente referenciar o código-fonte, mencionando nomes de funções (\`handleApiKeySet\`), variáveis (\`apiKeyStatus\`), ou arquivos (\`CreationModal.js\`) para tornar a documentação concreta e útil para desenvolvedores.
    `.trim();

    if (team === Team.Developers) {
        technicalRules += `
- **SEPARAÇÃO FRONTEND/BACKEND:** Ao analisar o contexto, identifique quais arquivos e lógicas pertencem ao Frontend (ex: React, HTML, CSS, componentes de UI) e quais pertencem ao Backend (ex: API, banco de dados, lógica de servidor). Estruture sua resposta de forma que a documentação do Frontend seja apresentada primeiro, seguida pela documentação do Backend em seções claramente distintas, se ambas existirem.`;
    }

    const supportRules = `
**REGRAS PARA GUIA DO USUÁRIO:**
- **Foco no Usuário Final:** Sua perspectiva DEVE ser a de um usuário leigo que nunca viu o sistema. A linguagem deve ser simples, amigável e direta.
- **NÃO FALE SOBRE CÓDIGO:** Não mencione nomes de arquivos, funções, variáveis, APIs, ou qualquer detalhe técnico de implementação.
- **Fale Sobre a Interface:** Em vez de código, descreva a interface. Diga "Clique no botão 'Salvar'", "Preencha o campo 'Seu Nome'", "Navegue até a seção 'Configurações'". Use o contexto das imagens (screenshots) para guiar suas explicações. O objetivo é ensinar o usuário a USAR a ferramenta, não a entender como ela foi construída.
    `.trim();

    const addStructureToOutline = (structure, level) => {
        let outline = '';
        structure.forEach(item => {
            outline += `${'#'.repeat(level)} ${item.title}\n`;
            if (item.children) {
                outline += addStructureToOutline(item.children, level + 1);
            }
        });
        return outline;
    };
    
    if (docType === 'technical') {
        const technicalOutline = addStructureToOutline(structures.technicalStructure, 1);
        return `
Sua tarefa é gerar o conteúdo completo para um documento técnico, seguindo a estrutura de tópicos fornecida.
${header}
${technicalRules}
${generalRules}
**Estrutura do Documento Técnico que você deve seguir e preencher:**
${technicalOutline}
${contextBlock}
Agora, gere o documento Markdown completo, começando pelo conteúdo do primeiro título.
        `.trim();
    }

    if (docType === 'support') {
        const supportOutline = addStructureToOutline(structures.supportStructure, 1);
        return `
Sua tarefa é gerar o conteúdo completo para um Guia do Usuário, seguindo a estrutura de tópicos fornecida.
${header}
${supportRules}
${generalRules}
**Estrutura do Guia do Usuário que você deve seguir e preencher:**
${supportOutline}
${contextBlock}
Agora, gere o documento Markdown completo, começando pelo conteúdo do primeiro título.
        `.trim();
    }

    if (docType === 'both') {
        const technicalOutline = addStructureToOutline(structures.technicalStructure, 1);
        const supportOutline = addStructureToOutline(structures.supportStructure, 1);
        return `
Sua tarefa é gerar um documento completo com duas seções distintas: uma Documentação Técnica e um Guia do Usuário, seguindo as estruturas fornecidas.

**PROCESSO OBRIGATÓRIO:**
1.  **Gere a Documentação Técnica:** Escreva o conteúdo completo para a seção técnica, seguindo as regras e a estrutura dela.
2.  **Insira um Separador:** Após terminar TODA a parte técnica, insira uma linha horizontal (\`---\`) e, em uma nova linha, um novo título principal \`# Guia do Usuário\`.
3.  **Gere o Guia do Usuário:** Abaixo do novo título, escreva o conteúdo completo para o guia do usuário, seguindo as regras e a estrutura dele.

${header}

**SEÇÃO 1: DOCUMENTAÇÃO TÉCNICA**
${technicalRules}
**Estrutura da Documentação Técnica (Preencha o conteúdo para cada tópico):**
${technicalOutline}

**SEÇÃO 2: GUIA DO USUÁRIO**
${supportRules}
**Estrutura do Guia do Usuário (Preencha o conteúdo para cada tópico após o separador e o novo título 'Guia do Usuário'):**
${supportOutline}

${generalRules}
${contextBlock}

Agora, gere o documento Markdown completo, começando pelo cabeçalho, depois a documentação técnica, o separador, e finalmente o guia do usuário.
        `.trim();
    }
    
    return ''; // Should not happen
};


const generateContentInSingleCall = async (params, structures, persona, knowledgeBase, progressCallback) => {
    progressCallback({ progress: 20, message: 'Analisando todo o contexto...' });
    
    const finalPrompt = buildGenerationPrompt(params, structures, knowledgeBase);

    progressCallback({ progress: 50, message: 'Gerando rascunho de todo o documento...' });

    const messages = [{ role: "system", content: persona }, { role: "user", content: buildUserMessageContent(finalPrompt, params.teamData) }];
    const markdownResponse = await callOpenAI(messages);
    
    // Clean up potential markdown code block wrappers from the response.
    let cleanedMarkdown = markdownResponse;
    const codeBlockRegex = /^\s*```(?:markdown)?\s*([\s\S]*?)\n\s*```\s*$/;
    const match = cleanedMarkdown.match(codeBlockRegex);
    if (match && match[1]) {
        console.log("[INFO] Removed markdown code block wrapper from AI response.");
        cleanedMarkdown = match[1];
    }


    progressCallback({ progress: 85, message: 'Formatando documento final...' });

    return markdownToHtml(cleanedMarkdown);
};

export const generateFullDocumentContent = async (params, structures, progressCallback) => {
    if (!openAIApiKey) throw new Error("A API OpenAI não foi inicializada.");
    
    const { projectName } = params;
    const persona = getBaseSystemPersona(params.team);
    
    progressCallback({ progress: 10, message: 'Construindo base de conhecimento...' });
    const knowledgeBase = buildTeamContext(params.teamData);
    
    console.log(`[INFO] Usando estratégia de chamada única com GPT-5.1.`);
    const fullHtmlContent = await generateContentInSingleCall(params, structures, persona, knowledgeBase, progressCallback);

    return {
        title: projectName,
        content: fullHtmlContent
    };
};