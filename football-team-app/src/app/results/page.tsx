import { db, fixtures, matches, opponents, teams, seasons } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import Link from 'next/link';
import { format } from 'date-fns';
import { Trophy } from 'lucide-react';
import { PublicNav } from '@/components/public/PublicNav';

export default async function ResultsPage() {
  const team = db.select().from(teams).get();

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">No team configured yet.</p>
      </div>
    );
  }

  const currentSeason = db
    .select()
    .from(seasons)
    .where(and(eq(seasons.teamId, team.id), eq(seasons.isCurrent, true)))
    .get();

  // Get all results
  const allResults = db
    .select({
      fixture: fixtures,
      match: matches,
      opponent: opponents,
    })
    .from(fixtures)
    .innerJoin(matches, eq(fixtures.id, matches.fixtureId))
    .leftJoin(opponents, eq(fixtures.opponentId, opponents.id))
    .where(
      and(
        eq(fixtures.teamId, team.id),
        eq(fixtures.status, 'Played')
      )
    )
    .orderBy(desc(fixtures.dateTime))
    .all();

  // Calculate season stats
  const wins = allResults.filter((r) => r.match.ourScore > r.match.theirScore).length;
  const draws = allResults.filter((r) => r.match.ourScore === r.match.theirScore).length;
  const losses = allResults.filter((r) => r.match.ourScore < r.match.theirScore).length;
  const goalsFor = allResults.reduce((sum, r) => sum + r.match.ourScore, 0);
  const goalsAgainst = allResults.reduce((sum, r) => sum + r.match.theirScore, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav teamName={team.name} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Results</h1>
          <p className="text-gray-600 mt-1">{currentSeason?.name || 'Current Season'}</p>
        </div>

        {/* Season Summary */}
        {allResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Season Summary</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-gray-900">{allResults.length}</p>
                <p className="text-sm text-gray-500">Played</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{wins}</p>
                <p className="text-sm text-gray-500">Won</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-600">{draws}</p>
                <p className="text-sm text-gray-500">Drawn</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{losses}</p>
                <p className="text-sm text-gray-500">Lost</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{goalsFor}</p>
                <p className="text-sm text-gray-500">GF</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">{goalsAgainst}</p>
                <p className="text-sm text-gray-500">GA</p>
              </div>
            </div>
          </div>
        )}

        {/* Results List */}
        {allResults.length > 0 ? (
          <div className="space-y-4">
            {allResults.map(({ fixture, match, opponent }) => {
              const isWin = match.ourScore > match.theirScore;
              const isDraw = match.ourScore === match.theirScore;
              const isLoss = match.ourScore < match.theirScore;

              return (
                <Link
                  key={fixture.id}
                  href={`/matches/${match.id}`}
                  className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 flex items-center justify-center rounded-full font-bold text-xl ${
                          isWin
                            ? 'bg-green-100 text-green-600'
                            : isLoss
                            ? 'bg-red-100 text-red-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isWin ? 'W' : isLoss ? 'L' : 'D'}
                      </div>
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          {fixture.isHome ? 'vs' : '@'} {opponent?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {format(fixture.dateTime, 'EEE, MMM d, yyyy')} •{' '}
                          {fixture.isHome ? 'Home' : 'Away'}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`text-3xl font-bold ${
                        isWin
                          ? 'text-green-600'
                          : isLoss
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {match.ourScore} - {match.theirScore}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No results yet this season</p>
          </div>
        )}
      </main>
    </div>
  );
}
