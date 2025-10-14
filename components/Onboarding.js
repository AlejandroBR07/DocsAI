import React, { useState } from 'react';
import { Team } from '../types.js';
import { DeveloperIcon, UXUIIcon, AutomationIcon, AIIcon } from './Icons.js';

const teamOptions = [
  { team: Team.Developers, icon: React.createElement(DeveloperIcon, null), label: 'Desenvolvedores' },
  { team: Team.UXUI, icon: React.createElement(UXUIIcon, null), label: 'UX/UI' },
  { team: Team.Automations, icon: React.createElement(AutomationIcon, null), label: 'Automações' },
  { team: Team.AI, icon: React.createElement(AIIcon, null), label: 'IA' },
];

const Onboarding = ({ onComplete }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);

  return (
    React.createElement('div', { className: "flex-grow flex items-center justify-center p-4" },
      React.createElement('div', { className: "text-center p-8 max-w-3xl mx-auto bg-gray-800/50 rounded-lg" },
        React.createElement('h1', { className: "text-4xl font-bold text-white mb-3" },
          "Bem-vindo ao ", React.createElement('span', { className: "text-indigo-400" }, "NexusDocs"), " AI"
        ),
        React.createElement('p', { className: "text-lg text-gray-300 mb-8" },
          "Sua central de documentos inteligente. Para começar, selecione sua equipe principal."
        ),
        
        React.createElement('div', { className: "grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" },
          teamOptions.map(({ team, icon, label }) => (
            React.createElement('button', {
              key: team,
              onClick: () => setSelectedTeam(team),
              className: `p-4 rounded-lg text-center border-2 transition-all duration-200 flex flex-col items-center justify-center aspect-square ${
                selectedTeam === team ? 'border-indigo-500 bg-indigo-900/50 scale-105' : 'border-gray-600 hover:border-indigo-600 hover:bg-gray-700'
              }`
            },
              React.createElement('div', { className: "text-indigo-400 mb-2" }, icon),
              React.createElement('h3', { className: "font-bold text-white text-sm" }, label)
            )
          ))
        ),

        React.createElement('button', {
          onClick: () => selectedTeam && onComplete(selectedTeam),
          disabled: !selectedTeam,
          className: "bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        },
          "Começar a Criar"
        )
      )
    )
  );
};

export default Onboarding;
