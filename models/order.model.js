const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    product: {type: mongoose.Schema.Types.ObjectId, ref: 'product', required: true},
    productCOde: {type: String},
    name: {type: String},
    qty: {type: Number, required: true},
    price: {type: Number , required: true},
    total: {type: Number, required: true}
});

const orderSchema = new mongoose.Schema({
    orderCode: {type: String, required: true, unique: true},
    items: [itemSchema],
    buyer: {type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true},
    totalAmount: {type: Number, required: true},
    status: {
        type: String, 
        enum: ['pending', 'processing', 'completed', 'cancelled'], 
        default: 'pending'
    },
    completedAt: {type: Date},
    createAt: {type:Date , default: Date.now}
})

module.exports = mongoose.model('order' , orderSchema);