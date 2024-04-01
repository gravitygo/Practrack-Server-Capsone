const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

const UserController = require("../controller/userController");

router.post("/register", UserController.register);
router.get("/login", authMiddleware, UserController.login);
router.post("/setCustomUserClaims", UserController.setCustomUserClaims);
module.exports = router;
