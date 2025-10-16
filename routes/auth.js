const express = require('express');
const router = express.Router();

// Simple auth routes for testing
router.post('/login', (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: 'Login successful',
    data: {
      token: 'sample-token',
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com'
      }
    }
  });
});

router.post('/register', (req, res) => {
  res.status(201).json({ 
    success: true, 
    message: 'Registration successful',
    data: {
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com'
      }
    }
  });
});

router.get('/me', (req, res) => {
  res.status(200).json({ 
    success: true, 
    data: {
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com'
      }
    }
  });
});

module.exports = router;