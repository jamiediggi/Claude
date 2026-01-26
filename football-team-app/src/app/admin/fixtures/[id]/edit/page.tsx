import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db, fixtures, teams, opponents, seasons } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { FixtureForm } from '@/components/admin/FixtureForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface EditFixturePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditFixturePage({ params }: EditFixturePageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
  }

  const { id } = await params;

  const team = db.select().from(teams).get();

  if (!team) {
    redirect('/admin');
  }

  const fixture = db
    .select()
    .from(fixtures)
    .where(eq(fixtures.id, id))
    .get();

  if (!fixture) {
    notFound();
  }

  const allOpponents = db
    .select()
    .from(opponents)
    .orderBy(opponents.name)
    .all();

  const allSeasons = db
    .select()
    .from(seasons)
    .where(eq(seasons.teamId, team.id))
    .orderBy(desc(seasons.startDate))
    .all();

  const opponent = allOpponents.find((o) => o.id === fixture.opponentId);

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/admin/fixtures/${id}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Fixture: vs {opponent?.name}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <FixtureForm
          fixture={fixture}
          teamId={team.id}
          opponents={allOpponents}
          seasons={allSeasons}
        />
      </div>
    </div>
  );
}
