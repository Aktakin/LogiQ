'use client';

import { motion } from 'framer-motion';
import {
  BLOCK_TEMPLATES,
  ROUTINE_META,
  ROUTINE_PALETTE,
  formatBlockLabel,
  type ProgramBlock,
  type RoutineTemplateId,
} from '@/lib/underOneConditionLevels';

interface RoutineEditorProps {
  slot: 'a' | 'b';
  routine: ProgramBlock[];
  maxBlocks: number;
  isRunning: boolean;
  isEditing: boolean;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onClear: () => void;
  onAddBlock: (templateId: RoutineTemplateId) => void;
  onRemoveBlock: (id: string) => void;
  onUpdateBlock: (id: string, patch: Partial<ProgramBlock>) => void;
}

export function RoutineEditor({
  slot,
  routine,
  maxBlocks,
  isRunning,
  isEditing,
  onStartEdit,
  onSave,
  onCancel,
  onClear,
  onAddBlock,
  onRemoveBlock,
  onUpdateBlock,
}: RoutineEditorProps) {
  const meta = ROUTINE_META[slot];

  return (
    <div
      className="rounded-xl p-3 mb-4"
      style={{ background: `${meta.color}12`, border: `1px solid ${meta.color}35` }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-white">
          {meta.emoji} {meta.label}
        </p>
        <span className="text-[10px] text-gray-500">{routine.length}/{maxBlocks}</span>
      </div>

      {!isEditing ? (
        <>
          {routine.length === 0 ? (
            <p className="text-[11px] text-gray-500 mb-2">Empty — save hops & go blocks here</p>
          ) : (
            <div className="space-y-1 mb-2">
              {routine.map((b, i) => (
                <div key={b.id} className="text-[11px] text-gray-300 px-2 py-1 rounded bg-black/20">
                  {i + 1}. {formatBlockLabel(b)}
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={isRunning}
              onClick={onStartEdit}
              className="flex-1 py-2 rounded-lg text-xs font-medium text-white disabled:opacity-40"
              style={{ background: `${meta.color}30`, border: `1px solid ${meta.color}50` }}
            >
              {routine.length ? 'Edit' : 'Build'} {meta.label}
            </button>
            {routine.length > 0 && (
              <button
                type="button"
                disabled={isRunning}
                onClick={onClear}
                className="px-3 py-2 rounded-lg text-xs text-gray-500 hover:text-gray-300 disabled:opacity-40"
              >
                Clear
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-[10px] text-gray-500 mb-2">Tap blocks to add — saved routine runs when you Call it</p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {ROUTINE_PALETTE.map((id) => (
              <button
                key={id}
                type="button"
                disabled={routine.length >= maxBlocks}
                onClick={() => onAddBlock(id)}
                className="px-2 py-1.5 rounded-lg text-[10px] font-medium text-white disabled:opacity-40"
                style={{ background: `${BLOCK_TEMPLATES[id].color}30`, border: `1px solid ${BLOCK_TEMPLATES[id].color}60` }}
              >
                + {BLOCK_TEMPLATES[id].shortLabel}
              </button>
            ))}
          </div>
          <div className="space-y-1 mb-2 max-h-28 overflow-y-auto">
            {routine.map((b, i) => (
              <div key={b.id} className="flex items-center gap-2 text-[11px] px-2 py-1 rounded bg-black/25">
                <span className="text-gray-500 w-4">{i + 1}</span>
                <span className="flex-1 text-gray-200">{formatBlockLabel(b)}</span>
                {(b.templateId === 'if_path' || b.templateId === 'if_path_else') && (
                  <div className="flex gap-0.5">
                    {(['left', 'right'] as const).map((side) => (
                      <button
                        key={side}
                        type="button"
                        onClick={() => onUpdateBlock(b.id, { checkDir: side })}
                        className="px-1.5 py-0.5 rounded text-[9px] capitalize"
                        style={{
                          background: (b.checkDir ?? 'left') === side ? meta.color : 'rgba(255,255,255,0.1)',
                          color: '#fff',
                        }}
                      >
                        {side}
                      </button>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => onRemoveBlock(b.id)} className="text-red-400 text-xs">×</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <motion.button
              type="button"
              onClick={onSave}
              whileTap={{ scale: 0.97 }}
              className="flex-1 py-2 rounded-lg text-xs font-semibold text-white"
              style={{ background: meta.color }}
            >
              Save {meta.label}
            </motion.button>
            <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg text-xs text-gray-400">
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  );
}
