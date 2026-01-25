'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('App error:', error);
  }, [error]);

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md">
        <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
        <p className="text-gray-400 text-sm mb-6">
          The page had a problem loading. Try going back or refreshing.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-medium hover:bg-cyan-500"
          >
            Try again
          </button>
          <Link
            href="/dashboard"
            className="px-4 py-2 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
