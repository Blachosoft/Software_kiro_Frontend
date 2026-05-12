/**
 * Login Page
 * 
 * Route page for user authentication.
 * Renders the LoginScreen component with necessary hooks.
 * 
 * **Validates: Requirements 13.1, 13.2, 13.3**
 */

'use client';

import { useRouter } from 'next/navigation';
import { LoginScreen } from '../../../src/adapters/ui/screens/LoginScreen';
import { useAuth } from '../../../src/adapters/ui/hooks/useAuth';
import { getDependencies } from '../../../src/config/dependencies';

export default function LoginPage() {
  const { authenticateUserUseCase } = getDependencies();
  const auth = useAuth({ authenticateUserUseCase });
  const router = useRouter();

  const handleLoginSuccess = () => {
    // Redirect to dashboard after successful login
    router.push('/');
  };

  return <LoginScreen auth={auth} onLoginSuccess={handleLoginSuccess} />;
}
