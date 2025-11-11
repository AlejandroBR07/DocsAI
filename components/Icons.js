import React from 'react';

export const PlusIcon = (props) => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Criar novo documento", ...props },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 6v6m0 0v6m0-6h6m-6 0H6" })
  )
);

export const DocumentIcon = () => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Documento" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" })
  )
);

export const TeamIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Selecionar Equipe" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" })
    )
);

export const BackIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Voltar" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M10 19l-7-7m0 0l7-7m-7 7h18" })
    )
);

export const LoadingSpinner = () => (
    React.createElement('svg', { className: "animate-spin h-5 w-5 text-white", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", title: "Carregando..." },
        React.createElement('circle', { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
        React.createElement('path', { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
    )
);

export const CopyIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Copiar" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" })
    )
);

export const UploadIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Enviar arquivo" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" })
    )
);

export const CodeIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Contexto de Código" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" })
    )
);

export const JsonIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, title: "Contexto de JSON" },
      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M8.25 7.5l-4.5 4.5 4.5 4.5m7.5-9l-4.5 4.5 4.5 4.5" }),
      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M14.25 4.5l-4.5 15" })
    )
);

export const BrainIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 24 24", strokeWidth: "2", stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round", title: "Contexto de IA" },
        React.createElement('path', { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
        React.createElement('path', { d: "M15.5 13a3.5 3.5 0 0 0 -3.5 3.5v1a3.5 3.5 0 0 0 7 0v-1.8" }),
        React.createElement('path', { d: "M8.5 13a3.5 3.5 0 0 1 3.5 3.5v1a3.5 3.5 0 0 1 -7 0v-1.8" }),
        React.createElement('path', { d: "M17.5 16a3.5 3.5 0 0 0 0 -7h-1.5" }),
        React.createElement('path', { d: "M15 8a3.5 3.5 0 0 1 -3.5 -3.5v-1a3.5 3.5 0 0 1 7 0v1.8" }),
        React.createElement('path', { d: "M9 8a3.5 3.5 0 0 0 3.5 -3.5v-1a3.5 3.5 0 0 0 -7 0v1.8" }),
        React.createElement('path', { d: "M6.5 16a3.5 3.5 0 0 1 0 -7h1.5" })
    )
);

export const DeveloperIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", viewBox: "0 0 24 24", strokeWidth: "2", stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round", title: "Equipe de Desenvolvedores" },
      React.createElement('path', { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
      React.createElement('path', { d: "M7 8l-4 4l4 4" }),
      React.createElement('path', { d: "M17 8l4 4l-4 4" }),
      React.createElement('path', { d: "M14 4l-4 16" })
    )
);

export const UXUIIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round", title: "Equipe de UX/UI" },
        React.createElement('path', { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
        React.createElement('path', { d: "M12 21a9 9 0 0 1 0 -18a9 8 0 0 1 9 8a4.5 4 0 0 1 -4.5 4h-2.5a2 2 0 0 0 -1 3.75a1.3 1.3 0 0 1 -1 2.25" }),
        React.createElement('circle', { cx: "8.5", cy: "10.5", r: "1" }),
        React.createElement('circle', { cx: "12.5", cy: "7.5", r: "1" }),
        React.createElement('circle', { cx: "16.5", cy: "10.5", r: "1" })
    )
);

export const AutomationIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round", title: "Equipe de Automações" },
        React.createElement('path', { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
        React.createElement('circle', { cx: "12", cy: "18", r: "2" }),
        React.createElement('circle', { cx: "7", cy: "6", r: "2" }),
        React.createElement('circle', { cx: "17", cy: "6", r: "2" }),
        React.createElement('path', { d: "M7 8v2a2 2 0 0 0 2 2h2" }),
        React.createElement('path', { d: "M12 12l0 4" }),
        React.createElement('path', { d: "M17 8v2a2 2 0 0 1 -2 2h-2" })
    )
);

export const AIIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", viewBox: "0 0 24 24", strokeWidth: "1.5", stroke: "currentColor", fill: "none", strokeLinecap: "round", strokeLinejoin: "round", title: "Equipe de IA" },
        React.createElement('path', { stroke: "none", d: "M0 0h24v24H0z", fill: "none" }),
        React.createElement('path', { d: "M4 12h4" }),
        React.createElement('path', { d: "M16 12h4" }),
        React.createElement('path', { d: "M12 4v4" }),
        React.createElement('path', { d: "M12 16v4" }),
        React.createElement('path', { d: "M8.5 8.5l3.5 3.5" }),
        React.createElement('path', { d: "M15.5 8.5l-3.5 3.5" }),
        React.createElement('path', { d: "M8.5 15.5l3.5 -3.5" }),
        React.createElement('path', { d: "M15.5 15.5l-3.5 -3.5" }),
        React.createElement('circle', { cx: "12", cy: "12", r: "3" }),
        React.createElement('circle', { cx: "4", cy: "12", r: "1" }),
        React.createElement('circle', { cx: "20", cy: "12", r: "1" }),
        React.createElement('circle', { cx: "12", cy: "4", r: "1" }),
        React.createElement('circle', { cx: "12", cy: "20", r: "1" }),
        React.createElement('circle', { cx: "8.5", cy: "8.5", r: "1" }),
        React.createElement('circle', { cx: "15.5", cy: "8.5", r: "1" }),
        React.createElement('circle', { cx: "8.5", cy: "15.5", r: "1" }),
        React.createElement('circle', { cx: "15.5", cy: "15.5", r: "1" })
    )
);


