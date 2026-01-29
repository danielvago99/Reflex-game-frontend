import { useNavigate } from 'react-router-dom';
import { WelcomeScreen } from '../../../components/WelcomeScreen';
import { ScreenPaths, screenToPath, type AppScreen } from '../../../shared/types/navigation';

const isScreen = (value: string): value is AppScreen => value in ScreenPaths;

export default function WelcomeRoute() {
  const navigate = useNavigate();

  const handleNavigate = (screen: string) => {
    if (isScreen(screen)) {
      navigate(screenToPath(screen));
    }
  };

  return <WelcomeScreen onNavigate={handleNavigate} />;
}
