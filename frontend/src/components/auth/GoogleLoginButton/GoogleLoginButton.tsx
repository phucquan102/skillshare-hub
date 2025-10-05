import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import styles from './GoogleLoginButton.module.scss';

declare global {
  interface Window {
    google: any;
  }
}

interface GoogleLoginButtonProps {
  onSuccess?: (token: string) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ 
  onSuccess, 
  onError,
  isLoading = false
}) => {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLogin = async (response: any) => {
    try {
      const googleToken = response.credential;
      console.log('🔑 Google token received:', googleToken);
      
      // Gọi hàm đăng nhập Google từ context
      const result = await googleLogin(googleToken);
      console.log('✅ Google login successful:', result);
      
      // Thông báo thành công
      onSuccess?.(googleToken);
      
      // 🔥 QUAN TRỌNG: Chuyển hướng về trang chủ
      setTimeout(() => {
        navigate('/');
      }, 100);
      
    } catch (error: any) {
      console.error('❌ Google login failed:', error);
      const errorMessage = error.message || 'Đăng nhập Google thất bại';
      onError?.(errorMessage);
    }
  };

  React.useEffect(() => {
    const initializeGoogle = () => {
      if (window.google) {
        console.log('🔄 Initializing Google Sign-In...');
        
        window.google.accounts.id.initialize({
          client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
          callback: handleGoogleLogin,
          locale: 'vi',
        });

        window.google.accounts.id.renderButton(
          document.getElementById('googleSignInButton'),
          {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 300,
          }
        );
        
        console.log('✅ Google Sign-In initialized');
      }
    };

    const existingScript = document.querySelector(
      'script[src="https://accounts.google.com/gsi/client"]'
    );

    if (existingScript) {
      initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => {
      console.error('❌ Failed to load Google Sign-In script');
      onError?.('Không thể tải Google Sign-In');
    };
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (window.google) {
        window.google.accounts.id.cancel();
      }
    };
  }, []);

  return (
    <div className={styles.googleButtonContainer}>
      <div
        id="googleSignInButton"
        className={`${styles.googleButton} ${isLoading ? styles.loading : ''}`}
      ></div>
      {isLoading && <div className={styles.loadingText}>Đang xử lý...</div>}
    </div>
  );
};

export default GoogleLoginButton;