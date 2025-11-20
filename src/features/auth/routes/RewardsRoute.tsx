import { useNavigate } from 'react-router-dom';
import { RewardsScreen } from '../../../components/RewardsScreen';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function RewardsRoute() {
  const navigate = useNavigate();
  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };
  return <RewardsScreen onNavigate={handleNavigate} />;
}
