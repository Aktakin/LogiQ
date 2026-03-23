'use client';

/**
 * Root-level error UI. Next.js requires this file to recover when the root layout
 * throws — a normal `error.tsx` cannot replace `<html>` / `<body>`.
 * Keep it self-contained (inline styles) so it still renders if CSS pipeline fails.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          fontFamily: 'system-ui, Segoe UI, sans-serif',
          background: '#0a0a1a',
          color: '#e2e8f0',
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 420 }}>
          <h1 style={{ fontSize: '1.35rem', margin: '0 0 0.5rem' }}>Something went wrong</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 1.25rem', lineHeight: 1.5 }}>
            LogiQuest hit an unexpected error. If this keeps happening, stop the dev server, delete the{' '}
            <code style={{ color: '#cbd5e1' }}>.next</code> folder, and run{' '}
            <code style={{ color: '#cbd5e1' }}>npm run dev</code> again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              marginRight: 12,
              padding: '10px 20px',
              borderRadius: 12,
              border: 'none',
              background: '#0891b2',
              color: 'white',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
          <a href="/" style={{ color: '#22d3ee', fontSize: 14 }}>
            Home
          </a>
        </div>
        {/* Helps instructors see digest in devtools */}
        {process.env.NODE_ENV === 'development' && error?.message ? (
          <pre
            style={{
              position: 'fixed',
              bottom: 8,
              left: 8,
              right: 8,
              maxHeight: '30vh',
              overflow: 'auto',
              fontSize: 11,
              color: '#f87171',
              textAlign: 'left',
              background: '#1e1b2e',
              padding: 8,
              borderRadius: 8,
            }}
          >
            {error.message}
          </pre>
        ) : null}
      </body>
    </html>
  );
}
