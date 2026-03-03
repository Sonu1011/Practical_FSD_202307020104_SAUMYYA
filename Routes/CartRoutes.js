const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const Cart = require("../models/cart");     // Import the Cart model
const User = require("../models/user");     // Import the User model
const Product = require("../models/product"); // Import the Product model

// ==============================
// GET cart by userId - GET /cart/:userId
// ==============================
router.get("/:userId", async (req, res) => {
    try {
        // populate gives us product details inside the cart
        const cart = await Cart.findOne({ userId: req.params.userId })
            .populate("products.productId", "name price");

        if (!cart) return res.status(404).json({ message: "Cart not found for this user" });

        // Build detailed cart response
        const cartDetails = {
            _id: cart._id,
            userId: cart.userId,
            items: cart.products.map(item => ({
                productId: item.productId?._id,
                productName: item.productId?.name || "Unknown",
                price: item.productId?.price || 0,
                quantity: item.quantity,
                subtotal: (item.productId?.price || 0) * item.quantity
            })),
            totalItems: cart.products.length,
            totalQuantity: cart.products.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: cart.products.reduce((sum, item) => sum + ((item.productId?.price || 0) * item.quantity), 0)
        };
        res.status(200).json(cartDetails);
    } catch (err) {
        res.status(500).json({ message: "Error fetching cart", error: err.message });
    }
});

// ==============================
// ADD product to cart - POST /cart/add
// ==============================
router.post("/add", [
    body('userId').notEmpty().withMessage('User ID is required'),
    body('productId').notEmpty().withMessage('Product ID is required'),
    body('quantity').notEmpty().withMessage('Quantity is required').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, productId, quantity } = req.body;
    try {
        // Validate that user and product exist
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: "Product not found" });

        // Find or create cart for user
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, products: [{ productId, quantity }] });
            await cart.save();
            return res.status(201).json({ message: "Cart created and product added", cart });
        }

        // Check if product already in cart
        const existingItem = cart.products.find(p => p.productId.toString() === productId);
        if (existingItem) {
            existingItem.quantity += parseInt(quantity);
            await cart.save();
            return res.status(200).json({ message: "Product quantity updated in cart", cart });
        }

        cart.products.push({ productId, quantity });
        await cart.save();
        res.status(201).json({ message: "Product added to cart", cart });
    } catch (err) {
        res.status(500).json({ message: "Error adding product to cart", error: err.message });
    }
});

// ==============================
// UPDATE quantity - PUT /cart/update/:userId/:productId
// ==============================
router.put("/update/:userId/:productId", [
    body('quantity').notEmpty().withMessage('Quantity is required').isInt({ min: 1 }).withMessage('Quantity must be at least 1')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { userId, productId } = req.params;
    const { quantity } = req.body;
    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Cart not found for this user" });

        const item = cart.products.find(p => p.productId.toString() === productId);
        if (!item) return res.status(404).json({ message: "Product not found in cart" });

        item.quantity = parseInt(quantity);
        await cart.save();
        res.status(200).json({ message: "Product quantity updated", cart });
    } catch (err) {
        res.status(500).json({ message: "Error updating cart", error: err.message });
    }
});

// ==============================
// REMOVE one product - DELETE /cart/remove/:userId/:productId
// ==============================
router.delete("/remove/:userId/:productId", async (req, res) => {
    const { userId, productId } = req.params;
    try {
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: "Cart not found for this user" });

        const initialLength = cart.products.length;
        cart.products = cart.products.filter(p => p.productId.toString() !== productId);

        if (cart.products.length === initialLength) {
            return res.status(404).json({ message: "Product not found in cart" });
        }

        await cart.save();
        res.status(200).json({ message: "Product removed from cart", cart });
    } catch (err) {
        res.status(500).json({ message: "Error removing product from cart", error: err.message });
    }
});

// ==============================
// CLEAR cart - DELETE /cart/clear/:userId
// ==============================
router.delete("/clear/:userId", async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.params.userId });
        if (!cart) return res.status(404).json({ message: "Cart not found for this user" });

        cart.products = [];
        await cart.save();
        res.status(200).json({ message: "Cart cleared successfully", cart });
    } catch (err) {
        res.status(500).json({ message: "Error clearing cart", error: err.message });
    }
});

module.exports = router;
