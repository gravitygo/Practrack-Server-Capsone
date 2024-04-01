const express = require("express");
// const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();
const moadssController = require("../controller/moadssController");

router.get("/:coorID", moadssController.viewMOA);
router.get("/:coorID/list", moadssController.getCompanies);
router.get("/:coorID/companyDetails/:company", moadssController.getRow);
router.post("/:coorID/check", moadssController.checkConfig);
router.post("/:coorID/check/true", moadssController.saveConfig);

// router.get("/getCompanies", moadssController.getCompanies);

module.exports = router;
