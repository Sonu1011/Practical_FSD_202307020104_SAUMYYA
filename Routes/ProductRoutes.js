const router = require("express").Router();
const Product = require("../models/product"); // Import the Product model

// ==============================
// CREATE - POST /products/add
// ==============================
router.post("/add", async (req, res) => {
    try {
        const product = new Product({
            name: req.body.name,
            price: req.body.price,
            description: req.body.description,
        });
        const savedProduct = await product.save();
        res.status(201).json({ message: "Product added successfully", product: savedProduct });
    } catch (err) {
        res.status(500).json({ message: "Error adding product", error: err.message });
    }
});

// ==============================
// READ ALL - GET /products
// ==============================
router.get("/", async (req, res) => {
    try {
        const products = await Product.find({});
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: "Error fetching products", error: err.message });
    }
});

// ==============================
// READ ONE - GET /products/:id
// ==============================
router.get("/:id", async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ message: "Error fetching product", error: err.message });
    }
});

// ==============================
// UPDATE - PUT /products/update/:id
// ==============================
router.put("/update/:id", async (req, res) => {
    try {
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                price: req.body.price,
                description: req.body.description,
            },
            { new: true } // returns the updated document
        );
        if (!updatedProduct) return res.status(404).json({ message: "Product not found" });
        res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
    } catch (err) {
        res.status(500).json({ message: "Error updating product", error: err.message });
    }
});

// ==============================
// DELETE - DELETE /products/remove/:id
// ==============================
router.delete("/remove/:id", async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        if (!deletedProduct) return res.status(404).json({ message: "Product not found" });
        res.status(200).json({ message: "Product removed successfully", product: deletedProduct });
    } catch (err) {
        res.status(500).json({ message: "Error deleting product", error: err.message });
    }
});

module.exports = router;
