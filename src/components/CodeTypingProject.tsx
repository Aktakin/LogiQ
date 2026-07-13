'use client';

import { useState, useRef, useEffect, type CSSProperties } from 'react';
import { motion } from 'framer-motion';

type CodeTab = 'html' | 'css' | 'js';

interface CodeTypingProjectProps {
  title: string;
  description: string;
  htmlCode: string;
  cssCode: string;
  expectedJs: string;
}

const TAB_META: {
  id: CodeTab;
  label: string;
  activeColor: string;
  borderColor: string;
  hintColor: string;
  correctColor: string;
}[] = [
  {
    id: 'html',
    label: 'HTML',
    activeColor: 'bg-orange-500/20 border-orange-400/50 text-orange-200',
    borderColor: 'border-orange-500/20',
    hintColor: 'text-orange-200',
    correctColor: 'text-orange-400',
  },
  {
    id: 'css',
    label: 'CSS',
    activeColor: 'bg-sky-500/20 border-sky-400/50 text-sky-200',
    borderColor: 'border-sky-500/20',
    hintColor: 'text-sky-200',
    correctColor: 'text-sky-400',
  },
  {
    id: 'js',
    label: 'JavaScript',
    activeColor: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-200',
    borderColor: 'border-emerald-500/20',
    hintColor: 'text-emerald-200',
    correctColor: 'text-emerald-400',
  },
];

function countLines(code: string) {
  return code.trim() ? code.split('\n').length : 0;
}

function codesMatch(typed: string, expected: string) {
  return typed.trim() === expected.trim();
}

function getLineSegments(expectedLine: string, typedLine: string) {
  let correctLen = 0;
  while (
    correctLen < expectedLine.length &&
    correctLen < typedLine.length &&
    expectedLine[correctLen] === typedLine[correctLen]
  ) {
    correctLen++;
  }
  return {
    correct: expectedLine.slice(0, correctLen),
    wrong: typedLine.slice(correctLen),
    remaining: expectedLine.slice(typedLine.length),
  };
}

const CODE_FONT_STYLE: CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
  fontSize: '16px',
  lineHeight: '28px',
  letterSpacing: '0',
  tabSize: 2,
  padding: 0,
  margin: 0,
  boxSizing: 'border-box',
};

