import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, fixtures, matches } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const fixture = db
      .select()
      .from(fixtures)
      .where(eq(fixtures.id, id))
      .get();

    if (!fixture) {
      return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
    }

    return NextResponse.json(fixture);
  } catch (error) {
    console.error('Failed to get fixture:', error);
    return NextResponse.json(
      { error: 'Failed to get fixture' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const {
      seasonId,
      opponentId,
      dateTime,
      isHome,
      venueName,
      venueAddress,
      status,
      notes,
    } = body;

    // Check if fixture has a match result - can't change certain fields
    const existingMatch = db
      .select()
      .from(matches)
      .where(eq(matches.fixtureId, id))
      .get();

    if (existingMatch && status && status !== 'Played') {
      return NextResponse.json(
        { error: 'Cannot change status of a played fixture' },
        { status: 400 }
      );
    }

    const [fixture] = db
      .update(fixtures)
      .set({
        seasonId,
        opponentId,
        dateTime: dateTime ? new Date(dateTime) : undefined,
        isHome,
        venueName: venueName || null,
        venueAddress: venueAddress || null,
        status: existingMatch ? 'Played' : (status || 'Scheduled'),
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(fixtures.id, id))
      .returning()
      .all();

    if (!fixture) {
      return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
    }

    return NextResponse.json(fixture);
  } catch (error) {
    console.error('Failed to update fixture:', error);
    return NextResponse.json(
      { error: 'Failed to update fixture' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check if fixture has a match result
    const existingMatch = db
      .select()
      .from(matches)
      .where(eq(matches.fixtureId, id))
      .get();

    if (existingMatch) {
      return NextResponse.json(
        { error: 'Cannot delete fixture with match result. Delete the match first.' },
        { status: 400 }
      );
    }

    db.delete(fixtures).where(eq(fixtures.id, id)).run();

    return NextResponse.json({ message: 'Fixture deleted' });
  } catch (error) {
    console.error('Failed to delete fixture:', error);
    return NextResponse.json(
      { error: 'Failed to delete fixture' },
      { status: 500 }
    );
  }
}
