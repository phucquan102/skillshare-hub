import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import styles from './GoogleLoginButton.module.scss';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleLoginButtonProps {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ 
  onSuccess, 
  onError,
  isLoading = false
}) => {
  const { googleLogin } = useAuth();

  const handleGoogleLogin = async (response: any) => {
    try {
      await googleLogin(response.credential);
      onSuccess?.();
    } catch (error: any) {
      console.error('Google login failed:', error);
      const errorMessage = error.message || 'Đăng nhập Google thất bại';
      onError?.(errorMessage);
    }
  };

  React.useEffect(() => {
    // Kiểm tra nếu script đã được load
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client?hl=en';

    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);

    function initializeGoogle() {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin,
          locale: 'en'   
        });
        
        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          { 
            theme: 'outline', 
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 300
          }
        );
      }
    }

    return () => {
      // Cleanup nếu cần
    };
  }, []);

  return (
    <div className={styles.googleButtonContainer}>
      <div 
        id="googleSignInButton" 
        className={`${styles.googleButton} ${isLoading ? styles.loading : ''}`}
      ></div>
    </div>
  );
};

export default GoogleLoginButton;