const express = require("express");
const router = express.Router();

const TermController = require("../controller/termController");

router.get("/", TermController.getCurrentTerm);
module.exports = router;
