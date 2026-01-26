import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db, fixtures, matches, players, opponents, teams, seasons } from '@/lib/db';
import { eq, desc, and, gt, lt } from 'drizzle-orm';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Users, Shield, Trophy, ArrowRight } from 'lucide-react';

export default async function AdminDashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
  }

  // Get the team (assuming single team for now)
  const team = db.select().from(teams).get();

  if (!team) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Football Team Admin</h1>
        <p className="text-gray-600">No team found. Please set up your team first.</p>
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

  // Get last result
  const lastResult = db
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
    .get();

  // Get counts
  const playerCount = db.select().from(players).where(and(eq(players.teamId, team.id), eq(players.active, true))).all().length;
  const opponentCount = db.select().from(opponents).all().length;
  const fixtureCount = currentSeason
    ? db.select().from(fixtures).where(eq(fixtures.seasonId, currentSeason.id)).all().length
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{team.name}</h1>
        <p className="text-gray-600">
          {team.ageGroup} • {currentSeason?.name || 'No active season'}
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link
          href="/admin/players"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Players</p>
              <p className="text-2xl font-bold text-gray-900">{playerCount}</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/opponents"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Opponents</p>
              <p className="text-2xl font-bold text-gray-900">{opponentCount}</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/fixtures"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Season Fixtures</p>
              <p className="text-2xl font-bold text-gray-900">{fixtureCount}</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/trophies"
          className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Trophies</p>
              <p className="text-2xl font-bold text-gray-900">Manage</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Next fixture and last result */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next Fixture */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Next Fixture</h2>
          </div>
          <div className="p-6">
            {nextFixture ? (
              <div className="space-y-3">
                <p className="text-xl font-bold text-gray-900">
                  {nextFixture.fixture.isHome ? 'vs' : '@'} {nextFixture.opponent?.name}
                </p>
                <p className="text-gray-600">
                  {format(nextFixture.fixture.dateTime, 'EEEE, MMMM d, yyyy')} at{' '}
                  {format(nextFixture.fixture.dateTime, 'h:mm a')}
                </p>
                <p className="text-sm text-gray-500">
                  {nextFixture.fixture.venueName}
                </p>
                <Link
                  href={`/admin/fixtures/${nextFixture.fixture.id}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  View details <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ) : (
              <p className="text-gray-500">No upcoming fixtures scheduled</p>
            )}
          </div>
        </div>

        {/* Last Result */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Last Result</h2>
          </div>
          <div className="p-6">
            {lastResult ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xl font-bold text-gray-900">
                    {lastResult.fixture.isHome ? 'vs' : '@'} {lastResult.opponent?.name}
                  </p>
                  <p className="text-2xl font-bold">
                    <span
                      className={
                        lastResult.match.ourScore > lastResult.match.theirScore
                          ? 'text-green-600'
                          : lastResult.match.ourScore < lastResult.match.theirScore
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }
                    >
                      {lastResult.match.ourScore} - {lastResult.match.theirScore}
                    </span>
                  </p>
                </div>
                <p className="text-gray-600">
                  {format(lastResult.fixture.dateTime, 'MMMM d, yyyy')}
                </p>
                <Link
                  href={`/admin/fixtures/${lastResult.fixture.id}`}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  View match details <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            ) : (
              <p className="text-gray-500">No results yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/players/new"
            className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Add Player
          </Link>
          <Link
            href="/admin/opponents/new"
            className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Add Opponent
          </Link>
          <Link
            href="/admin/fixtures/new"
            className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Add Fixture
          </Link>
          <Link
            href="/admin/fixtures?status=played"
            className="flex items-center justify-center px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            View Results
          </Link>
        </div>
      </div>
    </div>
  );
}
