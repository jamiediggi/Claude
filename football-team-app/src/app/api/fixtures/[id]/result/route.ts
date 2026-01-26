import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, fixtures, matches, appearances, matchEvents, trophyAwards } from '@/lib/db';
import { eq } from 'drizzle-orm';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: fixtureId } = await params;
    const body = await request.json();
    const {
      ourScore,
      theirScore,
      captainPlayerId,
      playerIds,
      goals,
      trophyAwards: awards,
      summaryNotes,
    } = body;

    // Validate fixture exists and is not already played
    const fixture = db
      .select()
      .from(fixtures)
      .where(eq(fixtures.id, fixtureId))
      .get();

    if (!fixture) {
      return NextResponse.json({ error: 'Fixture not found' }, { status: 404 });
    }

    if (fixture.status === 'Played') {
      return NextResponse.json(
        { error: 'Result already entered for this fixture' },
        { status: 400 }
      );
    }

    // Create match
    const [match] = db
      .insert(matches)
      .values({
        fixtureId,
        ourScore: ourScore ?? 0,
        theirScore: theirScore ?? 0,
        captainPlayerId: captainPlayerId || null,
        summaryNotes: summaryNotes || null,
      })
      .returning()
      .all();

    // Create appearances
    if (playerIds && playerIds.length > 0) {
      for (const playerId of playerIds) {
        db.insert(appearances)
          .values({
            matchId: match.id,
            playerId,
            started: true,
          })
          .run();
      }
    }

    // Create goal events
    if (goals && goals.length > 0) {
      for (const goal of goals) {
        if (goal.playerId) {
          db.insert(matchEvents)
            .values({
              matchId: match.id,
              type: 'Goal',
              playerId: goal.playerId,
              minute: goal.minute || null,
            })
            .run();
        }
      }
    }

    // Create trophy awards
    if (awards && awards.length > 0) {
      for (const award of awards) {
        if (award.trophyId && award.playerId) {
          db.insert(trophyAwards)
            .values({
              trophyId: award.trophyId,
              matchId: match.id,
              playerId: award.playerId,
              date: fixture.dateTime,
            })
            .run();
        }
      }
    }

    // Update fixture status to Played
    db.update(fixtures)
      .set({
        status: 'Played',
        updatedAt: new Date(),
      })
      .where(eq(fixtures.id, fixtureId))
      .run();

    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    console.error('Failed to save result:', error);
    return NextResponse.json(
      { error: 'Failed to save result' },
      { status: 500 }
    );
  }
}
