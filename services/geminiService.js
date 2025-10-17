import { GoogleGenAI } from "@google/genai";
import { Team } from "../types.js";

let ai = null;

export const initializeGemini = (apiKey) => {
  if (!apiKey) {
    console.error("A chave de API é necessária para inicializar o Gemini.");
    return false;
  }
  // A inicialização acontece aqui, usando a chave fornecida pelo usuário.
  ai = new GoogleGenAI({ apiKey });
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

    // Inline elements
    htmlContent = htmlContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');

    // Lists (unordered and ordered)
    // Process unordered lists
    htmlContent = htmlContent.replace(/^\s*[-*] (.*$)/gm, '<li>$1</li>');
    htmlContent = htmlContent.replace(/((<li>.*<\/li>\s*)+)/g, '<ul>\n$1</ul>\n');
     htmlContent = htmlContent.replace(/<\/ul>\s*<ul>/g, '');


    // Process ordered lists
    htmlContent = htmlContent.replace(/^\s*\d+\. (.*$)/gm, '<li>$1</li>');
    htmlContent = htmlContent.replace(/((<li>.*<\/li>\s*)+)/g, (match) => {
        // Avoid re-wrapping if it's already in a <ul>
        if (match.includes('<ul>')) return match;
        return '<ol>\n' + match + '</ol>\n';
    });
    htmlContent = htmlContent.replace(/<\/ol>\s*<ol>/g, '');
    htmlContent = htmlContent.replace(/<\/ul>\s*<ol>/g, '</ul>\n<ol>');


    // Newlines
    htmlContent = htmlContent.replace(/\n/g, '<br />');

    // Cleanup: remove <br> around block elements
    const blockElements = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'pre', 'li', 'div'];
    blockElements.forEach(tag => {
        const reBefore = new RegExp(`<br \\/>(\\s*<${tag}[^>]*>)`, 'g');
        const reAfter = new RegExp(`(</${tag}>\\s*)<br \\/>`, 'g');
        htmlContent = htmlContent.replace(reBefore, '$1');
        htmlContent = htmlContent.replace(reAfter, '$1');
    });
     htmlContent = htmlContent.replace(/<\/li><br \/>/g, '</li>');


    return htmlContent;
}

