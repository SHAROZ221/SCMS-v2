const { Op } = require('sequelize');
const { SparePart } = require('../models');

/**
 * @desc    Get all spare parts with search & category filters
 * @route   GET /api/inventory
 * @access  All roles
 */
const getParts = async (req, res, next) => {
  try {
    const { q, category, low_stock_only } = req.query;
    const whereClause = { is_active: true };

    if (category) {
      whereClause.category = category;
    }

    if (q && q.trim()) {
      whereClause[Op.or] = [
        { part_name: { [Op.like]: `%${q}%` } },
        { part_number: { [Op.like]: `%${q}%` } },
        { category: { [Op.like]: `%${q}%` } },
      ];
    }

    let parts = await SparePart.findAll({
      where: whereClause,
      order: [['part_name', 'ASC']],
    });

    if (low_stock_only === 'true') {
      parts = parts.filter(part => part.quantity_in_stock <= part.reorder_level);
    }

    return res.status(200).json({ parts, count: parts.length });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get spare parts below or equal to reorder level
 * @route   GET /api/inventory/low-stock
 * @access  Admin, Receptionist, Technician
 */
const getLowStockParts = async (req, res, next) => {
  try {
    const allParts = await SparePart.findAll({
      where: { is_active: true },
      order: [['quantity_in_stock', 'ASC']],
    });

    const lowStock = allParts.filter(part => part.quantity_in_stock <= part.reorder_level);

    return res.status(200).json({
      lowStockParts: lowStock,
      count: lowStock.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add a new spare part to inventory
 * @route   POST /api/inventory
 * @access  Admin only
 */
const createPart = async (req, res, next) => {
  try {
    const {
      part_name,
      part_number,
      category = 'General',
      quantity_in_stock = 0,
      unit_price = 0.00,
      reorder_level = 5,
    } = req.body;

    const existing = await SparePart.findOne({ where: { part_number } });
    if (existing) {
      return res.status(409).json({
        error: { message: 'A spare part with this part number already exists', status: 409 },
      });
    }

    const part = await SparePart.create({
      part_name,
      part_number,
      category,
      quantity_in_stock: parseInt(quantity_in_stock, 10),
      unit_price: parseFloat(unit_price),
      reorder_level: parseInt(reorder_level, 10),
      is_active: true,
    });

    return res.status(201).json({
      message: 'Spare part created successfully',
      part,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update spare part details
 * @route   PUT /api/inventory/:id
 * @access  Admin only
 */
const updatePart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { part_name, part_number, category, unit_price, reorder_level, is_active } = req.body;

    const part = await SparePart.findByPk(id);
    if (!part) {
      return res.status(404).json({ error: { message: 'Spare part not found', status: 404 } });
    }

    if (part_number && part_number !== part.part_number) {
      const duplicate = await SparePart.findOne({
        where: { part_number, id: { [Op.ne]: id } },
      });
      if (duplicate) {
        return res.status(409).json({
          error: { message: 'Part number already taken by another item', status: 409 },
        });
      }
      part.part_number = part_number;
    }

    if (part_name !== undefined) part.part_name = part_name;
    if (category !== undefined) part.category = category;
    if (unit_price !== undefined) part.unit_price = parseFloat(unit_price);
    if (reorder_level !== undefined) part.reorder_level = parseInt(reorder_level, 10);
    if (is_active !== undefined) part.is_active = is_active;

    await part.save();

    return res.status(200).json({
      message: 'Spare part updated successfully',
      part,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Restock a spare part (add quantity)
 * @route   PATCH /api/inventory/:id/restock
 * @access  Admin only
 */
const restockPart = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { quantityToAdd } = req.body;

    const qty = parseInt(quantityToAdd, 10);
    if (isNaN(qty) || qty <= 0) {
      return res.status(400).json({
        error: { message: 'quantityToAdd must be a positive integer', status: 400 },
      });
    }

    const part = await SparePart.findByPk(id);
    if (!part) {
      return res.status(404).json({ error: { message: 'Spare part not found', status: 404 } });
    }

    part.quantity_in_stock += qty;
    await part.save();

    return res.status(200).json({
      message: `Successfully restocked ${qty} units of ${part.part_name}`,
      part,
      newStock: part.quantity_in_stock,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getParts,
  getLowStockParts,
  createPart,
  updatePart,
  restockPart,
};
