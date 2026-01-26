import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db, fixtures, opponents, matches, teams, seasons } from '@/lib/db';
import { eq, and, desc, gt, lt } from 'drizzle-orm';
import Link from 'next/link';
import { format } from 'date-fns';
import { Plus, Calendar, CheckCircle, Clock, XCircle, Edit } from 'lucide-react';

interface FixturesPageProps {
  searchParams: Promise<{ status?: string; season?: string }>;
}

export default async function FixturesPage({ searchParams }: FixturesPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
  }

  const { status, season } = await searchParams;

  const team = db.select().from(teams).get();

  if (!team) {
    redirect('/admin');
  }

  // Get all seasons for filter
  const allSeasons = db
    .select()
    .from(seasons)
    .where(eq(seasons.teamId, team.id))
    .orderBy(desc(seasons.startDate))
    .all();

  const currentSeason = allSeasons.find((s) => s.isCurrent) || allSeasons[0];
  const selectedSeasonId = season || currentSeason?.id;

  // Build query conditions
  let query = db
    .select({
      fixture: fixtures,
      opponent: opponents,
      match: matches,
    })
    .from(fixtures)
    .leftJoin(opponents, eq(fixtures.opponentId, opponents.id))
    .leftJoin(matches, eq(fixtures.id, matches.fixtureId))
    .where(eq(fixtures.teamId, team.id));

  // Get all fixtures and filter in JS for simplicity
  const allFixtures = db
    .select({
      fixture: fixtures,
      opponent: opponents,
      match: matches,
    })
    .from(fixtures)
    .leftJoin(opponents, eq(fixtures.opponentId, opponents.id))
    .leftJoin(matches, eq(fixtures.id, matches.fixtureId))
    .where(
      selectedSeasonId
        ? and(eq(fixtures.teamId, team.id), eq(fixtures.seasonId, selectedSeasonId))
        : eq(fixtures.teamId, team.id)
    )
    .orderBy(fixtures.dateTime)
    .all();

  // Filter by status
  const filteredFixtures = status
    ? allFixtures.filter((f) => f.fixture.status.toLowerCase() === status.toLowerCase())
    : allFixtures;

  const getStatusIcon = (fixtureStatus: string) => {
    switch (fixtureStatus) {
      case 'Played':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'Scheduled':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'Postponed':
        return <XCircle className="w-4 h-4 text-yellow-600" />;
      case 'Cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (fixtureStatus: string) => {
    const colors: Record<string, string> = {
      Played: 'bg-green-100 text-green-800',
      Scheduled: 'bg-blue-100 text-blue-800',
      Postponed: 'bg-yellow-100 text-yellow-800',
      Cancelled: 'bg-red-100 text-red-800',
    };
    return colors[fixtureStatus] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fixtures</h1>
        <Link
          href="/admin/fixtures/new"
          className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Fixture
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Season
            </label>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              defaultValue={selectedSeasonId}
              onChange={(e) => {
                const url = new URL(window.location.href);
                url.searchParams.set('season', e.target.value);
                window.location.href = url.toString();
              }}
            >
              {allSeasons.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isCurrent ? '(Current)' : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex gap-2">
              <Link
                href={`/admin/fixtures?season=${selectedSeasonId}`}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !status ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </Link>
              <Link
                href={`/admin/fixtures?season=${selectedSeasonId}&status=scheduled`}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === 'scheduled' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Upcoming
              </Link>
              <Link
                href={`/admin/fixtures?season=${selectedSeasonId}&status=played`}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  status === 'played' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Played
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Fixtures list */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opponent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Result
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFixtures.map(({ fixture, opponent, match }) => (
                <tr key={fixture.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{format(fixture.dateTime, 'EEE, MMM d, yyyy')}</div>
                    <div className="text-gray-500">{format(fixture.dateTime, 'h:mm a')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="font-medium text-gray-900">
                      {fixture.isHome ? 'vs' : '@'} {opponent?.name}
                    </div>
                    <div className="text-gray-500">
                      {fixture.isHome ? 'Home' : 'Away'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {fixture.venueName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(
                        fixture.status
                      )}`}
                    >
                      {getStatusIcon(fixture.status)}
                      <span className="ml-1">{fixture.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {match ? (
                      <span
                        className={`font-bold ${
                          match.ourScore > match.theirScore
                            ? 'text-green-600'
                            : match.ourScore < match.theirScore
                            ? 'text-red-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {match.ourScore} - {match.theirScore}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/admin/fixtures/${fixture.id}`}
                        className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        title="View"
                      >
                        <Calendar className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/admin/fixtures/${fixture.id}/edit`}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      {fixture.status === 'Scheduled' && (
                        <Link
                          href={`/admin/fixtures/${fixture.id}/result`}
                          className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Enter Result
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFixtures.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    No fixtures found.
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
