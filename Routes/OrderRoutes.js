const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const Order = require("../models/order");   // Import the Order model
const User = require("../models/user");     // Import the User model
const Product = require("../models/product"); // Import the Product model
const Cart = require("../models/cart");     // Import the Cart model (to clear after order)

// ==============================
// GET all orders - GET /orders
// ==============================
router.get("/", async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate("userId", "name email")
            .populate("items.productId", "name price");
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: "Error fetching orders", error: err.message });
    }
});

// ==============================
// GET orders by userId - GET /orders/user/:userId
// ==============================
router.get("/user/:userId", async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.params.userId })
            .populate("items.productId", "name price");

        if (orders.length === 0) {
            return res.status(404).json({ message: "No orders found for this user" });
        }
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: "Error fetching orders", error: err.message });
    }
});

// ==============================
// TRACK order - GET /orders/track/:orderId
// ==============================
router.get("/track/:orderId", async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate("items.productId", "name price");

        if (!order) return res.status(404).json({ message: "Order not found" });

        const statuses = ['pending', 'processing', 'shipped', 'delivered'];
        const currentIndex = statuses.indexOf(order.status);

        const statusHistory = order.status === 'cancelled'
            ? [{ status: 'pending', completed: true }, { status: 'cancelled', completed: true }]
            : statuses.map((status, index) => ({ status, completed: index <= currentIndex }));

        const trackingInfo = {
            orderId: order._id,
            status: order.status,
            placedAt: new Date(order.timestamp).toLocaleString(),
            total: order.total,
            itemCount: order.items.length,
            items: order.items.map(item => ({
                productId: item.productId?._id,
                productName: item.productId?.name || "Unknown",
                quantity: item.quantity,
                price: item.productId?.price || 0,
                subtotal: (item.productId?.price || 0) * item.quantity
            })),
            statusHistory
        };
        res.status(200).json(trackingInfo);
    } catch (err) {
        res.status(500).json({ message: "Error tracking order", error: err.message });
    }
});

// ==============================
// GET one order - GET /orders/:orderId
// ==============================
router.get("/:orderId", async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate("items.productId", "name price");
        if (!order) return res.status(404).json({ message: "Order not found" });
        res.status(200).json(order);
    } catch (err) {
        res.status(500).json({ message: "Error fetching order", error: err.message });
    }
});

// ==============================
// PLACE order - POST /orders/place
// ==============================
router.post("/place", [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('items').notEmpty().withMessage('Order items are required').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
    body('items.*.productId').notEmpty().withMessage('Product ID is required'),
    body('items.*.quantity').notEmpty().withMessage('Quantity is required').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, items } = req.body;
    try {
        // Validate user exists
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Validate each product and calculate total
        let total = 0;
        const orderItems = [];

        for (let item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
            }
            total += product.price * item.quantity;
            orderItems.push({ productId: item.productId, quantity: item.quantity });
        }

        const newOrder = new Order({
            userId,
            total,
            items: orderItems,
            timestamp: Date.now(),
            status: "pending"
        });

        await newOrder.save();

        // Clear the user's cart after placing the order
        const cart = await Cart.findOne({ userId });
        if (cart) {
            cart.products = [];
            await cart.save();
        }

        res.status(201).json({ message: "Order placed successfully", order: newOrder });
    } catch (err) {
        res.status(500).json({ message: "Error placing order", error: err.message });
    }
});

// ==============================
// UPDATE order status - PUT /orders/update/:orderId
// ==============================
router.put("/update/:orderId", [
    body('status').notEmpty().withMessage('Status is required')
        .isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled'])
        .withMessage('Invalid status value')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.orderId,
            { status: req.body.status },
            { new: true }
        );
        if (!updatedOrder) return res.status(404).json({ message: "Order not found" });
        res.status(200).json({ message: "Order status updated successfully", order: updatedOrder });
    } catch (err) {
        res.status(500).json({ message: "Error updating order", error: err.message });
    }
});

// ==============================
// CANCEL order - PUT /orders/cancel/:orderId
// ==============================
router.put("/cancel/:orderId", async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        if (order.status === "delivered") {
            return res.status(400).json({ message: "Cannot cancel a delivered order" });
        }
        if (order.status === "cancelled") {
            return res.status(400).json({ message: "Order is already cancelled" });
        }

        order.status = "cancelled";
        await order.save();
        res.status(200).json({ message: "Order cancelled successfully", order });
    } catch (err) {
        res.status(500).json({ message: "Error cancelling order", error: err.message });
    }
});

module.exports = router;
