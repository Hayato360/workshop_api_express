const express = require('express');
const router = express.Router();
const Product = require('../models/product.model');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', async (req, res) => {
    const products = await Product.find();
    res.json(products);
});


router.get('/:id', authMiddleware, async (req, res) => {
    const product = await Product.findById(req.params.id);
    res.json(product);
});


router.post('/', authMiddleware, adminOnly, async (req, res) => {
    const newProduct = new Product(req.body);
    await newProduct.save();
    res.json(newProduct);
});


router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
});

module.exports = router;
