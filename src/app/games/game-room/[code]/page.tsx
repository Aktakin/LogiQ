'use client';

import { Suspense } from 'react';
import GameRoomPage from './RoomClient';

export default function GameRoomRoutePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center text-white">
          Loading room…
        </main>
      }
    >
      <GameRoomPage />
    </Suspense>
  );
}
