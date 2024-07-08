const express = require("express");
const router = express.Router();

const HomeController = require("../controller/homeController");

router.get("/coor", HomeController.getValues);
router.get("/student", HomeController.getStudentHome);
router.get("/notifs", HomeController.getNotifs);
module.exports = router;
