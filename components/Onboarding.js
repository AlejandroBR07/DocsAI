import React, { useState } from 'react';
import { Team } from '../types.js';
import { DeveloperIcon, UXUIIcon, AutomationIcon, AIIcon } from './Icons.js';

const teamOptions = [
  { team: Team.Developers, icon: <DeveloperIcon />, label: 'Desenvolvedores' },
  { team: Team.UXUI, icon: <UXUIIcon />, label: 'UX/UI' },
  { team: Team.Automations, icon: <AutomationIcon />, label: 'Automações' },
  { team: Team.AI, icon: <AIIcon />, label: 'IA' },
];

const Onboarding = ({ onComplete }) => {
  const [selectedTeam, setSelectedTeam] = useState(null);

  return (
    <div className="flex-grow flex items-center justify-center p-4">
      <div className="text-center p-8 max-w-3xl mx-auto bg-gray-800/50 rounded-lg">
        <h1 className="text-4xl font-bold text-white mb-3">
          Bem-vindo ao <span className="text-indigo-400">NexusDocs</span> AI
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          Sua central de documentos inteligente. Para começar, selecione sua equipe principal.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {teamOptions.map(({ team, icon, label }) => (
            <button
              key={team}
              onClick={() => setSelectedTeam(team)}
              className={`p-4 rounded-lg text-center border-2 transition-all duration-200 flex flex-col items-center justify-center aspect-square ${
                selectedTeam === team ? 'border-indigo-500 bg-indigo-900/50 scale-105' : 'border-gray-600 hover:border-indigo-600 hover:bg-gray-700'
              }`}
            >
              <div className="text-indigo-400 mb-2">{icon}</div>
              <h3 className="font-bold text-white text-sm">{label}</h3>
            </button>
          ))}
        </div>

        <button
          onClick={() => selectedTeam && onComplete(selectedTeam)}
          disabled={!selectedTeam}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Começar a Criar
        </button>
      </div>
    </div>
  );
};

export default Onboarding;
