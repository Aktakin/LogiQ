'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CodeTypingProjectProps {
  title: string;
  description: string;
  htmlCode: string;
  cssCode: string;
  expectedJs: string;
}

export default function CodeTypingProject({ title, description, htmlCode, cssCode, expectedJs }: CodeTypingProjectProps) {
  const [typed, setTyped] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isComplete = typed.trim() === expectedJs.trim();

  useEffect(() => {
    if (isComplete && showPreview) {
      textareaRef.current?.blur();
    }
  }, [isComplete, showPreview]);

  const expectedLines = expectedJs.split('\n');
  const typedLines = typed.split('\n');

  const getLineSegments = (expectedLine: string, typedLine: string) => {
    const len = Math.max(expectedLine.length, typedLine.length);
    let correctLen = 0;
    while (correctLen < expectedLine.length && correctLen < typedLine.length && expectedLine[correctLen] === typedLine[correctLen]) {
      correctLen++;
    }
    return {
      correct: expectedLine.slice(0, correctLen),
      wrong: typedLine.slice(correctLen),
      remaining: expectedLine.slice(typedLine.length),
    };
  };

  const fullPageHtml = (js: string) => {
    const safeJs = js.replace(/<\/script>/gi, '<\\/script>');
    const end = '</scr' + 'ipt>';
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${cssCode}</style></head><body>${htmlCode}<script>${safeJs}${end}</body></html>`;
  };

  const previewSrc = showPreview
    ? (() => {
        const html = fullPageHtml(isComplete ? typed : expectedJs);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        return URL.createObjectURL(blob);
      })()
    : '';

  return (
    <main className="min-h-screen min-h-[100dvh] flex flex-col bg-slate-950 overflow-hidden">
      {/* Top bar: Back, title, Preview button */}
      <header className="flex-shrink-0 flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 bg-slate-900/90 border-b border-slate-700 flex-wrap">
        <motion.button
          onClick={() => window.history.back()}
          className="px-3 sm:px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-gray-300 hover:text-white text-sm min-h-[44px] touch-target"
        >
          ← Back
        </motion.button>
        <div className="flex-1 min-w-0 order-3 w-full sm:order-none sm:w-auto basis-full sm:basis-auto">
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-white truncate">{title}</h1>
          <p className="text-gray-500 text-xs truncate">{description}</p>
        </div>
        <motion.button
          onClick={() => setShowPreview(true)}
          className="flex-shrink-0 px-3 sm:px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 min-h-[44px] touch-target"
        >
          Preview
        </motion.button>
      </header>

      {/* Full-screen JavaScript typing area */}
      <div className="flex-1 min-h-0 overflow-auto bg-slate-900/50">
        <div className="p-3 sm:p-4 md:p-6 max-w-4xl mx-auto">
          <div className="relative inline-block min-w-full">
            <pre
              className="m-0 whitespace-pre text-base leading-relaxed pointer-events-none select-none pr-4"
              style={{ fontFamily: 'ui-monospace, monospace', lineHeight: '1.75rem' }}
              aria-hidden
            >
              {expectedLines.map((expectedLine, i) => {
                const typedLine = typedLines[i] ?? '';
                const { correct, wrong, remaining } = getLineSegments(expectedLine, typedLine);
                return (
                  <span key={i}>
                    <span className="text-emerald-400">{correct}</span>
                    {wrong && <span className="text-red-400 bg-red-500/20">{wrong}</span>}
                    <span className="text-slate-500">{remaining}</span>
                    {i < expectedLines.length - 1 ? '\n' : ''}
                  </span>
                );
              })}
              {typedLines.length > expectedLines.length && (
                <span className="text-red-400 bg-red-500/20">
                  {'\n' + typedLines.slice(expectedLines.length).join('\n')}
                </span>
              )}
            </pre>
            <textarea
              ref={textareaRef}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  const next = typed.slice(0, start) + '  ' + typed.slice(end);
                  setTyped(next);
                  setTimeout(() => {
                    e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                  }, 0);
                }
              }}
              spellCheck={false}
              className="absolute inset-0 w-full min-h-full resize-none bg-transparent text-transparent caret-cyan-400 font-mono outline-none cursor-text overflow-hidden"
              style={{
                fontFamily: 'ui-monospace, monospace',
                fontSize: '1rem',
                lineHeight: '1.75rem',
                whiteSpace: 'pre',
                padding: 0,
              }}
              placeholder=""
            />
          </div>
        </div>
      </div>

      {/* Full-screen preview overlay */}
      {showPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-slate-950"
        >
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
            <span className="text-white font-semibold">
              Preview {!isComplete && <span className="text-amber-400 font-normal text-xs">(solution)</span>}
            </span>
            <motion.button
              onClick={() => setShowPreview(false)}
              className="px-4 py-2 rounded-xl bg-slate-700 text-white text-sm hover:bg-slate-600"
            >
              ← Back to code
            </motion.button>
          </div>
          <div className="flex-1 min-h-0 p-4 bg-slate-900">
            <iframe
              key={previewSrc || 'preview'}
              title="Project preview"
              src={previewSrc}
              className="w-full h-full rounded-xl border border-slate-600 bg-white"
            />
          </div>
        </motion.div>
      )}
    </main>
  );
}
