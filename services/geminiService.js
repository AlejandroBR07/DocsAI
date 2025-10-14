import { GoogleGenAI } from "@google/genai";
import { DOCUMENT_STRUCTURES } from "../constants.js";
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

    // Headings (including numbered ones like 1.1)
    htmlContent = htmlContent
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>');

    // Code blocks with copy button
    htmlContent = htmlContent.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
        const languageClass = lang ? ` class="language-${lang}"` : '';
        const cleanedCode = code.trim().replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const copyButton = `<button class="copy-code-btn" title="Copiar código">Copiar</button>`;
        return `<div class="code-block-wrapper">${copyButton}<pre><code${languageClass}>${cleanedCode}</code></pre></div>`;
    });

    // Inline elements
    htmlContent = htmlContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em></em>')
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
    const blockElements = ['h1', 'h2', 'h3', 'ul', 'ol', 'pre', 'li', 'div'];
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
    const baseStructure = DOCUMENT_STRUCTURES[team].replace(/NOME_DO_PROJETO/g, projectName);

    let supportInstruction = '';
    if (includeSupportSection) {
      supportInstruction = `
---
## 📖 Seção de Suporte ao Usuário Final

**Instrução Adicional:** Agora, gere uma seção de suporte destinada ao **usuário final**, que não tem conhecimento técnico. Use uma linguagem simples, clara e direta. Evite jargões de programação ou de negócios. A seção deve ser útil e fácil de entender. Estruture em formato de FAQ (Perguntas Frequentes) e, se aplicável, um guia de "Passo a Passo para Solução de Problemas" para questões comuns.
`;
    }
    const finalStructure = baseStructure + supportInstruction;

    let teamContext = '';
    let persona = 'Você é um assistente de IA especialista em criar documentação técnica e de negócios.';
    
    switch (team) {
      case Team.Developers:
        persona = 'Aja como um engenheiro de software sênior e arquiteto de soluções.';
        teamContext += teamData.code ? `**Código Fonte para Análise:**\n\`\`\`\n${teamData.code}\n\`\`\`\nUse o código acima como a principal fonte de verdade para preencher a documentação.\n` : '';
        teamContext += teamData.databaseSchema ? `**Esquema do Banco de Dados:**\n${teamData.databaseSchema}\n` : '';
        teamContext += teamData.dependencies ? `**Dependências e Bibliotecas:**\n${teamData.dependencies}\n` : '';
        break;
      case Team.UXUI:
         persona = 'Aja como um especialista em UX/UI e Product Designer, com foco em clareza para a equipe de desenvolvimento.';
        teamContext += (teamData.images && teamData.images.length > 0) ? 'Analise as imagens de interface fornecidas para descrever os componentes, fluxos e design system.\n' : '';
        teamContext += teamData.personas ? `**Personas:**\n${teamData.personas}\n` : '';
        teamContext += teamData.userFlows ? `**Fluxos de Usuário (descrição textual):**\n${teamData.userFlows}\n` : '';
        break;
      case Team.Automations:
        persona = 'Aja como um especialista em automação de processos (RPA e integrações).';
        teamContext += teamData.json ? `**Estrutura da Automação (JSON - ex: N8N):**\n\`\`\`json\n${teamData.json}\n\`\`\`\nInterprete a estrutura JSON acima para detalhar os nós e a lógica.\n` : '';
        teamContext += teamData.triggerInfo ? `**Informações do Gatilho (Trigger):**\n${teamData.triggerInfo}\n` : '';
        teamContext += teamData.externalApis ? `**APIs Externas Envolvidas:**\n${teamData.externalApis}\n` : '';
        break;
      case Team.AI:
        persona = 'Aja como um engenheiro de IA especialista em arquitetura de agentes e large language models.';
        teamContext += teamData.systemPrompt ? `**System Prompt:**\n${teamData.systemPrompt}\n` : '';
        teamContext += teamData.workflow ? `**Fluxo de Trabalho/Conversa:**\n${teamData.workflow}\n` : '';
        teamContext += teamData.tools ? `**Ferramentas (Tools):**\n${teamData.tools}\n` : '';
        teamContext += teamData.exampleIO ? `**Exemplos de Entrada/Saída:**\n${teamData.exampleIO}\n` : '';
        teamContext += teamData.guardrails ? `**Guardrails e Regras de Segurança:**\n${teamData.guardrails}\n` : '';
        break;
    }

    const fullPrompt = `
      ${persona}
      Sua tarefa é preencher a estrutura de markdown a seguir de forma detalhada e profissional, usando as informações fornecidas. Substitua todos os placeholders como "[Descreva...]" por conteúdo relevante e completo. Não deixe nenhum placeholder no resultado final.

      **Informações do Projeto:**
      - Nome do Projeto: ${projectName}
      - Descrição/Objetivo Principal: ${description}
      - Equipe Alvo da Documentação: ${team}

      **Contexto Adicional Fornecido:**
      ${teamContext || "Nenhum contexto adicional foi fornecido. Preencha a documentação com base nas melhores práticas para o tipo de projeto descrito."}

      **Estrutura a ser preenchida:**
      ---
      ${finalStructure}

      **Sua Resposta (apenas o markdown preenchido):**
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
    const text = response.text;

    if (!text) {
      throw new Error("A resposta da IA estava vazia.");
    }
    
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