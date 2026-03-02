const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    total: { type: Number, required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        quantity: { type: Number, default: 1 }
    }],
    timestamp: { type: Date, default: Date.now },
    status: { type: String, default: "pending" }
});

module.exports = mongoose.model("Order", orderSchema);
