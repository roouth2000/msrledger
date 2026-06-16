const app = require('./app');
const sequelize = require('./config/database');

const PORT = process.env.PORT || 3000;
// Enforce localhost binding to adhere to the security rules
const HOST = '127.0.0.1';

async function startServer() {
  try {
    // Verify database connectivity
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    // Sync tables (alter is set to true in dev to sync new models, false in prod for safety)
    const isDev = process.env.NODE_ENV !== 'production';
    await sequelize.sync({ alter: isDev });
    console.log('Database models synced.');

    // Launch server on localhost only
    app.listen(PORT, HOST, () => {
      console.log(`Server is running on http://${HOST}:${PORT}`);
      console.log(`Swagger documentation is available at http://${HOST}:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Fatal error starting the server:', error.message);
    process.exit(1);
  }
}

startServer();
