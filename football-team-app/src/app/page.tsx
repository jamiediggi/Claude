import { db, fixtures, matches, opponents, teams, seasons, matchEvents, players } from '@/lib/db';
import { eq, and, desc, gt, sql } from 'drizzle-orm';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, MapPin, Trophy, ChevronRight } from 'lucide-react';
import { PublicNav } from '@/components/public/PublicNav';

export default async function HomePage() {
  // Get the team
  const team = db.select().from(teams).get();

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">No team configured yet.</p>
      </div>
    );
  }

  // Get current season
  const currentSeason = db
    .select()
    .from(seasons)
    .where(and(eq(seasons.teamId, team.id), eq(seasons.isCurrent, true)))
    .get();

  // Get next upcoming fixture
  const now = new Date();
  const nextFixture = db
    .select({
      fixture: fixtures,
      opponent: opponents,
    })
    .from(fixtures)
    .leftJoin(opponents, eq(fixtures.opponentId, opponents.id))
    .where(
      and(
        eq(fixtures.teamId, team.id),
        eq(fixtures.status, 'Scheduled'),
        gt(fixtures.dateTime, now)
      )
    )
    .orderBy(fixtures.dateTime)
    .get();

  // Get last 3 results
  const recentResults = db
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
    .limit(3)
    .all();

  // Get top 5 scorers
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

  // Get top 5 scorer details
  const topScorerIds = Object.entries(goalCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const topScorers = topScorerIds.length > 0
    ? db
        .select()
        .from(players)
        .all()
        .filter((p) => topScorerIds.includes(p.id))
        .map((p) => ({ player: p, goals: goalCounts[p.id] }))
        .sort((a, b) => b.goals - a.goals)
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav teamName={team.name} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-4xl font-bold mb-2">{team.name}</h1>
          <p className="text-blue-100">
            {team.ageGroup} • {currentSeason?.name || 'Current Season'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Next Fixture */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                <h2 className="text-lg font-semibold text-blue-900">Next Fixture</h2>
              </div>
              <div className="p-6">
                {nextFixture ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">
                          {nextFixture.fixture.isHome ? 'vs' : '@'}{' '}
                          {nextFixture.opponent?.name}
                        </p>
                        <p className="text-gray-500">
                          {nextFixture.fixture.isHome ? 'Home' : 'Away'} match
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {format(nextFixture.fixture.dateTime, 'EEEE, MMMM d, yyyy')} at{' '}
                        {format(nextFixture.fixture.dateTime, 'h:mm a')}
                      </div>
                      {nextFixture.fixture.venueName && (
                        <div className="flex items-center text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          {nextFixture.fixture.venueName}
                        </div>
                      )}
                    </div>
                    <Link
                      href="/fixtures"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View all fixtures <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                ) : (
                  <p className="text-gray-500">No upcoming fixtures scheduled</p>
                )}
              </div>
            </div>

            {/* Recent Results */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden mt-6">
              <div className="px-6 py-4 bg-green-50 border-b border-green-100">
                <h2 className="text-lg font-semibold text-green-900">Recent Results</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {recentResults.map(({ fixture, match, opponent }) => (
                  <Link
                    key={fixture.id}
                    href={`/matches/${match.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {fixture.isHome ? 'vs' : '@'} {opponent?.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {format(fixture.dateTime, 'MMM d, yyyy')}
                      </p>
                    </div>
                    <div
                      className={`text-xl font-bold ${
                        match.ourScore > match.theirScore
                          ? 'text-green-600'
                          : match.ourScore < match.theirScore
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}
                    >
                      {match.ourScore} - {match.theirScore}
                    </div>
                  </Link>
                ))}
                {recentResults.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No results yet
                  </div>
                )}
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <Link
                  href="/results"
                  className="inline-flex items-center text-green-600 hover:text-green-800 font-medium"
                >
                  View all results <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Top Scorers */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 bg-yellow-50 border-b border-yellow-100">
                <h2 className="text-lg font-semibold text-yellow-900">Top Scorers</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {topScorers.map(({ player, goals }, index) => (
                  <div key={player.id} className="flex items-center justify-between p-4">
                    <div className="flex items-center">
                      <span
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-sm font-medium mr-3 ${
                          index === 0
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="font-medium text-gray-900">
                        {player.firstName} {player.lastName.charAt(0)}.
                      </span>
                    </div>
                    <span className="font-bold text-gray-900">{goals}</span>
                  </div>
                ))}
                {topScorers.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    No goals scored yet
                  </div>
                )}
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                <Link
                  href="/stats"
                  className="inline-flex items-center text-yellow-600 hover:text-yellow-800 font-medium"
                >
                  View all stats <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Link
                  href="/fixtures"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Fixtures
                </Link>
                <Link
                  href="/results"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Results
                </Link>
                <Link
                  href="/stats"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Stats
                </Link>
                <Link
                  href="/trophies"
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Trophies
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
