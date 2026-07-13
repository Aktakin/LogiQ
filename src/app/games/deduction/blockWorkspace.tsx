'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BLOCK_TEMPLATES,
  formatBlockLabel,
  isPathEditable,
  type BlockTemplateId,
  type ProgramBlock,
} from '@/lib/underOneConditionLevels';
import { ScratchBlock, ScriptArea } from './blocks';

const DRAG_NEW = 'application/x-condition-block-new';
const DRAG_MOVE = 'application/x-condition-block-move';
const ACCENT = '#f59e0b';

function PathDirToggle({
  value,
  onChange,
  disabled,
}: {
  value: 'left' | 'right';
  onChange: (v: 'left' | 'right') => void;
  disabled?: boolean;
}) {
  return (
    <div
      className="inline-flex rounded-md overflow-hidden text-[10px] font-bold shrink-0"
      style={{ border: '1px solid rgba(0,0,0,0.25)' }}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {(['left', 'right'] as const).map((side) => (
        <button
          key={side}
          type="button"
          disabled={disabled}
          onClick={() => onChange(side)}
          className="px-2 py-0.5 transition-colors disabled:opacity-40 capitalize"
          style={{
            background: value === side ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.1)',
            color: value === side ? '#fff' : 'rgba(255,255,255,0.65)',
          }}
        >
          {side}
        </button>
      ))}
    </div>
  );
}

