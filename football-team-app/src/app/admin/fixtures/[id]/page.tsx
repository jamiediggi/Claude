import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db, fixtures, matches, opponents, players, appearances, matchEvents, trophyAwards, trophies } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft, Edit, MapPin, Clock, User, Trophy, FileText } from 'lucide-react';
import { GenerateReportButton } from '@/components/admin/GenerateReportButton';

interface FixtureDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function FixtureDetailPage({ params }: FixtureDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
  }

  const { id } = await params;

  const fixtureData = db
    .select({
      fixture: fixtures,
      opponent: opponents,
      match: matches,
    })
    .from(fixtures)
    .leftJoin(opponents, eq(fixtures.opponentId, opponents.id))
    .leftJoin(matches, eq(fixtures.id, matches.fixtureId))
    .where(eq(fixtures.id, id))
    .get();

  if (!fixtureData) {
    notFound();
  }

  const { fixture, opponent, match } = fixtureData;

  // Get captain if match exists
  let captain = null;
  if (match?.captainPlayerId) {
    captain = db
      .select()
      .from(players)
      .where(eq(players.id, match.captainPlayerId))
      .get();
  }

  // Get appearances if match exists
  let matchAppearances: { appearance: typeof appearances.$inferSelect; player: typeof players.$inferSelect }[] = [];
  if (match) {
    matchAppearances = db
      .select({
        appearance: appearances,
        player: players,
      })
      .from(appearances)
      .innerJoin(players, eq(appearances.playerId, players.id))
      .where(eq(appearances.matchId, match.id))
      .orderBy(players.shirtNumber)
      .all();
  }

  // Get goals if match exists
  let goals: { event: typeof matchEvents.$inferSelect; player: typeof players.$inferSelect | null }[] = [];
  if (match) {
    goals = db
      .select({
        event: matchEvents,
        player: players,
      })
      .from(matchEvents)
      .leftJoin(players, eq(matchEvents.playerId, players.id))
      .where(and(eq(matchEvents.matchId, match.id), eq(matchEvents.type, 'Goal')))
      .all();
  }

  // Get trophy awards if match exists
  let awards: { award: typeof trophyAwards.$inferSelect; trophy: typeof trophies.$inferSelect; player: typeof players.$inferSelect }[] = [];
  if (match) {
    awards = db
      .select({
        award: trophyAwards,
        trophy: trophies,
        player: players,
      })
      .from(trophyAwards)
      .innerJoin(trophies, eq(trophyAwards.trophyId, trophies.id))
      .innerJoin(players, eq(trophyAwards.playerId, players.id))
      .where(eq(trophyAwards.matchId, match.id))
      .all();
  }

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

  const getResultClass = () => {
    if (!match) return '';
    if (match.ourScore > match.theirScore) return 'text-green-600';
    if (match.ourScore < match.theirScore) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/fixtures"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {fixture.isHome ? 'vs' : '@'} {opponent?.name}
            </h1>
            <p className="text-gray-600">
              {format(fixture.dateTime, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link
            href={`/admin/fixtures/${id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Fixture
          </Link>
          {fixture.status === 'Scheduled' && (
            <Link
              href={`/admin/fixtures/${id}/result`}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Enter Result
            </Link>
          )}
        </div>
      </div>

      {/* Match result banner */}
      {match && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">Final Score</p>
              <p className={`text-5xl font-bold ${getResultClass()}`}>
                {match.ourScore} - {match.theirScore}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {match.ourScore > match.theirScore
                  ? 'Win'
                  : match.ourScore < match.theirScore
                  ? 'Loss'
                  : 'Draw'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Fixture details */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Fixture Details</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start">
              <Clock className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  {format(fixture.dateTime, 'h:mm a')}
                </p>
                <p className="text-sm text-gray-500">Kick-off time</p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900">
                  {fixture.venueName || (fixture.isHome ? 'Home' : 'Away')}
                </p>
                {fixture.venueAddress && (
                  <p className="text-sm text-gray-500">{fixture.venueAddress}</p>
                )}
              </div>
            </div>
            <div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  fixture.status === 'Played'
                    ? 'bg-green-100 text-green-800'
                    : fixture.status === 'Scheduled'
                    ? 'bg-blue-100 text-blue-800'
                    : fixture.status === 'Postponed'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {fixture.status}
              </span>
            </div>
            {fixture.notes && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">Admin notes:</p>
                <p className="text-gray-700">{fixture.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Captain and scorer info */}
        {match && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Match Info</h2>
            </div>
            <div className="p-6 space-y-4">
              {captain && (
                <div className="flex items-start">
                  <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {captain.firstName} {captain.lastName}
                    </p>
                    <p className="text-sm text-gray-500">Captain</p>
                  </div>
                </div>
              )}
              {Object.keys(goalsByPlayer).length > 0 && (
                <div>
                  <p className="font-medium text-gray-900 mb-2">Scorers</p>
                  <ul className="space-y-1">
                    {Object.values(goalsByPlayer).map(({ player, count }) => (
                      <li key={player.id} className="text-gray-700">
                        {player.firstName} {player.lastName}
                        {count > 1 && ` (${count})`}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {awards.length > 0 && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="font-medium text-gray-900 mb-2">Awards</p>
                  <ul className="space-y-2">
                    {awards.map(({ award, trophy, player }) => (
                      <li key={award.id} className="flex items-center">
                        <Trophy className="w-4 h-4 text-yellow-500 mr-2" />
                        <span className="text-gray-700">
                          {trophy.name}: {player.firstName} {player.lastName}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Squad / Appearances */}
      {match && matchAppearances.length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Squad ({matchAppearances.length} players)
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {matchAppearances.map(({ appearance, player }) => (
                <div
                  key={appearance.id}
                  className="flex items-center p-3 bg-gray-50 rounded-lg"
                >
                  <span className="w-8 h-8 flex items-center justify-center bg-blue-100 text-blue-800 rounded-full text-sm font-medium mr-3">
                    {player.shirtNumber || '-'}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">
                      {player.firstName} {player.lastName}
                    </p>
                    {appearance.position && (
                      <p className="text-xs text-gray-500">{appearance.position}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Match Report */}
      {match && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Match Report</h2>
            <GenerateReportButton matchId={match.id} hasReport={!!match.matchReport} />
          </div>
          <div className="p-6">
            {match.matchReport ? (
              <div className="prose max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {match.matchReport}
                </pre>
              </div>
            ) : (
              <p className="text-gray-500">
                No match report generated yet. Click the button above to generate one.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
