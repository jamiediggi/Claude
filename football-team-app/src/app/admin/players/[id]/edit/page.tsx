import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db, players, teams } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { PlayerForm } from '@/components/admin/PlayerForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface EditPlayerPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPlayerPage({ params }: EditPlayerPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
  }

  const { id } = await params;

  const team = db.select().from(teams).get();

  if (!team) {
    redirect('/admin');
  }

  const player = db
    .select()
    .from(players)
    .where(eq(players.id, id))
    .get();

  if (!player) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/players"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Player: {player.firstName} {player.lastName}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <PlayerForm player={player} teamId={team.id} />
      </div>
    </div>
  );
}
