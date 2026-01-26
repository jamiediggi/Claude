import { db, trophies, trophyAwards, players, matches, fixtures, opponents, teams, seasons } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { format } from 'date-fns';
import { Trophy, Award } from 'lucide-react';
import { PublicNav } from '@/components/public/PublicNav';

export default async function TrophiesPage() {
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

  // Get all trophies
  const allTrophies = db
    .select()
    .from(trophies)
    .where(eq(trophies.teamId, team.id))
    .all();

  // Get all trophy awards with details
  const allAwards = db
    .select({
      award: trophyAwards,
      trophy: trophies,
      player: players,
      match: matches,
      fixture: fixtures,
      opponent: opponents,
    })
    .from(trophyAwards)
    .innerJoin(trophies, eq(trophyAwards.trophyId, trophies.id))
    .innerJoin(players, eq(trophyAwards.playerId, players.id))
    .leftJoin(matches, eq(trophyAwards.matchId, matches.id))
    .leftJoin(fixtures, eq(matches.fixtureId, fixtures.id))
    .leftJoin(opponents, eq(fixtures.opponentId, opponents.id))
    .where(eq(trophies.teamId, team.id))
    .orderBy(desc(trophyAwards.date))
    .all();

  // Group awards by trophy and count per player
  const trophyStats: Record<string, { trophy: typeof trophies.$inferSelect; playerCounts: Record<string, { player: typeof players.$inferSelect; count: number }> }> = {};

  allAwards.forEach(({ trophy, player }) => {
    if (!trophyStats[trophy.id]) {
      trophyStats[trophy.id] = {
        trophy,
        playerCounts: {},
      };
    }
    if (!trophyStats[trophy.id].playerCounts[player.id]) {
      trophyStats[trophy.id].playerCounts[player.id] = { player, count: 0 };
    }
    trophyStats[trophy.id].playerCounts[player.id].count++;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav teamName={team.name} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trophies & Awards</h1>
          <p className="text-gray-600 mt-1">{currentSeason?.name || 'Current Season'}</p>
        </div>

        {/* Trophy Leaders */}
        {Object.keys(trophyStats).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {Object.values(trophyStats).map(({ trophy, playerCounts }) => {
              const sortedPlayers = Object.values(playerCounts)
                .sort((a, b) => b.count - a.count)
                .slice(0, 5);

              return (
                <div key={trophy.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100 flex items-center">
                    <Trophy className="w-5 h-5 text-yellow-600 mr-2" />
                    <h2 className="text-lg font-semibold text-yellow-900">{trophy.name}</h2>
                  </div>
                  <div className="divide-y divide-gray-100">
                    {sortedPlayers.map(({ player, count }, index) => (
                      <div key={player.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center">
                          <span
                            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold mr-3 ${
                              index === 0
                                ? 'bg-yellow-400 text-yellow-900'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-900">
                            {player.firstName} {player.lastName.charAt(0)}.
                          </span>
                        </div>
                        <span className="font-bold text-gray-900">{count}</span>
                      </div>
                    ))}
                    {sortedPlayers.length === 0 && (
                      <div className="p-4 text-center text-gray-500">
                        No awards yet
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Recent Awards */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 bg-purple-50 border-b border-purple-100">
            <h2 className="text-lg font-semibold text-purple-900">Recent Awards</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {allAwards.length > 0 ? (
              allAwards.slice(0, 10).map(({ award, trophy, player, fixture, opponent }) => (
                <div key={award.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start">
                      <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                        <Award className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{trophy.name}</p>
                        <p className="text-gray-600">
                          {player.firstName} {player.lastName}
                        </p>
                        {fixture && opponent && (
                          <p className="text-sm text-gray-500 mt-1">
                            {fixture.isHome ? 'vs' : '@'} {opponent.name}
                          </p>
                        )}
                      </div>
                    </div>
                    {award.date && (
                      <span className="text-sm text-gray-500">
                        {format(award.date, 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p>No awards yet this season</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
