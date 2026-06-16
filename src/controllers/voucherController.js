const { sequelize, Voucher, VoucherItem } = require('../models');
const { Op } = require('sequelize');

/**
 * List all vouchers for the current authenticated user.
 * Supports filtering by type and searching party name or voucher number.
 */
exports.listVouchers = async (req, res) => {
  const { type, search } = req.query;
  const whereClause = { userId: req.user.id };

  if (type) {
    whereClause.type = type;
  }

  if (search) {
    whereClause[Op.or] = [
      { partyName: { [Op.like]: `%${search}%` } },
      { voucherNumber: { [Op.like]: `%${search}%` } }
    ];
  }

  try {
    const vouchers = await Voucher.findAll({
      where: whereClause,
      include: [{ model: VoucherItem, as: 'items' }],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });
    return res.status(200).json({ vouchers });
  } catch (err) {
    console.error('List vouchers error details:', err.message);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Get details of a single voucher by ID (must belong to authenticated user).
 */
exports.getVoucher = async (req, res) => {
  const { id } = req.params;

  try {
    const voucher = await Voucher.findOne({
      where: { id, userId: req.user.id },
      include: [{ model: VoucherItem, as: 'items' }]
    });

    if (!voucher) {
      return res.status(404).json({ error: 'Voucher not found.' });
    }

    return res.status(200).json({ voucher });
  } catch (err) {
    console.error('Get voucher error details:', err.message);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Create a new voucher and associated items within a database transaction.
 */
exports.createVoucher = async (req, res) => {
  const { voucherNumber, type, partyName, date, status, terms, gstRate = 18, items = [] } = req.body;

  // Validate required fields
  if (!voucherNumber || typeof voucherNumber !== 'string') {
    return res.status(400).json({ error: 'Voucher number is required.' });
  }
  if (!type || typeof type !== 'string') {
    return res.status(400).json({ error: 'Voucher type is required.' });
  }
  if (!partyName || typeof partyName !== 'string') {
    return res.status(400).json({ error: 'Party name is required.' });
  }
  if (!date || typeof date !== 'string') {
    return res.status(400).json({ error: 'Voucher date is required.' });
  }
  if (!status || typeof status !== 'string') {
    return res.status(400).json({ error: 'Voucher status is required.' });
  }

  const validTypes = ['Sales', 'Purchase', 'Receipt', 'Payment'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: 'Invalid voucher type.' });
  }

  const validStatuses = ['DUE', 'PAID', 'PARTIAL'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid voucher status.' });
  }

  // Parse items and calculate amounts
  let computedSubtotal = 0;
  const formattedItems = [];

  for (let i = 0; i < items.length; i++) {
    const { name, qty, rate } = items[i];
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Each item must have a valid name.' });
    }
    const parsedQty = parseInt(qty, 10);
    const parsedRate = parseFloat(rate);

    if (isNaN(parsedQty) || parsedQty < 1) {
      return res.status(400).json({ error: 'Item quantity must be a positive integer.' });
    }
    if (isNaN(parsedRate) || parsedRate < 0) {
      return res.status(400).json({ error: 'Item rate must be a non-negative number.' });
    }

    const itemAmount = parsedQty * parsedRate;
    computedSubtotal += itemAmount;
    formattedItems.push({
      name,
      qty: parsedQty,
      rate: parsedRate,
      amount: itemAmount
    });
  }

  let totalAmount = 0;
  let computedGstAmount = 0;

  if (items.length > 0) {
    const rateGst = parseFloat(gstRate);
    if (isNaN(rateGst) || rateGst < 0) {
      return res.status(400).json({ error: 'GST rate must be a non-negative number.' });
    }
    computedGstAmount = computedSubtotal * (rateGst / 100);
    totalAmount = computedSubtotal + computedGstAmount;
  } else {
    // For direct payments/receipts, take totalAmount from the body
    if (req.body.totalAmount === undefined || isNaN(parseFloat(req.body.totalAmount))) {
      return res.status(400).json({ error: 'Total amount is required when no items are provided.' });
    }
    totalAmount = parseFloat(req.body.totalAmount);
    if (totalAmount < 0) {
      return res.status(400).json({ error: 'Total amount cannot be negative.' });
    }
  }

  const transaction = await sequelize.transaction();

  try {
    const voucher = await Voucher.create({
      voucherNumber,
      type,
      partyName,
      date,
      status,
      subtotal: computedSubtotal,
      gstRate: items.length > 0 ? gstRate : 0.00,
      gstAmount: computedGstAmount,
      totalAmount,
      terms: terms || null,
      userId: req.user.id
    }, { transaction });

    if (formattedItems.length > 0) {
      const itemsToCreate = formattedItems.map(item => ({
        ...item,
        voucherId: voucher.id
      }));
      await VoucherItem.bulkCreate(itemsToCreate, { transaction });
    }

    await transaction.commit();

    const completeVoucher = await Voucher.findByPk(voucher.id, {
      include: [{ model: VoucherItem, as: 'items' }]
    });

    return res.status(201).json({
      message: 'Voucher created successfully.',
      voucher: completeVoucher
    });
  } catch (err) {
    await transaction.rollback();
    console.error('Create voucher error details:', err.message);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Duplicate an existing voucher (create a duplicate record with new ID and -DUP suffix).
 */
exports.duplicateVoucher = async (req, res) => {
  const { id } = req.params;

  try {
    const originalVoucher = await Voucher.findOne({
      where: { id, userId: req.user.id },
      include: [{ model: VoucherItem, as: 'items' }]
    });

    if (!originalVoucher) {
      return res.status(404).json({ error: 'Voucher not found.' });
    }

    const transaction = await sequelize.transaction();

    try {
      const newVoucher = await Voucher.create({
        voucherNumber: `${originalVoucher.voucherNumber}-DUP`,
        type: originalVoucher.type,
        partyName: originalVoucher.partyName,
        date: originalVoucher.date,
        status: originalVoucher.status,
        subtotal: originalVoucher.subtotal,
        gstRate: originalVoucher.gstRate,
        gstAmount: originalVoucher.gstAmount,
        totalAmount: originalVoucher.totalAmount,
        terms: originalVoucher.terms,
        userId: req.user.id
      }, { transaction });

      if (originalVoucher.items && originalVoucher.items.length > 0) {
        const duplicatedItems = originalVoucher.items.map(item => ({
          name: item.name,
          qty: item.qty,
          rate: item.rate,
          amount: item.amount,
          voucherId: newVoucher.id
        }));
        await VoucherItem.bulkCreate(duplicatedItems, { transaction });
      }

      await transaction.commit();

      const completeVoucher = await Voucher.findByPk(newVoucher.id, {
        include: [{ model: VoucherItem, as: 'items' }]
      });

      return res.status(201).json({
        message: 'Voucher duplicated successfully.',
        voucher: completeVoucher
      });
    } catch (innerErr) {
      await transaction.rollback();
      throw innerErr;
    }
  } catch (err) {
    console.error('Duplicate voucher error details:', err.message);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

/**
 * Delete a voucher (also cascadingly deletes all its items).
 */
exports.deleteVoucher = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedCount = await Voucher.destroy({
      where: { id, userId: req.user.id }
    });

    if (deletedCount === 0) {
      return res.status(404).json({ error: 'Voucher not found.' });
    }

    return res.status(200).json({ message: 'Voucher deleted successfully.' });
  } catch (err) {
    console.error('Delete voucher error details:', err.message);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};
