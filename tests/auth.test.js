const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const { User } = require('../src/models');

beforeAll(async () => {
  // Ensure we are in test environment
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Tests must run in test environment (NODE_ENV=test)');
  }
  // Sync and clean test database tables
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  // Close MySQL connection pool after test suites
  await sequelize.close();
});

describe('Authentication API Integration Tests', () => {
  const testUser = {
    username: 'testuser1',
    shopName: 'Shankar Traders',
    ownerName: 'Shankar Lal',
    mobile: '+919845012345',
    email: 'shankar@traders.com',
    password: 'Password@123',
  };

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'User registered successfully.');

      // Verify user is in DB
      const dbUser = await User.findOne({ where: { email: testUser.email } });
      expect(dbUser).not.toBeNull();
      expect(dbUser.shopName).toBe(testUser.shopName);
      expect(dbUser.ownerName).toBe(testUser.ownerName);
      expect(dbUser.mobile).toBe(testUser.mobile);
      expect(dbUser.email).toBe(testUser.email);
      // Ensure password was hashed and not stored in plaintext
      expect(dbUser.password).not.toBe(testUser.password);
    });

    it('should fail registration on duplicate email', async () => {
      const duplicateUser = {
        username: 'testuser2',
        shopName: 'Other Traders',
        ownerName: 'Other Owner',
        mobile: '+919845099999',
        email: testUser.email, // Duplicate email
        password: 'Password@123',
      };
      const res = await request(app)
        .post('/api/auth/register')
        .send(duplicateUser);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Email is already registered.');
    });

    it('should fail registration with invalid username (non-alphanumeric or short)', async () => {
      const shortUser = {
        username: 'ab',
        shopName: 'Shankar Traders',
        ownerName: 'Shankar Lal',
        mobile: '+919845012346',
        email: 'shankar2@traders.com',
        password: 'Password@123'
      };
      const badUser = {
        username: 'test_user!',
        shopName: 'Shankar Traders',
        ownerName: 'Shankar Lal',
        mobile: '+919845012347',
        email: 'shankar3@traders.com',
        password: 'Password@123'
      };

      const resShort = await request(app)
        .post('/api/auth/register')
        .send(shortUser);
      expect(resShort.status).toBe(400);

      const resBad = await request(app)
        .post('/api/auth/register')
        .send(badUser);
      expect(resBad.status).toBe(400);
    });

    it('should fail registration with short password', async () => {
      const weakUser = {
        username: 'weakuser',
        shopName: 'Shankar Traders',
        ownerName: 'Shankar Lal',
        mobile: '+919845012348',
        email: 'shankar4@traders.com',
        password: '123'
      };
      const res = await request(app)
        .post('/api/auth/register')
        .send(weakUser);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error', 'Password must be at least 8 characters long.');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with email and return a token', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Login successful.');
      expect(res.body).toHaveProperty('token');
      expect(typeof res.body.token).toBe('string');
    });

    it('should login successfully with mobile number', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: testUser.mobile,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Login successful.');
    });

    it('should fail login with incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: testUser.email,
          password: 'WrongPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid credentials.');
    });

    it('should fail login with non-existent identifier', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'noexist@example.com',
          password: 'Password@123',
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid credentials.');
    });
  });

  describe('GET /api/auth/profile (Protected Route)', () => {
    let token = '';

    beforeAll(async () => {
      // Get a valid token to use for tests
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: testUser.email,
          password: testUser.password
        });
      token = res.body.token;
    });

    it('should allow access with a valid token in Auth header', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Profile accessed successfully.');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('email', testUser.email);
      expect(res.body.user).toHaveProperty('shopName', testUser.shopName);
    });

    it('should allow access with a valid token in Cookie header', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Cookie', `token=${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('email', testUser.email);
    });

    it('should deny access without authorization header or cookie', async () => {
      const res = await request(app)
        .get('/api/auth/profile');

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Access denied. No token provided.');
    });

    it('should deny access with invalid/altered token', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}altered`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error', 'Invalid or expired token.');
    });
  });
});
