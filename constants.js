import { Team } from './types.js';

export const TEMPLATES = {
  [Team.Developers]: [
    {
      name: 'API Endpoint Detalhada',
      description: 'Documentação completa para um endpoint de API, incluindo autenticação, parâmetros e exemplos.',
      content: {
        description: `Este documento detalha o endpoint \`[MÉTODO] /api/v1/[URL]\`.

**Objetivo:** [Descreva em uma frase o que o endpoint faz, ex: "Registra um novo usuário no sistema."].

**Autenticação:** [Requerida/Opcional/Nenhuma]. Se requerida, especifique o tipo (ex: "Bearer Token com permissão de 'admin'").

**Parâmetros da Rota (Path Parameters):**
- \`id\` (string): [Descrição do parâmetro, ex: "ID do usuário a ser atualizado."].

**Parâmetros de Consulta (Query Parameters):**
- \`page\` (integer, opcional, default: 1): [Descrição, ex: "Número da página para paginação."].
- \`limit\` (integer, opcional, default: 10): [Descrição, ex: "Quantidade de itens por página."].
`,
        pastedCode: `// Exemplo de Request Body (application/json)
{
  "name": "John Doe",
  "email": "john.doe@example.com"
}

// Exemplo de Resposta de Sucesso (200 OK)
{
  "id": "user_12345",
  "message": "Usuário criado com sucesso."
}

// Exemplo de Resposta de Erro (400 Bad Request)
{
  "error": "O e-mail fornecido já está em uso."
}`,
        databaseSchema: 'N/A',
        dependencies: '',
      }
    },
    {
      name: 'Componente React Avançado',
      description: 'Documenta um componente React, incluindo props, estado, hooks e interações.',
      content: {
        description: `Documentação para o componente React \`<[NomeDoComponente] />\`.

**Finalidade:** [Descreva a responsabilidade principal e o local de uso do componente].

**Props (Propriedades):**
- \`propNome\` (\`tipo\`, obrigatória): [Descrição da prop e seu impacto no componente].
- \`onAction\` (\`(data: any) => void\`, opcional): [Descrição do callback, ex: "Função chamada quando o usuário clica no botão principal."].

**Estado Interno (State):**
- \`[nomeDoEstado]\`: [Descrição do estado e por que ele é necessário].

**Hooks Utilizados:**
- \`useEffect\`: [Descrição do efeito colateral, ex: "Busca dados da API quando o componente é montado."].
- \`useContext\`: [Descrição do contexto consumido, ex: "Acessa o tema atual da aplicação."].
`,
        pastedCode: `import React, { useState, useEffect } from 'react';

const [NomeDoComponente] = ({ propNome, onAction }) => {
  const [internalState, setInternalState] = useState(null);

  useEffect(() => {
    // Lógica do hook aqui
  }, [propNome]);

  return (
    <div onClick={() => onAction?.(internalState)}>
      {/* Lógica de renderização */}
    </div>
  );
};

export default [NomeDoComponente];`,
        databaseSchema: '',
        dependencies: 'react, prop-types',
      }
    },
     {
      name: 'Arquitetura de Feature',
      description: 'Visão geral da arquitetura para uma nova funcionalidade completa (backend + frontend).',
      content: {
        description: `Este documento descreve a arquitetura da feature **[Nome da Feature]**.

**Problema a ser Resolvido:** [Descreva o problema de negócio ou a necessidade do usuário que esta feature aborda].

**Solução Proposta:** [Descreva em alto nível como a feature resolverá o problema].

**Componentes Principais:**
1.  **Frontend:** [Liste os principais componentes de UI a serem criados ou modificados, ex: "Nova página de perfil, Modal de edição de dados"].
2.  **Backend:** [Liste os novos endpoints de API, workers ou serviços a serem criados].
3.  **Banco de Dados:** [Descreva as novas tabelas, colunas ou alterações de esquema necessárias].

**Fluxo de Dados:** [Descreva como os dados fluem entre o frontend, backend e banco de dados].
`,
        pastedCode: `// Cole aqui trechos de código relevantes de diferentes partes da feature
// Ex: Controller do backend
// Ex: Serviço de frontend que consome a API`,
        databaseSchema: `ALTER TABLE "users" ADD COLUMN "new_feature_flag" BOOLEAN DEFAULT false;`,
        dependencies: 'prisma, next.js, zod',
      }
    }
  ],
  [Team.UXUI]: [
    {
      name: 'Análise de Fluxo de Usuário',
      description: 'Detalha um fluxo de usuário, incluindo pontos de dor e oportunidades de melhoria.',
      content: {
        description: `Análise do fluxo de usuário para a tarefa de **[Nome da Tarefa, ex: "Realizar o primeiro login"]**.

**Persona Alvo:** [Nome da Persona] - [Breve descrição da persona e seus objetivos].

**Objetivo do Usuário no Fluxo:** [O que o usuário quer alcançar ao final deste fluxo?].

**Passos do Fluxo (Mapeamento):**
1.  **Ponto de Entrada:** [Onde o usuário inicia, ex: "Página inicial do app"].
2.  **Ação 1:** [Ex: "Clica em 'Entrar'"]. -> **Tela/Componente:** [Ex: "Modal de Login"].
3.  **Ação 2:** [Ex: "Preenche e-mail e senha"]. -> **Feedback:** [Ex: "Validação em tempo real dos campos"].
4.  ...
5.  **Ponto de Saída/Sucesso:** [Como o fluxo termina com sucesso, ex: "Redirecionado para o dashboard principal"].

**Pontos de Fricção e Oportunidades:**
- **Ponto de Fricção:** [Descreva uma dificuldade encontrada pelo usuário, ex: "O erro de senha incorreta é genérico."].
- **Oportunidade de Melhoria:** [Sugira uma solução, ex: "Adicionar um link 'Esqueci minha senha' mais visível."].`,
        personas: '[Cole aqui a descrição completa da persona, se aplicável].',
        userFlows: 'Os fluxos detalhados estão descritos acima.',
      }
    },
    {
        name: 'Componente (Design System)',
        description: 'Documenta um componente para o Design System, com foco em uso, variações e acessibilidade.',
        content: {
            description: `Documentação para o componente de Design System: **[NOME DO COMPONENTE, ex: "Botão Primário"]**.

**Quando Usar:** [Descreva o cenário de uso ideal. Ex: "Para a ação principal e mais importante em uma página ou modal."].
**Quando NÃO Usar:** [Descreva cenários onde outro componente seria mais adequado. Ex: "Para ações secundárias ou links de navegação, use o Botão Secundário ou um Link."].

**Variações de Estado:**
- **Padrão:** [Estado normal do componente].
- **Hover:** [Feedback visual ao passar o mouse].
- **Pressionado (Active):** [Feedback visual durante o clique].
- **Desabilitado (Disabled):** [Aparência e comportamento quando inativo].
- **Carregando (Loading):** [Feedback visual para ações assíncronas].

**Diretrizes de Acessibilidade (WCAG AA):**
- **Contraste:** [Garanta que o contraste de cores entre texto e fundo atende ao mínimo de 4.5:1].
- **Foco:** [O componente deve ter um estado de foco visível e claro para navegação por teclado].
- **Rótulos (Labels):** [Use \`aria-label\` para botões que contêm apenas ícones].`,
            personas: '',
            userFlows: '',
        }
    }
  ],
  [Team.Automations]: [
    {
        name: 'Fluxo de Automação (N8N/Make)',
        description: 'Documenta uma automação complexa, detalhando cada passo, lógica e sistemas envolvidos.',
        content: {
            description: `Documentação do fluxo de automação: **[NOME DA AUTOMAÇÃO]**.

**Objetivo de Negócio:** [O que esta automação resolve? Ex: "Automatizar a qualificação e distribuição de leads inbound para a equipe de vendas."].

**Gatilho (Trigger):**
- **Tipo:** [Ex: Webhook, Agendado (Schedule), Evento de App].
- **Origem:** [Ex: Formulário do site, RD Station, Disparo a cada 15 minutos].

**Etapas Principais do Fluxo:**
1.  **Recebimento e Validação:** [Nó que recebe os dados e verifica se são válidos].
2.  **Enriquecimento de Dados:** [Consulta a uma API externa (ex: Clearbit) para obter mais informações sobre o lead].
3.  **Lógica de Roteamento (IF/Switch):** [Como a automação decide para qual vendedor enviar o lead (ex: com base na região ou no tamanho da empresa)].
4.  **Criação no CRM:** [Criação do negócio (Deal) no Pipedrive com os dados enriquecidos].
5.  **Notificação:** [Envio de uma mensagem no Slack para o vendedor responsável].
6.  **Tratamento de Erros:** [O que acontece se uma etapa falhar? Ex: "Envia um e-mail para a equipe de TI e tenta novamente."].`,
            triggerInfo: 'Webhook URL: https://n8n.example.com/webhook/123-abc-xyz',
            externalApis: '- Pipedrive API\n- Slack API\n- Clearbit API',
            pastedJson: 'Cole o JSON exportado do N8N/Make aqui para que a IA possa analisar a estrutura completa.',
        }
    },
    {
      name: 'Monitoramento e Alertas',
      description: 'Documenta uma automação focada em monitorar sistemas e enviar alertas.',
      content: {
        description: `Documentação da automação de monitoramento: **[NOME DO MONITOR]**.

**Objetivo:** [Ex: "Verificar a cada 5 minutos se o site principal está online e respondendo corretamente."].

**Processo de Verificação:**
1.  **Requisição HTTP:** [Faz uma requisição GET para a URL [URL_DO_SITE]].
2.  **Validação de Status:** [Verifica se o código de status da resposta é 200 OK].
3.  **Validação de Conteúdo:** [Verifica se o corpo da resposta contém o texto "[TEXTO_ESPERADO]"].

**Lógica de Alerta (Condicional):**
- **SE** a validação falhar 3 vezes consecutivas, **ENTÃO** execute as ações de alerta.

**Ações de Alerta:**
1.  **Slack:** [Envia uma mensagem de emergência para o canal #devops].
2.  **E-mail:** [Envia um e-mail de alta prioridade para o grupo de administradores].
3.  **Log:** [Registra o incidente em uma planilha do Google Sheets para histórico].`,
        triggerInfo: 'Agendado (Schedule) para rodar a cada 5 minutos.',
        externalApis: '- Slack API\n- Google Sheets API',
        pastedJson: '',
      }
    }
  ],
  [Team.AI]: [
    {
        name: 'Agente de IA (LLM)',
        description: 'Arquitetura completa de um agente de IA, incluindo prompt, ferramentas e exemplos.',
        content: {
            description: `Documentação do agente de IA: **[NOME DO AGENTE]**.

**Missão Principal:** [Descreva o objetivo do agente em uma única frase. Ex: "Atuar como um assistente de onboarding para novos clientes, respondendo a perguntas frequentes e guiando-os pelos primeiros passos."].`,
            systemPrompt: `Você é o **[NOME DO AGENTE]**, um assistente de IA amigável e especialista na plataforma Synapse. Sua principal função é ajudar novos usuários a terem uma ótima primeira experiência.

**REGRAS DE OURO:**
- **Seja Proativo:** Não espere o usuário perguntar tudo. Se ele perguntar sobre "criar um projeto", ofereça também um link para o tutorial em vídeo.
- **Mantenha a Simplicidade:** Use uma linguagem clara e evite jargões técnicos.
- **Segurança em Primeiro Lugar:** NUNCA peça ou forneça informações sensíveis como senhas ou chaves de API. Se o usuário perguntar algo que você não sabe, direcione-o para o suporte humano usando a ferramenta \`escalate_to_human\`.`,
            workflow: `1.  **Saudação Inicial:** O agente se apresenta e pergunta como pode ajudar.
2.  **Análise de Intenção:** O agente usa o LLM para identificar a intenção principal do usuário (ex: "dúvida sobre faturamento", "problema técnico", "feedback").
3.  **Seleção de Ferramenta:** Com base na intenção, o agente decide se pode responder diretamente com seu conhecimento, se precisa usar uma ferramenta (ex: \`get_documentation_link\`) ou se deve escalar para um humano.
4.  **Geração de Resposta:** O agente formula uma resposta útil, combinando o resultado da ferramenta (se usada) com seu prompt de sistema.`,
            tools: `[
  {
    "name": "get_documentation_link",
    "description": "Busca na base de conhecimento um link de documentação relevante para um determinado tópico.",
    "parameters": {
      "type": "OBJECT",
      "properties": {
        "query": { "type": "STRING", "description": "O tópico ou palavra-chave a ser pesquisado." }
      },
      "required": ["query"]
    }
  },
  {
    "name": "escalate_to_human",
    "description": "Cria um ticket de suporte e transfere a conversa para um agente humano.",
    "parameters": { "type": "OBJECT", "properties": {} }
  }
]`,
            exampleIO: `**Entrada do Usuário:** "Não estou conseguindo adicionar um novo membro à minha equipe"
**Resposta Ideal do Agente:** "Claro, posso ajudar com isso! Para adicionar um novo membro, você precisa ir em 'Configurações' > 'Equipe' e clicar no botão 'Convidar Membro'. Aqui está um link para o nosso guia com imagens que mostra o passo a passo: [link gerado pela ferramenta get_documentation_link]. Se precisar de mais alguma coisa, é só avisar!"`,
            guardrails: `- Se o usuário usar linguagem ofensiva, emita um aviso. Na segunda vez, encerre a conversa.
- Se a pergunta for sobre os planos futuros da empresa, responda: "Não tenho acesso a informações sobre futuros lançamentos, mas aprecio sua curiosidade!".`,
        }
    }
  ]
};