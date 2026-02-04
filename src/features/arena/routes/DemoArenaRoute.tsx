import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameArena } from '../../../components/arena/GameArena';
import { useGame } from '../context/GameProvider';

export default function DemoArenaRoute() {
  const navigate = useNavigate();
  const { setMatchDetails } = useGame();

  useEffect(() => {
    setMatchDetails({
      isRanked: false,
      stakeAmount: 0,
      matchType: 'bot',
      opponentName: 'Training Bot',
    });
  }, [setMatchDetails]);

  const handleQuit = () => {
    navigate('/', { replace: true });
  };

  return (
    <GameArena
      onQuit={handleQuit}
      isRanked={false}
      stakeAmount={0}
      matchType="bot"
      opponentName="Training Bot"
      isDemo
    />
  );
}
