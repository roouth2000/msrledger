/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Register a new user business
 *     description: Creates a new user business account with details including shop name, owner name, mobile, email and a secure password.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shopName
 *               - ownerName
 *               - mobile
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 description: Optional alphanumeric username (3-30 characters)
 *                 example: devuser99
 *               shopName:
 *                 type: string
 *                 description: Name of the shop or business (3-100 characters)
 *                 example: Shankar Traders
 *               ownerName:
 *                 type: string
 *                 description: Full name of the business owner (2-100 characters)
 *                 example: Shankar Lal
 *               gstin:
 *                 type: string
 *                 description: Optional 15-character GSTIN number
 *                 example: 22AAAAA0000A1Z5
 *               mobile:
 *                 type: string
 *                 description: Mobile number with optional country prefix
 *                 example: +919845012345
 *               email:
 *                 type: string
 *                 description: Email address for the business
 *                 example: you@business.com
 *               password:
 *                 type: string
 *                 description: Secure password (minimum 8 characters)
 *                 example: Secure@P@ss123
 *     responses:
 *       201:
 *         description: User business registered successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully.
 *       400:
 *         description: Bad request (validation errors, duplicate email or mobile).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Email is already registered.
 *       500:
 *         description: Internal Server Error.
 *
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user business and get JWT token / cookie
 *     description: Verifies credentials (email, mobile, or username) and returns a secure JWT token.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Email address, mobile number or username
 *                 example: shankar@traders.com
 *               password:
 *                 type: string
 *                 example: Secure@P@ss123
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token and sets secure session cookie.
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
 *         description: Invalid credentials.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Invalid credentials.
 *       500:
 *         description: Internal Server Error.
 *
 * /api/auth/profile:
 *   get:
 *     summary: Get protected user business profile
 *     description: Retrieve details from the authenticated user context. Requires Bearer Token or cookie session.
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
 *                     shopName:
 *                       type: string
 *                       example: Shankar Traders
 *                     ownerName:
 *                       type: string
 *                       example: Shankar Lal
 *                     email:
 *                       type: string
 *                       example: shankar@traders.com
 *                     mobile:
 *                       type: string
 *                       example: +919845012345
 *                     gstin:
 *                       type: string
 *                       example: 22AAAAA0000A1Z5
 *       401:
 *         description: Unauthorized (missing, invalid, or expired token).
 */
