const express = require('express');
const router = express.Router();

// Import controllers
const { sendMessage, getChatHistory } = require('../controllers/chat.controller');

// Routes
router.post('/message', sendMessage);
router.get('/history', getChatHistory);

module.exports = router; 