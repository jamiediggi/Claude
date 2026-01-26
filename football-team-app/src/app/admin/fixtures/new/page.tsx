import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { db, teams, opponents, seasons } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { FixtureForm } from '@/components/admin/FixtureForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function NewFixturePage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
  }

  const team = db.select().from(teams).get();

  if (!team) {
    redirect('/admin');
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

  if (allSeasons.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/fixtures"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add New Fixture</h1>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
          No seasons found. Please create a season first.
        </div>
      </div>
    );
  }

  if (allOpponents.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Link
            href="/admin/fixtures"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Add New Fixture</h1>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
          No opponents found. Please{' '}
          <Link href="/admin/opponents/new" className="underline">
            add an opponent
          </Link>{' '}
          first.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/fixtures"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add New Fixture</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <FixtureForm teamId={team.id} opponents={allOpponents} seasons={allSeasons} />
      </div>
    </div>
  );
}
