const router = require("express").Router();
const { body, validationResult } = require("express-validator");


var users = [{
    id: 1,
    name: "John",
    email: "",
    password: "",
    address: "",
    contact: ""
}]


router.get("/", (req, res) => {
    res.send(users);
});

router.get("/:id", (req, res) => {
    var id = req.params.id;
    var user = users.find(u => u.id == id);
    if (user) {
        res.send(user);
    } else {
        res.status(404).send("User not found");
    }
});

router.post("/add", [
    body('name').notEmpty().withMessage('Name is required').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').notEmpty().withMessage('Email is required').isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('address').optional().trim().isLength({ max: 200 }).withMessage('Address must not exceed 200 characters'),
    body('contact').notEmpty().withMessage('Contact is required').matches(/^[0-9]{10}$/).withMessage('Contact must be a 10-digit number')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    var newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        address: req.body.address || "",
        contact: req.body.contact
    };
    users.push(newUser);
    res.status(201).json({ message: "User added successfully", user: newUser });
});



router.put("/update/:id", [
    body('name').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('email').optional().isEmail().withMessage('Invalid email format').normalizeEmail(),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('address').optional().trim().isLength({ max: 200 }).withMessage('Address must not exceed 200 characters'),
    body('contact').optional().matches(/^[0-9]{10}$/).withMessage('Contact must be a 10-digit number')
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    var id = req.params.id;
    var userIndex = users.findIndex(u => u.id == id);

    if (userIndex !== -1) {
        if (req.body.name) users[userIndex].name = req.body.name;
        if (req.body.email) users[userIndex].email = req.body.email;
        if (req.body.password) users[userIndex].password = req.body.password;
        if (req.body.address !== undefined) users[userIndex].address = req.body.address;
        if (req.body.contact) users[userIndex].contact = req.body.contact;

        res.json({ message: "User updated successfully", user: users[userIndex] });
    } else {
        res.status(404).send("User not found");
    }
});


router.delete("/remove/:id", (req, res) => {
    var id = req.params.id;
    var userIndex = users.findIndex(u => u.id == id);

    if (userIndex !== -1) {
        var removedUser = users.splice(userIndex, 1);
        res.json({ message: "User removed successfully", user: removedUser[0] });
    } else {
        res.status(404).send("User not found");
    }
});

module.exports = router;