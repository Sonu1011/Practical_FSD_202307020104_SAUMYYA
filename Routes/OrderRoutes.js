const router = require("express").Router();
const { body, validationResult } = require("express-validator");


var orders = [{
    id: 1,
    userId: 1,
    total: 0,
    items: [],
    timestamp: Date.now(),
    status: "pending"
}]

router.get("/", (req, res) => {
    res.json(orders);
});

router.get("/user/:userId", (req, res) => {
    const userId = parseInt(req.params.userId);
    const userOrders = orders.filter(o => o.userId == userId);

    if (userOrders.length > 0) {
        res.json(userOrders);
    } else {
        res.status(404).json({ message: "No orders found for this user" });
    }
});

router.get("/:orderId", (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const order = orders.find(o => o.id == orderId);

    if (order) {
        res.json(order);
    } else {
        res.status(404).json({ message: "Order not found" });
    }
});

router.post("/place", [
    body('userId').notEmpty().withMessage('User ID is required').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
    body('items').notEmpty().withMessage('Order items are required').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
    body('items.*.productId').notEmpty().withMessage('Product ID is required').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
    body('items.*.quantity').notEmpty().withMessage('Quantity is required').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
    body('items.*.price').notEmpty().withMessage('Price is required').isFloat({ min: 0 }).withMessage('Price must be a positive number')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, items } = req.body;

    const user = users.find(u => u.id == userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    for (let item of items) {
        const product = products.find(p => p.id == item.productId);
        if (!product) {
            return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
        }
    }

    const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const newOrder = {
        id: orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1,
        userId: userId,
        total: total,
        items: items,
        timestamp: Date.now(),
        status: "pending"
    };

    orders.push(newOrder);

    const userCart = cart.find(c => c.userId == userId);
    if (userCart) {
        userCart.productId = [];
        userCart.quantity = [];
    }

    res.status(201).json({
        message: "Order placed successfully",
        order: newOrder
    });
});


router.put("/update/:orderId", [
    body('status').notEmpty().withMessage('Status is required').isIn(['pending', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Invalid status value')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const orderId = parseInt(req.params.orderId);
    const { status } = req.body;

    const orderIndex = orders.findIndex(o => o.id == orderId);

    if (orderIndex !== -1) {
        orders[orderIndex].status = status;
        res.json({
            message: "Order status updated successfully",
            order: orders[orderIndex]
        });
    } else {
        res.status(404).json({ message: "Order not found" });
    }
});

router.put("/cancel/:orderId", (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const orderIndex = orders.findIndex(o => o.id == orderId);

    if (orderIndex !== -1) {
        const order = orders[orderIndex];

        if (order.status === "delivered") {
            return res.status(400).json({ message: "Cannot cancel a delivered order" });
        }

        if (order.status === "cancelled") {
            return res.status(400).json({ message: "Order is already cancelled" });
        }

        order.status = "cancelled";
        res.json({
            message: "Order cancelled successfully",
            order: order
        });
    } else {
        res.status(404).json({ message: "Order not found" });
    }
});

router.get("/track/:orderId", (req, res) => {
    const orderId = parseInt(req.params.orderId);
    const order = orders.find(o => o.id == orderId);

    if (order) {
        const trackingInfo = {
            orderId: order.id,
            status: order.status,
            placedAt: new Date(order.timestamp).toLocaleString(),
            total: order.total,
            itemCount: order.items.length,
            items: order.items.map(item => {
                const product = products.find(p => p.id == item.productId);
                return {
                    productId: item.productId,
                    productName: product ? product.name : "Unknown",
                    quantity: item.quantity,
                    price: item.price,
                    subtotal: item.price * item.quantity
                };
            }),
            statusHistory: getStatusHistory(order.status)
        };
        res.json(trackingInfo);
    } else {
        res.status(404).json({ message: "Order not found" });
    }
});

function getStatusHistory(currentStatus) {
    const statuses = ['pending', 'processing', 'shipped', 'delivered'];
    const currentIndex = statuses.indexOf(currentStatus);

    if (currentStatus === 'cancelled') {
        return [
            { status: 'pending', completed: true },
            { status: 'cancelled', completed: true }
        ];
    }

    return statuses.map((status, index) => ({
        status: status,
        completed: index <= currentIndex
    }));
}

module.exports = router;
