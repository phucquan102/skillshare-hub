// services/review-service/src/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const reviewRoutes = require('./routes/reviewRoutes');
const ratingRoutes = require('./routes/ratingRoutes');

app.use('/reviews', reviewRoutes);
app.use('/ratings', ratingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'Review Service is healthy' });
});

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB connected for Review Service'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Review Service running on port ${PORT}`);
});

// Error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});