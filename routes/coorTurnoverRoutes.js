const express = require("express");
const router = express.Router();

const CoorTurnoverController = require("../controller/coorTurnoverController");

router.get("/", CoorTurnoverController.coorTurnoverBool);
module.exports = router;
