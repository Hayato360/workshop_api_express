const express = require('express');
const router = express.Router();
const Cart = require('../models/cart.model');
const Product = require('../models/product.model');
const { authMiddleware } = require('../middleware/auth');

// Get user's cart
router.get('/', authMiddleware, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
            await cart.save();
        }
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching cart', error });
    }
});

// Add item to cart
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { productId, qty } = req.body;
        
        if (!productId || !qty || qty < 1) {
            return res.status(400).json({ message: 'Product ID and valid quantity required' });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.stock < qty) {
            return res.status(400).json({ message: 'Not enough stock' });
        }

        let cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            cart = new Cart({ user: req.user.id, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        
        if (existingItemIndex > -1) {
            const newQty = cart.items[existingItemIndex].qty + qty;
            if (product.stock < newQty) {
                return res.status(400).json({ message: 'Not enough stock for total quantity' });
            }
            cart.items[existingItemIndex].qty = newQty;
        } else {
            cart.items.push({ product: productId, qty });
        }

        await cart.save();
        await cart.populate('items.product');
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error adding to cart', error });
    }
});

// Update item quantity
router.put('/item/:productId', authMiddleware, async (req, res) => {
    try {
        const { qty } = req.body;
        
        if (!qty || qty < 1) {
            return res.status(400).json({ message: 'Valid quantity required' });
        }

        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        if (product.stock < qty) {
            return res.status(400).json({ message: 'Not enough stock' });
        }

        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => item.product.toString() === req.params.productId);
        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        cart.items[itemIndex].qty = qty;
        await cart.save();
        await cart.populate('items.product');
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error updating cart', error });
    }
});

// Remove item from cart
router.delete('/item/:productId', authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        cart.items = cart.items.filter(item => item.product.toString() !== req.params.productId);
        await cart.save();
        await cart.populate('items.product');
        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Error removing from cart', error });
    }
});

// Clear cart
router.delete('/', authMiddleware, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user.id });
        if (cart) {
            cart.items = [];
            await cart.save();
        }
        res.json({ message: 'Cart cleared' });
    } catch (error) {
        res.status(500).json({ message: 'Error clearing cart', error });
    }
});

// Create order from cart
router.post('/checkout', authMiddleware, async (req, res) => {
    try {
        const { orderCode } = req.body;
        
        if (!orderCode) {
            return res.status(400).json({ message: 'Order code required' });
        }

        const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        // Check stock availability and calculate total
        let totalAmount = 0;
        const processedItems = [];

        for (let item of cart.items) {
            if (!item.product || item.product.stock < item.qty) {
                return res.status(400).json({ 
                    message: `Not enough stock for ${item.product?.name || 'product'}` 
                });
            }

            const itemTotal = item.product.price * item.qty;
            totalAmount += itemTotal;

            processedItems.push({
                product: item.product._id,
                productCOde: item.product.code,
                name: item.product.name,
                qty: item.qty,
                price: item.product.price,
                total: itemTotal
            });
        }

        // Update product stock
        for (let item of cart.items) {
            item.product.stock -= item.qty;
            await item.product.save();
        }

        // Create order
        const Order = require('../models/order.model');
        const newOrder = new Order({
            orderCode,
            items: processedItems,
            buyer: req.user.id,
            totalAmount
        });

        await newOrder.save();

        // Clear cart
        cart.items = [];
        await cart.save();

        res.json(newOrder);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Order code already exists' });
        }
        res.status(500).json({ message: 'Error creating order from cart', error });
    }
});

module.exports = router;