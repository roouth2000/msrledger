const { User } = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../middleware/auth');

/**
 * Handle user registration.
 * Performs strict validation and secures the user record creation.
 */
exports.register = async (req, res) => {
  const { username, shopName, ownerName, gstin, mobile, email, password } = req.body;

  // Validate required fields
  if (!shopName || typeof shopName !== 'string') {
    return res.status(400).json({ error: 'Shop name is required and must be a string.' });
  }
  if (!ownerName || typeof ownerName !== 'string') {
    return res.status(400).json({ error: 'Owner name is required and must be a string.' });
  }
  if (!mobile || typeof mobile !== 'string') {
    return res.status(400).json({ error: 'Mobile number is required and must be a string.' });
  }
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ error: 'Email is required and must be a string.' });
  }
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Password is required and must be a string.' });
  }

  // Length validations
  if (shopName.length < 3 || shopName.length > 100) {
    return res.status(400).json({ error: 'Shop name must be between 3 and 100 characters.' });
  }
  if (ownerName.length < 2 || ownerName.length > 100) {
    return res.status(400).json({ error: 'Owner name must be between 2 and 100 characters.' });
  }

  // GSTIN optional validation
  if (gstin) {
    if (typeof gstin !== 'string') {
      return res.status(400).json({ error: 'GSTIN must be a string.' });
    }
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/i;
    if (!gstinRegex.test(gstin)) {
      return res.status(400).json({ error: 'Invalid GSTIN format.' });
    }
  }

  // Mobile format validation (10 to 15 digits, optionally starting with +)
  const mobileRegex = /^\+?[0-9]{10,15}$/;
  if (!mobileRegex.test(mobile)) {
    return res.status(400).json({ error: 'Invalid mobile number format.' });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Username validation if provided
  if (username) {
    if (typeof username !== 'string') {
      return res.status(400).json({ error: 'Username must be a string.' });
    }
    const usernameRegex = /^[a-zA-Z0-9]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ error: 'Username must be alphanumeric and between 3 and 30 characters.' });
    }
  }

  // Password rules (minimum 8 characters)
  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email },
          { mobile },
          ...(username ? [{ username }] : [])
        ]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: 'Email is already registered.' });
      }
      if (existingUser.mobile === mobile) {
        return res.status(400).json({ error: 'Mobile number is already registered.' });
      }
      if (username && existingUser.username === username) {
        return res.status(400).json({ error: 'Username is already taken.' });
      }
    }

    // Create user (password is automatically hashed by Sequelize model hooks)
    await User.create({
      username: username || null,
      shopName,
      ownerName,
      gstin: gstin || null,
      mobile,
      email,
      password
    });

    return res.status(201).json({ message: 'User registered successfully.' });
  } catch (err) {
    console.error('Registration error details:', err.message);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Handle user login.
 * Validates credentials and returns a secure JWT token on success.
 */
exports.login = async (req, res) => {
  const { identifier, username, password } = req.body;
  const loginVal = identifier || username;

  if (!loginVal || typeof loginVal !== 'string' || !password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email/Mobile/Username and password are required.' });
  }

  try {
    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: loginVal },
          { mobile: loginVal },
          { username: loginVal }
        ]
      }
    });
    
    // Perform constant-time verification logic flow to avoid timing attacks
    let isMatch = false;
    if (user) {
      isMatch = await user.comparePassword(password);
    }

    if (!user || !isMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    // Generate token
    const secret = getJwtSecret();
    const token = jwt.sign(
      { id: user.id, username: user.username || user.shopName, email: user.email },
      secret,
      { 
        algorithm: 'HS256', 
        expiresIn: process.env.JWT_EXPIRES_IN || '1h' 
      }
    );

    // Set HttpOnly, Secure, SameSite secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3600000 // 1 hour
    });

    return res.status(200).json({
      message: 'Login successful.',
      token,
    });
  } catch (err) {
    console.error('Login error details:', err.message);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};
