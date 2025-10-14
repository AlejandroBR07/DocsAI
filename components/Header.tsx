import React from 'react';
import { Team } from '../types.ts';
import { TeamIcon } from './Icons.js';

interface HeaderProps {
  currentTeam: Team;
  onTeamChange: (team: Team) => void;
}

const Header: React.FC<HeaderProps> = ({ currentTeam, onTeamChange }) => {
  return (
    <header className="bg-gray-800/50 backdrop-blur-sm p-4 sticky top-0 z-20 border-b border-gray-700">
      <div className="container mx-auto flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">
          <span className="text-indigo-400">NexusDocs</span> AI
        </h1>
        <div className="relative">
          <div className="flex items-center space-x-2 text-gray-300">
            <TeamIcon />
            <select
              value={currentTeam}
              onChange={(e) => onTeamChange(e.target.value as Team)}
              className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 appearance-none pr-8"
              aria-label="Selecionar equipe"
            >
              {Object.values(Team).map((team) => (
                <option key={team} value={team}>{team}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;