'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  type GameDesign,
  type StudioTab,
  type CharacterConfig,
  type EnvironmentConfig,
  type CodeRule,
  type GameSettings,
  type CityBuildingType,
} from './types';
import { RunnerSprite, CityBuilding } from './graphics';
import { CodeWorkspace } from './code-workspace';

const STUDIO_BG = '#0c0e14';
const PANEL_BG = '#13161f';
const PANEL_BORDER = 'rgba(255,255,255,0.06)';
const ACCENT = '#6366f1';

const BODY_COLORS = ['#f97316', '#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#06b6d4', '#eab308'];
const SKIN_COLORS = ['#fbbf24', '#fde68a', '#fcd34d', '#f9a8d4', '#93c5fd', '#86efac', '#d4a574', '#fda4af'];
const ACCESSORIES: { id: CharacterConfig['accessory']; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'cap', label: 'Cap' },
  { id: 'crown', label: 'Crown' },
  { id: 'visor', label: 'Visor' },
  { id: 'headphones', label: 'Headphones' },
];
const TRAILS: { id: CharacterConfig['trail']; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'fire', label: 'Fire' },
  { id: 'sparkle', label: 'Sparkle' },
  { id: 'neon', label: 'Neon' },
];
const BUILDINGS: { type: CityBuildingType; label: string }[] = [
  { type: 'skyscraper', label: 'Tower' },
  { type: 'house', label: 'House' },
  { type: 'shop', label: 'Shop' },
  { type: 'tree', label: 'Tree' },
  { type: 'lamp', label: 'Lamp' },
  { type: 'billboard', label: 'Sign' },
];

