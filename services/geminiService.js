import { Team } from "../types.js";

let openAIApiKey = null;

// NOTE: The function name is kept as `initializeGemini` to avoid extensive refactoring,
// but it now initializes the OpenAI API key.
export const initializeGemini = (apiKey) => {
  if (!apiKey) {
    console.error("A chave de API é necessária para inicializar o serviço OpenAI.");
    return false;
  }
  openAIApiKey = apiKey;
  return true;
};

const createCacheKey = (params) => {
    const { projectName, description, team, docType, teamData } = params;
    
    const folderFilesKey = teamData.folderFiles?.map(f => `${f.path}:${f.content}`).join('|') || '';
    const uploadedFilesKey = teamData.uploadedCodeFiles?.map(f => `${f.name}:${f.content}`).join('|') || '';
    const imagesKey = teamData.images?.map(img => img.data.substring(0, 200)).join('|') || ''; // Use a substring

    const keyData = {
        projectName, description, team, docType,
        pastedCode: teamData.pastedCode,
        databaseSchema: teamData.databaseSchema,
        dependencies: teamData.dependencies,
        json: teamData.json,
        triggerInfo: teamData.triggerInfo,
        externalApis: teamData.externalApis,
        systemPrompt: teamData.systemPrompt,
        workflow: teamData.workflow,
        tools: teamData.tools,
        exampleIO: teamData.exampleIO,
        guardrails: teamData.guardrails,
        personas: teamData.personas,
        userFlows: teamData.userFlows,
        folderFilesKey,
        uploadedFilesKey,
        imagesKey
    };
    
    const jsonString = JSON.stringify(keyData);
    let hash = 0;
    if (jsonString.length === 0) return 'synapse-cache-empty';
    for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0; // Convert to 32bit integer
    }
    return `synapse-cache-${hash}`;
};


const markdownToHtml = (text) => {
    let htmlContent = text;

    // Cleanup for AI-generated Markdown table artifacts around code blocks
    // Removes lines like |:---| or |---|
    htmlContent = htmlContent.replace(/^\s*\|?\s*:?-{3,}:?\s*\|?\s*$/gm, '');
    // Removes leading/trailing pipes from single-column tables
    htmlContent = htmlContent.replace(/^\s*\|(.*?)\|?\s*$/gm, '$1').trim();

    htmlContent = htmlContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    // Headings (process from most specific to least specific)
    htmlContent = htmlContent
      .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
      .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>');

    // Horizontal Rule
    htmlContent = htmlContent.replace(/^\s*(?:\*|-|_){3,}\s*$/gm, '<hr />');

    // Inline elements
    htmlContent = htmlContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    // Lists (process unordered lists first)
    // Matches blocks of lines starting with * or -
    htmlContent = htmlContent.replace(/((?:^[ \t]*[-*] .*(?:\n|$))+)/gm, (match) => {
        const items = match.trim().split('\n').map(line => {
            return `<li>${line.replace(/^[ \t]*[-*]\s+/, '')}</li>`;
        });
        return `<ul>${items.join('')}</ul>`;
    });

    // Lists (process ordered lists)
    // Matches blocks of lines starting with 1. 2. etc.
    htmlContent = htmlContent.replace(/((?:^[ \t]*\d+\. .*(?:\n|$))+)/gm, (match) => {
        const items = match.trim().split('\n').map(line => {
            return `<li>${line.replace(/^[ \t]*\d+\.\s+/, '')}</li>`;
        });
        return `<ol>${items.join('')}</ol>`;
    });

    // Paragraphs and Newlines
    // Treat double newlines as paragraph breaks
    const paragraphs = htmlContent.split(/\n\n+/);
    htmlContent = paragraphs.map(p => {
        if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<hr')) {
            return p; // Don't wrap block elements in <p>
        }
        if (p.trim() === '') {
            return '';
        }
        // Replace single newlines with <br> inside paragraphs
        return `<p>${p.replace(/\n/g, '<br />')}</p>`;
    }).join('');
    
    // Cleanup any <p><br /></p> that might result from stray newlines
    htmlContent = htmlContent.replace(/<p><br \/><\/p>/g, '');
    
    // --- Security Sanitization Pass ---
    let sanitizedHtml = htmlContent;
    // 1. Remove script tags and their content entirely.
    sanitizedHtml = sanitizedHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
    // 2. Remove all on* event attributes (e.g., onclick, onerror).
    sanitizedHtml = sanitizedHtml.replace(/\s(on\w+)=(".*?"|'.*?'|[^ >]+)/gi, '');
    // 3. Remove javascript: URLs from href and src attributes to prevent script execution.
    sanitizedHtml = sanitizedHtml.replace(/(href|src)=["']\s*javascript:.+?["']/gi, '$1=""');
    // --- End of Security Sanitization ---

    return sanitizedHtml;
}

const callOpenAI = async (messages) => {
    const apiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${openAIApiKey}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: messages,
            max_tokens: 16384,
        })
    });

    if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        const defaultMessage = "Ocorreu uma falha inesperada ao tentar gerar o documento. Por favor, tente novamente mais tarde.";
        let userMessage = errorData.error?.message || defaultMessage;

        if (userMessage.includes('Incorrect API key')) {
            userMessage = "Sua chave de API da OpenAI é inválida. Por favor, verifique-a na tela de configuração.";
        } else if (apiResponse.status === 429) {
            userMessage = "Você excedeu sua cota atual da API OpenAI ou o limite de requisições. Verifique seu plano e detalhes de faturamento.";
        } else if (errorData.error?.code === 'context_length_exceeded') {
             userMessage = "O contexto fornecido (código, imagens, texto) é muito grande. Tente reduzir a quantidade de arquivos ou o tamanho do texto e tente novamente.";
        }
        else {
            userMessage = `Erro da IA: ${userMessage}`;
        }
        console.error("Erro da API OpenAI:", errorData);
        throw new Error(userMessage);
    }

    const data = await apiResponse.json();
    return data.choices[0]?.message?.content || "";
};