export const generateDocumentContent = async (params) => {
  if (!ai) {
    throw new Error("A API Gemini não foi inicializada. Por favor, configure sua chave de API na tela inicial.");
  }

  const { projectName, description, team, includeSupportSection, teamData } = params;
  try {
    
    let persona = 'Você é um assistente de IA especialista em criar documentação técnica e de negócios.';
    switch (team) {
      case Team.Developers:
        persona = 'Aja como um engenheiro de software sênior e arquiteto de soluções.';
        break;
      case Team.UXUI:
         persona = 'Aja como um especialista em UX/UI e Product Designer, com foco em clareza para a equipe de desenvolvimento.';
        break;
      case Team.Automations:
        persona = 'Aja como um especialista em automação de processos (RPA e integrações).';
        break;
      case Team.AI:
        persona = 'Aja como um engenheiro de IA especialista em arquitetura de agentes e large language models.';
        break;
    }

    let teamContext = '';
    
    // Handle context for developers from multiple sources
    if (team === Team.Developers) {
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
    }


    teamContext += teamData.databaseSchema ? `**Esquema do Banco de Dados:**\n${teamData.databaseSchema}\n` : '';
    teamContext += teamData.dependencies ? `**Dependências e Bibliotecas:**\n${teamData.dependencies}\n` : '';
    teamContext += (teamData.images && teamData.images.length > 0) ? 'Analise as imagens de interface fornecidas para descrever os componentes, fluxos e design system.\n' : '';
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
      ${persona}
      Sua tarefa é atuar como um escritor técnico especialista e criar uma documentação abrangente e bem-estruturada para o projeto a seguir.

      **Instruções Chave:**
      1.  **Análise Holística:** Você recebeu um contexto de código de múltiplas fontes (pastas de projeto, arquivos avulsos, código colado). Analise TODAS as fontes e suas relações para entender o projeto de forma completa antes de escrever.
      2.  **Estrutura Dinâmica:** NÃO use um template fixo. Com base na sua análise holística do código, gere as seções e tópicos mais lógicos e úteis para ESTE projeto específico. Se o usuário fornecer um texto com placeholders como "[Descreva aqui]", sua tarefa é PREENCHER esses placeholders com conteúdo detalhado e relevante, usando o resto do contexto.
      3.  **Estilo Profissional:** A documentação deve ser clara, prática e bem-organizada. Use uma estrutura hierárquica e numerada quando fizer sentido (ex: 1.0, 2.1, 2.1.1).
      4.  **Conteúdo Essencial:** Comece com a motivação ou o objetivo do projeto. Em seguida, detalhe o fluxo de funcionamento, a arquitetura e os componentes técnicos ou de processo mais importantes. Preencha todo o conteúdo de forma detalhada e profissional. O resultado final não deve conter placeholders.
      5.  **Profundidade e Completude:** Sua meta é criar um documento tão completo que um novo membro da equipe possa entender o projeto de ponta a ponta sem precisar perguntar a ninguém. Não deixe lacunas. Se uma parte do contexto não for clara, use seu conhecimento como especialista para fazer suposições informadas e preencher os detalhes com as melhores práticas da indústria.
      6.  **Formatação Markdown RÍGIDA (Estilo Google Docs):**
          - **PROIBIDO:** NUNCA, sob nenhuma circunstância, use blocos de código com três crases (\`\`\`). A saída NÃO DEVE conter \`\`\`.
          - **CORRETO:** Para código em linha (nomes de variáveis, funções, arquivos), use crases SIMPLES (\`). Exemplo: \`minhaFuncao()\`.
          - **PROIBIDO:** Não gere crases vazias ou com apenas espaços, como \` \` ou \`\`.
          - **CORRETO:** Para blocos de código com várias linhas, insira-os como texto simples, preservando a indentação e as quebras de linha, sem usar crases.
          - Use negrito (\*\*) para ênfase e títulos de seção.
      7.  **Padrão Google Docs:** A formatação final deve ser 100% compatível com o estilo e a estrutura de um documento profissional do Google Docs. Pense em como o conteúdo ficaria ao ser colado diretamente no Google Docs: títulos claros (usando #, ##, etc.), listas com marcadores ou números, e uso de negrito para destaque.

      **Informações do Projeto:**
      - Nome do Projeto: ${projectName}
      - Descrição/Objetivo Principal: ${description}
      - Equipe Alvo da Documentação: ${team}

      **Contexto Adicional Fornecido para sua Análise:**
      ${teamContext || "Nenhum contexto adicional foi fornecido. Crie a estrutura e o conteúdo com base nas melhores práticas para um projeto com a descrição fornecida."}
    `;

    let supportInstruction = '';
    if (includeSupportSection) {
      supportInstruction = `
---
## 📖 Guia Completo do Usuário (Help Center)

**Instrução Adicional OBRIGATÓRIA:** Após a documentação técnica, sua tarefa mais importante é criar um guia de usuário final EXTREMAMENTE COMPLETO e abrangente. Este não é apenas um anexo, mas um manual detalhado para um usuário que não tem NENHUM conhecimento técnico. A linguagem deve ser a mais simples e acessível possível. Analise TODO o contexto fornecido (descrição, código, imagens, fluxos) para identificar TODAS as funcionalidades e interações possíveis do ponto de vista do usuário.

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
    }

    const fullPrompt = `
      ${mainPrompt}
      ${supportInstruction}
      
      **Sua Resposta (gere apenas o markdown completo e preenchido, começando com o título principal como '# Nome do Projeto'):**
    `;

    let contents;

    if (team === Team.UXUI && teamData.images && teamData.images.length > 0) {
        const imageParts = teamData.images.map(img => ({
            inlineData: {
                mimeType: img.mimeType,
                data: img.data,
            }
        }));
        contents = { parts: [{ text: fullPrompt }, ...imageParts] };
    } else {
        contents = fullPrompt;
    }
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
    });
    let text = response.text;

    if (!text) {
      throw new Error("A resposta da IA estava vazia.");
    }
    
    // BUG FIX: Clean up common AI formatting errors before converting to HTML
    // 1. Remove any triple (or more) backticks, as they are disallowed.
    text = text.replace(/`{3,}/g, '');
    // 2. Remove empty or whitespace-only inline code blocks.
    text = text.replace(/`\s*`/g, '');

    // Remove component-like placeholders that the AI might generate
    text = text.replace(/<([A-Z][a-zA-Z0-9]+)\s*\/>/g, '');

    // Separate title from content
    const lines = text.trim().split('\n');
    let title = projectName;
    let contentMarkdown = text.trim();

    if (lines[0].startsWith('# ')) {
        const extractedTitle = lines[0].substring(2).trim();
        // Check if the extracted title contains the team name, e.g., "Documentação Técnica: My Project"
        const titleParts = extractedTitle.split(':');
        title = titleParts.length > 1 ? titleParts[1].trim() : extractedTitle;
        contentMarkdown = lines.slice(1).join('\n');
    }

    const htmlContent = markdownToHtml(contentMarkdown);
    return { title, content: htmlContent };

  } catch (error) {
    console.error("Erro ao gerar conteúdo com a API Gemini:", error);
    let userMessage = "Ocorreu uma falha inesperada ao tentar gerar o documento. Por favor, tente novamente mais tarde.";

    if (error instanceof Error) {
        if (error.message.includes('API key not valid')) {
            userMessage = "Sua chave de API do Gemini é inválida. Por favor, verifique-a na tela de configuração.";
        } else if (error.message.includes('SAFETY')) {
            userMessage = "A geração de conteúdo foi bloqueada pelas políticas de segurança da IA. Tente ajustar o conteúdo fornecido (textos, imagens, etc.) e tente novamente.";
        } else {
            userMessage = `Erro da IA: ${error.message}`;
        }
    }
    
    throw new Error(userMessage);
  }
};