import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type MatchType = 'ranked' | 'friend' | 'bot';

interface MatchDetails {
  isRanked: boolean;
  stakeAmount: number;
  matchType: MatchType;
}

interface GameContextValue {
  playerName: string;
  setPlayerName: (name: string) => void;
  matchDetails: MatchDetails;
  setMatchDetails: (details: MatchDetails) => void;
  resetMatch: () => void;
}

const defaultMatch: MatchDetails = { isRanked: false, stakeAmount: 0, matchType: 'bot' };

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [playerName, setPlayerName] = useState('Player_0x4f2a');
  const [matchDetails, setMatchDetailsState] = useState<MatchDetails>(defaultMatch);

  const setMatchDetails = (details: MatchDetails) => setMatchDetailsState(details);
  const resetMatch = () => setMatchDetailsState(defaultMatch);

  const value = useMemo(
    () => ({ playerName, setPlayerName, matchDetails, setMatchDetails, resetMatch }),
    [playerName, matchDetails]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within GameProvider');
  return context;
};
