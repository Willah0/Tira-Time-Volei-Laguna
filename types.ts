
export enum Position {
  SETTER = 'Levantador',
  ATTACKER = 'Ataque',
  DEFENDER = 'Defesa',
}

export enum Priority {
  MEMBER = 'Mensalista',
  VISITOR = 'Visitante',
}

export enum Gender {
  MALE = 'Masculino',
  FEMALE = 'Feminino',
}

export interface Player {
  id: number;
  name: string;
  positions: Position[];
  priority: Priority;
  gender: Gender;
  active: boolean;
}

export interface Team {
  name: string;
  players: Player[];
}

export interface Match {
  id: number;
  startTime: string;
  endTime?: string;
  teamA: Team;
  teamB: Team;
  winner?: 'A' | 'B';
  gameMode: '4v4' | '6v6';
}

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  playerIds: number[];
}

export type TeamFormationPriority = 'priority' | 'setter' | 'gender';

export interface GameSettings {
  defaultGameMode: '4v4' | '6v6';
  teamFormationPriority: TeamFormationPriority[];
}

export type Theme = 'system' | 'light' | 'dark';
export type AccentColor = 'mikasa' | 'penalty' | 'molten';