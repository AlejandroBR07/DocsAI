export enum Team {
  Developers = 'Desenvolvedores',
  UXUI = 'UX/UI',
  Automations = 'Automações',
  AI = 'IA',
}

export interface Document {
  id: string;
  title: string;
  content: string;
  team: Team;
  createdAt: string;
}
