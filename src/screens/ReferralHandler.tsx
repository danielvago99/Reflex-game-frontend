import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export function ReferralHandler() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (code) {
      localStorage.setItem('referralCode', code);
      console.log('Referral code captured:', code);
    }

    navigate('/', { replace: true });
  }, [code, navigate]);

  return null;
}
