const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { swaggerUi, swaggerSpec } = require('./swagger/swagger');

const app = express();

// Set up security headers as required by secure coding guidelines
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; frame-ancestors 'self';");
  // Limit allowed HTTP methods (allow-list GET, POST)
  const allowedMethods = ['GET', 'POST'];
  if (!allowedMethods.includes(req.method)) {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  next();
});

// Configure CORS with a strict origin check (reject wildcards in production)
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',')
  : ['http://127.0.0.1:3000', 'http://localhost:3000', 'http://127.0.0.1:3001'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server or local testing requests with no origin
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);

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
