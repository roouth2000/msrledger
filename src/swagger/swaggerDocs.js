/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with a secure, bcrypt-hashed password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Alphanumeric username (3-30 characters)
 *                 example: devuser99
 *               password:
 *                 type: string
 *                 description: Secure password (minimum 8 characters)
 *                 example: Secure@P@ss123
 *     responses:
 *       201:
 *         description: User registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully.
 *       400:
 *         description: Bad request (validation errors, username taken).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Username is already taken.
 *       500:
 *         description: Internal Server Error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: An internal server error occurred.
 *
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and get JWT token
 *     description: Verifies credentials and returns a secure JWT token for access to protected routes.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: devuser99
 *               password:
 *                 type: string
 *                 example: Secure@P@ss123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT Bearer token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful.
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials (generic message to block enumeration).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid username or password.
 *       500:
 *         description: Internal Server Error.
 *
 * /api/auth/profile:
 *   get:
 *     summary: Get protected user profile
 *     description: Retrieve details from the authenticated user context. Requires Bearer Token.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile accessed successfully.
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 4a2b3c...
 *                     username:
 *                       type: string
 *                       example: devuser99
 *       401:
 *         description: Unauthorized (missing, invalid, or expired token).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid or expired token.
 */
