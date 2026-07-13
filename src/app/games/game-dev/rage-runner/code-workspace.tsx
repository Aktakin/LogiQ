'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RULE_PRESETS,
  WHEN_LABELS,
  DO_LABELS,
  type CodeRule,
  type RuleWhen,
  type RuleDo,
} from './types';
import { ScratchBlock, BlockStudioGrid } from './graphics';

const PANEL_BORDER = 'rgba(255,255,255,0.06)';
const ACCENT = '#6366f1';

const DRAG_NEW = 'application/x-rage-rule-new';
const DRAG_MOVE = 'application/x-rage-rule-move';

function presetColor(when: RuleWhen): string {
  return RULE_PRESETS.find((p) => p.when === when)?.color ?? '#6366f1';
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-3">{children}</p>
  );
}

function PaletteBlock({ when, do: doAction, color }: { when: RuleWhen; do: RuleDo; color: string }) {
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DRAG_NEW, JSON.stringify({ when, do: doAction }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div draggable onDragStart={onDragStart} className="cursor-grab active:cursor-grabbing">
      <ScratchBlock color={color} variant="palette">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="bg-black/25 px-1.5 py-0.5 rounded font-black text-[9px]">WHEN</span>
          <span className="flex-1">{WHEN_LABELS[when]}</span>
          <span className="text-white/50 text-[10px]">→</span>
          <span className="bg-black/25 px-1.5 py-0.5 rounded font-black text-[9px]">DO</span>
          <span>{DO_LABELS[doAction]}</span>
        </div>
      </ScratchBlock>
    </div>
  );
}

function ScriptBlock({
  rule,
  index,
  isDragging,
  onRemove,
  onDragStart,
  onDragEnd,
}: {
  rule: CodeRule;
  index: number;
  isDragging: boolean;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const color = presetColor(rule.when);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: isDragging ? 0.35 : 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="cursor-grab active:cursor-grabbing group"
    >
      <ScratchBlock color={color} variant="script">
        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <span className="text-white/40 text-[10px] font-mono w-4">{index + 1}</span>
          <span className="bg-black/25 px-1.5 py-0.5 rounded font-black text-[9px]">WHEN</span>
          <span className="flex-1">{WHEN_LABELS[rule.when]}</span>
          <span className="text-white/50 text-[10px]">→</span>
          <span className="bg-black/25 px-1.5 py-0.5 rounded font-black text-[9px]">DO</span>
          <span>{DO_LABELS[rule.do]}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="opacity-0 group-hover:opacity-100 w-5 h-5 rounded-full bg-black/25 hover:bg-red-500/50 text-xs transition-all ml-1"
          >
            ×
          </button>
        </div>
      </ScratchBlock>
    </motion.div>
  );
}

function DropSlot({
  index,
  isActive,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  index: number;
  isActive: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="transition-all duration-150 rounded-lg"
      style={{
        height: isActive ? 28 : 6,
        margin: isActive ? '4px 0' : '0',
        background: isActive ? `${ACCENT}33` : 'transparent',
        border: isActive ? `2px dashed ${ACCENT}` : '2px dashed transparent',
      }}
      data-drop-index={index}
    />
  );
}

