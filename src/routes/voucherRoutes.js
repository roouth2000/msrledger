const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const { authMiddleware } = require('../middleware/auth');

// Apply auth protection globally to all voucher endpoints
router.use(authMiddleware);

// Voucher CRUD and duplication endpoints
router.get('/', voucherController.listVouchers);
router.post('/', voucherController.createVoucher);
router.get('/:id', voucherController.getVoucher);
router.post('/:id/duplicate', voucherController.duplicateVoucher);
router.delete('/:id', voucherController.deleteVoucher);

module.exports = router;
