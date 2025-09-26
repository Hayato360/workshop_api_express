const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    username: { type: String, required: true, unique: true  },
    password: { type: String, required: true },
    firstName: { type: String },
    lastName: { type: String },
    gender: { type: String, enum: ['male','female','other'], default: 'other' },
    age: { type: Number },
    role: { type: String, enum: ['user','admin'], default: 'user' }
}, {
    timestamps: true
})

module.exports = mongoose.model('user', userSchema)