export const FileIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Arquivo" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" })
    )
);

export const FolderIcon = (props) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", title: "Pasta do Projeto", ...props },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" })
    )
);

export const CloseIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Fechar / Remover" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" })
    )
);

export const TrashIcon = (props) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Excluir documento", ...props },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" })
    )
);

export const WarningIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Aviso" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" })
    )
);

export const InfoIcon = (props) => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Informação", ...props },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })
    )
);

export const CheckIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Sucesso / Válido" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M5 13l4 4L19 7" })
    )
);

export const AlertTriangleIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Alerta / Inválido" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" })
    )
);

export const PencilIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Editar documento" },
      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L15.232 5.232z" })
    )
);

export const BoldIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, title: "Negrito (Ctrl+B)" },
      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M13 12H8m5 0a3 3 0 100-6H8v6m5 0a3 3 0 110 6H8v-6" })
    )
);

export const ItalicIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, title: "Itálico (Ctrl+I)" },
      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M11 5l4 0M9 19l4 0M12 5l-4 14" })
    )
);

export const InlineCodeIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, title: "Código em linha" },
      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M7 8l-4 4l4 4m10-8l4 4l-4 4M14 4l-4 16" })
    )
);

export const ListUlIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, title: "Lista não ordenada" },
      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 6h16M4 12h16M4 18h7" })
    )
);

export const ListOlIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2.5, title: "Lista ordenada" },
      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 6h11M9 12h11M9 18h11M5 6h.01M5 12h.01M5 18h.01" })
    )
);

export const TemplateIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", strokeWidth: 2, stroke: "currentColor", title: "Templates" },
      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 4h6v6H4zm0 10h6v6H4zm10-10h6v6h-6zm0 10h6v6h-6z" })
    )
);

export const SettingsIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Configurações" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" }),
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M15 12a3 3 0 11-6 0 3 3 0 016 0z" })
    )
);

export const SearchIcon = () => (
    React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Pesquisar" },
        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" })
    )
);

export const SidebarOpenIcon = () => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Mostrar sumário" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M4 6h16M4 12h16M4 18h7" })
  )
);

export const SidebarCloseIcon = () => (
  React.createElement('svg', { xmlns: "http://www.w3.org/2000/svg", className: "h-6 w-6", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", strokeWidth: 2, title: "Ocultar sumário" },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M6 18L18 6M6 6l12 12" })
  )
);

export const ChevronRightIcon = (props) => (
  React.createElement('svg', {
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24",
    stroke: "currentColor",
    strokeWidth: 2,
    ...props,
  },
    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", d: "M9 5l7 7-7 7" })
  )
);

export const DragHandleIcon = (props) => (
    React.createElement('svg', { 
        xmlns: "http://www.w3.org/2000/svg", 
        className: "h-5 w-5", 
        viewBox: "0 0 24 24", 
        fill: "none", 
        stroke: "currentColor", 
        strokeWidth: "2", 
        strokeLinecap: "round", 
        strokeLinejoin: "round",
        title: "Arrastar para reordenar",
        ...props
    },
        React.createElement('circle', { cx: "9", cy: "12", r: "1" }),
        React.createElement('circle', { cx: "9", cy: "5", r: "1" }),
        React.createElement('circle', { cx: "9", cy: "19", r: "1" }),
        React.createElement('circle', { cx: "15", cy: "12", r: "1" }),
        React.createElement('circle', { cx: "15", cy: "5", r: "1" }),
        React.createElement('circle', { cx: "15", cy: "19", r: "1" })
    )
);

const TextIcon = ({ children, title }) => (
    React.createElement('svg', { 
        xmlns: "http://www.w3.org/2000/svg", 
        className: "h-5 w-5", 
        viewBox: "0 0 24 24", 
        title: title 
    },
      React.createElement('text', { 
        x: "50%", 
        y: "50%", 
        dominantBaseline: "middle", 
        textAnchor: "middle", 
        dy: "0.1em", // Fine-tune vertical alignment
        fontSize: children.length > 1 ? "11" : "14", // smaller font for H2/H3
        fontWeight: "700", 
        fill: "currentColor",
        fontFamily: "Inter, sans-serif" // Use the app's font for consistency
      }, 
        children
      )
    )
);

export const ParagraphIcon = () => React.createElement(TextIcon, { title: "Parágrafo" }, 'P');
export const Heading1Icon = () => React.createElement(TextIcon, { title: "Título 1" }, 'H1');
export const Heading2Icon = () => React.createElement(TextIcon, { title: "Título 2" }, 'H2');