const mongoose = require("mongoose");
const User = require("./models/user");
const Product = require("./models/product");
const Order = require("./models/order");
const Cart = require("./models/cart");

// Connect to MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/testdb")
    .then(async () => {
        console.log("Connected to MongoDB for CRUD Demo!");

        try {
            // ==============================
            // 1. CREATE Operations
            // ==============================
            console.log("\n--- Creating Documents ---");
            const newUser = new User({ name: "Alice", email: "alice@example.com", password: "pass123", contact: "1234567890" });
            await newUser.save();
            console.log("User Created:", newUser.name);

            const newProduct = new Product({ name: "Gaming Laptop", price: 1200, description: "High performance" });
            await newProduct.save();
            console.log("Product Created:", newProduct.name);

            const newCart = new Cart({ userId: newUser._id, products: [{ productId: newProduct._id, quantity: 1 }] });
            await newCart.save();
            console.log("Cart Created for User:", newUser.name);

            const newOrder = new Order({ userId: newUser._id, total: 1200, items: [{ productId: newProduct._id, quantity: 1 }] });
            await newOrder.save();
            console.log("Order Created with total:", newOrder.total);


            // ==============================
            // 2. READ Operations
            // ==============================
            console.log("\n--- Reading Documents ---");
            const foundUser = await User.findOne({ email: "alice@example.com" });
            console.log("Found User:", foundUser.name);

            const foundProduct = await Product.findById(newProduct._id);
            console.log("Found Product:", foundProduct.name, "Price:", foundProduct.price);


            // ==============================
            // 3. UPDATE Operations
            // ==============================
            console.log("\n--- Updating Documents ---");
            const updatedProduct = await Product.findByIdAndUpdate(
                newProduct._id,
                { price: 1050 }, // new data
                { new: true }    // returns the updated document
            );
            console.log("Updated Product Price:", updatedProduct.price);


            // ==============================
            // 4. DELETE Operations
            // ==============================
            console.log("\n--- Deleting Documents ---");
            // Deleting them to clean up the demo
            await Order.findByIdAndDelete(newOrder._id);
            await Cart.findByIdAndDelete(newCart._id);
            await Product.findByIdAndDelete(newProduct._id);
            await User.findByIdAndDelete(newUser._id);
            console.log("All created documents deleted successfully.");

        } catch (error) {
            console.error("Error during CRUD operations:", error);
        } finally {
            // Close the database connection
            await mongoose.disconnect();
            console.log("\nDisconnected from MongoDB.");
        }
    })
    .catch(err => console.error("Connection Error:", err));
