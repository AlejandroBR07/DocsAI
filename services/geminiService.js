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


const markdownToHtml = (text) => {
    let htmlContent = text
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

    return htmlContent;
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

  const { projectName, description, team, docType, teamData } = params;
  try {
    
    let persona = 'Você é um assistente de IA especialista em criar documentação técnica e de negócios.';
    switch (team) {
      case Team.Developers:
        persona = 'Aja como um engenheiro de software sênior e arquiteto de soluções, e sua tarefa é criar a documentação mais detalhada possível.';
        break;
      case Team.UXUI:
         persona = 'Aja como um especialista em UX/UI e Product Designer, com foco em clareza para a equipe de desenvolvimento e na criação da documentação mais detalhada possível.';
        break;
      case Team.Automations:
        persona = 'Aja como um especialista em automação de processos (RPA e integrações), e sua tarefa é criar a documentação mais detalhada possível.';
        break;
      case Team.AI:
        persona = 'Aja como um engenheiro de IA especialista em arquitetura de agentes e large language models, e sua tarefa é criar a documentação mais detalhada possível.';
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
          - **CORRETO:** Para código em linha (nomes de variáveis, funções, arquivos), use crases SIMPLES (\`). Exemplo: \`minhaFuncao()\`.
          - **PROIBIDO:** Não gere crases vazias ou com apenas espaços, como \` \` ou \`\`.
          - **CORRETO:** Para blocos de código com várias linhas, insira-os como texto simples, preservando a indentação e as quebras de linha, sem usar crases.
          - Use negrito (\*\*) para ênfase e títulos de seção.
      7.  **Padrão Google Docs:** A formatação final deve ser 100% compatível com o estilo e a estrutura de um documento profissional do Google Docs. Pense em como o conteúdo ficaria ao ser colado diretamente no Google Docs: títulos claros (usando #, ##, etc.), listas com marcadores ou números, e uso de negrito para destaque.
      8.  **Foco Interno:** Se estiver gerando documentação técnica, o foco é a equipe interna. EVITE adicionar seções genéricas de "Suporte e Contato", pois a equipe já conhece os canais de comunicação. Foque estritamente no conteúdo técnico e de processo do projeto.

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

**Instrução Adicional OBRIGATÓRIA:** Sua tarefa mais importante é criar um guia de usuário final EXTREMAMENTE COMPLETO e abrangente. Este não é apenas um anexo, mas um manual detalhado para um usuário que não tem NENHUM conhecimento técnico. A linguagem deve ser a mais simples e acessível possível. Analise TODO o contexto fornecido (descrição, código, imagens, fluxos) para identificar TODAS as funcionalidades e interações possíveis do ponto de vista do usuário.

**Estrutura Obrigatória para o Guia do Usuário:**

### 1. Bem-vindo ao ${projectName}!
- **O que é isso?** Comece com uma explicação muito simples e amigável sobre o que é a funcionalidade/projeto e qual problema ela resolve para o usuário no dia a dia. Use analogias se ajudar.
- **Para quem é isso?** Descreva o perfil de usuário que mais se beneficiará com isso.

### 2. Primeiros Passos (Guia Rápido)
- Forneça um guia de início rápido com 3 a 5 passos essenciais para que o usuário possa obter valor imediato. Ex: "1. Crie sua conta; 2. Configure seu perfil; 3. Crie seu primeiro projeto...".

### 3. Tutoriais Detalhados (Passo a Passo)
- **INSTRUÇÃO CRÍTICA:** Analise o contexto e INFERIR as principais tarefas que um usuário pode realizar. Crie um tutorial passo a passo separado para CADA TAREFA.
- **Exemplos de tarefas a serem inferidas:** Se o contexto é sobre um sistema de e-commerce, crie tutoriais para "Como buscar um produto", "Como adicionar um item ao carrinho", "Como finalizar uma compra". Se for sobre uma ferramenta de design, "Como criar um novo arquivo", "Como usar a ferramenta de texto", "Como exportar seu trabalho". Se for uma landing page de cursos como o usuário mencionou, crie um tutorial para "Como se inscrever em um novo curso".
- Cada tutorial deve ser ultra-detalhado, com uma lista numerada, verbos de ação claros (Ex: "Clique no botão 'Salvar'", "Arraste o item para a coluna 'Concluído'") e, se possível, descreva o que o usuário deve ver na tela.

### 4. Solução de Problemas e Perguntas Frequentes (FAQ)
- Crie uma seção robusta com pelo menos 5 a 8 problemas comuns ou perguntas frequentes.
- Para cada item, use o seguinte formato:
    - **🤔 Pergunta/Problema:** [Descreva a dúvida ou o erro em linguagem de usuário. Ex: "O botão de salvar não funciona." ou "Onde encontro meus arquivos?"]
    - **💡 Solução/Resposta:** [Forneça uma explicação clara e uma série de passos simples para resolver o problema. Ex: "Isso geralmente acontece porque o campo 'Nome' não foi preenchido. Verifique se todos os campos obrigatórios (marcados com *) estão completos e tente salvar novamente."].

Este guia deve ser tão completo que elimina a necessidade de o usuário entrar em contato com o suporte para tarefas rotineiras.
`;
    
    let userTextPrompt = '';

    if (docType === 'technical') {
      userTextPrompt = `
        ${mainPrompt}
        **Sua Resposta (gere APENAS a documentação técnica completa e preenchida, começando com o título principal como '# Nome do Projeto'):**
      `;
    } else if (docType === 'support') {
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
    } else { // 'both'
      userTextPrompt = `
        ${mainPrompt}
        ${supportInstruction}
        **Sua Resposta (gere a documentação técnica PRIMEIRO, e DEPOIS o guia do usuário, ambos completos e preenchidos, começando com o título principal como '# Nome do Projeto'):**
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
          const extractedTitle = lines[0].substring(2).trim();
          title = extractedTitle;
          contentMarkdown = lines.slice(1).join('\n');
      }
      
      const htmlContent = markdownToHtml(contentMarkdown);
      return { title, content: htmlContent };
    }

    // Para 'technical' e 'both', execute o processo de várias etapas.
    let fullMarkdownResponse = "";
    
    const levelPrompts = [
        "O documento está excelente até agora. Sua tarefa é **adicionar o conteúdo seguinte**, continuando de onde a resposta anterior parou. Não repita nenhuma seção já escrita. Foque **exclusivamente** em detalhar o **código e a lógica interna**. Para cada função, componente, classe ou endpoint, descreva em detalhes seus parâmetros, props, argumentos, valores de retorno e a lógica de negócios passo a passo. Inclua exemplos de código relevantes e bem comentados. Sua resposta deve começar diretamente com o título da nova seção (ex: '## Análise de Código e Lógica Interna').",
        "A análise do código foi ótima. Dando continuidade, sua tarefa é **adicionar a próxima seção** ao documento. Não repita o conteúdo anterior. Foque **exclusivamente** no **fluxo de dados e integração**. Descreva como os dados se movem através do sistema, como os diferentes componentes interagem e como a aplicação se conecta com APIs externas ou bancos de dados. Sua resposta deve começar diretamente com o título da nova seção.",
        "Perfeito. Agora, **adicione a próxima seção** ao documento. Não repita o conteúdo já gerado. Foque **exclusivamente** em **Segurança, Performance e Escalabilidade**. Discuta potenciais vulnerabilidades, gargalos de performance com sugestões de otimização, e a capacidade da arquitetura de escalar. Sua resposta deve começar diretamente com o título da nova seção.",
        "Estamos quase no final. Para concluir, **adicione as seções finais** ao documento. Não repita nada do que já foi escrito. Foque **exclusivamente** em **exemplos práticos, tutoriais e recomendações para desenvolvedores**. Crie guias 'Primeiros Passos', snippets de código para casos de uso comuns e ofereça recomendações sobre melhores práticas e manutenção. Se o pedido original incluía um guia de suporte, gere-o agora. Sua resposta deve começar diretamente com o título da nova seção."
    ];
    const totalLevels = 1 + levelPrompts.length;

    // Nível 1: Chamada Inicial
    progressCallback({ progress: (100 / totalLevels) * 1, message: 'Nível 1/5: Estrutura e arquitetura...' });
    const text1 = await callOpenAI(messages);
    if (!text1) throw new Error("A resposta inicial da IA estava vazia.");
    fullMarkdownResponse += text1 + "\n\n";
    messages.push({ role: "assistant", content: text1 });

    // Níveis 2-5: Loop de Aprofundamento
    for (let i = 0; i < levelPrompts.length; i++) {
        const level = i + 2;
        const levelMessages = [
           "Nível 2/5: Código e lógica interna...",
           "Nível 3/5: Fluxo de dados e integração...",
           "Nível 4/5: Segurança e performance...",
           "Nível 5/5: Tutoriais e exemplos...",
        ];
        progressCallback({ progress: (100 / totalLevels) * level, message: levelMessages[i] });
        
        messages.push({ role: "user", content: levelPrompts[i] });
        const loopText = await callOpenAI(messages);
        fullMarkdownResponse += "\n\n" + loopText;
        messages.push({ role: "assistant", content: loopText });
    }

    progressCallback({ progress: 98, message: 'Finalizando formatação...' });
    
    let text = fullMarkdownResponse;
    text = text.replace(/<code>(.*?)<\/code>/g, '`$1`');
    text = text.replace(/`{3,}/g, '');
    text = text.replace(/`\s*`/g, '');
    text = text.replace(/<([A-Z][a-zA-Z0-9]+)\s*\/>/g, '');

    const lines = text1.trim().split('\n');
    let title = projectName;
    let contentMarkdown = text.trim();

    if (lines[0].startsWith('# ')) {
        const extractedTitle = lines[0].substring(2).trim();
        const titleParts = extractedTitle.split(':');
        title = titleParts.length > 1 ? titleParts[1].trim() : extractedTitle;
        
        const fullLines = contentMarkdown.split('\n');
        if (fullLines[0].trim() === lines[0].trim()) {
           contentMarkdown = fullLines.slice(1).join('\n');
        }
    }

    const htmlContent = markdownToHtml(contentMarkdown);
    return { title, content: htmlContent };

  } catch (error) {
    console.error("Erro ao gerar conteúdo com a API OpenAI:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Ocorreu uma falha inesperada ao se comunicar com a API OpenAI.");
  }
};