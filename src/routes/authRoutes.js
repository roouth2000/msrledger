const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');

// Public endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);

// Protected endpoint to verify JWT is working correctly
router.get('/profile', authMiddleware, (req, res) => {
  // Returns user information stored in the verified JWT token
  return res.status(200).json({
    message: 'Profile accessed successfully.',
    user: {
      id: req.user.id,
      username: req.user.username,
    },
  });
});

module.exports = router;
