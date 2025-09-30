import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRouter from "./routes/AppRouter";
import { GoogleOAuthProvider } from '@react-oauth/google';

// Stripe import
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

function App() {
  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <BrowserRouter>
          {/* Wrap toàn bộ app hoặc ít nhất phần route thanh toán */}
          <Elements stripe={stripePromise}>
            <AppRouter />
          </Elements>
        </BrowserRouter>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
