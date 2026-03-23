import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen min-h-[100dvh] flex flex-col items-center justify-center p-6 text-center bg-[#0a0a1a] text-slate-200">
      <div className="max-w-md">
        <p className="text-6xl mb-4" aria-hidden>
          🛸
        </p>
        <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
        <p className="text-slate-400 text-sm mb-8">
          That route does not exist in LogiQuest. Check the address or head back to play.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/"
            className="px-4 py-2.5 rounded-xl bg-cyan-600 text-white font-medium hover:bg-cyan-500 min-h-[44px] inline-flex items-center"
          >
            Home
          </Link>
          <Link
            href="/dashboard"
            className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/15 min-h-[44px] inline-flex items-center"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
