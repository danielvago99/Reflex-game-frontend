import { useNavigate } from 'react-router-dom';
import { RewardsScreen } from '../../../components/RewardsScreen';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';
import { useUserDashboard } from '../hooks/useUserDashboard';
import { useAmbassadorData } from '../hooks/useAmbassadorData';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function RewardsRoute() {
  const navigate = useNavigate();
  const { user, loading } = useUserDashboard();
  const { data: ambassador, loading: ambassadorLoading } = useAmbassadorData();
  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };
  return (
    <RewardsScreen
      onNavigate={handleNavigate}
      stats={user?.stats ?? undefined}
      ambassadorStats={ambassador}
      isLoading={loading || ambassadorLoading}
    />
  );
}
