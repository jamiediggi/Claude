import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db, trophies, trophyAwards, players, matches, fixtures, opponents, teams, seasons } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { format } from 'date-fns';
import { Trophy, Award } from 'lucide-react';

export default async function TrophiesPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
  }

  const team = db.select().from(teams).get();

  if (!team) {
    redirect('/admin');
  }

  // Get all trophies with their awards
  const allTrophies = db
    .select()
    .from(trophies)
    .where(eq(trophies.teamId, team.id))
    .all();

  // Get recent trophy awards with details
  const recentAwards = db
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
    .limit(20)
    .all();

  // Count awards per player per trophy
  const awardCounts: Record<string, Record<string, number>> = {};
  recentAwards.forEach(({ trophy, player }) => {
    if (!awardCounts[trophy.id]) {
      awardCounts[trophy.id] = {};
    }
    if (!awardCounts[trophy.id][player.id]) {
      awardCounts[trophy.id][player.id] = 0;
    }
    awardCounts[trophy.id][player.id]++;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Trophies & Awards</h1>
      </div>

      {/* Trophy overview cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allTrophies.map((trophy) => {
          const trophyAwardsList = recentAwards.filter((a) => a.trophy.id === trophy.id);
          return (
            <div key={trophy.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center mb-4">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold text-gray-900">{trophy.name}</h3>
                  {trophy.description && (
                    <p className="text-sm text-gray-500">{trophy.description}</p>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {trophyAwardsList.length} awards this season
              </p>
            </div>
          );
        })}
        {allTrophies.length === 0 && (
          <div className="col-span-full bg-white rounded-lg shadow p-6 text-center text-gray-500">
            No trophies configured yet.
          </div>
        )}
      </div>

      {/* Recent awards */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Awards</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trophy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Player
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Match
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentAwards.map(({ award, trophy, player, fixture, opponent }) => (
                <tr key={award.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {award.date ? format(award.date, 'MMM d, yyyy') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Award className="w-4 h-4 text-yellow-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {trophy.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {player.firstName} {player.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {fixture && opponent ? (
                      <span>
                        {fixture.isHome ? 'vs' : '@'} {opponent.name}
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
              {recentAwards.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                    No trophy awards yet. Awards are given when entering match results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
