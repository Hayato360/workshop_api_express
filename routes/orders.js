const express = require('express');
const router = express.Router();
const Order = require('../models/order.model');
const Product = require('../models/product.model');
const { authMiddleware } = require('../middleware/auth');

// Create Order
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { orderCode, items } = req.body;

    let totalAmount = 0;
    const processedItems = [];

    for (let item of items) {
      const product = await Product.findById(item.product);
      if (!product || product.stock < item.qty) {
        return res.status(400).json({ message: `Not enough stock for ${product?.name}` });
      }

      product.stock -= item.qty;
      await product.save();

      const itemTotal = product.price * item.qty;
      totalAmount += itemTotal;

      processedItems.push({
        product: product._id,
        productCOde: product.code,
        name: product.name,
        qty: item.qty,
        price: product.price,
        total: itemTotal
      });
    }

    const newOrder = new Order({
      orderCode,
      items: processedItems,
      buyer: req.user.id,
      totalAmount
    });

    await newOrder.save();
    res.json(newOrder);
  } catch (error) {
    res.status(500).json({ message: 'Error creating order', error });
  }
});

// Get all orders (admin only)
router.get('/', authMiddleware, async (req, res) => {
  if (req.user.role === 'admin') {
    const orders = await Order.find().populate('items.product').populate('buyer');
    res.json(orders);
  } else {
    const orders = await Order.find({ buyer: req.user.id }).populate('items.product');
    res.json(orders);
  }
});

// Get order by id
router.get('/:id', authMiddleware, async (req, res) => {
  const order = await Order.findById(req.params.id).populate('items.product').populate('buyer');
  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (req.user.role !== 'admin' && order.buyer.toString() !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  res.json(order);
});

module.exports = router;
