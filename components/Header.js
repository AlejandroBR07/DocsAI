import React from 'react';
import { Team } from '../types.js';
import { TeamIcon, SettingsIcon, CheckIcon, AlertTriangleIcon } from './Icons.js';

const ApiStatusIndicator = ({ status, onClick }) => {
  const isOk = status === 'valid';
  const statusConfig = {
    valid: {
      bgColor: 'bg-green-500/20',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      hoverBgColor: 'hover:bg-green-500/30',
      icon: React.createElement(CheckIcon, null),
      label: 'API Válida'
    },
    invalid: {
      bgColor: 'bg-red-500/20',
      borderColor: 'border-red-500/30',
      textColor: 'text-red-400',
      hoverBgColor: 'hover:bg-red-500/30',
      icon: React.createElement(AlertTriangleIcon, null),
      label: 'API Inválida'
    },
    unknown: {
      bgColor: 'bg-gray-500/20',
      borderColor: 'border-gray-500/30',
      textColor: 'text-gray-400',
      hoverBgColor: 'hover:bg-gray-500/30',
      icon: React.createElement(SettingsIcon, null),
      label: 'Verificar API'
    }
  };

  const config = statusConfig[status] || statusConfig.unknown;

  return (
    React.createElement('button', {
      onClick: onClick,
      className: `flex items-center gap-2 text-sm font-medium p-2 rounded-lg border transition-colors ${config.bgColor} ${config.borderColor} ${config.textColor} ${config.hoverBgColor}`,
      "aria-label": "Verificar ou alterar configurações da API"
    },
      config.icon,
      React.createElement('span', { className: "hidden sm:inline" }, config.label)
    )
  );
};


const Header = ({ currentTeam, onTeamChange, onOpenSettings, apiKeyStatus }) => {
  return (
    React.createElement('header', { className: "bg-gray-800/50 backdrop-blur-sm p-4 sticky top-0 z-20 border-b border-gray-700" },
      React.createElement('div', { className: "container mx-auto flex justify-between items-center" },
        React.createElement('h1', { className: "text-2xl font-bold text-white" },
          "Trade", React.createElement('span', { className: "text-indigo-400" }, "Synapse")
        ),
        React.createElement('div', { className: "flex items-center gap-4" },
          React.createElement('div', { className: "relative" },
            React.createElement('div', { className: "flex items-center space-x-2 text-gray-300" },
              React.createElement(TeamIcon, null),
              React.createElement('select', {
                value: currentTeam,
                onChange: (e) => onTeamChange(e.target.value),
                className: "bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 appearance-none pr-8",
                "aria-label": "Selecionar equipe"
              },
                Object.values(Team).map((team) => (
                  React.createElement('option', { key: team, value: team }, team)
                ))
              )
            )
          ),
          React.createElement(ApiStatusIndicator, { status: apiKeyStatus, onClick: onOpenSettings })
        )
      )
    )
  );
};

export default Header;