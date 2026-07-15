import Ably from 'ably';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/**
 * Issues an Ably TokenRequest for the browser client.
 * Set ABLY_API_KEY in .env.local (from https://ably.com/dashboard).
 * Enable publish, subscribe, presence on the key.
 */
export async function GET(req: NextRequest) {
  const apiKey = process.env.ABLY_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          'ABLY_API_KEY is missing. Add it to .env.local from your Ably dashboard, then restart the dev server.',
      },
      { status: 500 }
    );
  }

  const clientId =
    req.nextUrl.searchParams.get('clientId')?.trim() ||
    `player-${Math.random().toString(36).slice(2, 10)}`;

  try {
    const rest = new Ably.Rest({ key: apiKey });
    const tokenRequest = await rest.auth.createTokenRequest({
      clientId,
      capability: {
        'game-room:*': ['publish', 'subscribe', 'presence', 'history'],
      },
    });
    return NextResponse.json(tokenRequest);
  } catch (err) {
    console.error('Ably token error', err);
    return NextResponse.json({ error: 'Could not create Ably token' }, { status: 500 });
  }
}
