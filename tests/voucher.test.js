const request = require('supertest');
const app = require('../src/app');
const sequelize = require('../src/config/database');
const { User, Voucher, VoucherItem } = require('../src/models');
const jwt = require('jsonwebtoken');
const { getJwtSecret } = require('../src/middleware/auth');

let userA = null;
let tokenA = '';
let userB = null;
let tokenB = '';

beforeAll(async () => {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('Tests must run in test environment (NODE_ENV=test)');
  }
  
  // Sync DB
  await sequelize.sync({ force: true });

  // Create two test users
  userA = await User.create({
    username: 'userA',
    shopName: 'Shankar Traders',
    ownerName: 'Shankar Lal',
    mobile: '+919845011111',
    email: 'shankar@traders.com',
    password: 'Password@123'
  });

  userB = await User.create({
    username: 'userB',
    shopName: 'Krishna Wholesale',
    ownerName: 'Krishna Kumar',
    mobile: '+919845022222',
    email: 'krishna@wholesale.com',
    password: 'Password@123'
  });

  // Generate tokens
  const secret = getJwtSecret();
  tokenA = jwt.sign({ id: userA.id, username: userA.shopName, email: userA.email }, secret, { algorithm: 'HS256' });
  tokenB = jwt.sign({ id: userB.id, username: userB.shopName, email: userB.email }, secret, { algorithm: 'HS256' });
});

afterAll(async () => {
  await sequelize.close();
});

