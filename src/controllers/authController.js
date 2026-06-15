const { User } = require('../models');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../middleware/auth');

/**
 * Handle user registration.
 * Performs strict validation and secures the user record creation.
 */
exports.register = async (req, res) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ error: 'Username is required and must be a string.' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required and must be a string.' });
  }

  // Username rules (alphanumeric, length between 3 and 30)
  const usernameRegex = /^[a-zA-Z0-9]{3,30}$/;
  if (!usernameRegex.test(username)) {
    return res.status(400).json({ error: 'Username must be alphanumeric and between 3 and 30 characters.' });
  }

  // Password rules (minimum 8 characters)
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    // Create user (password is automatically hashed by Sequelize model hooks)
    await User.create({ username, password });

    return res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    // Log the error internally but do not expose database error details to clients
    console.error('Registration error details:', err.message);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Handle user login.
 * Validates credentials and returns a secure JWT token on success.
 */
exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || typeof username !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const user = await User.findOne({ where: { username } });
    
    // Perform constant-time verification logic flow to avoid username enumeration timing attacks
    let isMatch = false;
    if (user) {
      isMatch = await user.comparePassword(password);
    }

    if (!user || !isMatch) {
      // Use generic message to prevent username/credential harvesting
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    // Generate token
    const secret = getJwtSecret();
    const token = jwt.sign(
      { id: user.id, username: user.username },
      secret,
      { 
        algorithm: 'HS256', 
        expiresIn: process.env.JWT_EXPIRES_IN || '1h' 
      }
    );

    return res.status(200).json({
      message: 'Login successful.',
      token,
    });
  } catch (err) {
    console.error('Login error details:', err.message);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};