export const generateDocumentContent = async (params, progressCallback) => {
  if (!openAIApiKey) {
    throw new Error("A API OpenAI não foi inicializada. Por favor, configure sua chave de API na tela inicial.");
  }
  
  const cacheKey = createCacheKey(params);
  try {
      const cachedData = sessionStorage.getItem(cacheKey);
      if (cachedData) {
          console.log("Carregando documento do cache da sessão.");
          progressCallback({ progress: 100, message: 'Carregado do cache...' });
          // Short delay to allow UI to show message before closing
          await new Promise(resolve => setTimeout(resolve, 300));
          return JSON.parse(cachedData);
      }
  } catch (e) {
      console.warn("Não foi possível acessar o cache da sessão.", e);
  }


  const { projectName, description, team, docType, teamData } = params;
  try {
    
    let persona = 'Você é um assistente de IA especialista em criar documentação técnica e de negócios. Sua resposta deve ser exclusivamente em Português do Brasil.';
    switch (team) {
      case Team.Developers:
        persona = 'Aja como um engenheiro de software sênior e arquiteto de soluções. Sua tarefa é criar a documentação mais detalhada possível, exclusivamente em Português do Brasil.';
        break;
      case Team.UXUI:
         persona = 'Aja como um especialista em UX/UI e Product Designer, com foco em clareza para a equipe de desenvolvimento. Sua tarefa é criar a documentação mais detalhada possível, exclusivamente em Português do Brasil.';
        break;
      case Team.Automations:
        persona = 'Aja como um especialista em automação de processos (RPA e integrações). Sua tarefa é criar a documentação mais detalhada possível, exclusivamente em Português do Brasil.';
        break;
      case Team.AI:
        persona = 'Aja como um engenheiro de IA especialista em arquitetura de agentes e large language models. Sua tarefa é criar a documentação mais detalhada possível, exclusivamente em Português do Brasil.';
        break;
    }

    let teamContext = '';
    
    if (teamData.folderFiles && teamData.folderFiles.length > 0) {
      let folderContent = '**Estrutura e Conteúdo do Projeto (Pasta):**\n\n';
      for (const file of teamData.folderFiles) {
        folderContent += `--- Arquivo: ${file.path} ---\n${file.content}\n\n`;
      }
      teamContext += folderContent;
    }

    if (teamData.uploadedCodeFiles && teamData.uploadedCodeFiles.length > 0) {
      let filesContent = '**Arquivos Avulsos Anexados:**\n\n';
      for (const file of teamData.uploadedCodeFiles) {
        filesContent += `--- Arquivo: ${file.name} ---\n${file.content}\n\n`;
      }
      teamContext += filesContent;
    }
    
    if (teamData.pastedCode) {
        teamContext += `**Código Colado Adicional:**\n${teamData.pastedCode}\n\n`;
    }

    teamContext += teamData.databaseSchema ? `**Esquema do Banco de Dados:**\n${teamData.databaseSchema}\n` : '';
    teamContext += teamData.dependencies ? `**Dependências e Bibliotecas:**\n${teamData.dependencies}\n` : '';
    teamContext += (teamData.images && teamData.images.length > 0) ? 'Analise as imagens fornecidas como contexto visual para o projeto (ex: diagramas de fluxo, screenshots de interface).\n' : '';
    teamContext += teamData.personas ? `**Personas:**\n${teamData.personas}\n` : '';
    teamContext += teamData.userFlows ? `**Fluxos de Usuário (descrição textual):**\n${teamData.userFlows}\n` : '';
    teamContext += teamData.json ? `**Estrutura da Automação (JSON - ex: N8N):**\n${teamData.json}\nInterprete a estrutura JSON acima para detalhar os nós e a lógica.\n` : '';
    teamContext += teamData.triggerInfo ? `**Informações do Gatilho (Trigger):**\n${teamData.triggerInfo}\n` : '';
    teamContext += teamData.externalApis ? `**APIs Externas Envolvidas:**\n${teamData.externalApis}\n` : '';
    teamContext += teamData.systemPrompt ? `**System Prompt:**\n${teamData.systemPrompt}\n` : '';
    teamContext += teamData.workflow ? `**Fluxo de Trabalho/Conversa:**\n${teamData.workflow}\n` : '';
    teamContext += teamData.tools ? `**Ferramentas (Tools):**\n${teamData.tools}\n` : '';
    teamContext += teamData.exampleIO ? `**Exemplos de Entrada/Saída:**\n${teamData.exampleIO}\n` : '';
    teamContext += teamData.guardrails ? `**Guardrails e Regras de Segurança:**\n${teamData.guardrails}\n` : '';
    
    const mainPrompt = `
      Sua tarefa é atuar como um escritor técnico especialista e criar uma documentação **extremamente detalhada, completa e exaustiva** para o projeto a seguir.

      **Instruções Chave:**
      1.  **Análise Holística:** Você recebeu um contexto de múltiplas fontes (pastas de projeto, arquivos avulsos, código colado, imagens). Analise e relacione **TODAS** as fontes para entender o projeto de forma completa antes de escrever. Se houver múltiplos arquivos, sintetize a informação de todos eles em uma documentação coesa.
      2.  **Estrutura Dinâmica:** NÃO use um template fixo. Com base na sua análise holística do contexto, gere as seções e tópicos mais lógicos e úteis para ESTE projeto específico. Se o usuário fornecer um texto com placeholders como "[Descreva aqui]", sua tarefa é PREENCHER esses placeholders com conteúdo detalhado e relevante, usando o resto do contexto.
      3.  **Detalhe Exaustivo:** Para cada elemento encontrado no contexto (funções, componentes, endpoints, nós de automação), detalhe CADA parâmetro, prop, argumento, campo de dados e opção de configuração. Seja explícito sobre tipos, obrigatoriedade e valores padrão. O objetivo é um manual de referência, não um resumo. Não omita nenhum detalhe.
      4.  **Profundidade e Completude:** Sua meta é criar um documento tão completo que um novo membro da equipe possa entender o projeto de ponta a ponta sem precisar perguntar a ninguém. Não deixe lacunas. Se uma parte do contexto não for clara, use seu conhecimento como especialista para fazer suposições informadas e preencher os detalhes com as melhores práticas da indústria. O resultado final não deve conter placeholders.
      5.  **Guia "Primeiros Passos":** Se for relevante para o tipo de projeto, adicione uma seção "Primeiros Passos" logo após a introdução. Esta seção deve ser um guia rápido com etapas claras e práticas para que alguém possa começar a usar ou entender a funcionalidade principal rapidamente.
      6.  **Formatação Markdown RÍGIDA (Estilo Google Docs):**
          - **PROIBIDO:** NUNCA, sob nenhuma circunstância, use blocos de código com três crases (\`\`\`). A saída NÃO DEVE conter \`\`\`.
          - **PROIBIDO:** NUNCA formate blocos de código usando a sintaxe de tabelas Markdown (| ... |). O código deve ser texto simples.
          - **CORRETO:** Para código em linha (nomes de variáveis, funções, arquivos), use crases SIMPLES (\`). Exemplo: \`minhaFuncao()\`.
          - **PROIBIDO:** Não gere crases vazias ou com apenas espaços, como \` \` ou \`\`.
          - **CORRETO:** Para blocos de código com várias linhas, insira-os como texto simples, preservando a indentação e as quebras de linha, sem usar crases ou tabelas.
          - Use negrito (\*\*) para ênfase e títulos de seção.
      7.  **Padrão Google Docs:** A formatação final deve ser 100% compatível com o estilo e a estrutura de um documento profissional do Google Docs. Pense em como o conteúdo ficaria ao ser colado diretamente no Google Docs: títulos claros (usando #, ##, etc.), listas com marcadores ou números, e uso de negrito para destaque.
      8.  **Foco Interno:** Se estiver gerando documentação técnica, o foco é a equipe interna. EVITE adicionar seções genéricas de "Suporte e Contato", pois a equipe já conhece os canais de comunicação. Foque estritamente no conteúdo técnico e de processo do projeto.
      9.  **Listas Consistentes:** Dentro de uma mesma lista, use um estilo consistente. Se for uma lista numerada, use \`1.\`, \`2.\`, \`3.\`, etc. para todos os itens. Se for uma lista com marcadores, use \`-\` ou \`*\` para todos os itens. NÃO misture os estilos na mesma lista. Para listas numeradas que representam um passo a passo contínuo, a numeração DEVE ser sequencial (1, 2, 3...), mesmo que haja texto ou quebras de linha entre os itens. NÃO reinicie a contagem para cada sub-tópico.

      **Instruções Específicas para Análise de Código-Fonte (OBRIGATÓRIO):**
      Se o contexto fornecido for o código-fonte de uma aplicação (ex: React, Node.js), sua análise DEVE ser muito mais profunda do que um resumo. Você precisa agir como um arquiteto de software sênior fazendo uma revisão de código completa.
      - **Análise por Componente:** Para aplicações de frontend (como React), sua análise **DEVE** incluir uma seção detalhada para CADA componente principal (ex: App.js, CreationModal.js, DocumentPreview.js). Descreva a responsabilidade de cada um, seus principais estados (useState), efeitos (useEffect), props que recebe e as funções internas mais importantes.
      - **Lógica de Negócios e Serviços:** Analise os arquivos de serviço (como \`services/geminiService.js\`) e descreva a lógica de negócio principal, como a comunicação com APIs externas, a manipulação de dados e as funções-chave exportadas.
      - **Estrutura de Dados (Constantes e Tipos):** Identifique e explique o propósito de arquivos de constantes (\`constants.js\`) e tipos (\`types.js\`). Detalhe as estruturas de dados, como os templates e os enums, e como eles são usados na aplicação.
      - **Fluxo de Interação do Usuário:** Mapeie o fluxo de dados e o fluxo de interação do usuário através da aplicação. Descreva como um usuário vai do onboarding à criação de um documento e à sua visualização. Explique como os componentes se comunicam para alcançar isso. NÃO SEJA SUPERFICIAL. Conecte os pontos entre os diferentes arquivos para construir uma imagem completa da arquitetura.

      **Informações do Projeto:**
      - Nome do Projeto: ${projectName}
      - Descrição/Objetivo Principal: ${description}
      - Equipe Alvo da Documentação: ${team}

      **Contexto Adicional Fornecido para sua Análise:**
      ${teamContext || "Nenhum contexto adicional foi fornecido. Crie a estrutura e o conteúdo com base nas melhores práticas para um projeto com a descrição fornecida."}
    `;

    const supportInstruction = `
---
## 📖 Guia Completo do Usuário (Help Center)

**Instrução Adicional OBRIGATÓRIA (LEIA COM ATENÇÃO):** Sua tarefa é criar um guia de usuário final **EXTREMAMENTE DETALHADO, INTELIGENTE e PRÁTICO**. A linguagem deve ser a mais simples possível, como se você estivesse explicando para alguém que nunca usou um computador.

**INSTRUÇÃO CRÍTICA PARA ANÁLISE DE QUALQUER CÓDIGO-FONTE:**
O contexto que você recebeu pode ser de QUALQUER TIPO de projeto (React, HTML/CSS/JS puro, Node.js, etc.). Sua inteligência será medida pela sua capacidade de analisar um código-fonte desconhecido e **deduzir** suas funcionalidades do ponto de vista de um usuário final. Você **NÃO** deve resumir o código; você deve **TRADUZIR O CÓDIGO EM AÇÕES PRÁTICAS**.

Siga esta metodologia de análise:

1.  **Entenda o Propósito Geral:** Primeiro, analise todos os arquivos fornecidos para entender o objetivo principal da aplicação. Qual problema ela resolve? A quem se destina? Comece o guia com essa explicação simples.

2.  **Identifique as Funcionalidades-Chave:** Vasculhe o código em busca de interações do usuário. Procure por:
    *   **Componentes ou seções de HTML:** Nomes como \`Login\`, \`Dashboard\`, \`Editor\`, \`Settings\`, \`CreateUserForm\` são pistas fortes.
    *   **Manipuladores de Eventos:** Funções como \`handleClick\`, \`onSubmit\`, \`handleDelete\`, \`saveChanges\` revelam as ações que um usuário pode tomar.
    *   **Formulários e Entradas:** Elementos \`<form>\`, \`<input>\`, \`<button>\` indicam onde o usuário insere dados ou inicia ações.

3.  **Crie um Tutorial para Cada Funcionalidade:** Para **CADA** funcionalidade principal que você identificar, crie um tutorial detalhado e passo a passo.
    *   **Exemplo para um App de Tarefas:** Se você encontrar um formulário para adicionar tarefas e uma lista para exibi-las, crie tutoriais separados como "Como Adicionar uma Nova Tarefa" e "Como Marcar uma Tarefa como Concluída".
    *   **Exemplo para um Site Simples:** Se for um arquivo \`index.html\` com uma galeria de imagens e um formulário de contato, crie um tutorial para "Como Navegar pela Galeria" e "Como Enviar uma Mensagem de Contato", detalhando cada campo do formulário.

**ESTRUTURA OBRIGATÓRIA E DETALHADA:**

### 1. Bem-vindo ao ${projectName}!
- **O que é isso?** Explique de forma muito simples o que o aplicativo faz, com base na sua análise do código.
- **Para quem é isso?** Descreva o perfil de usuário ideal.

### 2. Guia de Primeiros Passos
- Descreva a primeira ação que um usuário deve realizar. Se houver uma tela de configuração, um login ou um passo inicial obrigatório, detalhe-o aqui.

### 3. Usando o Aplicativo: Tutoriais Passo a Passo
- Crie um subtítulo (###) para **CADA UMA** das funcionalidades que você identificou na análise do código (ex: "Como Criar um Novo Relatório", "Como Editar seu Perfil", "Como Excluir um Item").
- Cada tutorial deve ser uma lista numerada (\`1.\`, \`2.\`, \`3.\`...) com ações claras (Ex: "1. Vá para a seção 'Relatórios' no menu principal.").
- Descreva o que o usuário vê na tela. (Ex: "2. Preencha o campo 'Nome do Relatório' com...").

### 4. Solução de Problemas e Perguntas Frequentes (FAQ)
- Com base nas funcionalidades que você documentou, crie uma seção robusta com 5 a 8 perguntas que um usuário real faria.
- **Exemplos de perguntas a inferir:** "Onde meus dados são salvos?", "Posso exportar meu trabalho?", "O que acontece se eu preencher o formulário incorretamente?".
- Para cada item, use o formato:
    - **🤔 Pergunta/Problema:** [A pergunta do usuário]
    - **💡 Solução/Resposta:** [Uma resposta clara e direta com os passos para resolver].

Este guia deve ser um manual completo que ensine um usuário a usar **TUDO** que o aplicativo oferece, **independentemente da tecnologia ou estrutura do projeto**.
`;
    
    let userTextPrompt = '';

    if (docType === 'support') {
      const supportOnlyIntro = `Com base nas informações e contexto do projeto fornecidos, sua única tarefa é criar um "Guia Completo do Usuário (Help Center)". Ignore completamente a criação de documentação técnica. Foque apenas na perspectiva de um usuário final não técnico.`;
      
      userTextPrompt = `
        **Informações do Projeto:**
        - Nome do Projeto: ${projectName}
        - Descrição/Objetivo Principal: ${description}
        - Equipe Alvo da Documentação: ${team}

        **Contexto Adicional Fornecido para sua Análise:**
        ${teamContext || "Nenhum contexto adicional foi fornecido."}
        
        ${supportOnlyIntro}
        ${supportInstruction}

        **Sua Resposta (gere APENAS o Guia do Usuário completo e preenchido, começando com o título principal como '# Guia de Suporte para ${projectName}'):**
      `;
    } else { // 'technical' or 'both'
      userTextPrompt = `
        ${mainPrompt}
        **Sua Resposta (gere APENAS a documentação técnica completa e preenchida, começando com o título principal como '# Nome do Projeto'):**
      `;
    }
    
    const messages = [];
    messages.push({ role: "system", content: persona });
    
    const userMessageContent = [{ type: "text", text: userTextPrompt }];

    if (teamData.images && teamData.images.length > 0) {
        teamData.images.forEach(img => {
            userMessageContent.push({
                type: "image_url",
                image_url: {
                    url: `data:${img.mimeType};base64,${img.data}`
                }
            });
        });
    }

    messages.push({ role: "user", content: userMessageContent });

    // Se for apenas um documento de suporte, o processo de várias etapas não é necessário.
    if (docType === 'support') {
      progressCallback({ progress: 25, message: 'Estruturando o guia...' });
      const text = await callOpenAI(messages);
      progressCallback({ progress: 95, message: 'Finalizando...' });
      
      const lines = text.trim().split('\n');
      let title = projectName;
      let contentMarkdown = text.trim();

      if (lines[0].startsWith('# ')) {
          let extractedTitle = lines[0].substring(2).trim();
          extractedTitle = extractedTitle.replace(/(\*\*|__|\*|_)/g, ''); // Remove markdown formatting
          title = extractedTitle;
          contentMarkdown = lines.slice(1).join('\n');
      }
      
      const htmlContent = markdownToHtml(contentMarkdown);
      const result = { title, content: htmlContent };

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify(result));
      } catch(e) { console.warn("Não foi possível escrever no cache da sessão.", e); }

      return result;
    }

    // Para 'technical' e 'both', execute o processo de várias etapas.
    let fullMarkdownResponse = "";
    
    const levelPrompts = [
        {
            message: "Código e lógica interna...",
            prompt: "O documento está excelente até agora. Sua tarefa é **adicionar o conteúdo seguinte**, continuando de onde a resposta anterior parou. Não repita nenhuma seção já escrita. Foque **exclusivamente** em detalhar o **código e a lógica interna**. Para cada função, componente, classe ou endpoint, descreva em detalhes seus parâmetros, props, argumentos, valores de retorno e a lógica de negócios passo a passo. Inclua exemplos de código relevantes e bem comentados. Sua resposta deve começar diretamente com o título da nova seção (ex: '## Análise de Código e Lógica Interna')."
        },
        {
            message: "Fluxo de dados e integração...",
            prompt: "A análise do código foi ótima. Dando continuidade, sua tarefa é **adicionar a próxima seção** ao documento. Não repita o conteúdo anterior. Foque **exclusivamente** no **fluxo de dados e integração**. Descreva como os dados se movem através do sistema, como os diferentes componentes interagem e como a aplicação se conecta com APIs externas ou bancos de dados. Sua resposta deve começar diretamente com o título da nova seção."
        },
        {
            message: "Segurança e performance...",
            prompt: "Perfeito. Agora, **adicione a próxima seção** ao documento. Não repita o conteúdo já gerado. Foque **exclusivamente** em **Segurança, Performance e Escalabilidade**. Discuta potenciais vulnerabilidades, gargalos de performance com sugestões de otimização, e a capacidade da arquitetura de escalar. Sua resposta deve começar diretamente com o título da nova seção."
        },
        {
            message: "Tutoriais e exemplos...",
            prompt: "Estamos quase no final da parte técnica. Para concluir, **adicione as seções finais** ao documento. Não repita nada do que já foi escrito. Foque **exclusivamente** em **exemplos práticos, tutoriais e recomendações para desenvolvedores**. Crie guias 'Primeiros Passos', snippets de código para casos de uso comuns e ofereça recomendações sobre melhores práticas e manutenção. Sua resposta deve começar diretamente com o título da nova seção."
        }
    ];

    const totalLevels = docType === 'both' ? 1 + levelPrompts.length + 1 : 1 + levelPrompts.length;

    // Nível 1: Chamada Inicial
    progressCallback({ progress: (100 / totalLevels), message: `Nível 1/${totalLevels}: Estrutura e arquitetura...` });
    const text1 = await callOpenAI(messages);
    if (!text1) throw new Error("A resposta inicial da IA estava vazia.");
    fullMarkdownResponse += text1;
    messages.push({ role: "assistant", content: text1 });

    // Níveis de Aprofundamento Técnico
    for (let i = 0; i < levelPrompts.length; i++) {
        const level = i + 2;
        progressCallback({ progress: (100 / totalLevels) * level, message: `Nível ${level}/${totalLevels}: ${levelPrompts[i].message}` });
        
        messages.push({ role: "user", content: levelPrompts[i].prompt });
        const loopText = await callOpenAI(messages);
        fullMarkdownResponse += "\n\n" + loopText;
        messages.push({ role: "assistant", content: loopText });
    }
    
    // Nível Final: Guia do Usuário (apenas se 'both')
    if (docType === 'both') {
      const supportLevel = totalLevels;
      progressCallback({ progress: (100 / totalLevels) * supportLevel, message: `Nível ${supportLevel}/${totalLevels}: Guia do usuário...` });
      
      const supportUserPrompt = `
        A documentação técnica está completa. Baseado em TODO o contexto e conversa anteriores, sua tarefa final e separada é criar o guia de usuário.
        ${supportInstruction}
        Sua resposta deve começar diretamente com o título '## 📖 Guia Completo do Usuário (Help Center)'. NÃO inclua nenhum outro texto, introdução ou despedida.
      `;
      messages.push({ role: "user", content: supportUserPrompt });
      const supportText = await callOpenAI(messages);
      fullMarkdownResponse += "\n\n---\n\n" + supportText;
      // Não adicionamos a resposta do suporte ao histórico de mensagens para manter o contexto técnico limpo caso houvesse mais etapas.
    }


    progressCallback({ progress: 98, message: 'Finalizando formatação...' });
    
    let text = fullMarkdownResponse;
    const lines = text1.trim().split('\n');
    let title = projectName;
    let contentMarkdown = text.trim();

    if (lines[0].startsWith('# ')) {
        let extractedTitle = lines[0].substring(2).trim();
        extractedTitle = extractedTitle.replace(/(\*\*|__|\*|_)/g, ''); // Remove markdown from title
        const titleParts = extractedTitle.split(':');
        title = titleParts.length > 1 ? titleParts[1].trim() : extractedTitle;
        
        const fullLines = contentMarkdown.split('\n');
        if (fullLines[0].trim() === lines[0].trim()) {
           contentMarkdown = fullLines.slice(1).join('\n');
        }
    }

    const htmlContent = markdownToHtml(contentMarkdown);
    const result = { title, content: htmlContent };

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify(result));
    } catch(e) { 
        console.warn("Não foi possível escrever no cache da sessão.", e); 
        if (e.name === 'QuotaExceededError') {
          console.log("Cache de sessão cheio. Considere limpar o cache ou usar documentos menores.");
        }
    }

    return result;

  } catch (error) {
    console.error("Erro ao gerar conteúdo com a API OpenAI:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Ocorreu uma falha inesperada ao se comunicar com a API OpenAI.");
  }
};