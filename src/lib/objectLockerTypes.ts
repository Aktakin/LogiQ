export type ObjectValue = string | number | boolean;

export type ObjectMode = 'build' | 'access' | 'update' | 'create' | 'play' | 'method' | 'playMethods';

export type CreateFieldType = 'string' | 'number' | 'boolean';

export type PlayKind = 'shootPractice' | 'heroCombo' | 'arena';

export type UnlockMethod = 'shoot' | 'superJump' | 'grow' | 'enemyChase' | 'enemyRoar';

export interface CreateField {
  key: string;
  type: CreateFieldType;
  choices?: string[];
  min?: number;
  max?: number;
}

export interface ObjectLevel {
  id: number;
  title: string;
  concept: string;
  instruction: string;
  hint: string;
  explanation: string;
  mode: ObjectMode;
  startObject: Record<string, ObjectValue>;
  targetObject?: Record<string, ObjectValue>;
  expectedValue?: string;
  starterCode: string;
  solutions: string[];
  createVar?: string;
  createFields?: CreateField[];
  chapter?: 'final' | 'methods';
  methodNames?: string[];
  unlockMethod?: UnlockMethod;
  playKind?: PlayKind;
}

export type HeroObject = {
  name: string;
  power: string;
  strength: number;
  speed: number;
  canFly: boolean;
};

export type CityObject = {
  name: string;
  population: number;
  landmark: string;
  neon: boolean;
};

export type EnemyObject = {
  name: string;
  hp: number;
  speed: number;
};

export type HeroMethods = {
  shoot?: boolean;
  superJump?: boolean;
  grow?: boolean;
};

export type EnemyMethods = {
  chase?: boolean;
  roar?: boolean;
};

export type ObjectLockerSave = {
  hero?: HeroObject;
  city?: CityObject;
  enemy?: EnemyObject;
  heroMethods?: HeroMethods;
  enemyMethods?: EnemyMethods;
};

export const OBJECT_LOCKER_SAVE_KEY = 'object-locker-creations-v1';
