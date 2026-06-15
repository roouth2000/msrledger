const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { User } = require('../models');

// Public endpoints
router.post('/register', authController.register);
router.post('/login', authController.login);

// Logout endpoint to clear the secure cookie
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  });
  return res.status(200).json({ message: 'Logged out successfully.' });
});

// Protected endpoint to get user profile details
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'shopName', 'ownerName', 'gstin', 'mobile', 'email']
    });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(200).json({
      message: 'Profile accessed successfully.',
      user
    });
  } catch (err) {
    console.error('Profile fetch error:', err.message);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

module.exports = router;
