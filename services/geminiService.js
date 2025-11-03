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
      Sua tarefa é atuar como um escritor técnico especialista e criar uma documentação **extremamente detalhada, completa e exaustiva** para o projeto a seguir.

      **Instruções Chave:**
      0.  **Baseado em Evidências:** Sua análise deve se basear **estritamente** no contexto fornecido (imagens, textos, códigos). **NÃO INVENTE** detalhes técnicos que não possam ser inferidos diretamente do material. Se nenhum código for fornecido, não especule sobre a tecnologia (ex: React, Node.js) ou a estrutura do código. Se apenas uma imagem for fornecida, foque sua análise nos aspectos visuais, de layout, fluxo do usuário e componentes de interface visíveis.
      1.  **Análise Holística:** Você recebeu um contexto de múltiplas fontes (pastas de projeto, arquivos avulsos, código colado, imagens). Analise e relacione **TODAS** as fontes para entender o projeto de forma completa antes de escrever. Se houver múltiplos arquivos, sintetize a informação de todos eles em uma documentação coesa.
      2.  **Unicidade e Criatividade:** Cada documento que você cria deve ser único. Evite repetir a mesma estrutura, tom de voz ou exemplos de documentos gerados anteriormente. Seja criativo na organização do conteúdo e nos títulos das seções. Por exemplo, em vez de sempre usar "Visão Geral", você pode usar "O Problema e a Solução" ou "Objetivo Principal". Adapte o estilo e a estrutura para melhor se adequar ao contexto específico fornecido, garantindo que cada documentação tenha uma identidade própria.
      3.  **Estrutura Dinâmica:** NÃO use um template fixo. Com base na sua análise holística do contexto, gere as seções e tópicos mais lógicos e úteis para ESTE projeto específico. Se o usuário fornecer um texto com placeholders como "[Descreva aqui]", sua tarefa é PREENCHER esses placeholders com conteúdo detalhado e relevante, usando o resto do contexto.
      4.  **Detalhe Exaustivo:** Para cada elemento encontrado no contexto (funções, componentes, endpoints, nós de automação), detalhe CADA parâmetro, prop, argumento, campo de dados e opção de configuração. Seja explícito sobre tipos, obrigatoriedade e valores padrão. O objetivo é um manual de referência, não um resumo. Não omita nenhum detalhe.
      5.  **Profundidade e Completude:** Sua meta é criar um documento tão completo que um novo membro da equipe possa entender o projeto de ponta a ponta sem precisar perguntar a ninguém. Não deixe lacunas. Se uma parte do contexto não for clara, use seu conhecimento como especialista para fazer suposições informadas e preencher os detalhes com as melhores práticas da indústria. O resultado final não deve conter placeholders.
      6.  **Guia "Primeiros Passos":** Se for relevante para o tipo de projeto, adicione uma seção "Primeiros Passos" logo após a introdução. Esta seção deve ser um guia rápido com etapas claras e práticas para que alguém possa começar a usar ou entender a funcionalidade principal rapidamente.
      7.  **Formatação Markdown RÍGIDA (Estilo Google Docs):**
          - **PROIBIDO:** NUNCA, sob nenhuma circunstância, use blocos de código com três crases (\`\`\`). A saída NÃO DEVE conter \`\`\`.
          - **PROIBIDO:** NUNCA formate blocos de código usando a sintaxe de tabelas Markdown (| ... |). O código deve ser texto simples.
          - **CORRETO:** Para código em linha (nomes de variáveis, funções, arquivos), use crases SIMPLES (\`). Exemplo: \`minhaFuncao()\`.
          - **PROIBIDO:** Não gere crases vazias ou com apenas espaços, como \` \` ou \`\`.
          - **CORRETO:** Para blocos de código com várias linhas, insira-os como texto simples, preservando a indentação e as quebras de linha, sem usar crases ou tabelas.
          - Use negrito (\*\*) para ênfase e títulos de seção.
      8.  **Padrão Google Docs:** A formatação final deve ser 100% compatível com o estilo e a estrutura de um documento profissional do Google Docs. Pense em como o conteúdo ficaria ao ser colado diretamente no Google Docs: títulos claros (usando #, ##, etc.), listas com marcadores ou números, e uso de negrito para destaque.
      9.  **Foco Interno:** Se estiver gerando documentação técnica, o foco é a equipe interna. EVITE adicionar seções genéricas de "Suporte e Contato", pois a equipe já conhece os canais de comunicação. Foque estritamente no conteúdo técnico e de processo do projeto.
      10. **Listas Consistentes:** Dentro de uma mesma lista, use um estilo consistente. Se for uma lista numerada, use \`1.\`, \`2.\`, \`3.\`, etc. para todos os itens. Se for uma lista com marcadores, use \`-\` ou \`*\` para todos os itens. NÃO misture os estilos na mesma lista. Para listas numeradas que representam um passo a passo contínuo, a numeração DEVE ser sequencial (1, 2, 3...), mesmo que haja texto ou quebras de linha entre os itens. NÃO reinicie a contagem para cada sub-tópico.
      11. **Deploy e Uso (CRÍTICO):** Se o usuário fornecer informações específicas sobre o deploy na seção "Informações sobre Deploy", use-as para criar uma seção detalhada. Se nenhuma informação for dada, **NÃO INVENTE** um processo de deploy (ex: npm, Docker, CI/CD). Para arquivos simples (HTML/CSS/JS), sua seção de 'Uso' ou 'Deploy' deve simplesmente explicar como abrir o arquivo em um navegador ou incorporá-lo em outra plataforma, se o contexto sugerir.

      **Instruções Específicas para Análise de Código-Fonte (OBRIGATÓRIO):**
      Se o contexto fornecido incluir código-fonte, sua análise DEVE ser muito mais profunda do que um resumo. Aja como um arquiteto de software sênior fazendo uma revisão de código completa.
      - **Identifique a Tecnologia:** Tente identificar a tecnologia usada (ex: React, Vue, Node.js, HTML/CSS/JS puro). Se não for um framework óbvio, trate-o como código puro.
      - **Análise Estrutural:** Detalhe a estrutura do código. Se for uma aplicação baseada em componentes (como React), descreva cada componente principal, suas props, estados e funções. Se for HTML/CSS/JS puro, descreva a estrutura do DOM, os principais seletores CSS e a lógica dos scripts JS, explicando como eles interagem.
      - **Lógica de Negócios e Serviços:** Analise os arquivos de serviço ou scripts e descreva a lógica de negócio principal, como a comunicação com APIs externas, a manipulação de dados e as funções-chave exportadas.
      - **Estrutura de Dados (Constantes e Tipos):** Identifique e explique o propósito de arquivos de constantes, tipos ou estruturas de dados.
      - **Fluxo de Interação do Usuário:** Mapeie o fluxo de dados e o fluxo de interação do usuário através da aplicação, conectando os pontos entre os diferentes arquivos para construir uma imagem completa da arquitetura.

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

**Instrução Adicional OBRIGATÓRIA (LEIA COM ATENÇÃO):** Sua tarefa é criar um guia de usuário final **EXTREMAMENTE DETALHADO, INTELIGENTE, CRIATIVO e PRÁTICO**. A linguagem deve ser a mais simples possível, como se você estivesse explicando para alguém que nunca usou um computador. O objetivo é criar uma experiência de aprendizado única e agradável para cada projeto.

**INSTRUÇÃO CRÍTICA PARA ANÁLISE DE QUALQUER CÓDIGO-FONTE:**
O contexto que você recebeu pode ser de QUALQUER TIPO de projeto. Sua inteligência será medida pela sua capacidade de analisar um código-fonte desconhecido e **deduzir** suas funcionalidades do ponto de vista de um usuário final. Você **NÃO** deve resumir o código; você deve **TRADUZIR O CÓDIGO EM AÇÕES PRÁTICAS E GUIAS PASSO A PASSO**.

**PRINCÍPIOS-CHAVE PARA A GERAÇÃO DO GUIA:**

1.  **ESTRUTURA 100% DINÂMICA E ADAPTÁVEL (A REGRA MAIS IMPORTANTE):**
    *   **PROIBIDO:** **NÃO USE UM TEMPLATE FIXO.** A estrutura que você gerou para um documento não deve ser repetida no próximo. Cada guia de usuário deve ser uma obra única, moldada pelo contexto específico do projeto.
    *   **SEJA CRIATIVO:** Pense fora da caixa. Em vez de sempre usar "Primeiros Passos" ou "Funcionalidades", você pode estruturar o guia como:
        *   Uma narrativa: "Sua Jornada com o ${projectName}: Do Zero ao Herói".
        *   Baseado em objetivos: "O que você quer fazer hoje? (Ex: Quero criar um relatório, Quero convidar um amigo)".
        *   Um formato de perguntas e respostas aprofundado, onde cada "pergunta" é um tutorial completo de uma funcionalidade.
        *   Um guia visual, se houver muitas imagens, explicando cada tela e componente.
    *   A estrutura deve emergir **naturalmente** da sua análise do código e dos objetivos do projeto. Se é um app de uma única funcionalidade, aprofunde-se nela. Se é um dashboard complexo, divida-o em seções lógicas.

2.  **TRADUÇÃO PROFUNDA DE CÓDIGO PARA AÇÕES:**
    *   Vasculhe o código em busca de interações do usuário (componentes, manipuladores de eventos, formulários).
    *   Para **CADA** funcionalidade que você identificar, crie um tutorial detalhado e passo a passo. Seja visual na sua descrição ("Você verá um botão azul no canto superior direito...", "Preencha o campo 'Nome' que tem um ícone de pessoa ao lado...").

3.  **SOLUÇÃO DE PROBLEMAS CONTEXTUAL (NÃO UM FAQ GENÉRICO):**
    *   Em vez de uma seção de "Perguntas Frequentes" padronizada, crie uma seção de "Solução de Problemas" ou "Dicas e Truques" que seja **altamente específica** para as dificuldades que um usuário poderia enfrentar com **este aplicativo**.
    *   **Inferir problemas do código:** Se você vê uma validação de formulário complexa, um problema comum pode ser "Por que meu formulário não envia?". Se há um processo de upload, uma dica pode ser "O que fazer se meu arquivo for muito grande?".
    *   As perguntas e soluções devem ser originais e diretamente derivadas do contexto fornecido, não uma lista genérica.

4.  **UNICIDADE E CRIATIVIDADE (COMO NA DOCUMENTAÇÃO TÉCNICA):**
    *   Cada documento que você cria deve ser único. Evite repetir o mesmo tom de voz ou exemplos. Adapte o estilo para melhor se adequar ao público-alvo do projeto. Um app para designers pode ter uma linguagem mais visual, enquanto uma ferramenta para analistas de dados pode ser mais direta.
    *   Garanta que cada guia de usuário tenha uma identidade própria e ofereça uma experiência de leitura completamente nova.

Este guia deve ser um manual completo que ensine um usuário a usar **TUDO** que o aplicativo oferece, de uma maneira que seja sempre nova, interessante e perfeitamente adaptada ao projeto em questão.
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
    
    let levelPrompts = [];
    switch (team) {
        case Team.Developers:
            levelPrompts = [
                { message: "Decodificando a lógica interna...", prompt: "O documento está excelente. Continue **adicionando a próxima seção**, sem repetir o que já foi escrito. Foque **exclusivamente** em detalhar o **código e a lógica interna**. Para cada função, componente ou classe, descreva seus parâmetros, props, e a lógica de negócios passo a passo. Comece diretamente com o título da nova seção." },
                { message: "Traçando o fluxo de dados e conexões...", prompt: "Ótimo. Agora **adicione a próxima seção**, sem repetir o que já foi escrito, focando **exclusivamente** no **fluxo de dados, integração com APIs e banco de dados**. Descreva como os dados se movem através do sistema. Comece diretamente com o título da nova seção." },
                { message: "Planejando os testes e o deploy...", prompt: "Perfeito. **Adicione a próxima seção**, sem repetir o que já foi escrito. Foque em **Estratégias de Testes, Configuração de Ambiente e Como Usar/Deploy**. Com base nas informações fornecidas pelo usuário, detalhe o processo de deploy. Se NENHUMA informação de deploy foi fornecida, explique como executar o projeto localmente ou, para arquivos simples, como usá-los diretamente. NÃO INVENTE um processo de deploy complexo. Comece diretamente com o título da nova seção." },
                { message: "Adicionando sabedoria de manutenção...", prompt: "Para concluir, **adicione a seção final**, sem repetir o que já foi escrito, focada em **Manutenção e Melhores Práticas**. Discuta monitoramento, logging e boas práticas específicas ao código para manter a qualidade. Comece diretamente com o título da nova seção." }
            ];
            break;
        case Team.UXUI:
            levelPrompts = [
                { message: "Mapeando a jornada do usuário...", prompt: "A análise inicial está ótima. Continue **adicionando a próxima seção**, sem repetir o que já foi escrito, focando **exclusivamente** em detalhar o **Fluxo do Usuário e as Micro-interações**. Mapeie a jornada passo a passo e descreva o propósito e os estados de cada elemento interativo. NÃO GERE CÓDIGO. Comece diretamente com o título da nova seção." },
                { message: "Catalogando os componentes do design...", prompt: "Excelente. **Adicione a próxima seção**, sem repetir o que já foi escrito, focada em **Componentização e Design System**. Identifique componentes reutilizáveis, suas variações e quando usá-los. Use negrito para nomes de componentes, não crases. Comece diretamente com o título da nova seção." },
                { message: "Garantindo uma experiência acessível...", prompt: "Para finalizar, **adicione a seção final**, sem repetir o que já foi escrito, focada em **Acessibilidade (WCAG) e Handoff para Desenvolvedores**. Analise o design em relação a contraste, navegação por teclado e forneça especificações (cores, fontes, etc.) para a equipe de desenvolvimento. NÃO GERE CÓDIGO. Comece diretamente com o título da nova seção." }
            ];
            break;
        case Team.Automations:
            levelPrompts = [
                { message: "Desvendando o fluxo da automação...", prompt: "A visão geral está ótima. Continue **adicionando a próxima seção**, sem repetir o que já foi escrito. Foque **exclusivamente** no **Fluxo de Dados e Mapeamento de Campos**. Descreva em detalhes como os dados são transformados em cada etapa, desde o gatilho até a saída final, especificando os campos chave. Comece diretamente com o título da nova seção." },
                { message: "Fortalecendo a automação contra falhas...", prompt: "Excelente. **Adicione a próxima seção**, sem repetir o que já foi escrito, focando **exclusivamente** na **Lógica Condicional e Tratamento de Erros**. Detalhe as condições dos nós IF/Switch e como os erros são capturados e tratados em cada rota do fluxo. Comece diretamente com o título da nova seção." },
                { message: "Criando um plano de monitoramento...", prompt: "Para finalizar, **adicione a seção final**, sem repetir o que já foi escrito, sobre **Monitoramento e Manutenção**. Descreva como verificar a saúde da automação, acessar logs, gerenciar credenciais e quais são as melhores práticas para a sua evolução. Comece diretamente com o título da nova seção." }
            ];
            break;
        case Team.AI:
            levelPrompts = [
                { message: "Analisando a personalidade da IA...", prompt: "A missão está clara. Continue **adicionando a próxima seção**, sem repetir o que já foi escrito, com uma **Análise Profunda do Prompt de Sistema e dos Guardrails**. Desmembre cada regra e explique seu impacto no comportamento do agente. Comece diretamente com o título da nova seção." },
                { message: "Equipando o agente com suas ferramentas...", prompt: "Excelente. **Adicione a próxima seção**, sem repetir o que já foi escrito, focada na **Análise das Ferramentas (Tools) e na Lógica do Fluxo de Trabalho**. Detalhe os parâmetros de cada ferramenta e a lógica de decisão do agente. Comece diretamente com o título da nova seção." },
                { message: "Preparando cenários para treinar a IA...", prompt: "Para concluir, **adicione a seção final**, sem repetir o que já foi escrito, sobre **Estratégias de Teste e Recomendações de Ajuste Fino (Fine-Tuning)**. Crie cenários de teste e dê sugestões para modificar o prompt ou as ferramentas para melhor performance. Comece diretamente com o título da nova seção." }
            ];
            break;
        default:
            levelPrompts = [];
    }


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
      progressCallback({ progress: (100 / totalLevels) * supportLevel, message: 'Escrevendo o manual do usuário final...' });
      
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