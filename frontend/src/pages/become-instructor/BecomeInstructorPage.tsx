// frontend/src/pages/BecomeInstructorPage/BecomeInstructorPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../../components/payment/PaymentForm/PaymentForm';
import { instructorService } from '../../services/api/instructorService';
import { authService } from '../../services/api/authService';
import styles from './BecomeInstructorPage.module.scss';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

const BecomeInstructorPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [paymentId, setPaymentId] = useState('');

  // If user is already an instructor
  if (user?.role === 'instructor') {
    return (
      <div className={styles.instructorPage}>
        <div className={styles.container}>
          <div className={styles.successMessage}>
            <h2>🎉 You are already an Instructor!</h2>
            <p>You already have access to all instructor features.</p>
            <button 
              onClick={() => navigate('/instructor/dashboard')}
              className={styles.primaryButton}
            >
              Go to Instructor Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleBecomeInstructor = async () => {
    setIsProcessing(true);
    setError('');

    try {
      console.log('Creating instructor payment session...');
      const response = await instructorService.createInstructorPayment();

      if (response.success && response.data?.clientSecret) {
        setClientSecret(response.data.clientSecret);
        setPaymentId(response.data.paymentId);
      } else {
        setError(response.message || 'An error occurred while creating payment');
      }
    } catch (err: any) {
      console.error('Error creating payment:', err);
      setError(err.message || 'Unable to connect to server');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setIsUpgrading(true);
    setError('');

    try {
      console.log('Starting upgrade flow...');

      // 1. Call API to upgrade role on server
      const upgradeResult = await instructorService.upgradeToInstructor();
      
      if (!upgradeResult.success) {
        throw new Error(upgradeResult.message || 'Upgrade failed');
      }

      console.log('Upgrade API call successful');

      // 2. Handle token / session changes if backend requires re-login
      const tokenCheck = await instructorService.handlePostUpgradeToken();
      
      if (tokenCheck.needsRelogin) {
        console.warn('Token role mismatch detected after upgrade');
        alert('Upgrade successful! Please sign in again to refresh your permissions.');
        
        // Force logout and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return;
      }

      // 3. Fetch the latest profile
      console.log('Fetching updated profile...');
      const profileResponse = await authService.getProfile();
      
      // 4. Update user in context and localStorage
      if (profileResponse.user) {
        updateUser(profileResponse.user);
        localStorage.setItem('user', JSON.stringify(profileResponse.user));
        
        console.log('User updated successfully:', {
          role: profileResponse.user.role,
          id: profileResponse.user._id
        });
      }

      // 5. Mark success
      setSuccess(true);
      console.log('Upgrade process completed successfully');
    } catch (err: any) {
      console.error('Upgrade error:', err);
      setError(err.message || 'An error occurred while upgrading your account. Please contact support.');
    } finally {
      setIsUpgrading(false);
    }
  };

  const handlePaymentCancel = () => {
    setClientSecret('');
    setPaymentId('');
  };

  // Show loading state while upgrading
  if (isUpgrading) {
    return (
      <div className={styles.instructorPage}>
        <div className={styles.container}>
          <div className={styles.loadingMessage}>
            <h2>🔄 Upgrading your account...</h2>
            <p>Please wait a moment. This may take a couple of minutes.</p>
            <div className={styles.loadingSpinner}></div>
          </div>
        </div>
      </div>
    );
  }

  // Payment form view (Stripe Elements)
  if (clientSecret && !success) {
    return (
      <div className={styles.instructorPage}>
        <div className={styles.container}>
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              clientSecret={clientSecret}
              paymentId={paymentId}
              courseId="" // empty for instructor fee
              amount={10} // $10 instructor fee
              onSuccess={handlePaymentSuccess}
              onCancel={handlePaymentCancel}
              isInstructorFee={true}
            />
          </Elements>
        </div>
      </div>
    );
  }

  // Success view after upgrade
  if (success) {
    return (
      <div className={styles.instructorPage}>
        <div className={styles.container}>
          <div className={styles.successMessage}>
            <h2>🎉 Congratulations! You're now an Instructor</h2>
            <p>Your account has been upgraded successfully. You can now:</p>
            <ul>
              <li>✅ Create and manage courses</li>
              <li>✅ Earn income from teaching</li>
              <li>✅ Reach thousands of potential students</li>
              <li>✅ Use powerful course management tools</li>
            </ul>
            <div className={styles.actionButtons}>
              <button 
                onClick={() => navigate('/instructor/dashboard')}
                className={styles.primaryButton}
              >
                Go to Instructor Dashboard
              </button>
              <button 
                onClick={() => navigate('/courses/create')}
                className={styles.secondaryButton}
              >
                Create Your First Course
              </button>
              <button 
                onClick={() => {
                  // Force refresh to ensure everything is up-to-date
                  window.location.reload();
                }}
                className={styles.outlineButton}
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default landing view (before payment)
  return (
    <div className={styles.instructorPage}>
      <div className={styles.container}>
        <div className={styles.instructorHero}>
          <h1>Become an Instructor</h1>
          <p className={styles.subtitle}>
            Share knowledge, build your brand, and earn income
          </p>
        </div>

        <div className={styles.instructorContent}>
          <div className={styles.benefitsSection}>
            <h2>Benefits of Becoming an Instructor</h2>
            <div className={styles.benefitsGrid}>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>💰</div>
                <h3>Passive Income</h3>
                <p>Earn money by selling courses and lessons</p>
              </div>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>👥</div>
                <h3>Reach Students</h3>
                <p>Connect with thousands of potential learners</p>
              </div>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>🏆</div>
                <h3>Build Your Brand</h3>
                <p>Showcase expertise and build credibility</p>
              </div>
              <div className={styles.benefitCard}>
                <div className={styles.benefitIcon}>⚡</div>
                <h3>Powerful Tools</h3>
                <p>Use professional course management tools</p>
              </div>
            </div>
          </div>

          <div className={styles.pricingSection}>
            <div className={styles.pricingCard}>
              <div className={styles.pricingHeader}>
                <h3>Instructor Registration Fee</h3>
                <div className={styles.price}>$10</div>
                <p>One-time payment</p>
              </div>
              <div className={styles.pricingFeatures}>
                <ul>
                  <li>✓ Unlimited access to course creation tools</li>
                  <li>✓ 24/7 technical support</li>
                  <li>✓ Secure payments via Stripe</li>
                  <li>✓ 30-day refund if not satisfied</li>
                  <li>✓ Free feature updates</li>
                </ul>
              </div>
              <button
                onClick={handleBecomeInstructor}
                disabled={isProcessing}
                className={`${styles.primaryButton} ${styles.btnLarge}`}
              >
                {isProcessing ? 'Processing...' : 'Register Now - $10'}
              </button>
              {error && <div className={styles.errorMessage}>{error}</div>}
              
              {/* Debug info */}
              <div className={styles.debugInfo}>
                <p><strong>Debug Info:</strong></p>
                <p>User Role: {user?.role}</p>
                <p>User ID: {user?._id || (user as any)?.id}</p>
              </div>
            </div>
          </div>

          <div className={styles.requirementsSection}>
            <h2>Requirements to Become an Instructor</h2>
            <div className={styles.requirementsList}>
              <div className={styles.requirement}>
                <h4>Strong Expertise</h4>
                <p>Have deep knowledge in the subject you want to teach</p>
              </div>
              <div className={styles.requirement}>
                <h4>Teaching Skills</h4>
                <p>Ability to explain complex concepts clearly</p>
              </div>
              <div className={styles.requirement}>
                <h4>Quality Commitment</h4>
                <p>Ensure your course content is valuable and up-to-date</p>
              </div>
              <div className={styles.requirement}>
                <h4>Verified Account</h4>
                <p>Verified email and a complete profile</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeInstructorPage;
