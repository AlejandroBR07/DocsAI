import React from 'react';
import { Team } from '../types.js';
import { TeamIcon } from './Icons.js';

const Header = ({ currentTeam, onTeamChange }) => {
  return (
    React.createElement('header', { className: "bg-gray-800/50 backdrop-blur-sm p-4 sticky top-0 z-20 border-b border-gray-700" },
      React.createElement('div', { className: "container mx-auto flex justify-between items-center" },
        React.createElement('h1', { className: "text-2xl font-bold text-white" },
          React.createElement('span', { className: "text-indigo-400" }, "Synapse"), " Docs"
        ),
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
        )
      )
    )
  );
};

export default Header;