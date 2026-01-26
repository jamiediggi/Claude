'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, UserX, UserCheck } from 'lucide-react';
import { Player } from '@/lib/db/schema';

interface PlayerActionsProps {
  player: Player;
}

export function PlayerActions({ player }: PlayerActionsProps) {
  const router = useRouter();

  const toggleActive = async () => {
    try {
      const res = await fetch(`/api/players/${player.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !player.active }),
      });

      if (res.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Failed to toggle player status:', error);
    }
  };

  return (
    <div className="flex items-center justify-end space-x-2">
      <Link
        href={`/admin/players/${player.id}/edit`}
        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </Link>
      <button
        onClick={toggleActive}
        className={`p-2 rounded-lg transition-colors ${
          player.active
            ? 'text-gray-600 hover:text-red-600 hover:bg-red-50'
            : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
        }`}
        title={player.active ? 'Deactivate' : 'Activate'}
      >
        {player.active ? (
          <UserX className="w-4 h-4" />
        ) : (
          <UserCheck className="w-4 h-4" />
        )}
      </button>
    </div>
  );
}
