var express = require('express');
var router = express.Router();
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user.model')
require('dotenv').config()

router.get('/', function(req, res, next) {
  res.send('respond with auth');
});

router.post('/register', async (req, res, next) =>{
    try{
        const { username , password , firstName , lastName , gender , age} = req.body

        const hashedPassword = await bcrypt.hash(password, 10)

        const newUser = new User({
            username,
            password: hashedPassword,
            firstName,
            lastName,
            gender,
            age,
            role : 'user'
        })

        await newUser.save();
        res.status(201).json({ message: 'Register success', user: newUser });
    } catch (error) {

        if (error.code === 11000) {
            return res.status(400).json({ message: 'Duplicate username' });
        }
        res.status(500).json({ message: 'Error registering user', error });
    }
});

router.post('/login', async(req,res,next) => {
    try {
        const {username, password} = req.body

        const user = await User.findOne({username})
        if (!user) return res.status(404).json({ message: 'User not found' })

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid password'})

            const token = jwt.sign(
                {
                    id: user._id, role: user.role
                }, process.env.JWT_SECRET,
                {
                    expiresIn: '24h'
                }
            );

            res.json({ message: 'Loing success', token})
    }catch (error) {
        res.status(500).json({ message: 'Error login', error});
    }
})

module.exports = router;