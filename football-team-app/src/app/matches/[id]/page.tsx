import { notFound } from 'next/navigation';
import { db, matches, fixtures, opponents, players, appearances, matchEvents, trophyAwards, trophies, teams } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, MapPin, User, Trophy, Calendar } from 'lucide-react';
import { PublicNav } from '@/components/public/PublicNav';

interface MatchDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchDetailPage({ params }: MatchDetailPageProps) {
  const { id } = await params;

  const team = db.select().from(teams).get();

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">No team configured yet.</p>
      </div>
    );
  }

  const matchData = db
    .select({
      match: matches,
      fixture: fixtures,
      opponent: opponents,
    })
    .from(matches)
    .innerJoin(fixtures, eq(matches.fixtureId, fixtures.id))
    .leftJoin(opponents, eq(fixtures.opponentId, opponents.id))
    .where(eq(matches.id, id))
    .get();

  if (!matchData) {
    notFound();
  }

  const { match, fixture, opponent } = matchData;

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
    .where(and(eq(matchEvents.matchId, id), eq(matchEvents.type, 'Goal')))
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
    .where(eq(trophyAwards.matchId, id))
    .all();

  const isWin = match.ourScore > match.theirScore;
  const isDraw = match.ourScore === match.theirScore;
  const isLoss = match.ourScore < match.theirScore;

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav teamName={team.name} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/results"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Results
        </Link>

        {/* Match Header */}
        <div
          className={`rounded-2xl p-8 text-white mb-8 ${
            isWin
              ? 'bg-gradient-to-r from-green-500 to-green-700'
              : isLoss
              ? 'bg-gradient-to-r from-red-500 to-red-700'
              : 'bg-gradient-to-r from-gray-500 to-gray-700'
          }`}
        >
          <p className="text-sm opacity-80 mb-2">
            {format(fixture.dateTime, 'EEEE, MMMM d, yyyy')}
          </p>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-2xl font-bold">
                {fixture.isHome ? 'vs' : '@'} {opponent?.name}
              </p>
              <p className="opacity-80">
                {fixture.isHome ? 'Home' : 'Away'} •{' '}
                {isWin ? 'Victory' : isLoss ? 'Defeat' : 'Draw'}
              </p>
            </div>
            <div className="text-5xl font-bold">
              {match.ourScore} - {match.theirScore}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Match Info */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Match Info</h2>
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <Calendar className="w-5 h-5 mr-3" />
                <span>
                  {format(fixture.dateTime, 'h:mm a')} kick-off
                </span>
              </div>
              {fixture.venueName && (
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-3" />
                  <span>{fixture.venueName}</span>
                </div>
              )}
              {captain && (
                <div className="flex items-center text-gray-600">
                  <User className="w-5 h-5 mr-3" />
                  <span>
                    Captain: {captain.firstName} {captain.lastName}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Scorers */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Scorers</h2>
            {Object.keys(goalsByPlayer).length > 0 ? (
              <div className="space-y-2">
                {Object.values(goalsByPlayer).map(({ player, count }) => (
                  <div key={player.id} className="flex items-center justify-between">
                    <span className="text-gray-900">
                      {player.firstName} {player.lastName}
                    </span>
                    <span className="font-bold text-gray-900">
                      {count > 1 ? `(${count})` : ''}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No goals scored</p>
            )}
          </div>
        </div>

        {/* Trophy Awards */}
        {awards.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Awards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {awards.map(({ award, trophy, player }) => (
                <div
                  key={award.id}
                  className="flex items-center bg-yellow-50 rounded-lg p-4"
                >
                  <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{trophy.name}</p>
                    <p className="text-gray-600">
                      {player.firstName} {player.lastName}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match Report */}
        {match.matchReport && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Match Report</h2>
            <pre className="whitespace-pre-wrap font-sans text-gray-700">
              {match.matchReport}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
