export type GameMode = 'free' | 'scoreAttack' | 'skateHunt';

export interface TrickInfo {
  name: string;
  points: number;
  type: 'flip' | 'grind' | 'manual' | 'grab' | 'special';
  spinY?: number; // radians
  spinZ?: number; // radians
  spinX?: number; // radians
}

export interface ComboItem {
  name: string;
  points: number;
  isGrind?: boolean;
  isManual?: boolean;
}

export interface RailSpline {
  id: string;
  start: [number, number, number];
  end: [number, number, number];
  radius: number;
  type: 'flat' | 'down' | 'rainbow' | 'ledge';
  curve?: [number, number, number][];
}

export interface RampZone {
  id: string;
  center: [number, number, number];
  size: [number, number, number]; // width, height, depth
  type: 'quarterpipe' | 'halfpipe' | 'bank' | 'funbox';
  direction: [number, number]; // facing direction (x, z)
  radius?: number;
}

export interface CollectibleItem {
  id: string;
  type: 'letter' | 'cassette';
  letter?: 'S' | 'K' | 'A' | 'T' | 'E';
  position: [number, number, number];
  collected: boolean;
}

export interface HighScoreRecord {
  score: number;
  bestCombo: number;
  date: string;
  mode: GameMode;
}
