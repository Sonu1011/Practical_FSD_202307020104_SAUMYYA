const router = require("express").Router();
const { body, validationResult } = require("express-validator");

var cart = [{
    id: 1,
    userId: 1,
    productId: [],
    quantity: []
}]


router.get("/:userId", (req, res) => {
    const userId = parseInt(req.params.userId);
    const userCart = cart.find(c => c.userId == userId);

    if (userCart) {
        // Build detailed cart response with product information
        const cartDetails = {
            id: userCart.id,
            userId: userCart.userId,
            items: userCart.productId.map((prodId, index) => {
                const product = products.find(p => p.id == prodId);
                return {
                    productId: prodId,
                    productName: product ? product.name : "Unknown",
                    price: product ? product.price : 0,
                    quantity: userCart.quantity[index],
                    subtotal: product ? product.price * userCart.quantity[index] : 0
                };
            }),
            totalItems: userCart.productId.length,
            totalQuantity: userCart.quantity.reduce((sum, qty) => sum + qty, 0),
            totalPrice: userCart.productId.reduce((sum, prodId, index) => {
                const product = products.find(p => p.id == prodId);
                return sum + (product ? product.price * userCart.quantity[index] : 0);
            }, 0)
        };
        res.json(cartDetails);
    } else {
        res.status(404).json({ message: "Cart not found for this user" });
    }
});

router.post("/add", [
    body('userId').notEmpty().withMessage('User ID is required').isInt({ min: 1 }).withMessage('User ID must be a positive integer'),
    body('productId').notEmpty().withMessage('Product ID is required').isInt({ min: 1 }).withMessage('Product ID must be a positive integer'),
    body('quantity').notEmpty().withMessage('Quantity is required').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, productId, quantity } = req.body;
    const user = users.find(u => u.id == userId);
    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    const product = products.find(p => p.id == productId);
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    let userCart = cart.find(c => c.userId == userId);

    if (!userCart) {
        userCart = {
            id: cart.length > 0 ? Math.max(...cart.map(c => c.id)) + 1 : 1,
            userId: userId,
            productId: [],
            quantity: []
        };
        cart.push(userCart);
    }

    const productIndex = userCart.productId.indexOf(productId);

    if (productIndex !== -1) {
        userCart.quantity[productIndex] += quantity;
        res.json({ message: "Product quantity updated in cart", cart: userCart });
    } else {
        userCart.productId.push(productId);
        userCart.quantity.push(quantity);
        res.status(201).json({ message: "Product added to cart", cart: userCart });
    }
});

router.delete("/remove/:userId/:productId", (req, res) => {
    const userId = parseInt(req.params.userId);
    const productId = parseInt(req.params.productId);

    const userCart = cart.find(c => c.userId == userId);

    if (!userCart) {
        return res.status(404).json({ message: "Cart not found for this user" });
    }

    const productIndex = userCart.productId.indexOf(productId);

    if (productIndex !== -1) {
        userCart.productId.splice(productIndex, 1);
        userCart.quantity.splice(productIndex, 1);
        res.json({ message: "Product removed from cart", cart: userCart });
    } else {
        res.status(404).json({ message: "Product not found in cart" });
    }
});

router.delete("/clear/:userId", (req, res) => {
    const userId = parseInt(req.params.userId);
    const userCart = cart.find(c => c.userId == userId);

    if (!userCart) {
        return res.status(404).json({ message: "Cart not found for this user" });
    }

    userCart.productId = [];
    userCart.quantity = [];

    res.json({ message: "Cart cleared successfully", cart: userCart });
});

router.put("/update/:userId/:productId", [
    body('quantity').notEmpty().withMessage('Quantity is required').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const userId = parseInt(req.params.userId);
    const productId = parseInt(req.params.productId);
    const { quantity } = req.body;

    const userCart = cart.find(c => c.userId == userId);

    if (!userCart) {
        return res.status(404).json({ message: "Cart not found for this user" });
    }

    const productIndex = userCart.productId.indexOf(productId);

    if (productIndex !== -1) {
        userCart.quantity[productIndex] = quantity;
        res.json({ message: "Product quantity updated", cart: userCart });
    } else {
        res.status(404).json({ message: "Product not found in cart" });
    }
});

module.exports = router;
