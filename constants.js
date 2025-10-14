import { Team } from './types.js';

export const DOCUMENT_STRUCTURES = {
  [Team.Developers]: `
# 📝 Documentação Técnica: NOME_DO_PROJETO

## 1. Visão Geral
### 1.1. O Problema
[Descreva em detalhes o problema de negócio ou técnico que este projeto resolve. Qual era a dor ou a necessidade antes desta solução?]

### 1.2. A Solução
[Apresente um resumo de alto nível de como o projeto atende à necessidade descrita. Qual é o principal valor que ele entrega?]

## 2. Arquitetura da Solução
[Detalhe a arquitetura (ex: Microsserviços, Serverless, Monolito). Use texto ou links para diagramas. Mencione os principais padrões de design aplicados e justifique as escolhas tecnológicas.]

- **Tecnologias Principais:** [Frameworks, Linguagens, etc.]
- **Plataforma de Cloud:** [AWS, GCP, Azure, etc.]
- **Padrões de Arquitetura:** [Event-Driven, MVC, etc.]

## 3. Configuração do Ambiente de Desenvolvimento
### 3.1. Pré-requisitos
[Liste todo o software necessário para rodar o projeto localmente (ex: Node.js v18+, Docker, Python v3.10+).]

### 3.2. Instalação
[Forneça um guia passo a passo para instalar as dependências.]
\`\`\`bash
# Exemplo
npm install
\`\`\`

### 3.3. Variáveis de Ambiente
[Liste todas as variáveis de ambiente necessárias. Use um arquivo \`.env.example\` como modelo.]
- \`DATABASE_URL\`: String de conexão com o banco de dados.
- \`API_KEY_SECRET\`: Chave para um serviço externo.

## 4. API (se aplicável)
[Liste e descreva os principais endpoints da API.]

### Endpoint: \`POST /api/exemplo\`
- **Descrição:** [O que este endpoint faz?]
- **Autenticação:** [Obrigatória (Bearer Token), Opcional, Nenhuma]
- **Body (Request):**
\`\`\`json
{
  "exemploChave": "exemploValor"
}
\`\`\`
- **Resposta (200 OK):**
\`\`\`json
{
  "id": "uuid",
  "status": "sucesso"
}
\`\`\`

## 5. Estrutura do Banco de Dados
[Descreva o esquema do banco de dados, as tabelas principais e seus relacionamentos. Pode ser um script SQL, um diagrama ou uma descrição textual.]

## 6. Processo de Deploy
[Explique como o deploy é feito (ex: CI/CD com GitHub Actions, deploy manual). Inclua os comandos ou passos necessários.]

## 7. Observações Técnicas Adicionais
[Qualquer outra informação relevante: estratégias de cache, tratamento de erros, bibliotecas importantes, etc.]
`,
  [Team.UXUI]: `
# 🎨 Documentação de UX/UI: NOME_DO_PROJETO

## 1. Contexto e Objetivos
### 1.1. O Desafio do Usuário
[Qual é o problema ou necessidade fundamental do usuário que esta interface busca resolver? Descreva o cenário do usuário.]

### 1.2. Objetivos de Negócio e de Usabilidade
[Liste os principais objetivos de negócio (ex: aumentar a conversão em 10%) e de usabilidade (ex: reduzir o tempo para completar a tarefa X).]

## 2. Pesquisa e Personas
[Resuma os principais insights da pesquisa com usuários. Apresente as personas primárias e secundárias para as quais o projeto foi desenhado.]

## 3. Arquitetura da Informação e Fluxos
[Descreva a organização do conteúdo e a estrutura de navegação. Insira links para diagramas de fluxo de usuário, sitemaps ou wireflows.]

- **Link do Fluxo no Miro/Figma:** [URL]

## 4. Wireframes e Protótipos
[Forneça links para os wireframes (baixa fidelidade) e o protótipo interativo final (alta fidelidade).]

- **Wireframes (Lo-Fi):** [URL]
- **Protótipo Interativo (Hi-Fi):** [URL]

## 5. Design System e Componentes Visuais
### 5.1. Paleta de Cores
[Apresente a paleta de cores, incluindo primárias, secundárias, de feedback (sucesso, erro, aviso) e neutras.]

- **Primária:** #HEXCODE
- **Sucesso:** #HEXCODE

### 5.2. Tipografia
[Detalhe a família tipográfica, pesos e a escala tipográfica utilizada (tamanhos para H1, H2, Body, etc.).]

- **Fonte Principal:** [Nome da Fonte]
- **Base Size:** 16px

### 5.3. Componentes Chave
[Descreva e mostre exemplos dos componentes mais importantes (ex: botões, cards, formulários), incluindo seus diferentes estados (default, hover, disabled).]

## 6. Diretrizes de Acessibilidade (WCAG)
[Liste as principais diretrizes de acessibilidade consideradas no projeto (ex: contraste de cores, navegação por teclado, texto alternativo para imagens).]

## 7. Animações e Microinterações
[Descreva as principais animações que guiam a experiência, como transições de página ou feedback de ações do usuário.]
`,
  [Team.Automations]: `
# ⚙️ Documentação de Automação: NOME_DO_PROJETO

## 1. Propósito da Automação
[Descreva o processo de negócio que está sendo automatizado. Qual era o processo manual antes? Qual o ganho esperado com a automação (economia de tempo, redução de erros)?]

## 2. Visão Geral do Fluxo
[Apresente um resumo de alto nível do que a automação faz, desde o gatilho inicial até o resultado final. Se possível, inclua um link para um diagrama do fluxo.]

- **Plataforma:** [N8N, Zapier, Make, etc.]
- **Link do Workflow:** [URL do workflow, se aplicável]

## 3. Gatilhos (Triggers)
[Detalhe o que inicia a automação.]
- **Tipo de Gatilho:** [Webhook, Agendado (Schedule), Manual]
- **Frequência (se agendado):** [Ex: A cada 15 minutos, toda segunda-feira às 9h]
- **Payload do Webhook (se aplicável):** [Mostre um exemplo do JSON esperado]

## 4. Detalhamento dos Passos (Nós)
[Liste e descreva os nós ou passos mais críticos da automação.]

- **Nó 1: [Nome do Nó]**
  - **Função:** [O que ele faz?]
  - **Sistemas Envolvidos:** [API do Sistema X, Banco de Dados Y]
- **Nó 2: [Nome do Nó]**
  - **Função:** [O que ele faz?]
  - **Lógica Condicional:** [Descreva qualquer lógica "if/else" importante aqui.]

## 5. Sistemas Integrados e Credenciais
[Liste todas as APIs e sistemas de terceiros utilizados. Explique como as credenciais são gerenciadas (ex: Credenciais do N8N, Variáveis de Ambiente).]

## 6. Tratamento de Erros e Notificações
[Descreva o que acontece quando ocorre um erro. Existe um fluxo de tratamento de erros? Alguém é notificado?]

## 7. Variáveis de Ambiente e Inputs
[Liste as variáveis de ambiente ou inputs necessários para a automação funcionar.]
- \`API_KEY_SISTEMA_X\`: [Descrição da chave]
- \`USER_ID_DEFAULT\`: [Descrição da variável]

## 8. Monitoramento e Logs
[Explique como monitorar a execução da automação e onde encontrar os logs para depuração.]
`,
  [Team.AI]: `
# 🤖 Documentação de IA / Agente: NOME_DO_PROJETO

## 1. Objetivo do Agente
[Descreva a principal função do modelo ou agente de IA. Que tarefa ele executa? Qual problema ele resolve para o usuário ou para o negócio?]

## 2. Arquitetura e Modelo
### 2.1. Modelo de Linguagem (LLM)
[Especifique o modelo base utilizado.]
- **Modelo:** [Gemini 1.5 Flash, GPT-4o, etc.]
- **Provedor:** [Google, OpenAI, etc.]

### 2.2. Instrução de Sistema (System Prompt)
[Apresente o prompt de sistema completo que define a persona, o objetivo e as restrições do agente.]
\`\`\`
[Cole o prompt base aqui]
\`\`\`

## 3. Ferramentas (Tools / Functions)
[Liste e descreva todas as ferramentas ou funções que o agente pode invocar para interagir com sistemas externos.]

### Ferramenta: \`nomeDaFuncao\`
- **Descrição:** [O que a função faz, na perspectiva do modelo.]
- **Parâmetros:**
  - \`param1\`: [Tipo de dado] - [Descrição do parâmetro]
  - \`param2\`: [Tipo de dado] - [Descrição do parâmetro]
- **Retorno:** [O que a função retorna para o modelo.]

## 4. Fluxo de Execução e Lógica
[Descreva a lógica principal do agente. Como ele decide qual ferramenta usar? Existe algum fluxo de conversa pré-definido ou ele é totalmente reativo?]

## 5. Estrutura de Resposta
[Detalhe o formato esperado da resposta final da IA, especialmente se for uma estrutura específica como JSON. Forneça um exemplo claro.]

### Exemplo de Resposta (JSON):
\`\`\`json
{
  "key": "value",
  "analysis": {
    "sentiment": "positive"
  }
}
\`\`\`

## 6. Estratégias de Validação e Guardrails
[Descreva como a qualidade e a segurança das respostas são garantidas. Existem passos de validação? Como o agente lida com tópicos fora de escopo ou perigosos?]

## 7. Observações e Limitações
[Inclua informações sobre limitações conhecidas, considerações de custo, latência ou estratégias de fallback caso a IA falhe.]
`,
};
