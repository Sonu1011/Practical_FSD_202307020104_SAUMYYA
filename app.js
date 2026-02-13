//Backend technologies:
// ● Create REST APIs for /products, /users, /cart, /orders.
// ● Implement data validation and middleware for requests.
// ● Add server-side error handling.

const express = require("express");
const app = express();
const productRoutes = require("./Routes/ProductRoutes");
const userRoutes = require("./Routes/UserRoutes");
const cartRoutes = require("./Routes/CartRoutes");
const orderRoutes = require("./Routes/OrderRoutes");
const { body, validationResult } = require("express-validator");

app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use("/products", productRoutes);
app.use("/users", userRoutes);
app.use("/cart", cartRoutes);
app.use("/orders", orderRoutes);

app.post("/login", (req, res) => {
    const email = req.body.email;
    const password = req.body.password;
    if (email == "admin@gmail.com" && password == "admin") {
        res.send("Login Success");
    }
    else {
        res.send("Login Failed");
    }
})




app.listen(3000, () => {
    console.log("http://localhost:3000/");
});

var users = [{
    id: 1,
    name: "John",
    email: "",
    password: "",
    address: "",
    contact: ""
}]

var products = [{
    id: 1,
    name: "",
    price: "",
    description: "",
}]

var cart = [{
    id: 1,
    userId: 1,
    productId: [],
    quantity: []
}]

var orders = [{
    id: 1,
    userId: 1,
    total: 0,
    items: [],
    timestamp: Date.now(),
    status: "pending"
}]





