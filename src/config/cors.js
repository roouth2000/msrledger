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

module.exports = corsOptions;
