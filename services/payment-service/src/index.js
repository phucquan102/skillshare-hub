// payment-service/src/index.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const paymentRoutes = require('./routes/paymentRoutes');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Basic routes
app.get('/', (req, res) => {
  res.json({ message: 'Payment Service Running', timestamp: new Date() });
});

app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'payment-service' });
});

// Payment routes
app.use('/api/payments', require('./routes/paymentRoutes'));

app.listen(port, () => {
  console.log(`Payment Service running on port ${port}`);
});