describe('Vouchers API Integration Tests', () => {
  
  describe('POST /api/vouchers', () => {
    it('should successfully create a Sales voucher with calculated item subtotals and 18% GST', async () => {
      const payload = {
        voucherNumber: 'INV-1042',
        type: 'Sales',
        partyName: 'Anand Kirana Stores',
        date: '2026-06-15',
        status: 'DUE',
        terms: 'Net 15 days',
        items: [
          { name: 'Basmati Rice 25kg', qty: 4, rate: 1850.00 },
          { name: 'Sunflower Oil 5L', qty: 6, rate: 850.00 }
        ]
      };

      const res = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Voucher created successfully.');
      expect(res.body).toHaveProperty('voucher');
      
      const v = res.body.voucher;
      expect(v.voucherNumber).toBe('INV-1042');
      expect(parseFloat(v.subtotal)).toBe(12500.00); // (4*1850) + (6*850) = 7400 + 5100 = 12500
      expect(parseFloat(v.gstAmount)).toBe(2250.00); // 12500 * 0.18 = 2250
      expect(parseFloat(v.totalAmount)).toBe(14750.00); // 12500 + 2250 = 14750
      expect(v.items.length).toBe(2);
      expect(v.userId).toBe(userA.id);

      // Verify cascading items in DB
      const dbItems = await VoucherItem.findAll({ where: { voucherId: v.id } });
      expect(dbItems.length).toBe(2);
      // Sort to make assertions deterministic
      dbItems.sort((a, b) => parseFloat(b.amount) - parseFloat(a.amount));
      expect(parseFloat(dbItems[0].amount)).toBe(7400.00);
      expect(parseFloat(dbItems[1].amount)).toBe(5100.00);
    });

    it('should successfully create a Payment voucher with a direct total amount (no items)', async () => {
      const payload = {
        voucherNumber: 'PAY-118',
        type: 'Payment',
        partyName: 'Sunrise Distributors',
        date: '2026-06-13',
        status: 'PAID',
        totalAmount: 15000.00
      };

      const res = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(201);
      const v = res.body.voucher;
      expect(v.voucherNumber).toBe('PAY-118');
      expect(parseFloat(v.totalAmount)).toBe(15000.00);
      expect(parseFloat(v.subtotal)).toBe(0.00);
      expect(v.items.length).toBe(0);
    });

    it('should fail creation if required fields are missing', async () => {
      const payload = {
        voucherNumber: 'INV-1043',
        type: 'Sales'
        // missing partyName, date, status
      };

      const res = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(400);
    });

    it('should fail creation with invalid negative quantity or rate values', async () => {
      const payload = {
        voucherNumber: 'INV-1043',
        type: 'Sales',
        partyName: 'Anand Kirana Stores',
        date: '2026-06-15',
        status: 'DUE',
        items: [
          { name: 'Basmati Rice 25kg', qty: -4, rate: 1850.00 }
        ]
      };

      const res = await request(app)
        .post('/api/vouchers')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(payload);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/vouchers', () => {
    beforeAll(async () => {
      // Create a Purchase voucher for User A
      await Voucher.create({
        voucherNumber: 'PUR-318',
        type: 'Purchase',
        partyName: 'Sunrise Distributors',
        date: '2026-06-14',
        status: 'DUE',
        totalAmount: 28400.00,
        userId: userA.id
      });

      // Create a Sales voucher for User B
      await Voucher.create({
        voucherNumber: 'INV-999',
        type: 'Sales',
        partyName: 'User B Customer',
        date: '2026-06-14',
        status: 'PAID',
        totalAmount: 5000.00,
        userId: userB.id
      });
    });

    it('should list all vouchers of User A, ensuring tenant isolation from User B', async () => {
      const res = await request(app)
        .get('/api/vouchers')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('vouchers');
      
      const numbers = res.body.vouchers.map(v => v.voucherNumber);
      expect(numbers).toContain('INV-1042');
      expect(numbers).toContain('PAY-118');
      expect(numbers).toContain('PUR-318');
      expect(numbers).not.toContain('INV-999'); // Tenant isolation check
    });

    it('should filter list by type query parameter', async () => {
      const res = await request(app)
        .get('/api/vouchers?type=Sales')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      const types = res.body.vouchers.map(v => v.type);
      expect(types.every(t => t === 'Sales')).toBe(true);
      expect(types).toContain('Sales');
    });

    it('should search match by voucher number or party name', async () => {
      const res = await request(app)
        .get('/api/vouchers?search=Sunrise')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.vouchers.length).toBe(2); // PAY-118 and PUR-318 both match "Sunrise Distributors"
      expect(res.body.vouchers[0].partyName).toBe('Sunrise Distributors');
    });
  });

  describe('POST /api/vouchers/:id/duplicate', () => {
    it('should successfully duplicate a voucher adding -DUP to the voucher number', async () => {
      const original = await Voucher.findOne({ where: { voucherNumber: 'INV-1042' } });
      
      const res = await request(app)
        .post(`/api/vouchers/${original.id}/duplicate`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(201);
      expect(res.body.voucher.voucherNumber).toBe('INV-1042-DUP');
      expect(parseFloat(res.body.voucher.totalAmount)).toBe(14750.00);
      expect(res.body.voucher.items.length).toBe(2);
    });

    it('should block duplicating a voucher belonging to another user', async () => {
      const otherUserVoucher = await Voucher.findOne({ where: { voucherNumber: 'INV-999' } });
      
      const res = await request(app)
        .post(`/api/vouchers/${otherUserVoucher.id}/duplicate`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404); // returns 404 since it cannot find it for user A
    });
  });

  describe('DELETE /api/vouchers/:id', () => {
    it('should successfully delete a voucher and all its cascade items', async () => {
      const toDelete = await Voucher.findOne({ where: { voucherNumber: 'INV-1042-DUP' } });
      
      const res = await request(app)
        .delete(`/api/vouchers/${toDelete.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Voucher deleted successfully.');

      const checkVoucher = await Voucher.findByPk(toDelete.id);
      expect(checkVoucher).toBeNull();

      const checkItems = await VoucherItem.findAll({ where: { voucherId: toDelete.id } });
      expect(checkItems.length).toBe(0);
    });

    it('should block deleting a voucher belonging to another user', async () => {
      const otherVoucher = await Voucher.findOne({ where: { voucherNumber: 'INV-999' } });

      const res = await request(app)
        .delete(`/api/vouchers/${otherVoucher.id}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(404);
    });
  });
});
