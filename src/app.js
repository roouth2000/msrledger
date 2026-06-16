const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/authRoutes');
const voucherRoutes = require('./routes/voucherRoutes');
const { swaggerUi, swaggerSpec } = require('./swagger/swagger');

const app = express();

// Set up security headers as required by secure coding guidelines
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'self';");
  // Limit allowed HTTP methods (allow-list GET, POST, DELETE)
  const allowedMethods = ['GET', 'POST', 'DELETE'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  next();
});

// Configure CORS using isolated config file
const corsOptions = require('./config/cors');

app.use(cors(corsOptions));
app.use(express.json());

// Serve static assets from src/public
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/vouchers', voucherRoutes);

// Swagger Documentation UI endpoint
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Base health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Global 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

module.exports = app;
