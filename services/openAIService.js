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

const markdownToHtml = (text) => {
    let htmlContent = text;
    // Basic Sanitation & Table cleanup (simple version)
    htmlContent = htmlContent.replace(/^\s*\|?\s*:?-{3,}:?\s*\|?\s*$/gm, '').replace(/^\s*\|(.*?)\|?\s*$/gm, '$1').trim();
    htmlContent = htmlContent.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    
    // Process lists first to keep them as single blocks
    htmlContent = htmlContent.replace(/((?:^[ \t]*[-*] .*(?:\n|$))+)/gm, (match) => `<ul>${match.trim().split('\n').map(line => `<li>${line.replace(/^[ \t]*[-*]\s+/, '')}</li>`).join('')}</ul>`);
    htmlContent = htmlContent.replace(/((?:^[ \t]*\d+\. .*(?:\n|$))+)/gm, (match) => `<ol>${match.trim().split('\n').map(line => `<li>${line.replace(/^[ \t]*\d+\.\s+/, '')}</li>`).join('')}</ol>`);

    // Process other block-level elements
    htmlContent = htmlContent.replace(/^###### (.*$)/gm, '<h6>$1</h6>').replace(/^##### (.*$)/gm, '<h5>$1</h5>').replace(/^#### (.*$)/gm, '<h4>$1</h4>').replace(/^### (.*$)/gm, '<h3>$1</h3>').replace(/^## (.*$)/gm, '<h2>$1</h2>').replace(/^# (.*$)/gm, '<h1>$1</h1>');
    htmlContent = htmlContent.replace(/^\s*(?:\*|-|_){3,}\s*$/gm, '<hr />');

    // Process inline elements
    htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/`+([^`]+?)`+/g, '<code>$1</code>');

    // Process paragraphs
    const paragraphs = htmlContent.split(/\n\n+/);
    htmlContent = paragraphs.map(p => {
        if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<hr')) return p;
        if (p.trim() === '') return '';
        return `<p>${p.replace(/\n/g, '<br />')}</p>`;
    }).join('');

    // Final cleanup
    htmlContent = htmlContent.replace(/<p><br \/><\/p>/g, '');
    return htmlContent;
}

const structureToString = (structure) => {
  return structure.map(item => {
      let s = `- ${item.title}`;
      if (item.children && item.children.length > 0) {
          s += `\n${item.children.map(child => `  - ${child.title}`).join('\n')}`;
      }
      return s;
  }).join('\n');
};

export const generateFullDocumentContent = async (params, structures, progressCallback) => {
  if (!openAIApiKey) throw new Error("A API OpenAI não foi inicializada.");

  const { projectName, description, team, docType, teamData } = params;
  const { technicalStructure, supportStructure } = structures;
  const persona = getBaseSystemPersona(team);
  
  // --- ETAPA DE RESUMO (MAP) ---
  const allCodeFiles = [...(teamData.folderFiles || []), ...(teamData.uploadedCodeFiles || [])];
  let summarizedCodeContext = '';
  
  if (allCodeFiles.length > 0) {
    const summaryPersona = 'Você é um engenheiro de software sênior. Sua tarefa é ler o código-fonte de um arquivo e criar um resumo técnico conciso e informativo. Foque no propósito do arquivo, suas principais funcionalidades, a lógica de negócios implementada e como ele se conecta com outras partes de um sistema. O resumo será usado como contexto para gerar uma documentação completa posteriormente. Responda APENAS com o resumo do código, em Português do Brasil.';
    
    for (let i = 0; i < allCodeFiles.length; i++) {
        const file = allCodeFiles[i];
        const progress = 5 + Math.round((i / allCodeFiles.length) * 60); // Progress from 5% to 65%
        const fileName = file.path || file.name;
        progressCallback({ progress, message: `Resumindo arquivo ${i + 1} de ${allCodeFiles.length}: ${fileName}` });

        const summaryPrompt = `Analise e resuma o seguinte arquivo de código:\n\n--- Arquivo: ${fileName} ---\n\n${file.content}`;
        const summary = await callOpenAI([
            { role: "system", content: summaryPersona },
            { role: "user", content: summaryPrompt }
        ]);
        summarizedCodeContext += `--- Resumo do arquivo: ${fileName} ---\n${summary}\n\n`;
    }
  }

  // --- ETAPA DE COMPILAÇÃO (REDUCE) ---
  progressCallback({ progress: 70, message: 'Compilando resumos e contexto...' });
  const otherTeamData = { ...teamData, folderFiles: [], uploadedCodeFiles: [] }; // Remove full code files
  const otherContext = buildTeamContext(otherTeamData);
  const finalContext = summarizedCodeContext ? `**Resumos dos Arquivos de Código:**\n${summarizedCodeContext}\n**Outros Contextos Fornecidos:**\n${otherContext}` : otherContext;

  let messages = [ { role: "system", content: persona } ];
  let fullMarkdownResponse = "";

  // --- ETAPA DE GERAÇÃO (TECHNICAL) ---
  if ((docType === 'technical' || docType === 'both') && technicalStructure?.length > 0) {
    progressCallback({ progress: 75, message: 'Escrevendo a documentação técnica...' });
    
    const technicalStructureString = structureToString(technicalStructure);
    const mainPrompt = `
      Sua tarefa é atuar como um escritor técnico especialista e criar o conteúdo completo para um documento, seguindo a estrutura pré-aprovada.

      **Estrutura Técnica Aprovada (Siga FIELMENTE):**
      ${technicalStructureString}

      **Instruções Chave:**
      0.  **Baseado em Evidências:** Sua análise deve se basear **estritamente** no contexto fornecido (resumos de código, imagens, textos). **NÃO INVENTE** detalhes técnicos ou funcionalidades que não existam explicitamente no contexto.
      1.  **Documente o Presente, Não o Futuro (REGRA CRÍTICA):** Documente o estado **ATUAL** do projeto. É estritamente **PROIBIDO** sugerir melhorias, funcionalidades futuras, ou próximos passos. Foque apenas no que existe.
      2.  **COMPLETUDE MÁXIMA:** Seja **exaustivo** e **extremamente detalhado**. Sua missão é extrair e explicar **TODA** a informação relevante do contexto. Não resuma ou omita detalhes por brevidade. O objetivo é uma documentação completa, não um resumo. Imagine que o leitor não tem nenhum conhecimento prévio do projeto.
      3.  **Análise Holística:** Relacione **TODAS** as fontes de contexto para entender o projeto de forma completa ao escrever. Por exemplo, explique como um screenshot de uma UI se conecta com os resumos dos componentes que a implementam.
      4.  **Formatação Markdown RÍGIDA (Estilo Google Docs):**
          - **PROIBIDO:** NUNCA use blocos de código com três crases (\`\`\`).
          - **CORRETO:** Para código em linha, use crases SIMPLES (\`).
          - **CORRETO:** Para blocos de código com várias linhas, insira-os como texto simples, preservando a indentação original e a sintaxe.
          - Use títulos Markdown (#, ##) para as seções da estrutura aprovada.
      5.  **Deploy e Uso:** Se o usuário fornecer informações de deploy, use-as. Se não, **NÃO INVENTE**. Para arquivos simples (HTML/CSS/JS), explique como abrir diretamente no navegador.
      6.  **Tradução de JSON de Automação:** Se o contexto contiver um JSON de N8N, **TRADUZA** o JSON em uma descrição funcional e detalhada do fluxo de trabalho, explicando o propósito de cada nó, seus parâmetros mais importantes e como eles se conectam.

      **Informações do Projeto:**
      - Nome do Projeto: ${projectName}
      - Descrição/Objetivo Principal: ${description}
      - Equipe Alvo da Documentação: ${team}

      **Contexto Completo para sua Análise:**
      ${finalContext}

      **Sua Resposta:**
      Gere a documentação técnica completa e detalhada, preenchendo cada seção da estrutura aprovada. Comece diretamente com o primeiro título da estrutura. NÃO inclua o nome do projeto como um título principal, ele será adicionado depois.
    `;
    messages.push({ role: "user", content: buildUserMessageContent(mainPrompt, teamData) });
    const technicalText = await callOpenAI(messages);
    fullMarkdownResponse += technicalText;
  }
  
  // --- ETAPA DE GERAÇÃO (SUPPORT) ---
  if ((docType === 'support' || docType === 'both') && supportStructure?.length > 0) {
    const progressStart = (docType === 'both') ? 85 : 75;
    progressCallback({ progress: progressStart, message: 'Criando o guia do usuário...' });
    
    if (fullMarkdownResponse) {
        messages.push({ role: "assistant", content: fullMarkdownResponse });
    }

    const supportStructureString = structureToString(supportStructure);
    const supportPrompt = `
      Com base em TODO o contexto do projeto, sua tarefa agora é criar o conteúdo detalhado para o **Guia do Usuário**, seguindo a estrutura pré-aprovada. A linguagem deve ser a mais simples possível, focada em um usuário não-técnico.

      **Estrutura de Suporte Aprovada (Siga FIELMENTE):**
      ${supportStructureString}

      **PRINCÍPIOS-CHAVE:**
      1.  **TRADUÇÃO PROFUNDA DE CÓDIGO/IMAGENS PARA AÇÕES:** Para **CADA** funcionalidade identificada, crie um tutorial passo a passo. Seja visual na sua descrição.
      2.  **SIMPLICIDADE:** Evite jargões técnicos a todo custo.
      3.  **SOLUÇÃO DE PROBLEMAS CONTEXTUAL:** Na seção de "Solução de Problemas" (se houver), seja **altamente específico** para as dificuldades que um usuário poderia ter com **este aplicativo**, inferindo problemas do contexto.

      **Contexto Completo para sua Análise:**
      ${finalContext}

      **Sua Resposta (gere APENAS o Guia do Usuário completo, preenchendo a estrutura aprovada):**
    `;

    messages.push({ role: "user", content: buildUserMessageContent(supportPrompt, teamData) });
    const supportText = await callOpenAI(messages);
    
    if (fullMarkdownResponse) {
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