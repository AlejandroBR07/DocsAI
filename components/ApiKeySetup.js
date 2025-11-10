import React, { useState } from 'react';
import { validateApiKey } from '../services/openAIService.js';
import { LoadingSpinner } from './Icons.js';

const ApiKeySetup = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!apiKey.trim() || isLoading) return;
    
    setIsLoading(true);
    setError('');

    const isValid = await validateApiKey(apiKey.trim());
    
    setIsLoading(false);

    if (isValid) {
      onApiKeySet(apiKey.trim());
    } else {
      setError('Sua chave de API parece ser inválida. Por favor, verifique e tente novamente.');
    }
  };

  return (
    React.createElement('div', { className: "min-h-screen bg-gray-900 flex items-center justify-center p-4 text-white" },
      React.createElement('div', { className: "w-full max-w-lg bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700" },
        React.createElement('div', { className: "text-center mb-8" },
            React.createElement('h1', { className: "text-3xl font-bold text-white" }, "Configurar ", "Trade", React.createElement('span', { className: "text-indigo-400" }, "Synapse")),
            React.createElement('p', { className: "text-gray-400 mt-2" }, "Para começar, você precisa de uma chave de API da OpenAI (GPT).")
        ),
        React.createElement('form', { onSubmit: handleSubmit, className: "space-y-6" },
            React.createElement('div', null,
                React.createElement('label', { htmlFor: "api-key", className: "block text-sm font-medium text-gray-300 mb-2" }, "Sua Chave de API da OpenAI"),
                React.createElement('input', {
                    id: "api-key",
                    type: "password",
                    value: apiKey,
                    onChange: (e) => setApiKey(e.target.value),
                    className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                    placeholder: "Cole sua chave de API aqui"
                }),
                error && React.createElement('p', { className: "text-red-400 text-sm mt-2" }, error)
            ),
            React.createElement('button', {
                type: "submit",
                disabled: !apiKey.trim() || isLoading,
                className: "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            }, 
                isLoading ? React.createElement(LoadingSpinner, null) : null,
                isLoading ? 'Verificando...' : 'Salvar e Continuar'
            ),
             React.createElement('div', { className: "text-center text-sm text-gray-500" },
                React.createElement('p', null, "Sua chave de API é armazenada apenas no seu navegador."),
                React.createElement('a', {
                    href: "https://platform.openai.com/account/api-keys",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-indigo-400 hover:text-indigo-300 underline"
                }, "Obtenha uma chave de API no painel da OpenAI")
            )
        )
      )
    )
  );
};

export default ApiKeySetup;