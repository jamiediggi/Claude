import { db, fixtures, opponents, teams, seasons } from '@/lib/db';
import { eq, and, gt, desc } from 'drizzle-orm';
import { format } from 'date-fns';
import { Calendar, MapPin } from 'lucide-react';
import { PublicNav } from '@/components/public/PublicNav';

export default async function FixturesPage() {
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

  const now = new Date();

  // Get upcoming fixtures
  const upcomingFixtures = db
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
    .all();

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav teamName={team.name} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upcoming Fixtures</h1>
          <p className="text-gray-600 mt-1">{currentSeason?.name || 'Current Season'}</p>
        </div>

        {upcomingFixtures.length > 0 ? (
          <div className="space-y-4">
            {upcomingFixtures.map(({ fixture, opponent }) => (
              <div
                key={fixture.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      {fixture.isHome ? 'vs' : '@'} {opponent?.name}
                    </p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${
                        fixture.isHome
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {fixture.isHome ? 'Home' : 'Away'}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {format(fixture.dateTime, 'EEE, MMM d')}
                    </p>
                    <p className="text-gray-500">
                      {format(fixture.dateTime, 'h:mm a')}
                    </p>
                  </div>
                </div>
                {fixture.venueName && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">
                        {fixture.venueName}
                        {fixture.venueAddress && ` • ${fixture.venueAddress}`}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No upcoming fixtures scheduled</p>
          </div>
        )}
      </main>
    </div>
  );
}
