import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, opponents, fixtures } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const opponent = db
      .select()
      .from(opponents)
      .where(eq(opponents.id, id))
      .get();

    if (!opponent) {
      return NextResponse.json({ error: 'Opponent not found' }, { status: 404 });
    }

    return NextResponse.json(opponent);
  } catch (error) {
    console.error('Failed to get opponent:', error);
    return NextResponse.json(
      { error: 'Failed to get opponent' },
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
    const { name, homeGroundName, postcode, notes } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const [opponent] = db
      .update(opponents)
      .set({
        name,
        homeGroundName: homeGroundName || null,
        postcode: postcode || null,
        notes: notes || null,
        updatedAt: new Date(),
      })
      .where(eq(opponents.id, id))
      .returning()
      .all();

    if (!opponent) {
      return NextResponse.json({ error: 'Opponent not found' }, { status: 404 });
    }

    return NextResponse.json(opponent);
  } catch (error) {
    console.error('Failed to update opponent:', error);
    return NextResponse.json(
      { error: 'Failed to update opponent' },
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

    // Check if opponent has fixtures
    const fixtureCount = db
      .select()
      .from(fixtures)
      .where(eq(fixtures.opponentId, id))
      .all().length;

    if (fixtureCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete opponent with existing fixtures' },
        { status: 400 }
      );
    }

    db.delete(opponents).where(eq(opponents.id, id)).run();

    return NextResponse.json({ message: 'Opponent deleted' });
  } catch (error) {
    console.error('Failed to delete opponent:', error);
    return NextResponse.json(
      { error: 'Failed to delete opponent' },
      { status: 500 }
    );
  }
}
