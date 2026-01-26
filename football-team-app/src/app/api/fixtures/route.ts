import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, fixtures } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      teamId,
      seasonId,
      opponentId,
      dateTime,
      isHome,
      venueName,
      venueAddress,
      status,
      notes,
    } = body;

    if (!teamId || !seasonId || !opponentId || !dateTime) {
      return NextResponse.json(
        { error: 'Team, season, opponent, and date/time are required' },
        { status: 400 }
      );
    }

    const [fixture] = db
      .insert(fixtures)
      .values({
        teamId,
        seasonId,
        opponentId,
        dateTime: new Date(dateTime),
        isHome: isHome ?? true,
        venueName: venueName || null,
        venueAddress: venueAddress || null,
        status: status || 'Scheduled',
        notes: notes || null,
      })
      .returning()
      .all();

    return NextResponse.json(fixture, { status: 201 });
  } catch (error) {
    console.error('Failed to create fixture:', error);
    return NextResponse.json(
      { error: 'Failed to create fixture' },
      { status: 500 }
    );
  }
}
