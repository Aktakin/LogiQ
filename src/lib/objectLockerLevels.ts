import { objectLockerMethodLevels } from './objectLockerMethodLevels';

export type ObjectValue = string | number | boolean;

export type ObjectMode = 'build' | 'access' | 'update' | 'create' | 'play' | 'method' | 'playMethods';

export type CreateFieldType = 'string' | 'number' | 'boolean';

export type PlayKind = 'shootPractice' | 'heroCombo' | 'arena';

export type UnlockMethod = 'shoot' | 'superJump' | 'grow' | 'enemyChase' | 'enemyRoar';

export interface CreateField {
  key: string;
  type: CreateFieldType;
  /** Optional allowed strings (case-insensitive) — empty means any non-empty string. */
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
  /** Shown in the locker (start state). */
  startObject: Record<string, ObjectValue>;
  /** Goal locker after a successful build/update (access uses startObject). */
  targetObject?: Record<string, ObjectValue>;
  /** For access mode — value the expression should mean. */
  expectedValue?: string;
  starterCode: string;
  /** Acceptable typed answers (compared normalized). Empty for create/play. */
  solutions: string[];
  /** Final creative levels — validate required keys/types. */
  createVar?: string;
  createFields?: CreateField[];
  /** Badge in the level picker / header. */
  chapter?: 'final' | 'methods';
  /** Method names shown in the locker UI. */
  methodNames?: string[];
  /** Unlock a gameplay ability when this level is solved. */
  unlockMethod?: UnlockMethod;
  /** Which mini-game for playMethods mode. */
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

export const OBJECT_LOCKER_SAVE_KEY = 'object-locker-creations-v1';

export type ObjectLockerSave = {
  hero?: HeroObject;
  city?: CityObject;
  enemy?: EnemyObject;
  heroMethods?: HeroMethods;
  enemyMethods?: EnemyMethods;
};

function n(s: string) {
  return s.trim().replace(/\s+/g, ' ');
}

/** Normalize for flexible matching of object literals / access / methods. */
export function normalizeObjectAnswer(raw: string): string {
  return n(raw)
    .replace(/;+$/, '')
    .replace(/'/g, '"')
    .replace(/,\s*}/g, ' }')
    .replace(/{\s+/g, '{ ')
    .replace(/\s+}/g, ' }')
    .replace(/function\s*\(\s*\)\s*\{\s*\}/g, 'function() {}')
    .replace(/\(\s*\)\s*=>\s*\{\s*\}/g, '() => {}')
    .replace(/:\s*function\s*\(\s*\)\s*\{\s*\}/g, ': function() {}')
    .replace(/(\w+)\s*\(\s*\)\s*\{\s*\}/g, '$1() {}')
    .replace(/\(\s*\)/g, '()')
    .replace(/\s*=\s*/g, ' = ')
    .replace(/\s*\.\s*/g, '.');
}

/** Pull `{ ... }` body from typed code. */
function extractObjectBody(raw: string): string | null {
  const cleaned = raw.replace(/;+$/, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  return cleaned.slice(start + 1, end);
}

/**
 * Parse a simple object literal into key → value.
 * Supports strings, numbers, booleans — no nesting.
 */
export function parseSimpleObjectLiteral(raw: string): Record<string, ObjectValue> | null {
  const body = extractObjectBody(raw);
  if (body === null) return null;
  const out: Record<string, ObjectValue> = {};
  if (!body.trim()) return out;

  // Split on commas that are not inside quotes
  const parts: string[] = [];
  let cur = '';
  let inStr: '"' | "'" | null = null;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i]!;
    if ((ch === '"' || ch === "'") && body[i - 1] !== '\\') {
      inStr = inStr === ch ? null : inStr ?? ch;
      cur += ch;
      continue;
    }
    if (ch === ',' && !inStr) {
      parts.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur);

  for (const part of parts) {
    const colon = part.indexOf(':');
    if (colon < 0) return null;
    const key = part.slice(0, colon).trim();
    const valRaw = part.slice(colon + 1).trim();
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) return null;

    if (/^".*"$/.test(valRaw) || /^'.*'$/.test(valRaw)) {
      out[key] = valRaw.slice(1, -1);
    } else if (valRaw === 'true') {
      out[key] = true;
    } else if (valRaw === 'false') {
      out[key] = false;
    } else if (/^-?\d+(\.\d+)?$/.test(valRaw)) {
      out[key] = Number(valRaw);
    } else {
      return null;
    }
  }
  return out;
}

