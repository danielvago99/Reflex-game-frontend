import { useNavigate } from 'react-router-dom';
import { AmbassadorScreen } from '../../../components/AmbassadorScreen';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';
import { useAmbassadorData } from '../hooks/useAmbassadorData';
import { useUserDashboard } from '../hooks/useUserDashboard';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function AmbassadorRoute() {
  const navigate = useNavigate();
  const { data, loading } = useAmbassadorData();
  const { user, loading: userLoading } = useUserDashboard();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  return (
    <AmbassadorScreen
      onNavigate={handleNavigate}
      referralLink={data?.referralLink}
      activePlayers={data?.activeReferrals ?? 0}
      totalInvited={data?.totalReferrals ?? 0}
      playerName={user?.username}
      isLoading={loading || userLoading}
    />
  );
}
