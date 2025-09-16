const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authMiddleware, studentMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, studentMiddleware, courseController.createEnrollment);

module.exports = router;