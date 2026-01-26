import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { OpponentForm } from '@/components/admin/OpponentForm';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function NewOpponentPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/admin/login');
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
        <h1 className="text-2xl font-bold text-gray-900">Add New Opponent</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <OpponentForm />
      </div>
    </div>
  );
}