export function validateCreateAnswer(
  level: ObjectLevel,
  userCode: string
): { ok: true; data: Record<string, ObjectValue> } | { ok: false; message: string } {
  const fields = level.createFields;
  const varName = level.createVar;
  if (!fields || !varName) return { ok: false, message: 'Missing create config' };

  const trimmed = userCode.trim().replace(/;+$/, '');
  const assignOk =
    new RegExp(`^(let|const|var)\\s+${varName}\\s*=`, 'i').test(trimmed) ||
    new RegExp(`^${varName}\\s*=`, 'i').test(trimmed);
  if (!assignOk) {
    return { ok: false, message: `Start with let ${varName} = { ... }` };
  }

  const parsed = parseSimpleObjectLiteral(trimmed);
  if (!parsed) {
    return { ok: false, message: 'Could not read the object — check quotes, colons, and commas.' };
  }

  for (const field of fields) {
    if (!(field.key in parsed)) {
      return { ok: false, message: `Missing key: ${field.key}` };
    }
    const v = parsed[field.key]!;
    if (field.type === 'string') {
      if (typeof v !== 'string' || !v.trim()) {
        return { ok: false, message: `${field.key} needs a non-empty string in quotes.` };
      }
      if (field.choices?.length) {
        const ok = field.choices.some((c) => c.toLowerCase() === v.toLowerCase());
        if (!ok) {
          return {
            ok: false,
            message: `${field.key} should be one of: ${field.choices.map((c) => `"${c}"`).join(', ')}`,
          };
        }
      }
    } else if (field.type === 'number') {
      if (typeof v !== 'number' || Number.isNaN(v)) {
        return { ok: false, message: `${field.key} needs a number (no quotes).` };
      }
      if (field.min != null && v < field.min) {
        return { ok: false, message: `${field.key} should be at least ${field.min}.` };
      }
      if (field.max != null && v > field.max) {
        return { ok: false, message: `${field.key} should be at most ${field.max}.` };
      }
    } else if (field.type === 'boolean') {
      if (typeof v !== 'boolean') {
        return { ok: false, message: `${field.key} needs true or false (no quotes).` };
      }
    }
  }

  return { ok: true, data: parsed };
}

export function checkObjectAnswer(level: ObjectLevel, userCode: string): boolean {
  if (level.mode === 'create') {
    return validateCreateAnswer(level, userCode).ok;
  }
  if (level.mode === 'play' || level.mode === 'playMethods') return false;
  const got = normalizeObjectAnswer(userCode);
  return level.solutions.some((s) => normalizeObjectAnswer(s) === got);
}

export function asHero(data: Record<string, ObjectValue>): HeroObject {
  return {
    name: String(data.name ?? 'Hero'),
    power: String(data.power ?? 'spark'),
    strength: Number(data.strength ?? 5),
    speed: Number(data.speed ?? 5),
    canFly: Boolean(data.canFly),
  };
}

export function asCity(data: Record<string, ObjectValue>): CityObject {
  return {
    name: String(data.name ?? 'Neon City'),
    population: Number(data.population ?? 1000),
    landmark: String(data.landmark ?? 'Tower'),
    neon: Boolean(data.neon),
  };
}

export function asEnemy(data: Record<string, ObjectValue>): EnemyObject {
  return {
    name: String(data.name ?? 'Glitch'),
    hp: Number(data.hp ?? 8),
    speed: Number(data.speed ?? 4),
  };
}

