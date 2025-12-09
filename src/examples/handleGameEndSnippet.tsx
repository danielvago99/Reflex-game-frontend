import { useCallback } from 'react';
import useDashboard from '../hooks/useDashboard';

interface GameResultPayload {
  result: 'win' | 'loss';
  score: number;
}

export function GameScreen() {
  const { refreshDashboard } = useDashboard();

  const handleGameEnd = useCallback(
    async ({ result, score }: GameResultPayload) => {
      const response = await fetch('/api/user/game/end', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ result, score }),
      });

      if (!response.ok) {
        throw new Error('Unable to submit game result');
      }

      await refreshDashboard();
    },
    [refreshDashboard]
  );

  return (
    <button type="button" onClick={() => handleGameEnd({ result: 'win', score: 120 })}>
      Finish Game
    </button>
  );
}
