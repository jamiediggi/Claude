import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db, matches, fixtures, opponents, players, matchEvents, trophyAwards, trophies, teams } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import { format } from 'date-fns';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: matchId } = await params;

    // Get match with fixture and opponent
    const matchData = db
      .select({
        match: matches,
        fixture: fixtures,
        opponent: opponents,
      })
      .from(matches)
      .innerJoin(fixtures, eq(matches.fixtureId, fixtures.id))
      .leftJoin(opponents, eq(fixtures.opponentId, opponents.id))
      .where(eq(matches.id, matchId))
      .get();

    if (!matchData) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const { match, fixture, opponent } = matchData;

    // Get team
    const team = db
      .select()
      .from(teams)
      .where(eq(teams.id, fixture.teamId))
      .get();

    // Get captain
    let captain = null;
    if (match.captainPlayerId) {
      captain = db
        .select()
        .from(players)
        .where(eq(players.id, match.captainPlayerId))
        .get();
    }

    // Get goals
    const goals = db
      .select({
        event: matchEvents,
        player: players,
      })
      .from(matchEvents)
      .leftJoin(players, eq(matchEvents.playerId, players.id))
      .where(and(eq(matchEvents.matchId, matchId), eq(matchEvents.type, 'Goal')))
      .all();

    // Count goals by player
    const goalsByPlayer: Record<string, { player: typeof players.$inferSelect; count: number }> = {};
    goals.forEach(({ player }) => {
      if (player) {
        if (!goalsByPlayer[player.id]) {
          goalsByPlayer[player.id] = { player, count: 0 };
        }
        goalsByPlayer[player.id].count++;
      }
    });

    // Get trophy awards
    const awards = db
      .select({
        award: trophyAwards,
        trophy: trophies,
        player: players,
      })
      .from(trophyAwards)
      .innerJoin(trophies, eq(trophyAwards.trophyId, trophies.id))
      .innerJoin(players, eq(trophyAwards.playerId, players.id))
      .where(eq(trophyAwards.matchId, matchId))
      .all();

    // Generate report
    const resultText = match.ourScore > match.theirScore
      ? 'victory'
      : match.ourScore < match.theirScore
      ? 'defeat'
      : 'draw';

    const scorersText = Object.values(goalsByPlayer)
      .map(({ player, count }) => {
        const name = `${player.firstName} ${player.lastName}`;
        return count > 1 ? `${name} (${count})` : name;
      })
      .join(', ');

    const trophiesText = awards
      .map(({ trophy, player }) => `${trophy.name}: ${player.firstName} ${player.lastName}`)
      .join('\n');

    const report = `MATCH REPORT
${team?.name || 'Our Team'} vs ${opponent?.name || 'Opponent'}
${format(fixture.dateTime, 'EEEE, MMMM d, yyyy')}

RESULT: ${match.ourScore} - ${match.theirScore} (${resultText.toUpperCase()})

Venue: ${fixture.venueName || (fixture.isHome ? 'Home' : 'Away')}
${fixture.isHome ? 'Home' : 'Away'} match

${captain ? `Captain: ${captain.firstName} ${captain.lastName}` : ''}

${scorersText ? `SCORERS:\n${scorersText}` : 'No goals scored'}

${trophiesText ? `\nAWARDS:\n${trophiesText}` : ''}

---
Report generated on ${format(new Date(), 'MMMM d, yyyy')} at ${format(new Date(), 'h:mm a')}`;

    // Update match with report
    db.update(matches)
      .set({
        matchReport: report,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, matchId))
      .run();

    return NextResponse.json({ report });
  } catch (error) {
    console.error('Failed to generate report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}
