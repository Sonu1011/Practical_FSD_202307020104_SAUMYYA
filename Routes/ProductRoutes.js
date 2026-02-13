const router = require("express").Router();



var products = [{
    id: 1,
    name: "",
    price: "",
    description: "",
}]


router.get("/", (req, res) => {
    res.send(products);
})


router.post("/add", (req, res) => {
    var newProduct = {
        id: req.body.id,
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
    }
    products.push(newProduct);
    res.send(newProduct);
})

router.post("/update/:id", (req, res) => {
    var id = req.params.id;
    for (var i = 0; i < products.length; i++) {
        if (products[i].id == id) {
            products[i].name = req.body.name;
            products[i].price = req.body.price;
            products[i].description = req.body.description;
            res.send("Product updated");
            return;
        }
    }
    res.send("Product not found");
})


router.delete("/remove/:id", (req, res) => {
    var id = parseInt(req.params.id);
    var productIndex = products.findIndex(p => p.id == id);

    if (productIndex !== -1) {
        var removedProduct = products.splice(productIndex, 1);
        res.json({ message: "Product removed successfully", product: removedProduct[0] });
    } else {
        res.status(404).json({ message: "Product not found" });
    }
})

module.exports = router;
