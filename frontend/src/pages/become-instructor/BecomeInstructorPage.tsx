// frontend/src/pages/BecomeInstructorPage/BecomeInstructorPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../../components/payment/PaymentForm/PaymentForm';
import { instructorService } from '../../services/api/instructorService';
import { authService } from '../../services/api/authService';
import { 
  FiStar, 
  FiUsers, 
  FiAward, 
  FiTool, 
  FiCheckCircle,
  FiArrowRight,
  FiRefreshCw,
  FiBook,
  FiDollarSign,
  FiTrendingUp
} from 'react-icons/fi';
import { HiOutlineAcademicCap, HiOutlineShieldCheck } from 'react-icons/hi';

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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border border-white/20">
            <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <HiOutlineAcademicCap className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent mb-4">
              You're Already an Instructor!
            </h2>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Welcome back! You have full access to all instructor features and tools.
            </p>
            <button 
              onClick={() => navigate('/instructor/dashboard')}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-3 mx-auto"
            >
              <FiArrowRight className="w-5 h-5" />
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border border-white/20">
            <div className="relative inline-block mb-6">
              <div className="w-20 h-20 border-4 border-emerald-200 rounded-full animate-spin"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upgrading Your Account</h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Please wait while we upgrade your account to instructor status. This may take a few moments.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Payment form view (Stripe Elements)
  if (clientSecret && !success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent mb-4">
              Complete Your Instructor Registration
            </h1>
            <p className="text-gray-600 text-lg">Secure payment processed via Stripe</p>
          </div>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
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
      </div>
    );
  }

  // Success view after upgrade
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center border border-white/20">
            <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle className="w-12 h-12 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent mb-4">
              Welcome to the Instructor Community!
            </h2>
            
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              Your account has been successfully upgraded. You now have access to powerful teaching tools.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 max-w-2xl mx-auto">
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <FiBook className="w-6 h-6 text-emerald-600" />
                <span className="font-medium text-gray-900">Create Courses</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <FiDollarSign className="w-6 h-6 text-emerald-600" />
                <span className="font-medium text-gray-900">Earn Income</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <FiUsers className="w-6 h-6 text-emerald-600" />
                <span className="font-medium text-gray-900">Reach Students</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <FiTrendingUp className="w-6 h-6 text-emerald-600" />
                <span className="font-medium text-gray-900">Build Your Brand</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <button 
                onClick={() => navigate('/instructor/dashboard')}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-3"
              >
                <FiArrowRight className="w-5 h-5" />
                Go to Instructor Dashboard
              </button>
              
              <button 
                onClick={() => navigate('/courses/create')}
                className="px-8 py-4 bg-white text-emerald-600 border-2 border-emerald-200 rounded-2xl hover:bg-emerald-50 hover:shadow-lg transition-all duration-300 font-semibold flex items-center gap-3"
              >
                <FiBook className="w-5 h-5" />
                Create Your First Course
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default landing view (before payment)
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-24 h-24 bg-gradient-to-r from-emerald-500 to-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <HiOutlineAcademicCap className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-emerald-700 bg-clip-text text-transparent mb-4">
            Become an Instructor
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Share your expertise, build your brand, and generate income by teaching what you love
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Benefits Section */}
          <div className="space-y-8">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                <FiStar className="w-6 h-6 text-emerald-500" />
                Why Become an Instructor?
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4 p-4 hover:bg-emerald-50 rounded-2xl transition-all duration-200">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiDollarSign className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Generate Passive Income</h3>
                    <p className="text-gray-600">Earn money by creating and selling courses that work for you 24/7</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 hover:bg-emerald-50 rounded-2xl transition-all duration-200">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiUsers className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Global Student Reach</h3>
                    <p className="text-gray-600">Connect with thousands of learners from around the world</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 hover:bg-emerald-50 rounded-2xl transition-all duration-200">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiAward className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Establish Authority</h3>
                    <p className="text-gray-600">Build your professional reputation and become an industry expert</p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 hover:bg-emerald-50 rounded-2xl transition-all duration-200">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FiTool className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2">Professional Tools</h3>
                    <p className="text-gray-600">Access powerful course creation and management tools</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Requirements Section */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-8 border border-white/20">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Instructor Requirements</h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-gray-700">Strong expertise in your subject area</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-gray-700">Ability to explain complex concepts clearly</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-gray-700">Commitment to providing quality content</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <FiCheckCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span className="text-gray-700">Verified email and complete profile</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Registration Section */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Start Your Teaching Journey</h2>
              <p className="text-gray-600">One-time registration fee gives you lifetime instructor access</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl p-6 text-white text-center mb-8">
              <div className="text-4xl font-bold mb-2">$10</div>
              <p className="text-emerald-100">One-time registration fee</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <HiOutlineShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-700">Unlimited course creation tools</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <FiUsers className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-700">24/7 technical support</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <FiDollarSign className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-700">Secure payments via Stripe</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <FiCheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="text-gray-700">30-day satisfaction guarantee</span>
              </div>
            </div>

            <button
              onClick={handleBecomeInstructor}
              disabled={isProcessing}
              className="w-full px-8 py-4 bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-2xl hover:shadow-xl hover:scale-105 transition-all duration-300 font-semibold flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <FiRefreshCw className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <HiOutlineAcademicCap className="w-5 h-5" />
                  Register Now - $10
                </>
              )}
            </button>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Security Badge */}
            <div className="mt-6 p-4 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <HiOutlineShieldCheck className="w-5 h-5 text-emerald-500" />
                <span>Secure SSL encrypted payment. Your information is protected.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeInstructorPage;