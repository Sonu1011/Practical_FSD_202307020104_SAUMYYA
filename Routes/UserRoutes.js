const router = require("express").Router();
const { body, validationResult } = require("express-validator");
const User = require("../models/user"); // Import the User model

// ==============================
// CREATE - POST /users/add
// ==============================
router.post("/add", [
    body('name').notEmpty().withMessage('Name is required').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('address').optional().trim().isLength({ max: 200 }).withMessage('Address must not exceed 200 characters'),
    body('contact').notEmpty().withMessage('Contact is required').matches(/^[0-9]{10}$/).withMessage('Contact must be a 10-digit number')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const user = new User({
            name: req.body.name,
            email: req.body.email,
            password: req.body.password,
            address: req.body.address || "",
            contact: req.body.contact,
        });
        const savedUser = await user.save();
        res.status(201).json({ message: "User added successfully", user: savedUser });
    } catch (err) {
        // Handle duplicate email
        if (err.code === 11000) {
            return res.status(409).json({ message: "Email already exists" });
        }
        res.status(500).json({ message: "Error adding user", error: err.message });
    }
});

// ==============================
// READ ALL - GET /users
// ==============================
router.get("/", async (req, res) => {
    try {
        const users = await User.find({});
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ message: "Error fetching users", error: err.message });
    }
});

// ==============================
// READ ONE - GET /users/:id
// ==============================
router.get("/:id", async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ message: "Error fetching user", error: err.message });
    }
});

// ==============================
// UPDATE - PUT /users/update/:id
// ==============================
router.put("/update/:id", [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').optional().isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('address').optional().trim().isLength({ max: 200 }).withMessage('Address must not exceed 200 characters'),
    body('contact').optional().matches(/^[0-9]{10}$/).withMessage('Contact must be a 10-digit number')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // returns the updated document
        );
        if (!updatedUser) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "User updated successfully", user: updatedUser });
    } catch (err) {
        res.status(500).json({ message: "Error updating user", error: err.message });
    }
});

// ==============================
// DELETE - DELETE /users/remove/:id
// ==============================
router.delete("/remove/:id", async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) return res.status(404).json({ message: "User not found" });
        res.status(200).json({ message: "User removed successfully", user: deletedUser });
    } catch (err) {
        res.status(500).json({ message: "Error deleting user", error: err.message });
    }
});

module.exports = router;