/**
 * Object Locker — puzzle levels teaching JS objects.
 * Build literals, read with . / [], update properties,
 * then Final Levels: hero + city + playable character game,
 * then Methods chapter.
 */
const objectLockerCoreLevels: ObjectLevel[] = [
  // ——— BUILD ———
  {
    id: 1,
    title: 'Empty Locker',
    concept: 'An object is a collection of named slots (keys)',
    instruction: 'Create an empty object called frog with curly braces.',
    hint: 'Empty braces make an empty object.',
    explanation: 'Objects use { } — like a locker with labeled drawers. Empty braces mean no drawers yet!',
    mode: 'build',
    startObject: {},
    targetObject: {},
    starterCode: 'let frog = ',
    solutions: ['let frog = {}', 'let frog = { }'],
  },
  {
    id: 2,
    title: 'Name Tag',
    concept: 'Keys hold values — like name: "Pip"',
    instruction: 'Make frog with one property: name set to "Pip".',
    hint: 'Inside the braces, write the label, a colon, then the value.',
    explanation: 'name is the key (label). "Pip" is the value sitting in that drawer.',
    mode: 'build',
    startObject: {},
    targetObject: { name: 'Pip' },
    starterCode: 'let frog = ',
    solutions: ['let frog = { name: "Pip" }', 'let frog = {name: "Pip"}'],
  },
  {
    id: 3,
    title: 'Two Drawers',
    concept: 'Separate properties with commas',
    instruction: 'Make hero with name "Nova" and power 5.',
    hint: 'Two key:value pairs need a comma between them.',
    explanation: 'Each key:value pair is a drawer. Commas keep drawers apart.',
    mode: 'build',
    startObject: {},
    targetObject: { name: 'Nova', power: 5 },
    starterCode: 'let hero = ',
    solutions: [
      'let hero = { name: "Nova", power: 5 }',
      'let hero = {name: "Nova", power: 5}',
      'let hero = { power: 5, name: "Nova" }',
      'let hero = {power: 5, name: "Nova"}',
    ],
  },
  {
    id: 4,
    title: 'Boolean Latch',
    concept: 'Objects can store true/false too',
    instruction: 'Make door with locked set to true (no quotes on true!).',
    hint: 'Booleans are bare words: true or false.',
    explanation: 'true/false are booleans — don\'t wrap them in quotes.',
    mode: 'build',
    startObject: {},
    targetObject: { locked: true },
    starterCode: 'let door = ',
    solutions: ['let door = { locked: true }', 'let door = {locked: true}'],
  },
  {
    id: 5,
    title: 'Passport Pack',
    concept: 'Mix strings and numbers in one object',
    instruction: 'Make passport with id 42 and city "Luna".',
    hint: 'Numbers skip quotes; city text needs quotes.',
    explanation: 'One object can mix types — numbers, strings, booleans — each in its own key.',
    mode: 'build',
    startObject: {},
    targetObject: { id: 42, city: 'Luna' },
    starterCode: 'let passport = ',
    solutions: [
      'let passport = { id: 42, city: "Luna" }',
      'let passport = {id: 42, city: "Luna"}',
      'let passport = { city: "Luna", id: 42 }',
      'let passport = {city: "Luna", id: 42}',
    ],
  },
  // ——— ACCESS ———
  {
    id: 6,
    title: 'Dot Peek',
    concept: 'Read a value with object.key',
    instruction: 'Type the expression that reads the frog\'s name (use a dot).',
    hint: 'Object first, then a dot, then the key name.',
    explanation: 'frog.name means: open the frog locker, look in the name drawer.',
    mode: 'access',
    startObject: { name: 'Pip', color: 'green' },
    expectedValue: 'Pip',
    starterCode: '',
    solutions: ['frog.name', 'console.log(frog.name)'],
  },
  {
    id: 7,
    title: 'Score Check',
    concept: 'Dot access works for numbers too',
    instruction: 'Read the player\'s score with a dot.',
    hint: 'Same pattern: player then . then the key.',
    explanation: 'Whatever type is in the drawer, dot access pulls it out.',
    mode: 'access',
    startObject: { score: 120, lives: 3 },
    expectedValue: '120',
    starterCode: '',
    solutions: ['player.score', 'console.log(player.score)'],
  },
  {
    id: 8,
    title: 'Bracket Path',
    concept: 'object["key"] is another way to read',
    instruction: 'Read ship\'s kind using square brackets and quotes — like object["key"] (not a dot).',
    hint: 'Square brackets need the key as a string inside: ship["kind"]',
    explanation: 'ship["kind"] equals ship.kind — brackets are handy when the key is unusual.',
    mode: 'access',
    startObject: { kind: 'rocket', fuel: 80 },
    expectedValue: 'rocket',
    starterCode: '',
    solutions: ['ship["kind"]', "ship['kind']", 'console.log(ship["kind"])', "console.log(ship['kind'])"],
  },
  {
    id: 9,
    title: 'Which Drawer?',
    concept: 'Pick the key that matches the value you need',
    instruction: 'Robot\'s battery is low — type the access that gets battery.',
    hint: 'Look at the locker labels — which one holds the number?',
    explanation: 'You choose the key that names the drawer you care about.',
    mode: 'access',
    startObject: { name: 'Beep', battery: 12, mode: 'idle' },
    expectedValue: '12',
    starterCode: '',
    solutions: ['robot.battery', 'robot["battery"]', "robot['battery']"],
  },
  // ——— UPDATE ———
  {
    id: 10,
    title: 'Repaint',
    concept: 'Change a property with object.key = value',
    instruction: 'Change frog.color to "blue" (keep the other keys).',
    hint: 'You don\'t need let — just assign to the property.',
    explanation: 'Updating a key replaces what\'s in that drawer. Other drawers stay put.',
    mode: 'update',
    startObject: { name: 'Pip', color: 'green' },
    targetObject: { name: 'Pip', color: 'blue' },
    starterCode: '',
    solutions: ['frog.color = "blue"', 'frog["color"] = "blue"'],
  },
  {
    id: 11,
    title: 'Level Up',
    concept: 'Numbers in objects can be updated too',
    instruction: 'Set hero.power to 9.',
    hint: 'Dot assign a number — no quotes.',
    explanation: 'Same assign pattern works for numbers and booleans.',
    mode: 'update',
    startObject: { name: 'Nova', power: 5 },
    targetObject: { name: 'Nova', power: 9 },
    starterCode: '',
    solutions: ['hero.power = 9', 'hero["power"] = 9'],
  },
  {
    id: 12,
    title: 'New Drawer',
    concept: 'Assigning a new key adds a property',
    instruction: 'Add wings: true to the bird object.',
    hint: 'Use a key that isn\'t there yet, then assign.',
    explanation: 'If the key doesn\'t exist, assignment creates it — a brand-new drawer!',
    mode: 'update',
    startObject: { name: 'Sky', speed: 4 },
    targetObject: { name: 'Sky', speed: 4, wings: true },
    starterCode: '',
    solutions: ['bird.wings = true', 'bird["wings"] = true'],
  },
  {
    id: 13,
    title: 'Toggle Latch',
    concept: 'Flip a boolean property',
    instruction: 'Set door.locked to false.',
    hint: 'Boolean assign — no quotes around false.',
    explanation: 'Booleans switch like latches: true ↔ false.',
    mode: 'update',
    startObject: { locked: true, material: 'steel' },
    targetObject: { locked: false, material: 'steel' },
    starterCode: '',
    solutions: ['door.locked = false', 'door["locked"] = false'],
  },
  // ——— MIX / HARDER ———
  {
    id: 14,
    title: 'Nested Peek',
    concept: 'Objects can hold other objects',
    instruction: 'Read the nested city: player.home.city',
    hint: 'Chain dots — outer key, then inner key.',
    explanation: 'player.home is itself an object. Another .city opens the inner drawer.',
    mode: 'access',
    startObject: { name: 'Alex' },
    expectedValue: 'Mars',
    starterCode: '',
    solutions: ['player.home.city', 'player["home"]["city"]', 'player.home["city"]'],
  },
  {
    id: 15,
    title: 'Full Profile',
    concept: 'Build a complete object in one go',
    instruction: 'Create pet with name "Mochi", age 3, and soft true.',
    hint: 'Three drawers: string, number, boolean — commas between.',
    explanation: 'You can pack a whole profile into one object literal!',
    mode: 'build',
    startObject: {},
    targetObject: { name: 'Mochi', age: 3, soft: true },
    starterCode: 'let pet = ',
    solutions: [
      'let pet = { name: "Mochi", age: 3, soft: true }',
      'let pet = {name: "Mochi", age: 3, soft: true}',
      'let pet = { age: 3, name: "Mochi", soft: true }',
      'let pet = { soft: true, name: "Mochi", age: 3 }',
      'let pet = { name: "Mochi", soft: true, age: 3 }',
    ],
  },

  // ——— FINAL LEVELS ———
  {
    id: 16,
    title: 'Final Levels · Hero Forge',
    concept: 'Design your own game character as an object',
    instruction:
      'Create hero with: name (string), power (one of "lightning", "shield", "blast", "heal"), strength (1–10), speed (1–10), and canFly (true/false). Pick your own name!',
    hint: 'Example shape: let hero = { name: "Zap", power: "lightning", strength: 8, speed: 6, canFly: true }',
    explanation: 'Your hero object is game data — keys drive what the character can do!',
    mode: 'create',
    chapter: 'final',
    startObject: {},
    starterCode: '',
    solutions: [],
    createVar: 'hero',
    createFields: [
      { key: 'name', type: 'string' },
      { key: 'power', type: 'string', choices: ['lightning', 'shield', 'blast', 'heal'] },
      { key: 'strength', type: 'number', min: 1, max: 10 },
      { key: 'speed', type: 'number', min: 1, max: 10 },
      { key: 'canFly', type: 'boolean' },
    ],
  },
  {
    id: 17,
    title: 'Final Levels · City Design',
    concept: 'Build the world your hero lives in — also an object',
    instruction:
      'Create city with: name (string), population (number 100–99999), landmark (string), and neon (true/false). Invent any city name!',
    hint: 'Example: let city = { name: "Nova Bay", population: 12000, landmark: "Crystal Tower", neon: true }',
    explanation: 'Games store places as objects too — same key:value pattern as characters.',
    mode: 'create',
    chapter: 'final',
    startObject: {},
    starterCode: '',
    solutions: [],
    createVar: 'city',
    createFields: [
      { key: 'name', type: 'string' },
      { key: 'population', type: 'number', min: 100, max: 99999 },
      { key: 'landmark', type: 'string' },
      { key: 'neon', type: 'boolean' },
    ],
  },
  {
    id: 18,
    title: 'Final Character Game',
    concept: 'Play with the hero + city objects you built',
    instruction:
      'Your objects are alive! Move with ← → (or buttons), press Power to use hero.power, collect 5 orbs in your city. Flying heroes jump higher.',
    hint: 'Higher strength = stronger blast. Higher speed = faster moves. canFly helps reach high orbs.',
    explanation: 'Real games read object properties every frame — you just designed playable data!',
    mode: 'play',
    chapter: 'final',
    startObject: {},
    starterCode: '',
    solutions: [],
  },
];

export const objectLockerLevels: ObjectLevel[] = [
  ...objectLockerCoreLevels,
  ...objectLockerMethodLevels,
];

/** Nested home shown specially in level 14 UI */
export const nestedHomePreview = { city: 'Mars', pad: 7 };

export const defaultHero: HeroObject = {
  name: 'Pip',
  power: 'spark',
  strength: 5,
  speed: 5,
  canFly: false,
};

export const defaultCity: CityObject = {
  name: 'Starter Town',
  population: 1000,
  landmark: 'Park',
  neon: false,
};

export const defaultEnemy: EnemyObject = {
  name: 'Glitch',
  hp: 8,
  speed: 4,
};
