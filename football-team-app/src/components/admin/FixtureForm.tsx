'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Fixture, Opponent, Season } from '@/lib/db/schema';
import { format } from 'date-fns';

interface FixtureFormProps {
  fixture?: Fixture;
  teamId: string;
  opponents: Opponent[];
  seasons: Season[];
}

const statuses = ['Scheduled', 'Postponed', 'Cancelled'];

export function FixtureForm({ fixture, teamId, opponents, seasons }: FixtureFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const currentSeason = seasons.find((s) => s.isCurrent);

  const [formData, setFormData] = useState({
    seasonId: fixture?.seasonId || currentSeason?.id || '',
    opponentId: fixture?.opponentId || '',
    dateTime: fixture?.dateTime
      ? format(fixture.dateTime, "yyyy-MM-dd'T'HH:mm")
      : '',
    isHome: fixture?.isHome ?? true,
    venueName: fixture?.venueName || '',
    venueAddress: fixture?.venueAddress || '',
    status: fixture?.status || 'Scheduled',
    notes: fixture?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = fixture ? `/api/fixtures/${fixture.id}` : '/api/fixtures';
      const method = fixture ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          teamId,
          dateTime: new Date(formData.dateTime).toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save fixture');
      }

      router.push('/admin/fixtures');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save fixture');
      setLoading(false);
    }
  };

  // Auto-fill venue when opponent changes
  const handleOpponentChange = (opponentId: string) => {
    const opponent = opponents.find((o) => o.id === opponentId);
    setFormData((prev) => ({
      ...prev,
      opponentId,
      // Only auto-fill venue for away games
      venueName: !prev.isHome && opponent?.homeGroundName ? opponent.homeGroundName : prev.venueName,
      venueAddress: !prev.isHome && opponent?.postcode ? opponent.postcode : prev.venueAddress,
    }));
  };

  // Auto-fill venue when home/away changes
  const handleHomeAwayChange = (isHome: boolean) => {
    const opponent = opponents.find((o) => o.id === formData.opponentId);
    setFormData((prev) => ({
      ...prev,
      isHome,
      venueName: isHome ? '' : (opponent?.homeGroundName || ''),
      venueAddress: isHome ? '' : (opponent?.postcode || ''),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="seasonId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Season *
          </label>
          <select
            id="seasonId"
            value={formData.seasonId}
            onChange={(e) =>
              setFormData({ ...formData, seasonId: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          >
            <option value="">Select season...</option>
            {seasons.map((season) => (
              <option key={season.id} value={season.id}>
                {season.name} {season.isCurrent ? '(Current)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="opponentId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Opponent *
          </label>
          <select
            id="opponentId"
            value={formData.opponentId}
            onChange={(e) => handleOpponentChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          >
            <option value="">Select opponent...</option>
            {opponents.map((opponent) => (
              <option key={opponent.id} value={opponent.id}>
                {opponent.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="dateTime"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Date & Time *
          </label>
          <input
            id="dateTime"
            type="datetime-local"
            value={formData.dateTime}
            onChange={(e) =>
              setFormData({ ...formData, dateTime: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Home / Away *
          </label>
          <div className="flex gap-4">
            <label className="flex items-center">
              <input
                type="radio"
                name="isHome"
                checked={formData.isHome}
                onChange={() => handleHomeAwayChange(true)}
                className="mr-2"
              />
              Home
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="isHome"
                checked={!formData.isHome}
                onChange={() => handleHomeAwayChange(false)}
                className="mr-2"
              />
              Away
            </label>
          </div>
        </div>

        <div>
          <label
            htmlFor="venueName"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Venue Name
          </label>
          <input
            id="venueName"
            type="text"
            value={formData.venueName}
            onChange={(e) =>
              setFormData({ ...formData, venueName: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder={formData.isHome ? 'Your home ground' : 'Away venue'}
          />
        </div>

        <div>
          <label
            htmlFor="venueAddress"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Venue Address / Postcode
          </label>
          <input
            id="venueAddress"
            type="text"
            value={formData.venueAddress}
            onChange={(e) =>
              setFormData({ ...formData, venueAddress: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Status
          </label>
          <select
            id="status"
            value={formData.status}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={fixture?.status === 'Played'}
          >
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
            {fixture?.status === 'Played' && (
              <option value="Played">Played</option>
            )}
          </select>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="notes"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Notes (Admin only)
          </label>
          <textarea
            id="notes"
            value={formData.notes}
            onChange={(e) =>
              setFormData({ ...formData, notes: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="flex items-center space-x-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-purple-400 transition-colors"
        >
          {loading ? 'Saving...' : fixture ? 'Update Fixture' : 'Add Fixture'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
