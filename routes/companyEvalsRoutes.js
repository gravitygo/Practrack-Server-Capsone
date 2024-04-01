const express = require("express");
const router = express.Router();

const CompanyEvalsController = require("../controller/companyEvalsController");

router.get("/", CompanyEvalsController.getCompanyEvalsData);
module.exports = router;
