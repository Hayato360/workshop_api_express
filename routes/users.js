const express = require('express');
const router = express.Router();
const User = require('../models/user.model');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', authMiddleware, adminOnly, async (req, res) => {
  const users = await User.find();
  res.json(users);
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile', error });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json(user);
});

router.post('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const newUser = new User(req.body);
    await newUser.save();
    res.json(newUser);
  } catch (error) {

    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate username' });
    }
    res.status(500).json({ message: 'Error creating user', error });
  }
});

router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(user);
});

router.delete('/:id', authMiddleware, adminOnly, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: 'User deleted' });
});

module.exports = router;
