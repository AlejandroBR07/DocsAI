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

export const generateDocumentStructure = async (params) => {
  if (!openAIApiKey) throw new Error("A API OpenAI não foi inicializada.");
  
  const { projectName, description, team, teamData } = params;
  const persona = getBaseSystemPersona(team);
  const teamContext = buildTeamContext(teamData);

  const structurePrompt = `
    Sua primeira tarefa é atuar como um arquiteto de documentação. Analise de forma holística TODO o contexto fornecido abaixo e proponha a melhor estrutura possível para um documento técnico e/ou de suporte.

    **REGRAS CRÍTICAS PARA A ESTRUTURA:**
    1.  **UNICIDADE:** A estrutura deve ser **100% única e adaptada** ao contexto. NÃO use um template genérico.
    2.  **LÓGICA:** Os tópicos devem seguir uma ordem lógica que facilite o entendimento.
    3.  **RELEVÂNCIA:** Crie seções que sejam genuinamente úteis com base no que você pode inferir do código, imagens e textos.
    4.  **FORMATO JSON:** Sua resposta DEVE ser um objeto JSON válido, contendo uma única chave "structure" que é um array de objetos. Cada objeto deve ter uma chave "title" (string) e opcionalmente uma chave "children" (um array de objetos com o mesmo formato, para sub-tópicos).
    5.  **PROFUNDIDADE:** Crie no máximo 2 níveis de profundidade (tópicos e sub-tópicos).
    6.  **IDIOMA:** Todos os títulos devem ser em Português do Brasil.

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

const markdownToHtml = (text) => {
    let htmlContent = text;
    htmlContent = htmlContent.replace(/^\s*\|?\s*:?-{3,}:?\s*\|?\s*$/gm, '').replace(/^\s*\|(.*?)\|?\s*$/gm, '$1').trim();
    htmlContent = htmlContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    htmlContent = htmlContent.replace(/^###### (.*$)/gm, '<h6>$1</h6>').replace(/^##### (.*$)/gm, '<h5>$1</h5>').replace(/^#### (.*$)/gm, '<h4>$1</h4>').replace(/^### (.*$)/gm, '<h3>$1</h3>').replace(/^## (.*$)/gm, '<h2>$1</h2>').replace(/^# (.*$)/gm, '<h1>$1</h1>');
    htmlContent = htmlContent.replace(/^\s*(?:\*|-|_){3,}\s*$/gm, '<hr />');
    htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/`+([^`]+?)`+/g, '<code>$1</code>');
    htmlContent = htmlContent.replace(/((?:^[ \t]*[-*] .*(?:\n|$))+)/gm, (match) => `<ul>${match.trim().split('\n').map(line => `<li>${line.replace(/^[ \t]*[-*]\s+/, '')}</li>`).join('')}</ul>`);
    htmlContent = htmlContent.replace(/((?:^[ \t]*\d+\. .*(?:\n|$))+)/gm, (match) => `<ol>${match.trim().split('\n').map(line => `<li>${line.replace(/^[ \t]*\d+\.\s+/, '')}</li>`).join('')}</ol>`);
    const paragraphs = htmlContent.split(/\n\n+/);
    htmlContent = paragraphs.map(p => {
        if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<hr')) return p;
        if (p.trim() === '') return '';
        return `<p>${p.replace(/\n/g, '<br />')}</p>`;
    }).join('');
    htmlContent = htmlContent.replace(/<p><br \/><\/p>/g, '');
    return htmlContent;
}

export const generateFullDocumentContent = async (params, structure, progressCallback) => {
  if (!openAIApiKey) throw new Error("A API OpenAI não foi inicializada.");

  const { projectName, description, team, docType, teamData } = params;
  const persona = getBaseSystemPersona(team);
  const teamContext = buildTeamContext(teamData);
  
  const structureString = structure.map(item => {
      let s = `- ${item.title}`;
      if (item.children && item.children.length > 0) {
          s += `\n${item.children.map(child => `  - ${child.title}`).join('\n')}`;
      }
      return s;
  }).join('\n');
  
  const mainPrompt = `
      Sua tarefa é atuar como um escritor técnico especialista e criar o conteúdo completo para um documento, seguindo a estrutura pré-aprovada.

      **Estrutura Aprovada (Siga FIELMENTE):**
      ${structureString}

      **Instruções Chave:**
      0.  **Baseado em Evidências:** Sua análise deve se basear **estritamente** no contexto fornecido (imagens, textos, códigos). **NÃO INVENTE** detalhes técnicos.
      1.  **Documente o Presente, Não o Futuro (REGRA CRÍTICA):** Documente o estado **ATUAL**. É estritamente **PROIBIDO** sugerir melhorias ou funcionalidades futuras.
      2.  **Análise Holística:** Relacione **TODAS** as fontes de contexto para entender o projeto de forma completa ao escrever.
      3.  **Profundidade Proporcional:** O nível de detalhe deve ser **proporcional à quantidade de contexto fornecido**. Contexto rico, documento detalhado. Contexto simples, documento conciso.
      4.  **Formatação Markdown RÍGIDA (Estilo Google Docs):**
          - **PROIBIDO:** NUNCA use blocos de código com três crases (\`\`\`).
          - **CORRETO:** Para código em linha, use crases SIMPLES (\`).
          - **CORRETO:** Para blocos de código com várias linhas, insira-os como texto simples, preservando a indentação.
          - Use títulos Markdown (#, ##) para as seções da estrutura aprovada.
      5.  **Deploy e Uso:** Se o usuário fornecer informações de deploy, use-as. Se não, **NÃO INVENTE**. Para arquivos simples (HTML/CSS/JS), explique como abrir no navegador.
      6.  **Tradução de JSON de Automação:** Se o contexto contiver um JSON de N8N, **TRADUZA** o JSON em uma descrição funcional do fluxo de trabalho, explicando cada nó, seus parâmetros e conexões.

      **Instruções Específicas para Análise de Código-Fonte:**
      Se o contexto incluir código-fonte, aja como um arquiteto sênior.
      - **Identifique a Tecnologia** (React, Vue, Node.js, etc.).
      - **Detalhe a Estrutura:** componentes, props, estados, DOM, CSS, e lógica.
      - **Descreva a Lógica de Negócios** e o fluxo de interação.

      **Informações do Projeto:**
      - Nome do Projeto: ${projectName}
      - Descrição/Objetivo Principal: ${description}
      - Equipe Alvo da Documentação: ${team}

      **Contexto Completo para sua Análise:**
      ${teamContext}

      **Sua Resposta:**
      Gere a documentação técnica completa e detalhada, preenchendo cada seção da estrutura aprovada. Comece diretamente com o primeiro título da estrutura. NÃO inclua o nome do projeto como um título principal, ele será adicionado depois.
    `;
  
  const supportInstruction = `
---
## 📖 Guia do Usuário

**Instrução Adicional OBRIGATÓRIA:** Com base em TODO o contexto do projeto, crie um guia de usuário final **INTELIGENTE, CRIATIVO e PRÁTICO**. A linguagem deve ser a mais simples possível.

**PRINCÍPIOS-CHAVE:**
1.  **ESTRUTURA 100% DINÂMICA:** **NÃO USE UM TEMPLATE FIXO.** Crie um título criativo e seções que emergem **naturalmente** da sua análise do aplicativo.
2.  **TRADUÇÃO PROFUNDA DE CÓDIGO/IMAGENS PARA AÇÕES:** Para **CADA** funcionalidade identificada, crie um tutorial passo a passo. Seja visual na sua descrição.
3.  **SOLUÇÃO DE PROBLEMAS CONTEXTUAL:** Crie uma seção de "Solução de Problemas" ou "Dicas e Truques" **altamente específica** para as dificuldades que um usuário poderia ter com **este aplicativo**, inferindo problemas do código ou do design.
`;
  
  let userTextPrompt;
  let messages = [
    { role: "system", content: persona },
  ];
  let fullMarkdownResponse = "";

  // Generate Technical Content if needed
  if (docType === 'technical' || docType === 'both') {
    progressCallback({ progress: 25, message: 'Escrevendo a documentação técnica...' });
    userTextPrompt = mainPrompt;
    messages.push({ role: "user", content: buildUserMessageContent(userTextPrompt, teamData) });
    const technicalText = await callOpenAI(messages);
    fullMarkdownResponse += technicalText;
  }
  
  // Generate Support Content if needed
  if (docType === 'support' || docType === 'both') {
    progressCallback({ progress: 75, message: 'Criando o guia do usuário...' });
    const supportOnlyIntro = `Com base em todo o contexto do projeto, sua única tarefa é criar um "Guia do Usuário". Ignore a criação de documentação técnica. Foque apenas na perspectiva de um usuário final não técnico.`;
    
    let supportUserPrompt = `
      **Informações do Projeto:**
      - Nome do Projeto: ${projectName}
      - Descrição/Objetivo Principal: ${description}
      - Equipe Alvo da Documentação: ${team}

      **Contexto Completo:**
      ${teamContext}
      
      ${docType === 'support' ? supportOnlyIntro : ''}
      ${supportInstruction}

      **Sua Resposta (gere APENAS o Guia do Usuário completo, começando com um título principal criativo e único como '# Título Criativo para ${projectName}'):**
    `;

    // For 'both', we add the technical doc as assistant context
    if (docType === 'both') {
        messages.push({ role: "assistant", content: fullMarkdownResponse });
        supportUserPrompt = `A documentação técnica está pronta. Agora, com base nela e em todo o contexto, crie o guia do usuário. ${supportInstruction}`;
    }
    
    messages.push({ role: "user", content: buildUserMessageContent(supportUserPrompt, teamData) });
    const supportText = await callOpenAI(messages);
    
    if (docType === 'both') {
        fullMarkdownResponse += "\n\n---\n\n" + supportText;
    } else {
        fullMarkdownResponse = supportText;
    }
  }

  progressCallback({ progress: 98, message: 'Polindo os últimos detalhes...' });
  
  let text = fullMarkdownResponse.trim();
  let title = projectName;
  let contentMarkdown = text;

  if (docType === 'support') {
      const lines = text.split('\n');
      if (lines[0].startsWith('# ')) {
          let extractedTitle = lines[0].substring(2).trim().replace(/(\*\*|__|\*|_)/g, '');
          title = extractedTitle || projectName;
          contentMarkdown = lines.slice(1).join('\n');
      }
  }

  console.log("%c[DEBUG] Markdown Final:", "color: #2196f3; font-weight: bold;", `\n\n${contentMarkdown}`);
  const htmlContent = markdownToHtml(contentMarkdown);
  console.log("%c[DEBUG] HTML Final:", "color: #4caf50; font-weight: bold;", `\n\n${htmlContent}`);
  return { title, content: htmlContent };
};