function CodeTypingEditor({
  tab,
  expected,
  typed,
  onTypedChange,
}: {
  tab: CodeTab;
  expected: string;
  typed: string;
  onTypedChange: (value: string) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const meta = TAB_META.find((item) => item.id === tab)!;
  const expectedLines = expected.split('\n');
  const typedLines = typed.split('\n');
  const displayLineCount = Math.max(expectedLines.length, typedLines.length);
  const isComplete = codesMatch(typed, expected);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [tab]);

  useEffect(() => {
    const textarea = textareaRef.current;
    const pre = preRef.current;
    if (!textarea || !pre) return;
    textarea.style.height = `${pre.offsetHeight}px`;
  }, [typed, expected, tab, displayLineCount]);

  return (
    <div className={`rounded-2xl border ${meta.borderColor} bg-slate-900/70 overflow-hidden`}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-700 bg-slate-900/90">
        <p className={`text-sm ${meta.hintColor}`}>
          Type this {meta.label} exactly.{isComplete ? ' Done!' : ''}
        </p>
        <span className="text-xs text-gray-500">{countLines(expected)} lines</span>
      </div>
      <div className="p-4 sm:p-6 overflow-auto">
        <div className="flex min-w-full">
          <div
            className="shrink-0 select-none text-slate-600 text-right pr-4"
            style={CODE_FONT_STYLE}
            aria-hidden
          >
            {Array.from({ length: displayLineCount }, (_, i) => (
              <div key={i} style={{ height: '28px' }}>
                {i + 1}
              </div>
            ))}
          </div>

          <div className="relative flex-1 min-w-0">
            <pre
              ref={preRef}
              className="m-0 p-0 whitespace-pre pointer-events-none select-none"
              style={{ ...CODE_FONT_STYLE, margin: 0 }}
              aria-hidden
            >
              {expectedLines.map((expectedLine, i) => {
                const typedLine = typedLines[i] ?? '';
                const { correct, wrong, remaining } = getLineSegments(expectedLine, typedLine);
                return (
                  <div key={i} style={{ height: '28px' }}>
                    <span className={meta.correctColor}>{correct}</span>
                    {wrong && <span className="text-red-400 bg-red-500/20">{wrong}</span>}
                    <span className="text-slate-500">{remaining}</span>
                  </div>
                );
              })}
              {typedLines.length > expectedLines.length &&
                typedLines.slice(expectedLines.length).map((extraLine, i) => (
                  <div key={`extra-${i}`} style={{ height: '28px' }}>
                    <span className="text-red-400 bg-red-500/20">{extraLine}</span>
                  </div>
                ))}
            </pre>

            <textarea
              ref={textareaRef}
              value={typed}
              onChange={(e) => onTypedChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  const next = typed.slice(0, start) + '  ' + typed.slice(end);
                  onTypedChange(next);
                  setTimeout(() => {
                    e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 2;
                  }, 0);
                }
              }}
              spellCheck={false}
              wrap="off"
              className="absolute top-0 left-0 w-full resize-none bg-transparent text-transparent caret-cyan-400 outline-none cursor-text p-0 m-0 border-0 overflow-hidden"
              style={{
                ...CODE_FONT_STYLE,
                whiteSpace: 'pre',
                overflowWrap: 'normal',
                wordBreak: 'normal',
              }}
              placeholder=""
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CodeTypingProject({ title, description, htmlCode, cssCode, expectedJs }: CodeTypingProjectProps) {
  const [activeTab, setActiveTab] = useState<CodeTab>('html');
  const [typedHtml, setTypedHtml] = useState('');
  const [typedCss, setTypedCss] = useState('');
  const [typedJs, setTypedJs] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const htmlComplete = codesMatch(typedHtml, htmlCode);
  const cssComplete = codesMatch(typedCss, cssCode);
  const jsComplete = codesMatch(typedJs, expectedJs);
  const allComplete = htmlComplete && cssComplete && jsComplete;
  const completedCount = [htmlComplete, cssComplete, jsComplete].filter(Boolean).length;

  const lineCounts = {
    html: countLines(htmlCode),
    css: countLines(cssCode),
    js: countLines(expectedJs),
  };

  const tabExpected = {
    html: htmlCode,
    css: cssCode,
    js: expectedJs,
  };

  const tabTyped = {
    html: typedHtml,
    css: typedCss,
    js: typedJs,
  };

  const setTabTyped = {
    html: setTypedHtml,
    css: setTypedCss,
    js: setTypedJs,
  };

  const tabComplete = {
    html: htmlComplete,
    css: cssComplete,
    js: jsComplete,
  };

  const fullPageHtml = (html: string, css: string, js: string) => {
    const safeJs = js.replace(/<\/script>/gi, '<\\/script>');
    const end = '</scr' + 'ipt>';
    return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${css}</style></head><body>${html}<script>${safeJs}${end}</body></html>`;
  };

  const previewHtml = fullPageHtml(
    htmlComplete ? typedHtml.trim() : htmlCode.trim(),
    cssComplete ? typedCss.trim() : cssCode.trim(),
    jsComplete ? typedJs.trim() : expectedJs.trim(),
  );

  const previewSrc = showPreview
    ? (() => {
        const blob = new Blob([previewHtml], { type: 'text/html;charset=utf-8' });
        return URL.createObjectURL(blob);
      })()
    : '';

  return (
    <main className="min-h-screen min-h-[100dvh] flex flex-col bg-slate-950 overflow-hidden">
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

      <div className="flex-shrink-0 px-3 sm:px-4 py-3 border-b border-slate-800 bg-slate-900/60">
        <div className="max-w-5xl mx-auto flex flex-wrap gap-2">
          {TAB_META.map((tab) => {
            const isActive = activeTab === tab.id;
            const done = tabComplete[tab.id];
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 sm:px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${
                  isActive ? tab.activeColor : 'border-slate-700 text-gray-400 hover:text-white hover:border-slate-500'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs opacity-80">{lineCounts[tab.id]}</span>
                {done && <span className="ml-2 text-xs text-emerald-400">✓</span>}
              </button>
            );
          })}
        </div>
        <p className="max-w-5xl mx-auto mt-2 text-xs text-gray-500">
          Type HTML, CSS, and JavaScript on each tab. Preview uses your code when a file is complete ({completedCount}/3 done).
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-auto bg-slate-900/50">
        <div className="p-3 sm:p-4 md:p-6 max-w-5xl mx-auto">
          <CodeTypingEditor
            tab={activeTab}
            expected={tabExpected[activeTab]}
            typed={tabTyped[activeTab]}
            onTypedChange={setTabTyped[activeTab]}
          />
        </div>
      </div>

      {showPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col bg-slate-950"
        >
          <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-700">
            <span className="text-white font-semibold">
              Preview{' '}
              {allComplete ? (
                <span className="text-emerald-400 font-normal text-xs">(your code)</span>
              ) : (
                <span className="text-amber-400 font-normal text-xs">(mix of your code + solution)</span>
              )}
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