function BlockContent({
  block,
  templateId,
  editable,
  checkDir,
  onCheckDirChange,
  isRunning,
}: {
  block?: ProgramBlock;
  templateId: BlockTemplateId;
  editable?: boolean;
  checkDir?: 'left' | 'right';
  onCheckDirChange?: (dir: 'left' | 'right') => void;
  isRunning?: boolean;
}) {
  const tpl = BLOCK_TEMPLATES[templateId];
  const label = block ? formatBlockLabel(block) : tpl.label;

  if (editable && checkDir && onCheckDirChange) {
    const action = checkDir === 'left' ? 'go left' : 'go right';
    const other = checkDir === 'left' ? 'go right' : 'go left';
    const isSimpleGo = templateId === 'if_path';

    if (isSimpleGo) {
      return (
        <div className="flex items-center gap-1.5 flex-wrap text-xs leading-snug">
          <span>{tpl.icon}</span>
          <span>Go</span>
          <PathDirToggle value={checkDir} onChange={onCheckDirChange} disabled={isRunning} />
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5 flex-wrap text-xs leading-snug">
        <span>{tpl.icon}</span>
        <span className="font-bold text-[10px] bg-black/20 px-1 rounded">IF</span>
        <span>path on</span>
        <PathDirToggle value={checkDir} onChange={onCheckDirChange} disabled={isRunning} />
        <span>→ {action}</span>
        {tpl.kind === 'if_else' && (
          <>
            <span className="font-bold text-[10px] bg-black/20 px-1 rounded">ELSE</span>
            <span>→ {other}</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span>{tpl.icon}</span>
      <span className="flex-1 leading-snug">{label}</span>
    </div>
  );
}

function PaletteBlock({ templateId }: { templateId: BlockTemplateId }) {
  const tpl = BLOCK_TEMPLATES[templateId];
  const editable = isPathEditable(templateId);
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_NEW, templateId);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      className="cursor-grab active:cursor-grabbing"
    >
      <ScratchBlock color={tpl.color} variant="palette">
        <BlockContent
          templateId={templateId}
          editable={editable}
          checkDir="left"
          onCheckDirChange={() => {}}
        />
        {editable && (
          <p className="text-[9px] text-white/50 mt-1.5">Tap left/right after dropping</p>
        )}
      </ScratchBlock>
    </div>
  );
}

function ScriptBlockRow({
  block,
  index,
  active,
  dragging,
  isRunning,
  onRemove,
  onUpdate,
  onDragStart,
  onDragEnd,
}: {
  block: ProgramBlock;
  index: number;
  active: boolean;
  dragging: boolean;
  isRunning: boolean;
  onRemove: () => void;
  onUpdate: (patch: Partial<ProgramBlock>) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}) {
  const tpl = BLOCK_TEMPLATES[block.templateId];
  const editable = isPathEditable(block.templateId);
  const checkDir = block.checkDir ?? (tpl.condition === 'path_right' ? 'right' : 'left');

  return (
    <div
      draggable={!isRunning}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className={`group rounded-lg ${isRunning ? '' : 'cursor-grab active:cursor-grabbing'} ${active ? 'ring-2 ring-amber-400/70' : ''}`}
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: dragging ? 0.4 : 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
      >
        <ScratchBlock color={tpl.color} variant="script">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/50 font-mono w-4">{index + 1}</span>
            <div className="flex-1 min-w-0">
              <BlockContent
                block={block}
                templateId={block.templateId}
                editable={editable}
                checkDir={checkDir}
                onCheckDirChange={(dir) => onUpdate({ checkDir: dir })}
                isRunning={isRunning}
              />
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              disabled={isRunning}
              className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full bg-black/25 hover:bg-red-500/40 text-xs transition-all disabled:opacity-30"
            >
              ×
            </button>
          </div>
        </ScratchBlock>
      </motion.div>
    </div>
  );
}

function DropSlot({
  index,
  active,
  onDragOver,
  onDragLeave,
  onDrop,
}: {
  index: number;
  active: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="rounded transition-all"
      style={{
        height: active ? 24 : 5,
        margin: active ? '3px 0' : 0,
        background: active ? `${ACCENT}33` : 'transparent',
        border: active ? `2px dashed ${ACCENT}` : '2px dashed transparent',
      }}
      data-drop-index={index}
    />
  );
}

interface BlockWorkspaceProps {
  palette: BlockTemplateId[];
  program: ProgramBlock[];
  maxBlocks: number;
  executingIndex: number;
  isRunning: boolean;
  onAdd: (templateId: BlockTemplateId, index?: number) => void;
  onRemove: (id: string) => void;
  onUpdate: (id: string, patch: Partial<ProgramBlock>) => void;
  onReorder: (from: number, to: number) => void;
  onClear: () => void;
}

export function BlockWorkspace({
  palette,
  program,
  maxBlocks,
  executingIndex,
  isRunning,
  onAdd,
  onRemove,
  onUpdate,
  onReorder,
  onClear,
}: BlockWorkspaceProps) {
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isOverScript, setIsOverScript] = useState(false);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const handleDragOverSlot = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isRunning) return;
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes(DRAG_MOVE) ? 'move' : 'copy';
    setDragOverIndex(index);
    setIsOverScript(true);
  };

  const handleDropAt = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (isRunning) return;
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

    const newId = e.dataTransfer.getData(DRAG_NEW) as BlockTemplateId;
    if (newId && BLOCK_TEMPLATES[newId]) onAdd(newId, index);
  };

  const handleScriptDrop = (e: React.DragEvent) => {
    if (dragOverIndex !== null) return;
    e.preventDefault();
    if (isRunning) return;
    setIsOverScript(false);
    setDraggingId(null);

    const moveData = e.dataTransfer.getData(DRAG_MOVE);
    if (moveData) {
      const { fromIndex } = JSON.parse(moveData) as { fromIndex: number };
      if (fromIndex !== program.length - 1) onReorder(fromIndex, program.length);
      return;
    }

    const newId = e.dataTransfer.getData(DRAG_NEW) as BlockTemplateId;
    if (newId && BLOCK_TEMPLATES[newId]) onAdd(newId);
  };

  return (
    <div className="grid lg:grid-cols-[minmax(180px,220px)_1fr] gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-500 mb-2">Block palette</p>
        <p className="text-xs text-gray-600 mb-3">Drag into your program →</p>
        <div className="space-y-2">
          {palette.map((id) => (
            <PaletteBlock key={id} templateId={id} />
          ))}
        </div>
        <div className="mt-3 lg:hidden space-y-1">
          {palette.map((id) => (
            <button
              key={`tap-${id}`}
              type="button"
              disabled={isRunning || program.length >= maxBlocks}
              onClick={() => onAdd(id)}
              className="w-full text-left text-xs text-gray-500 px-2 py-1.5 rounded-lg hover:bg-white/5 disabled:opacity-40"
            >
              + {BLOCK_TEMPLATES[id].shortLabel}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-gray-600 mt-3">{program.length}/{maxBlocks} blocks</p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); if (!isRunning) setIsOverScript(true); }}
        onDragLeave={() => { setIsOverScript(false); setDragOverIndex(null); }}
        onDrop={handleScriptDrop}
      >
        <ScriptArea isOver={isOverScript} empty={program.length === 0}>
          {program.length > 0 && (
            <div>
              <DropSlot
                index={0}
                active={dragOverIndex === 0}
                onDragOver={(e) => handleDragOverSlot(e, 0)}
                onDragLeave={() => setDragOverIndex(null)}
                onDrop={(e) => handleDropAt(e, 0)}
              />
              <AnimatePresence>
                {program.map((block, i) => (
                  <div key={block.id}>
                    <ScriptBlockRow
                      block={block}
                      index={i}
                      active={executingIndex === i}
                      dragging={draggingId === block.id}
                      isRunning={isRunning}
                      onRemove={() => onRemove(block.id)}
                      onUpdate={(patch) => onUpdate(block.id, patch)}
                      onDragStart={(e) => {
                        if (isRunning) return;
                        e.dataTransfer.setData(DRAG_MOVE, JSON.stringify({ id: block.id, fromIndex: i }));
                        e.dataTransfer.effectAllowed = 'move';
                        setDraggingId(block.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOverIndex(null);
                        setIsOverScript(false);
                      }}
                    />
                    <DropSlot
                      index={i + 1}
                      active={dragOverIndex === i + 1}
                      onDragOver={(e) => handleDragOverSlot(e, i + 1)}
                      onDragLeave={() => setDragOverIndex(null)}
                      onDrop={(e) => handleDropAt(e, i + 1)}
                    />
                  </div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScriptArea>

        {program.length > 0 && (
          <div className="flex gap-2 mt-3">
            <div
              onDragOver={(e) => { e.preventDefault(); if (!isRunning) setIsOverTrash(true); }}
              onDragLeave={() => setIsOverTrash(false)}
              onDrop={(e) => {
                e.preventDefault();
                if (isRunning) return;
                setIsOverTrash(false);
                setDraggingId(null);
                const moveData = e.dataTransfer.getData(DRAG_MOVE);
                if (moveData) {
                  const { id } = JSON.parse(moveData) as { id: string };
                  onRemove(id);
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs transition-all"
              style={{
                border: `2px dashed ${isOverTrash ? '#ef4444' : 'rgba(255,255,255,0.1)'}`,
                background: isOverTrash ? 'rgba(239,68,68,0.1)' : 'rgba(0,0,0,0.2)',
                color: isOverTrash ? '#f87171' : '#6b7280',
              }}
            >
              🗑 Drag here to delete
            </div>
            <button
              type="button"
              onClick={onClear}
              disabled={isRunning}
              className="px-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 bg-white/5 disabled:opacity-40"
            >
              Clear all
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
