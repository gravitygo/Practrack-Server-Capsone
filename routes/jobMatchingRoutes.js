const express = require("express");
const router = express.Router();
const jobMatchingController = require("../controller/jobMatchingController");

router.get("/", jobMatchingController.getCompanySheets);

module.exports = router;
