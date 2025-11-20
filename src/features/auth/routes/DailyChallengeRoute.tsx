import { useNavigate } from 'react-router-dom';
import { DailyChallengeScreen } from '../../../components/DailyChallengeScreen';

export default function DailyChallengeRoute() {
  const navigate = useNavigate();
  return <DailyChallengeScreen onBack={() => navigate('/dashboard')} />;
}
