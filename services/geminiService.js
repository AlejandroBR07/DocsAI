
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
      .replace(/`+([^`]+?)`+/g, '<code>$1</code>');

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
            // The max_tokens parameter is high to accommodate large contexts and detailed responses.
            // The actual response size will be guided by the prompt instructions.
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
    const aiContent = data.choices[0]?.message?.content || "";
    console.log("%c[DEBUG] Resposta Bruta da IA:", "color: #ff9800; font-weight: bold;", `\n\n${aiContent}`);
    return aiContent;
};

export const generateDocumentContent = async (params, progressCallback) => {
  if (!openAIApiKey) {
    throw new Error("A API OpenAI não foi inicializada. Por favor, configure sua chave de API na tela inicial.");
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
        persona = 'Aja como um especialista em automação de processos (RPA e integrações), com conhecimento em plataformas visuais como N8N/Make e também em ferramentas de automação de conversas como Unnichat para WhatsApp. Seu superpoder é traduzir a estrutura de dados de uma automação (como um JSON do N8N) em uma explicação clara e visual de seus nós, parâmetros e fluxos, como se estivesse explicando a interface para um colega. Sua tarefa é criar a documentação mais detalhada possível, exclusivamente em Português do Brasil.';
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
    teamContext += teamData.deploymentInfo ? `**Informações sobre Deploy:**\n${teamData.deploymentInfo}\n` : '';
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
      Sua tarefa é atuar como um escritor técnico especialista e criar uma documentação clara, detalhada e útil para o projeto a seguir.

      **Instruções Chave:**
      0.  **Baseado em Evidências:** Sua análise deve se basear **estritamente** no contexto fornecido (imagens, textos, códigos). **NÃO INVENTE** detalhes técnicos que não possam ser inferidos diretamente do material. Se nenhum código for fornecido, não especule sobre a tecnologia. Se apenas uma imagem for fornecida, foque sua análise nos aspectos visuais, de layout, fluxo do usuário e componentes de interface visíveis.
      1.  **Documente o Presente, Não o Futuro (REGRA CRÍTICA E INFLEXÍVEL):** Sua única função é documentar o estado **ATUAL** do projeto. É estritamente **PROIBIDO** sugerir melhorias, funcionalidades futuras, otimizações, ou criar seções de "Próximos Passos", "A Fazer", "Manutenção", "Melhores Práticas para Evolução" ou qualquer outro tópico que discuta o futuro do projeto. A documentação deve ser um reflexo 100% fiel do que existe.
      2.  **Análise Holística:** Você recebeu um contexto de múltiplas fontes (pastas de projeto, arquivos avulsos, código colado, imagens). Analise e relacione **TODAS** as fontes para entender o projeto de forma completa antes de escrever. Se houver múltiplos arquivos, sintetize a informação de todos eles em uma documentação coesa.
      3.  **Unicidade e Criatividade:** Cada documento que você cria deve ser único. Evite repetir a mesma estrutura ou tom de voz. Seja criativo na organização do conteúdo e nos títulos das seções. Adapte o estilo e a estrutura para melhor se adequar ao contexto específico fornecido, garantindo que cada documentação tenha uma identidade própria.
      4.  **Estrutura Dinâmica:** NÃO use um template fixo. Com base na sua análise holística do contexto, gere as seções e tópicos mais lógicos e úteis para ESTE projeto específico. Se o usuário fornecer um texto com placeholders como "[Descreva aqui]", sua tarefa é PREENCHER esses placeholders com conteúdo detalhado e relevante, usando o resto do contexto.
      5.  **Tamanho e Profundidade Adaptativos (REGRA IMPORTANTE):** O tamanho e o nível de detalhe da sua resposta devem ser **proporcionais à quantidade de contexto fornecido**. Se o usuário fornecer um pequeno trecho de código ou uma descrição breve, crie uma documentação concisa e focada. Se o usuário fornecer uma pasta de projeto completa com múltiplos arquivos, sua documentação deve ser longa, exaustiva e profundamente detalhada. Deixe o contexto guiar a complexidade da sua resposta.
      6.  **Formatação Markdown RÍGIDA (Estilo Google Docs):**
          - **PROIBIDO:** NUNCA use blocos de código com três crases (\`\`\`).
          - **PROIBIDO:** NUNCA formate blocos de código usando tabelas Markdown.
          - **CORRETO:** Para código em linha (variáveis, funções), use crases SIMPLES (\`).
          - **CORRETO:** Para blocos de código com várias linhas, insira-os como texto simples, preservando a indentação.
          - Use negrito (\*\*) para ênfase e títulos de seção.
      7.  **Padrão Google Docs:** A formatação final deve ser 100% compatível com o estilo de um documento profissional do Google Docs: títulos claros (usando #, ##, etc.), listas, e uso de negrito para destaque.
      8.  **Deploy e Uso (CRÍTICO):** Se o usuário fornecer informações específicas sobre o deploy, use-as. Se nenhuma informação for dada, **NÃO INVENTE** um processo de deploy. Para arquivos simples (HTML/CSS/JS), sua seção de 'Uso' deve simplesmente explicar como abrir o arquivo em um navegador.
      9.  **Tradução de JSON de Automação (REGRA CRÍTICA para Automações):** Se o contexto for da equipe de Automações e contiver um JSON de uma ferramenta como N8N, sua tarefa **NÃO É** descrever o JSON. Em vez disso, você deve **TRADUZIR** esse JSON em uma descrição funcional do fluxo de trabalho. Descreva cada **NÓ** (node) da automação, explique sua finalidade, detalhe seus parâmetros e descreva como ele se conecta aos nós seguintes, como se estivesse explicando a interface visual da ferramenta.

      **Instruções Específicas para Análise de Código-Fonte (OBRIGATÓRIO):**
      Se o contexto incluir código-fonte, aja como um arquiteto de software sênior fazendo uma revisão de código.
      - **Identifique a Tecnologia:** Tente identificar a tecnologia usada (React, Vue, Node.js, HTML/CSS/JS puro, etc.).
      - **Análise Estrutural:** Detalhe a estrutura do código: componentes, props, estados, estrutura do DOM, seletores CSS e lógica dos scripts.
      - **Lógica de Negócios:** Descreva a lógica principal, comunicação com APIs, manipulação de dados e funções-chave.
      - **Fluxo de Interação:** Mapeie o fluxo de dados e a interação do usuário através da aplicação.

      **Informações do Projeto:**
      - Nome do Projeto: ${projectName}
      - Descrição/Objetivo Principal: ${description}
      - Equipe Alvo da Documentação: ${team}

      **Contexto Adicional Fornecido para sua Análise:**
      ${teamContext || "Nenhum contexto adicional foi fornecido. Crie a estrutura e o conteúdo com base nas melhores práticas para um projeto com a descrição fornecida."}
    `;

    const supportInstruction = `
---
## 📖 Guia do Usuário

**Instrução Adicional OBRIGATÓRIA (LEIA COM ATENÇÃO):** Sua tarefa é criar um guia de usuário final **INTELIGENTE, CRIATIVO e PRÁTICO**. A linguagem deve ser a mais simples possível. O objetivo é criar uma experiência de aprendizado única e agradável para cada projeto.

**INSTRUÇÃO CRÍTICA PARA ANÁLISE DE QUALQUER CÓDIGO-FONTE:**
Analise o código-fonte e **TRADUZA** suas funcionalidades em ações práticas e guias passo a passo para um usuário final. **NÃO RESUMA O CÓDIGO**.

**PRINCÍPIOS-CHAVE PARA A GERAÇÃO DO GUIA:**

1.  **ESTRUTURA 100% DINÂMICA E ADAPTÁVEL (A REGRA MAIS IMPORTANTE):**
    *   **PROIBIDO:** **NÃO USE UM TEMPLATE FIXO.** Cada guia de usuário deve ser uma obra única, moldada pelo contexto do projeto.
    *   **TÍTULO CRIATIVO:** **NÃO USE** títulos genéricos como "Guia Completo do Usuário" ou "Help Center". **INVENTE** um título criativo e apropriado para o guia. Ex: "Dominando o ${projectName}", "Seus Primeiros Passos com ${projectName}", ou "Como Usar o ${projectName} para [Objetivo]".
    *   **SEÇÕES ORGÂNICAS:** As seções do guia devem emergir **naturalmente** da sua análise. Se é um app de uma única funcionalidade, aprofunde-se nela. Se é um dashboard complexo, divida-o em seções lógicas. Pense fora da caixa: em vez de "Funcionalidades", use "O que você pode fazer?".

2.  **TRADUÇÃO PROFUNDA DE CÓDIGO PARA AÇÕES:**
    *   Para **CADA** funcionalidade que você identificar no código (componentes, formulários, botões), crie um tutorial detalhado e passo a passo. Seja visual na sua descrição ("Você verá um botão azul no canto superior direito...", "Preencha o campo 'Nome' que tem um ícone de pessoa ao lado...").

3.  **SOLUÇÃO DE PROBLEMAS CONTEXTUAL (NÃO UM FAQ GENÉRICO):**
    *   Em vez de "Perguntas Frequentes", crie uma seção de "Solução de Problemas" ou "Dicas e Truques" que seja **altamente específica** para as dificuldades que um usuário poderia enfrentar com **este aplicativo**.
    *   **Inferir problemas do código:** Se você vê uma validação de formulário complexa, um problema comum pode ser "Por que meu formulário não envia?". As perguntas e soluções devem ser originais e diretamente derivadas do contexto.

4.  **UNICIDADE E CRIATIVIDADE:**
    *   Adapte o estilo para o público-alvo. Um app para designers pode ter uma linguagem mais visual; uma ferramenta para analistas pode ser mais direta. Garanta que cada guia de usuário tenha uma identidade própria.
`;
    
    let userTextPrompt = '';

    if (docType === 'support') {
      const supportOnlyIntro = `Com base nas informações e contexto do projeto fornecidos, sua única tarefa é criar um "Guia do Usuário". Ignore completamente a criação de documentação técnica. Foque apenas na perspectiva de um usuário final não técnico.`;
      
      userTextPrompt = `
        **Informações do Projeto:**
        - Nome do Projeto: ${projectName}
        - Descrição/Objetivo Principal: ${description}
        - Equipe Alvo da Documentação: ${team}

        **Contexto Adicional Fornecido para sua Análise:**
        ${teamContext || "Nenhum contexto adicional foi fornecido."}
        
        ${supportOnlyIntro}
        ${supportInstruction}

        **Sua Resposta (gere APENAS o Guia do Usuário completo e preenchido, começando com um título principal criativo e único como '# Título Criativo para ${projectName}'):**
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
      progressCallback({ progress: 25, message: 'Traduzindo o técnico para o humano...' });
      const text = await callOpenAI(messages);
      progressCallback({ progress: 95, message: 'Polindo os últimos detalhes...' });
      
      const lines = text.trim().split('\n');
      let title = projectName;
      let contentMarkdown = text.trim();

      if (lines[0].startsWith('# ')) {
          let extractedTitle = lines[0].substring(2).trim();
          extractedTitle = extractedTitle.replace(/(\*\*|__|\*|_)/g, ''); // Remove markdown formatting
          title = extractedTitle;
          contentMarkdown = lines.slice(1).join('\n');
      }
      
      console.log("%c[DEBUG] Markdown Final (Suporte):", "color: #2196f3; font-weight: bold;", `\n\n${contentMarkdown}`);
      const htmlContent = markdownToHtml(contentMarkdown);
      console.log("%c[DEBUG] HTML Final (Suporte):", "color: #4caf50; font-weight: bold;", `\n\n${htmlContent}`);
      return { title, content: htmlContent };
    }

    // Para 'technical' e 'both', execute o processo de várias etapas.
    let fullMarkdownResponse = "";
    
    // Níveis de aprofundamento genéricos e maleáveis
    const levelPrompts = [
        { message: "Aprofundando a análise técnica...", prompt: "O documento inicial está ótimo. Continue **adicionando a próxima seção lógica**, sem repetir o que já foi escrito. Foque em **aprofundar a análise técnica** da parte mais complexa ou importante que você identificou (seja a lógica de um componente, o fluxo de uma automação, etc). Explique o 'porquê' por trás das decisões de implementação. Comece diretamente com o título da nova seção." },
        { message: "Criando exemplos e cenários de uso...", prompt: "Excelente detalhe. Agora, **adicione a próxima seção**, sem repetir o que já foi escrito, focando **exclusivamente em exemplos práticos e cenários de uso**. Mostre como o código é utilizado, como a automação é acionada, ou como o usuário interage com a interface. Seja o mais prático possível. Comece diretamente com o título da nova seção." }
    ];

    const totalLevels = docType === 'both' ? 1 + levelPrompts.length + 1 : 1 + levelPrompts.length;

    // Nível 1: Chamada Inicial
    progressCallback({ progress: (100 / totalLevels), message: 'Analisando o DNA do seu projeto...' });
    const text1 = await callOpenAI(messages);
    if (!text1) throw new Error("A resposta inicial da IA estava vazia.");
    fullMarkdownResponse += text1;
    messages.push({ role: "assistant", content: text1 });

    // Níveis de Aprofundamento Técnico
    for (let i = 0; i < levelPrompts.length; i++) {
        const level = i + 2;
        progressCallback({ progress: (100 / totalLevels) * level, message: levelPrompts[i].message });
        
        messages.push({ role: "user", content: levelPrompts[i].prompt });
        const loopText = await callOpenAI(messages);
        fullMarkdownResponse += "\n\n" + loopText;
        messages.push({ role: "assistant", content: loopText });
    }
    
    // Nível Final: Guia do Usuário (apenas se 'both')
    if (docType === 'both') {
      const supportLevel = totalLevels;
      progressCallback({ progress: (100 / totalLevels) * supportLevel, message: 'Escrevendo o manual do usuário...' });
      
      const supportUserPrompt = `
        A documentação técnica está completa. Baseado em TODO o contexto e conversa anteriores, sua tarefa final e separada é criar o guia de usuário.
        ${supportInstruction}
        Sua resposta deve começar diretamente com um título CRIATIVO e ÚNICO. NÃO inclua nenhum outro texto, introdução ou despedida.
      `;
      messages.push({ role: "user", content: supportUserPrompt });
      const supportText = await callOpenAI(messages);
      fullMarkdownResponse += "\n\n---\n\n" + supportText;
    }


    progressCallback({ progress: 98, message: 'Polindo os últimos detalhes...' });
    
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
    
    console.log("%c[DEBUG] Markdown Final (Técnico/Ambos):", "color: #2196f3; font-weight: bold;", `\n\n${contentMarkdown}`);
    const htmlContent = markdownToHtml(contentMarkdown);
    console.log("%c[DEBUG] HTML Final (Técnico/Ambos):", "color: #4caf50; font-weight: bold;", `\n\n${htmlContent}`);
    return { title, content: htmlContent };

  } catch (error) {
    console.error("Erro ao gerar conteúdo com a API OpenAI:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Ocorreu uma falha inesperada ao se comunicar com a API OpenAI.");
  }
};
