import React from 'react';
import { WarningIcon } from './Icons.js';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    React.createElement('div', {
      className: "fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 animate-fade-in",
      onClick: onClose,
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "confirmation-title"
    },
      React.createElement('div', {
        className: "bg-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all animate-slide-up",
        onClick: (e) => e.stopPropagation()
      },
        React.createElement('div', { className: "p-6" },
          React.createElement('div', { className: "flex items-start gap-4" },
            React.createElement('div', { className: "mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/50 sm:mx-0 sm:h-10 sm:w-10" },
              React.createElement(WarningIcon, { className: "h-6 w-6 text-red-400", "aria-hidden": "true" })
            ),
            React.createElement('div', { className: "mt-0 text-left" },
              React.createElement('h3', { id: "confirmation-title", className: "text-lg leading-6 font-bold text-white" }, title),
              React.createElement('div', { className: "mt-2" },
                React.createElement('p', { className: "text-sm text-gray-300" }, message)
              )
            )
          )
        ),
        React.createElement('div', { className: "bg-gray-800/50 px-6 py-4 flex flex-col-reverse sm:flex-row sm:justify-end gap-3" },
          React.createElement('button', {
            type: "button",
            className: "w-full justify-center rounded-md border border-gray-600 px-4 py-2 bg-gray-700 text-base font-medium text-gray-300 shadow-sm hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-gray-800 sm:w-auto sm:text-sm transition-colors",
            onClick: onClose
          }, "Cancelar"),
          React.createElement('button', {
            type: "button",
            className: "w-full justify-center rounded-md border border-transparent px-4 py-2 bg-red-600 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-gray-800 sm:w-auto sm:text-sm transition-colors",
            onClick: onConfirm
          }, "Excluir")
        )
      )
    )
  );
};

export default ConfirmationModal;
