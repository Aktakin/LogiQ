import { HOME } from './home/HomeTheme';

export function HomePageBackground() {
  return (
    <>
      {/* Colorful layer behind glass */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background: `linear-gradient(
            135deg,
            #283593 0%,
            #3949AB 28%,
            #5C6BC0 48%,
            #2D9B83 72%,
            #FFB4A2 100%
          )`,
        }}
      />

      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-[5%] w-[28rem] h-[28rem] rounded-full bg-[#FFE566]/55 blur-[80px]" />
        <div className="absolute top-[20%] -right-24 w-[24rem] h-[24rem] rounded-full bg-[#F06292]/40 blur-[70px]" />
        <div className="absolute bottom-[-8rem] left-[20%] w-[32rem] h-[32rem] rounded-full bg-[#4FC3F7]/40 blur-[90px]" />
        <div className="absolute bottom-[10%] right-[15%] w-[20rem] h-[20rem] rounded-full bg-[#81C784]/40 blur-[60px]" />
      </div>

      {/* Glassmorphic sheet over the colorful backdrop */}
      <div
        className="fixed inset-0 z-0 pointer-events-none backdrop-blur-2xl"
        style={{
          background:
            'linear-gradient(160deg, rgba(255,255,255,0.42) 0%, rgba(247,242,236,0.28) 45%, rgba(255,255,255,0.22) 100%)',
          borderTop: '1px solid rgba(255,255,255,0.35)',
        }}
      />

      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(circle, ${HOME.blue}55 1px, transparent 1px)`,
          backgroundSize: '22px 22px',
        }}
      />
    </>
  );
}
