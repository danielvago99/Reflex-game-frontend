import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

export function ReferralHandler() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      localStorage.setItem('referralCode', code);

      toast.success('Referral code applied!', {
        description: 'Log in and earn SOL.',
        duration: 2000,
      });
    }

    navigate('/', { replace: true });
  }, [code, navigate]);

  return null;
}
