export type GameTheme = 'lava' | 'forest' | 'neon';
export type GameState = 'menu' | 'playing' | 'gameover';
export type PageMode = 'hub' | 'play' | 'create';
export type StudioTab = 'character' | 'code' | 'world';

export interface CharacterConfig {
  bodyColor: string;
  skinColor: string;
  accessory: 'none' | 'cap' | 'crown' | 'visor' | 'headphones';
  trail: 'none' | 'fire' | 'sparkle' | 'neon';
  name: string;
}

export type CityBuildingType = 'skyscraper' | 'house' | 'shop' | 'tree' | 'lamp' | 'billboard';

export interface EnvironmentConfig {
  sky: 'sunset' | 'day' | 'night' | 'storm';
  ground: 'asphalt' | 'neon' | 'brick';
  slots: (CityBuildingType | null)[];
}

/** Simple block: WHEN something → DO action (no nested ELSE) */
export type RuleWhen = 'obstacle_low' | 'obstacle_high' | 'coin_nearby' | 'rage_ready';
export type RuleDo = 'jump' | 'duck' | 'collect' | 'rage';

export interface CodeRule {
  id: string;
  when: RuleWhen;
  do: RuleDo;
}

export interface GameSettings {
  speed: 'slow' | 'normal' | 'fast';
  difficulty: 'easy' | 'normal' | 'hard';
  coins: boolean;
  rage: boolean;
}

export interface GameDesign {
  character: CharacterConfig;
  environment: EnvironmentConfig;
  rules: CodeRule[];
  settings: GameSettings;
}

export interface GameConfig {
  startSpeed: number;
  maxSpeed: number;
  obstacleGapMin: number;
  obstacleGapMax: number;
  coinGapMin: number;
  coinGapMax: number;
  rageEnabled: boolean;
  theme: GameTheme;
}

export const DEFAULT_CHARACTER: CharacterConfig = {
  bodyColor: '#f97316',
  skinColor: '#fbbf24',
  accessory: 'none',
  trail: 'fire',
  name: 'Runner',
};

export const DEFAULT_ENVIRONMENT: EnvironmentConfig = {
  sky: 'sunset',
  ground: 'asphalt',
  slots: ['skyscraper', 'house', null, 'shop', 'tree', 'skyscraper', null, 'lamp', 'billboard', 'house'],
};

export const DEFAULT_SETTINGS: GameSettings = {
  speed: 'normal',
  difficulty: 'normal',
  coins: true,
  rage: true,
};

export const DEFAULT_RULES: CodeRule[] = [
  { id: 'r1', when: 'obstacle_low', do: 'jump' },
  { id: 'r2', when: 'obstacle_high', do: 'duck' },
];

export const DEFAULT_DESIGN: GameDesign = {
  character: DEFAULT_CHARACTER,
  environment: DEFAULT_ENVIRONMENT,
  rules: DEFAULT_RULES,
  settings: DEFAULT_SETTINGS,
};

export const RULE_PRESETS: { when: RuleWhen; do: RuleDo; label: string; color: string }[] = [
  { when: 'obstacle_low', do: 'jump', label: 'Low obstacle → Jump', color: '#6366f1' },
  { when: 'obstacle_high', do: 'duck', label: 'High obstacle → Duck', color: '#3b82f6' },
  { when: 'coin_nearby', do: 'collect', label: 'Coin nearby → Collect', color: '#f59e0b' },
  { when: 'rage_ready', do: 'rage', label: 'Rage ready → Unleash', color: '#ef4444' },
];

export const WHEN_LABELS: Record<RuleWhen, string> = {
  obstacle_low: 'low obstacle ahead',
  obstacle_high: 'high obstacle ahead',
  coin_nearby: 'coin is nearby',
  rage_ready: 'rage meter is full',
};

export const DO_LABELS: Record<RuleDo, string> = {
  jump: 'Jump',
  duck: 'Duck',
  collect: 'Collect',
  rage: 'Rage mode',
};

export function compileDesign(design: GameDesign): GameConfig {
  const { settings, environment } = design;
  const config: GameConfig = {
    startSpeed: 8,
    maxSpeed: 20,
    obstacleGapMin: 200,
    obstacleGapMax: 350,
    coinGapMin: settings.coins ? 80 : 99999,
    coinGapMax: settings.coins ? 140 : 99999,
    rageEnabled: settings.rage,
    theme: environment.sky === 'night' ? 'neon' : environment.sky === 'day' ? 'forest' : 'lava',
  };

  if (settings.speed === 'slow') { config.startSpeed = 5; config.maxSpeed = 12; }
  if (settings.speed === 'fast') { config.startSpeed = 12; config.maxSpeed = 28; }

  if (settings.difficulty === 'easy') { config.obstacleGapMin = 280; config.obstacleGapMax = 450; }
  if (settings.difficulty === 'hard') { config.obstacleGapMin = 120; config.obstacleGapMax = 220; }

  return config;
}
