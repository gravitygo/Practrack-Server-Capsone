const express = require("express");
// const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

const companyListingController = require("../controller/companyListingController");

router.get("/:userID", companyListingController.viewCompanyList);
router.post("/addCompany", companyListingController.addCompanyListing);
router.get("/:companyID/modal", companyListingController.viewCompanyModal);
router.post("/:companyID/save", companyListingController.saveCompany);
router.delete("/:companyID", companyListingController.deleteCompany);

module.exports = router;
