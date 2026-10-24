import type { Stats, BestiaryEntry, TerrainProperties } from './gameData';

export type TurnPhase = 'ranger' | 'creature' | 'companion' | 'event';

export type TerrainShape = 'box' | 'circle' | 'line' | 'zone';

export interface TerrainObject {
  id: string;
  name: string;
  type: string;
  shape: TerrainShape;
  x: number; // center X in inches
  y: number; // center Y in inches
  widthInches: number;
  lengthInches: number;
  radiusInches: number;
  rotationDegrees: number;
  endX?: number; // for line segments
  endY?: number;
  properties: TerrainProperties;
}

export type TokenCategory =
  | 'ranger'
  | 'companion'
  | 'monster'
  | 'clue'
  | 'treasure'
  | 'door'
  | 'terrain'
  | 'civilian'
  | 'target_point';

export interface TokenStatus {
  isWounded?: boolean;
  isPoisoned?: boolean;
  isEngaged?: boolean;
  isActivated?: boolean;
  activatedInPhase?: TurnPhase | null;
  actionsLeft?: number;
  maxActions?: number;
  hasMoved?: boolean;
  hasAttacked?: boolean;
  isLocked?: boolean;
  isOpen?: boolean;
  isSearched?: boolean;
  notes?: string;
}

export interface Token {
  id: string;
  name: string;
  category: TokenCategory;
  x: number; // position in inches from left
  y: number; // position in inches from top
  radiusInches: number; // base size (default 0.5 inches = 1 inch base diameter)
  stats?: Stats;
  currentHp?: number;
  maxHp?: number;
  armor?: number;
  fight?: number;
  shoot?: number;
  move?: number;
  will?: number;
  traits?: string[];
  specialRules?: string;
  status: TokenStatus;
  clueId?: number;
  color?: string;
  icon?: string;
  sourceData?: BestiaryEntry | any;
}

export interface RangerHeroicAbility {
  id: string;
  name: string;
  description: string;
  usesMax: number;
  usesRemaining: number;
}

export interface RangerSpell {
  id: string;
  name: string;
  description: string;
  usesMax: number;
  usesRemaining: number;
}

export interface RangerCharacter {
  id: string;
  name: string;
  level: number;
  xp: number;
  buildPoints: number;
  stats: Stats;
  currentHp: number;
  skills: Record<string, number>;
  heroicAbilities: RangerHeroicAbility[];
  spells: RangerSpell[];
  inventory: string[]; // 5 item slots maximum
  notes?: string;
  isOut?: boolean; // fell to 0 HP in current mission
}

export interface CompanionCharacter {
  id: string;
  name: string;
  role: string;
  rp: number; // Recruitment Points cost
  stats: Stats;
  currentHp: number;
  skills: Record<string, number>;
  equipment: string[];
  notes?: string;
  isOut?: boolean;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  turnNumber: number;
  phase: TurnPhase;
  message: string;
  type: 'system' | 'combat' | 'event' | 'ai' | 'dice' | 'clue' | 'llm';
  details?: any;
}

export interface LLMSettings {
  provider: 'openai' | 'anthropic' | 'google' | 'custom';
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature: number;
  enabled: boolean;
}

export interface BoardConfig {
  widthFeet: number; // e.g. 3 feet
  lengthFeet: number; // e.g. 3 feet
  pixelsPerInch: number; // Scale ratio, e.g. 40px = 1 inch
  mapImageUrl: string | null;
  calibrationMode: boolean;
  calibrationStep: 'none' | 'first_click' | 'second_click';
  calibrationStartPoint: { x: number; y: number } | null;
  calibrationEndPoint: { x: number; y: number } | null;
  gridVisible: boolean;
  gridSizeInches: number;
}
