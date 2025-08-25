const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3003;

// Stripe setup (sẽ cấu hình key sau trong .env)
// const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Payment Service Running', timestamp: new Date() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'payment-service' });
});

// Payment routes (mở rộng sau khi có Stripe key)
app.post('/api/payments/create-intent', (req, res) => {
  // Placeholder cho Stripe payment intent
  res.json({ 
    message: 'Payment intent endpoint (requires Stripe setup)',
    amount: req.body.amount || 0
  });
});

app.get('/api/payments/history', (req, res) => {
  res.json({ 
    payments: [
      { id: 1, amount: 99, status: 'completed', course: 'JavaScript Fundamentals' },
      { id: 2, amount: 149, status: 'pending', course: 'React Advanced' }
    ], 
    message: 'Payment history endpoint working' 
  });
});

app.listen(port, () => {
  console.log(`Payment Service running on port ${port}`);
});