import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SaaSLoginPage from '@/components/SaaS/SaaSLoginPage';

const SaaSLogin = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = (success: boolean) => {
    if (success) {
      setIsAuthenticated(true);
      // Navigate to SaaS admin panel after successful login
      navigate('/saas/admin');
    }
  };

  return (
    <div className="min-h-screen">
      <SaaSLoginPage onLogin={handleLogin} />
    </div>
  );
};

export default SaaSLogin;