interface CodeWorkspaceProps {
  rules: CodeRule[];
  onAddRule: (when: RuleWhen, doAction: RuleDo, index?: number) => void;
  onRemoveRule: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function CodeWorkspace({ rules, onAddRule, onRemoveRule, onReorder }: CodeWorkspaceProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isOverScript, setIsOverScript] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const handleDragOverSlot = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes(DRAG_MOVE) ? 'move' : 'copy';
    setDragOverIndex(index);
    setIsOverScript(true);
  };

  const handleDropAt = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    setIsOverScript(false);
    setDraggingId(null);

    const moveData = e.dataTransfer.getData(DRAG_MOVE);
    if (moveData) {
      const { fromIndex } = JSON.parse(moveData) as { fromIndex: number };
      let toIndex = index;
      if (fromIndex < toIndex) toIndex -= 1;
      if (fromIndex !== toIndex) onReorder(fromIndex, toIndex);
      return;
    }

    const newData = e.dataTransfer.getData(DRAG_NEW);
    if (newData) {
      const { when, do: doAction } = JSON.parse(newData) as { when: RuleWhen; do: RuleDo };
      onAddRule(when, doAction, index);
    }
  };

  const handleScriptDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverScript(true);
    if (rules.length === 0) setDragOverIndex(0);
  };

  const handleScriptDrop = (e: React.DragEvent) => {
    if (dragOverIndex !== null) return;
    e.preventDefault();
    setIsOverScript(false);
    setDraggingId(null);

    const moveData = e.dataTransfer.getData(DRAG_MOVE);
    if (moveData) {
      const { fromIndex } = JSON.parse(moveData) as { fromIndex: number };
      if (fromIndex !== rules.length - 1) onReorder(fromIndex, rules.length);
      return;
    }

    const newData = e.dataTransfer.getData(DRAG_NEW);
    if (newData) {
      const { when, do: doAction } = JSON.parse(newData) as { when: RuleWhen; do: RuleDo };
      onAddRule(when, doAction);
    }
  };

  const handleTrashDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOverTrash(false);
    setDraggingId(null);
    const moveData = e.dataTransfer.getData(DRAG_MOVE);
    if (moveData) {
      const { id } = JSON.parse(moveData) as { id: string; fromIndex: number };
      onRemoveRule(id);
    }
  };

  return (
    <div className="grid lg:grid-cols-[minmax(200px,240px)_1fr] gap-4">
      {/* Block palette */}
      <div>
        <SectionLabel>Block palette</SectionLabel>
        <p className="text-xs text-gray-600 mb-3">Drag blocks into the script area →</p>
        <div className="space-y-2">
          {RULE_PRESETS.map((preset) => (
            <PaletteBlock key={preset.when} when={preset.when} do={preset.do} color={preset.color} />
          ))}
        </div>
        <p className="text-[10px] text-gray-600 mt-3 hidden sm:block">
          Tip: tap a block on mobile to add it
        </p>
        <div className="mt-2 space-y-2 sm:hidden">
          {RULE_PRESETS.map((preset) => (
            <button
              key={`tap-${preset.when}`}
              onClick={() => onAddRule(preset.when, preset.do)}
              className="w-full text-left text-xs text-gray-500 px-2 py-1 rounded hover:bg-white/5"
            >
              + {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Script drop zone */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <SectionLabel>Runner script</SectionLabel>
          <span className="text-[10px] text-gray-600 -mt-3">Top rule runs first</span>
        </div>

        <BlockStudioGrid className="min-h-[280px] p-4">
          <div className="flex items-center gap-2 mb-4 pb-3" style={{ borderBottom: `1px solid ${PANEL_BORDER}` }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: 'rgba(99,102,241,0.2)' }}>
              🤖
            </div>
            <div>
              <p className="text-sm font-semibold text-white">When game runs…</p>
              <p className="text-[10px] text-gray-500">Drop code blocks here to program your runner</p>
            </div>
          </div>

          <div
            onDragOver={handleScriptDragOver}
            onDragLeave={() => { setIsOverScript(false); setDragOverIndex(null); }}
            onDrop={handleScriptDrop}
            className="min-h-[180px] transition-colors rounded-xl"
            style={{
              background: isOverScript ? 'rgba(99,102,241,0.06)' : 'transparent',
              outline: isOverScript && rules.length === 0 ? `2px dashed ${ACCENT}` : 'none',
              outlineOffset: 4,
            }}
          >
            {rules.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center pointer-events-none">
                <div className="text-3xl mb-2 opacity-30">⬇️</div>
                <p className="text-sm text-gray-500">Drag blocks here</p>
                <p className="text-xs text-gray-600 mt-1">Your runner will follow these rules automatically</p>
              </div>
            ) : (
              <div className="space-y-0">
                <DropSlot
                  index={0}
                  isActive={dragOverIndex === 0}
                  onDragOver={(e) => handleDragOverSlot(e, 0)}
                  onDragLeave={() => setDragOverIndex(null)}
                  onDrop={(e) => handleDropAt(e, 0)}
                />
                <AnimatePresence>
                  {rules.map((rule, i) => (
                    <div key={rule.id}>
                      <ScriptBlock
                        rule={rule}
                        index={i}
                        isDragging={draggingId === rule.id}
                        onRemove={() => onRemoveRule(rule.id)}
                        onDragStart={(e) => {
                          e.dataTransfer.setData(DRAG_MOVE, JSON.stringify({ id: rule.id, fromIndex: i }));
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggingId(rule.id);
                        }}
                        onDragEnd={() => { setDraggingId(null); setDragOverIndex(null); setIsOverScript(false); }}
                      />
                      <DropSlot
                        index={i + 1}
                        isActive={dragOverIndex === i + 1}
                        onDragOver={(e) => handleDragOverSlot(e, i + 1)}
                        onDragLeave={() => setDragOverIndex(null)}
                        onDrop={(e) => handleDropAt(e, i + 1)}
                      />
                    </div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Trash zone */}
          {rules.length > 0 && (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsOverTrash(true); }}
              onDragLeave={() => setIsOverTrash(false)}
              onDrop={handleTrashDrop}
              className="mt-4 flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
              style={{
                border: `2px dashed ${isOverTrash ? '#ef4444' : PANEL_BORDER}`,
                background: isOverTrash ? 'rgba(239,68,68,0.1)' : 'rgba(0,0,0,0.2)',
              }}
            >
              <span className="text-lg">{isOverTrash ? '🗑️' : '🗑'}</span>
              <span className={`text-xs ${isOverTrash ? 'text-red-400' : 'text-gray-600'}`}>
                Drag here to delete a block
              </span>
            </div>
          )}
        </BlockStudioGrid>
      </div>
    </div>
  );
}
