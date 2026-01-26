import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db, fixtures, opponents, players, teams, trophies } from '@/lib/db';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowLeft } from 'lucide-react';
import { ResultEntryForm } from '@/components/admin/ResultEntryForm';

interface ResultEntryPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResultEntryPage({ params }: ResultEntryPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
  }

  const { id } = await params;

  const fixtureData = db
    .select({
      fixture: fixtures,
      opponent: opponents,
    })
    .from(fixtures)
    .leftJoin(opponents, eq(fixtures.opponentId, opponents.id))
    .where(eq(fixtures.id, id))
    .get();

  if (!fixtureData) {
    notFound();
  }

  const { fixture, opponent } = fixtureData;

  // Can only enter result for scheduled fixtures
  if (fixture.status !== 'Scheduled') {
    redirect(`/admin/fixtures/${id}`);
  }

  const team = db.select().from(teams).get();

  if (!team) {
    redirect('/admin');
  }

  // Get active players
  const activePlayers = db
    .select()
    .from(players)
    .where(and(eq(players.teamId, team.id), eq(players.active, true)))
    .orderBy(players.shirtNumber)
    .all();

  // Get available trophies (for this team/season)
  const availableTrophies = db
    .select()
    .from(trophies)
    .where(eq(trophies.teamId, team.id))
    .all();

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/admin/fixtures/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enter Result</h1>
          <p className="text-gray-600">
            {fixture.isHome ? 'vs' : '@'} {opponent?.name} •{' '}
            {format(fixture.dateTime, 'MMMM d, yyyy')}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <ResultEntryForm
          fixtureId={fixture.id}
          players={activePlayers}
          trophies={availableTrophies}
          opponentName={opponent?.name || 'Opponent'}
        />
      </div>
    </div>
  );
}
