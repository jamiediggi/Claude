import { auth } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import { db, opponents } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { OpponentForm } from '@/components/admin/OpponentForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface EditOpponentPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditOpponentPage({ params }: EditOpponentPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
  }

  const { id } = await params;

  const opponent = db
    .select()
    .from(opponents)
    .where(eq(opponents.id, id))
    .get();

  if (!opponent) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/admin/opponents"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Edit Opponent: {opponent.name}
        </h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <OpponentForm opponent={opponent} />
      </div>
    </div>
  );
}
