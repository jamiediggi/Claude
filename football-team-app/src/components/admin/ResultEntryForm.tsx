'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Player, Trophy } from '@/lib/db/schema';
import { Plus, Trash2 } from 'lucide-react';

interface ResultEntryFormProps {
  fixtureId: string;
  players: Player[];
  trophies: Trophy[];
  opponentName: string;
}

interface GoalEntry {
  playerId: string;
  minute?: number;
}

interface TrophyAwardEntry {
  trophyId: string;
  playerId: string;
}

export function ResultEntryForm({
  fixtureId,
  players,
  trophies,
  opponentName,
}: ResultEntryFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [ourScore, setOurScore] = useState(0);
  const [theirScore, setTheirScore] = useState(0);
  const [captainPlayerId, setCaptainPlayerId] = useState('');
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(new Set());
  const [goals, setGoals] = useState<GoalEntry[]>([]);
  const [trophyAwards, setTrophyAwards] = useState<TrophyAwardEntry[]>([]);
  const [summaryNotes, setSummaryNotes] = useState('');

  const handlePlayerToggle = (playerId: string) => {
    const newSelected = new Set(selectedPlayers);
    if (newSelected.has(playerId)) {
      newSelected.delete(playerId);
      // Remove goals by this player
      setGoals(goals.filter((g) => g.playerId !== playerId));
      // Clear captain if this player was captain
      if (captainPlayerId === playerId) {
        setCaptainPlayerId('');
      }
      // Remove trophy awards for this player
      setTrophyAwards(trophyAwards.filter((t) => t.playerId !== playerId));
    } else {
      newSelected.add(playerId);
    }
    setSelectedPlayers(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPlayers.size === players.length) {
      setSelectedPlayers(new Set());
      setGoals([]);
      setCaptainPlayerId('');
      setTrophyAwards([]);
    } else {
      setSelectedPlayers(new Set(players.map((p) => p.id)));
    }
  };

  const addGoal = () => {
    if (selectedPlayers.size === 0) {
      alert('Please select players who played first');
      return;
    }
    setGoals([...goals, { playerId: '' }]);
  };

  const updateGoal = (index: number, field: keyof GoalEntry, value: string | number) => {
    const newGoals = [...goals];
    newGoals[index] = { ...newGoals[index], [field]: value };
    setGoals(newGoals);
  };

  const removeGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const addTrophyAward = () => {
    if (selectedPlayers.size === 0) {
      alert('Please select players who played first');
      return;
    }
    if (trophies.length === 0) {
      alert('No trophies available');
      return;
    }
    setTrophyAwards([...trophyAwards, { trophyId: '', playerId: '' }]);
  };

  const updateTrophyAward = (
    index: number,
    field: keyof TrophyAwardEntry,
    value: string
  ) => {
    const newAwards = [...trophyAwards];
    newAwards[index] = { ...newAwards[index], [field]: value };
    setTrophyAwards(newAwards);
  };

  const removeTrophyAward = (index: number) => {
    setTrophyAwards(trophyAwards.filter((_, i) => i !== index));
  };

  // Update ourScore based on goals count
  const validGoals = goals.filter((g) => g.playerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validation
    if (selectedPlayers.size === 0) {
      setError('Please select at least one player who played');
      setLoading(false);
      return;
    }

    if (!captainPlayerId) {
      setError('Please select a captain');
      setLoading(false);
      return;
    }

    // Count valid goals
    const validGoalsList = goals.filter((g) => g.playerId);
    if (validGoalsList.length !== ourScore) {
      const confirm = window.confirm(
        `You have ${validGoalsList.length} goals recorded but entered a score of ${ourScore}. Continue anyway?`
      );
      if (!confirm) {
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch(`/api/fixtures/${fixtureId}/result`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ourScore,
          theirScore,
          captainPlayerId,
          playerIds: Array.from(selectedPlayers),
          goals: validGoalsList,
          trophyAwards: trophyAwards.filter((t) => t.trophyId && t.playerId),
          summaryNotes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save result');
      }

      router.push(`/admin/fixtures/${fixtureId}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save result');
      setLoading(false);
    }
  };

  const playingPlayers = players.filter((p) => selectedPlayers.has(p.id));

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
      )}

      {/* Score */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Score</h3>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">Our Team</p>
            <input
              type="number"
              min="0"
              value={ourScore}
              onChange={(e) => setOurScore(parseInt(e.target.value) || 0)}
              className="w-24 h-16 text-center text-3xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <span className="text-2xl font-bold text-gray-400">-</span>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-2">{opponentName}</p>
            <input
              type="number"
              min="0"
              value={theirScore}
              onChange={(e) => setTheirScore(parseInt(e.target.value) || 0)}
              className="w-24 h-16 text-center text-3xl font-bold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Players who played */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Players Who Played ({selectedPlayers.size})
          </h3>
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {selectedPlayers.size === players.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {players.map((player) => (
            <label
              key={player.id}
              className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedPlayers.has(player.id)
                  ? 'bg-blue-50 border-blue-300'
                  : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="checkbox"
                checked={selectedPlayers.has(player.id)}
                onChange={() => handlePlayerToggle(player.id)}
                className="mr-3"
              />
              <span className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-sm font-medium mr-2">
                {player.shirtNumber || '-'}
              </span>
              <span className="text-sm">
                {player.firstName} {player.lastName}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Captain */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Captain</h3>
        <select
          value={captainPlayerId}
          onChange={(e) => setCaptainPlayerId(e.target.value)}
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        >
          <option value="">Select captain...</option>
          {playingPlayers.map((player) => (
            <option key={player.id} value={player.id}>
              {player.firstName} {player.lastName}
            </option>
          ))}
        </select>
        {selectedPlayers.size === 0 && (
          <p className="text-sm text-gray-500 mt-1">
            Select players who played first
          </p>
        )}
      </div>

      {/* Goals */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Goals ({validGoals.length})
          </h3>
          <button
            type="button"
            onClick={addGoal}
            className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Goal
          </button>
        </div>
        {goals.length === 0 ? (
          <p className="text-gray-500">No goals recorded. Click "Add Goal" to add scorers.</p>
        ) : (
          <div className="space-y-3">
            {goals.map((goal, index) => (
              <div key={index} className="flex items-center gap-3">
                <select
                  value={goal.playerId}
                  onChange={(e) => updateGoal(index, 'playerId', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select scorer...</option>
                  {playingPlayers.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.firstName} {player.lastName}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  max="90"
                  placeholder="Min"
                  value={goal.minute || ''}
                  onChange={(e) =>
                    updateGoal(index, 'minute', parseInt(e.target.value) || 0)
                  }
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => removeGoal(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trophy Awards */}
      {trophies.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Trophy Awards</h3>
            <button
              type="button"
              onClick={addTrophyAward}
              className="inline-flex items-center px-3 py-1 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Award
            </button>
          </div>
          {trophyAwards.length === 0 ? (
            <p className="text-gray-500">
              No trophy awards. Click "Add Award" to award trophies.
            </p>
          ) : (
            <div className="space-y-3">
              {trophyAwards.map((award, index) => (
                <div key={index} className="flex items-center gap-3">
                  <select
                    value={award.trophyId}
                    onChange={(e) =>
                      updateTrophyAward(index, 'trophyId', e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Select trophy...</option>
                    {trophies.map((trophy) => (
                      <option key={trophy.id} value={trophy.id}>
                        {trophy.name}
                      </option>
                    ))}
                  </select>
                  <select
                    value={award.playerId}
                    onChange={(e) =>
                      updateTrophyAward(index, 'playerId', e.target.value)
                    }
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  >
                    <option value="">Select player...</option>
                    {playingPlayers.map((player) => (
                      <option key={player.id} value={player.id}>
                        {player.firstName} {player.lastName}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeTrophyAward(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Summary Notes (Admin only)
        </h3>
        <textarea
          value={summaryNotes}
          onChange={(e) => setSummaryNotes(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          placeholder="Optional notes about the match..."
        />
      </div>

      {/* Submit */}
      <div className="flex items-center space-x-4 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors font-medium"
        >
          {loading ? 'Saving...' : 'Save Result'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
