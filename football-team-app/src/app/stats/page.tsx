import { db, fixtures, matches, teams, seasons, matchEvents, appearances, players } from '@/lib/db';
import { eq, and, desc } from 'drizzle-orm';
import { PublicNav } from '@/components/public/PublicNav';

export default async function StatsPage() {
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

  // Get all goals
  const goalEvents = db
    .select({
      playerId: matchEvents.playerId,
    })
    .from(matchEvents)
    .innerJoin(matches, eq(matchEvents.matchId, matches.id))
    .innerJoin(fixtures, eq(matches.fixtureId, fixtures.id))
    .where(
      and(
        eq(matchEvents.type, 'Goal'),
        eq(fixtures.teamId, team.id)
      )
    )
    .all();

  // Count goals per player
  const goalCounts: Record<string, number> = {};
  goalEvents.forEach(({ playerId }) => {
    if (playerId) {
      goalCounts[playerId] = (goalCounts[playerId] || 0) + 1;
    }
  });

  // Get all appearances
  const allAppearances = db
    .select({
      playerId: appearances.playerId,
    })
    .from(appearances)
    .innerJoin(matches, eq(appearances.matchId, matches.id))
    .innerJoin(fixtures, eq(matches.fixtureId, fixtures.id))
    .where(eq(fixtures.teamId, team.id))
    .all();

  // Count appearances per player
  const appearanceCounts: Record<string, number> = {};
  allAppearances.forEach(({ playerId }) => {
    if (playerId) {
      appearanceCounts[playerId] = (appearanceCounts[playerId] || 0) + 1;
    }
  });

  // Get all active players
  const allPlayers = db
    .select()
    .from(players)
    .where(eq(players.teamId, team.id))
    .all();

  // Build top scorers list
  const topScorers = allPlayers
    .filter((p) => goalCounts[p.id])
    .map((p) => ({ player: p, goals: goalCounts[p.id] }))
    .sort((a, b) => b.goals - a.goals);

  // Build appearances list
  const appearanceLeaders = allPlayers
    .filter((p) => appearanceCounts[p.id])
    .map((p) => ({ player: p, appearances: appearanceCounts[p.id] }))
    .sort((a, b) => b.appearances - a.appearances);

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav teamName={team.name} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Stats</h1>
          <p className="text-gray-600 mt-1">{currentSeason?.name || 'Current Season'}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Top Scorers */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100">
              <h2 className="text-lg font-semibold text-yellow-900">Top Scorers</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {topScorers.length > 0 ? (
                topScorers.map(({ player, goals }, index) => (
                  <div key={player.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                      <span
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mr-4 ${
                          index === 0
                            ? 'bg-yellow-400 text-yellow-900'
                            : index === 1
                            ? 'bg-gray-300 text-gray-700'
                            : index === 2
                            ? 'bg-amber-600 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {player.firstName} {player.lastName}
                        </p>
                        {player.preferredPosition && (
                          <p className="text-sm text-gray-500">{player.preferredPosition}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{goals}</p>
                      <p className="text-xs text-gray-500">goals</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No goals scored yet
                </div>
              )}
            </div>
          </div>

          {/* Appearances */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <h2 className="text-lg font-semibold text-blue-900">Appearances</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {appearanceLeaders.length > 0 ? (
                appearanceLeaders.map(({ player, appearances }, index) => (
                  <div key={player.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                      <span
                        className={`w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold mr-4 ${
                          index === 0
                            ? 'bg-blue-500 text-white'
                            : index === 1
                            ? 'bg-blue-300 text-blue-800'
                            : index === 2
                            ? 'bg-blue-200 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">
                          {player.firstName} {player.lastName}
                        </p>
                        {player.preferredPosition && (
                          <p className="text-sm text-gray-500">{player.preferredPosition}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{appearances}</p>
                      <p className="text-xs text-gray-500">apps</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500">
                  No matches played yet
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
