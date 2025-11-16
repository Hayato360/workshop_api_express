const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
    code: {type: String, required: true, unique: true},
    name: {type: String, required: true},
    description: {type: String},
    price: {type: Number, required: true, min: 0},
    stock: {type: Number, required: true, min: 0},
    image: {type: String}, // URL or path to product image
},{
    timestamps: true
});

module.exports = mongoose.model('product',productSchema)