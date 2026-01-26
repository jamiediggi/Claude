import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, players } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { teamId, firstName, lastName, shirtNumber, preferredPosition } = body;

    if (!teamId || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Team ID, first name, and last name are required' },
        { status: 400 }
      );
    }

    const [player] = db
      .insert(players)
      .values({
        teamId,
        firstName,
        lastName,
        shirtNumber: shirtNumber || null,
        preferredPosition: preferredPosition || null,
        active: true,
      })
      .returning()
      .all();

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('Failed to create player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
