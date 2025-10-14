import React, { useState } from 'react';

const ApiKeySetup = ({ onApiKeySet }) => {
  const [apiKey, setApiKey] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (apiKey.trim()) {
      onApiKeySet(apiKey.trim());
    }
  };

  return (
    React.createElement('div', { className: "min-h-screen bg-gray-900 flex items-center justify-center p-4 text-white" },
      React.createElement('div', { className: "w-full max-w-lg bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700" },
        React.createElement('div', { className: "text-center mb-8" },
            React.createElement('h1', { className: "text-3xl font-bold text-white" }, "Configurar ", React.createElement('span', { className: "text-indigo-400" }, "NexusDocs"), " AI"),
            React.createElement('p', { className: "text-gray-400 mt-2" }, "Para começar, você precisa de uma chave de API do Google Gemini.")
        ),
        React.createElement('form', { onSubmit: handleSubmit, className: "space-y-6" },
            React.createElement('div', null,
                React.createElement('label', { htmlFor: "api-key", className: "block text-sm font-medium text-gray-300 mb-2" }, "Sua Chave de API do Google Gemini"),
                React.createElement('input', {
                    id: "api-key",
                    type: "password",
                    value: apiKey,
                    onChange: (e) => setApiKey(e.target.value),
                    className: "w-full bg-gray-700 border border-gray-600 text-white rounded-md p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                    placeholder: "Cole sua chave de API aqui"
                })
            ),
            React.createElement('button', {
                type: "submit",
                disabled: !apiKey.trim(),
                className: "w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            }, "Salvar e Continuar"),
             React.createElement('div', { className: "text-center text-sm text-gray-500" },
                React.createElement('p', null, "Sua chave de API é armazenada apenas no seu navegador."),
                React.createElement('a', {
                    href: "https://aistudio.google.com/app/apikey",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    className: "text-indigo-400 hover:text-indigo-300 underline"
                }, "Obtenha uma chave de API no Google AI Studio")
            )
        )
      )
    )
  );
};

export default ApiKeySetup;
