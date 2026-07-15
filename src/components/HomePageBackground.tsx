'use client';

/** Soft nebula accents on top of the shared cosmic-bg from layout */
export function HomePageBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden>
      <div className="absolute -top-24 -left-16 w-[28rem] h-[28rem] rounded-full bg-purple-600/25 blur-[100px]" />
      <div className="absolute top-[15%] -right-20 w-[24rem] h-[24rem] rounded-full bg-pink-500/20 blur-[90px]" />
      <div className="absolute bottom-[-6rem] left-[25%] w-[30rem] h-[30rem] rounded-full bg-blue-500/15 blur-[110px]" />
      <div className="absolute bottom-[20%] right-[10%] w-[18rem] h-[18rem] rounded-full bg-cyan-400/10 blur-[70px]" />
    </div>
  );
}
