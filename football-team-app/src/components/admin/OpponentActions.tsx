'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Edit, Trash2 } from 'lucide-react';
import { Opponent } from '@/lib/db/schema';

interface OpponentActionsProps {
  opponent: Opponent;
}

export function OpponentActions({ opponent }: OpponentActionsProps) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${opponent.name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/opponents/${opponent.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete opponent');
      }
    } catch (error) {
      console.error('Failed to delete opponent:', error);
      alert('Failed to delete opponent');
    }
  };

  return (
    <div className="flex items-center justify-end space-x-2">
      <Link
        href={`/admin/opponents/${opponent.id}/edit`}
        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </Link>
      <button
        onClick={handleDelete}
        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