function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl ${className}`}
      style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">{children}</p>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${PANEL_BORDER}` }}>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className="flex-1 px-3 py-2 text-xs font-medium transition-colors"
          style={{
            background: value === opt.id ? ACCENT : 'transparent',
            color: value === opt.id ? '#fff' : '#9ca3af',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface StudioProps {
  design: GameDesign;
  onChange: (design: GameDesign) => void;
  onBack: () => void;
  onTest: () => void;
  onSave: () => void;
  renderPreview: (compact?: boolean) => React.ReactNode;
}

export function Studio({ design, onChange, onBack, onTest, onSave, renderPreview }: StudioProps) {
  const [tab, setTab] = useState<StudioTab>('code');
  const [selectedBuilding, setSelectedBuilding] = useState<CityBuildingType | null>(null);
  const ruleIdRef = useRef(1);

  const updateCharacter = (patch: Partial<CharacterConfig>) =>
    onChange({ ...design, character: { ...design.character, ...patch } });
  const updateEnv = (patch: Partial<EnvironmentConfig>) =>
    onChange({ ...design, environment: { ...design.environment, ...patch } });
  const updateSettings = (patch: Partial<GameSettings>) =>
    onChange({ ...design, settings: { ...design.settings, ...patch } });

  const addRule = (when: CodeRule['when'], doAction: CodeRule['do'], index?: number) => {
    ruleIdRef.current += 1;
    const newRule: CodeRule = { id: `rule-${ruleIdRef.current}`, when, do: doAction };
    const rules = [...design.rules];
    if (index !== undefined) rules.splice(index, 0, newRule);
    else rules.push(newRule);
    onChange({ ...design, rules });
  };

  const reorderRules = (fromIndex: number, toIndex: number) => {
    const rules = [...design.rules];
    const [moved] = rules.splice(fromIndex, 1);
    rules.splice(toIndex, 0, moved);
    onChange({ ...design, rules });
  };

  const removeRule = (id: string) =>
    onChange({ ...design, rules: design.rules.filter((r) => r.id !== id) });

  const placeBuilding = (index: number) => {
    if (!selectedBuilding) return;
    const slots = [...design.environment.slots];
    slots[index] = selectedBuilding;
    updateEnv({ slots });
  };

  const tabs: { id: StudioTab; label: string; desc: string }[] = [
    { id: 'character', label: 'Character', desc: 'Design your runner' },
    { id: 'code', label: 'Code', desc: 'WHEN → DO rules' },
    { id: 'world', label: 'World', desc: 'Build the city' },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: STUDIO_BG }}>
      {/* Toolbar */}
      <header
        className="flex items-center justify-between px-4 sm:px-6 py-3 flex-shrink-0"
        style={{ borderBottom: `1px solid ${PANEL_BORDER}`, background: PANEL_BG }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            ← Exit
          </button>
          <div className="h-5 w-px bg-white/10 hidden sm:block" />
          <div>
            <h1 className="text-sm font-semibold text-white tracking-tight">Rage Runner Studio</h1>
            <p className="text-[10px] text-gray-500">Block-based game builder</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white transition-colors"
            style={{ border: `1px solid ${PANEL_BORDER}` }}
          >
            Save
          </button>
          <button
            onClick={onTest}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: ACCENT, boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}
          >
            Run Game
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Sidebar */}
        <nav
          className="lg:w-52 flex lg:flex-col gap-1 p-3 flex-shrink-0 overflow-x-auto"
          style={{ borderRight: `1px solid ${PANEL_BORDER}`, background: 'rgba(0,0,0,0.2)' }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="text-left px-3 py-2.5 rounded-lg transition-all flex-shrink-0 lg:w-full"
              style={{
                background: tab === t.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                borderLeft: tab === t.id ? `2px solid ${ACCENT}` : '2px solid transparent',
              }}
            >
              <div className={`text-sm font-medium ${tab === t.id ? 'text-white' : 'text-gray-400'}`}>{t.label}</div>
              <div className="text-[10px] text-gray-600 hidden lg:block">{t.desc}</div>
            </button>
          ))}
        </nav>

        {/* Editor */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <AnimatePresence mode="wait">
            {tab === 'character' && (
              <motion.div key="char" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-lg space-y-5">
                <Panel className="p-5">
                  <SectionLabel>Runner Name</SectionLabel>
                  <input
                    value={design.character.name}
                    onChange={(e) => updateCharacter({ name: e.target.value.slice(0, 14) })}
                    className="w-full px-4 py-2.5 rounded-lg text-white text-sm focus:outline-none"
                    style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${PANEL_BORDER}` }}
                    placeholder="Enter name..."
                  />
                </Panel>

                <Panel className="p-5">
                  <SectionLabel>Outfit Color</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {BODY_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateCharacter({ bodyColor: c })}
                        className="w-9 h-9 rounded-lg transition-transform hover:scale-110"
                        style={{
                          background: c,
                          outline: design.character.bodyColor === c ? '2px solid #fff' : 'none',
                          outlineOffset: 2,
                        }}
                      />
                    ))}
                  </div>
                </Panel>

                <Panel className="p-5">
                  <SectionLabel>Skin Tone</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {SKIN_COLORS.map((c) => (
                      <button
                        key={c}
                        onClick={() => updateCharacter({ skinColor: c })}
                        className="w-9 h-9 rounded-full transition-transform hover:scale-110"
                        style={{
                          background: c,
                          outline: design.character.skinColor === c ? '2px solid #fff' : 'none',
                          outlineOffset: 2,
                        }}
                      />
                    ))}
                  </div>
                </Panel>

                <Panel className="p-5 space-y-4">
                  <div>
                    <SectionLabel>Accessory</SectionLabel>
                    <SegmentedControl
                      options={ACCESSORIES}
                      value={design.character.accessory}
                      onChange={(v) => updateCharacter({ accessory: v })}
                    />
                  </div>
                  <div>
                    <SectionLabel>Trail Effect</SectionLabel>
                    <SegmentedControl
                      options={TRAILS}
                      value={design.character.trail}
                      onChange={(v) => updateCharacter({ trail: v })}
                    />
                  </div>
                </Panel>

                <Panel className="p-8 flex flex-col items-center">
                  <RunnerSprite
                    isJumping={false}
                    isDucking={false}
                    rageMode={false}
                    hasShield={false}
                    isAuto={false}
                    character={design.character}
                  />
                  <p className="mt-4 text-white font-semibold">{design.character.name}</p>
                </Panel>
              </motion.div>
            )}

            {tab === 'code' && (
              <motion.div key="code" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-3xl space-y-5">
                <Panel className="p-5">
                  <SectionLabel>How it works</SectionLabel>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    Drag <span className="text-indigo-400 font-medium">WHEN → DO</span> blocks from the palette into the
                    script area. Stack them in order — your runner checks rules from top to bottom.
                  </p>
                </Panel>

                <Panel className="p-5">
                  <CodeWorkspace
                    rules={design.rules}
                    onAddRule={addRule}
                    onRemoveRule={removeRule}
                    onReorder={reorderRules}
                  />
                </Panel>

                <Panel className="p-5 space-y-4">
                  <SectionLabel>Game settings</SectionLabel>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Speed</p>
                    <SegmentedControl
                      options={[
                        { id: 'slow' as const, label: 'Slow' },
                        { id: 'normal' as const, label: 'Normal' },
                        { id: 'fast' as const, label: 'Fast' },
                      ]}
                      value={design.settings.speed}
                      onChange={(v) => updateSettings({ speed: v })}
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Obstacle density</p>
                    <SegmentedControl
                      options={[
                        { id: 'easy' as const, label: 'Easy' },
                        { id: 'normal' as const, label: 'Normal' },
                        { id: 'hard' as const, label: 'Hard' },
                      ]}
                      value={design.settings.difficulty}
                      onChange={(v) => updateSettings({ difficulty: v })}
                    />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={design.settings.coins}
                        onChange={(e) => updateSettings({ coins: e.target.checked })}
                        className="rounded accent-indigo-500"
                      />
                      Coins
                    </label>
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={design.settings.rage}
                        onChange={(e) => updateSettings({ rage: e.target.checked })}
                        className="rounded accent-indigo-500"
                      />
                      Rage mode
                    </label>
                  </div>
                </Panel>
              </motion.div>
            )}

            {tab === 'world' && (
              <motion.div key="world" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-xl space-y-5">
                <Panel className="p-5">
                  <SectionLabel>Sky</SectionLabel>
                  <SegmentedControl
                    options={[
                      { id: 'sunset' as const, label: 'Sunset' },
                      { id: 'day' as const, label: 'Day' },
                      { id: 'night' as const, label: 'Night' },
                      { id: 'storm' as const, label: 'Storm' },
                    ]}
                    value={design.environment.sky}
                    onChange={(v) => updateEnv({ sky: v })}
                  />
                </Panel>

                <Panel className="p-5">
                  <SectionLabel>Place buildings</SectionLabel>
                  <p className="text-xs text-gray-500 mb-3">Select a building, then tap a slot in the skyline</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {BUILDINGS.map((b) => (
                      <button
                        key={b.type}
                        onClick={() => setSelectedBuilding(selectedBuilding === b.type ? null : b.type)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        style={{
                          background: selectedBuilding === b.type ? ACCENT : 'rgba(0,0,0,0.3)',
                          color: selectedBuilding === b.type ? '#fff' : '#9ca3af',
                          border: `1px solid ${PANEL_BORDER}`,
                        }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                  <div
                    className="flex items-end justify-center gap-1 rounded-lg p-4 min-h-[140px]"
                    style={{ background: 'rgba(0,0,0,0.4)', border: `1px solid ${PANEL_BORDER}` }}
                  >
                    {design.environment.slots.map((building, i) => (
                      <button
                        key={i}
                        onClick={() => (selectedBuilding ? placeBuilding(i) : updateEnv({ slots: design.environment.slots.map((s, j) => (j === i ? null : s)) }))}
                        className="flex items-end justify-center rounded-md transition-colors hover:bg-white/5"
                        style={{
                          width: 40,
                          minHeight: 100,
                          border: building ? 'none' : `1px dashed ${PANEL_BORDER}`,
                        }}
                      >
                        {building ? <CityBuilding type={building} scale={0.75} /> : <span className="text-gray-700 text-lg mb-6">+</span>}
                      </button>
                    ))}
                  </div>
                </Panel>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview panel */}
        <aside
          className="lg:w-80 xl:w-96 flex-shrink-0 p-4"
          style={{ borderLeft: `1px solid ${PANEL_BORDER}`, background: 'rgba(0,0,0,0.25)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">Live Preview</p>
          <div className="rounded-xl overflow-hidden">{renderPreview(true)}</div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg py-2" style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}>
              <div className="text-[10px] text-gray-500">Rules</div>
              <div className="text-sm font-semibold text-white">{design.rules.length}</div>
            </div>
            <div className="rounded-lg py-2" style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}>
              <div className="text-[10px] text-gray-500">Buildings</div>
              <div className="text-sm font-semibold text-white">{design.environment.slots.filter(Boolean).length}</div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}