/**
 * @openapi
 * /api/vouchers:
 *   get:
 *     summary: List all user vouchers
 *     description: Retrieve a list of all accounting vouchers belonging to the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [Sales, Purchase, Receipt, Payment]
 *         description: Filter vouchers by type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Case-insensitive search match for party name or voucher number
 *     responses:
 *       200:
 *         description: A list of vouchers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 vouchers:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 *
 *   post:
 *     summary: Create a new voucher
 *     description: Create a new accounting voucher, optionally containing transaction line items.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voucherNumber
 *               - type
 *               - partyName
 *               - date
 *               - status
 *             properties:
 *               voucherNumber:
 *                 type: string
 *                 example: INV-1043
 *               type:
 *                 type: string
 *                 enum: [Sales, Purchase, Receipt, Payment]
 *                 example: Sales
 *               partyName:
 *                 type: string
 *                 example: Anand Kirana Stores
 *               date:
 *                 type: string
 *                 format: date
 *                 example: 2026-06-15
 *               status:
 *                 type: string
 *                 enum: [DUE, PAID, PARTIAL]
 *                 example: DUE
 *               gstRate:
 *                 type: number
 *                 default: 18.00
 *                 example: 18.00
 *               terms:
 *                 type: string
 *                 example: Net 15 days
 *               totalAmount:
 *                 type: number
 *                 description: Required ONLY if items array is empty. Ignored if items are present.
 *                 example: 15000.00
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - qty
 *                     - rate
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: Basmati Rice 25kg
 *                     qty:
 *                       type: integer
 *                       example: 4
 *                     rate:
 *                       type: number
 *                       example: 1850.00
 *     responses:
 *       201:
 *         description: Voucher created successfully
 *       400:
 *         description: Bad request (validation errors)
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal Server Error
 *
 * /api/vouchers/{id}:
 *   get:
 *     summary: Get voucher details
 *     description: Retrieve details of a single voucher by UUID, including its line items.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Voucher details retrieved successfully
 *       404:
 *         description: Voucher not found
 *       401:
 *         description: Unauthorized
 *
 *   delete:
 *     summary: Delete a voucher
 *     description: Delete a voucher and its associated items.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Voucher deleted successfully
 *       404:
 *         description: Voucher not found
 *       401:
 *         description: Unauthorized
 *
 * /api/vouchers/{id}/duplicate:
 *   post:
 *     summary: Duplicate a voucher
 *     description: Duplicate a voucher's fields and items, generating a duplicate with suffix -DUP.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       201:
 *         description: Voucher duplicated successfully
 *       404:
 *         description: Voucher not found
 *       401:
 *         description: Unauthorized
 */
