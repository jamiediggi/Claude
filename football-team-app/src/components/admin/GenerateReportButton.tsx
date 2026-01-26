'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, RefreshCw } from 'lucide-react';

interface GenerateReportButtonProps {
  matchId: string;
  hasReport: boolean;
}

export function GenerateReportButton({ matchId, hasReport }: GenerateReportButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/matches/${matchId}/report`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate report');
      }

      router.refresh();
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGenerate}
      disabled={loading}
      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
    >
      {loading ? (
        <>
          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          Generating...
        </>
      ) : (
        <>
          <FileText className="w-4 h-4 mr-2" />
          {hasReport ? 'Regenerate Report' : 'Generate Report'}
        </>
      )}
    </button>
  );
}
