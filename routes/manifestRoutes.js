const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const router = express.Router();

const ManifestController = require("../controller/manifestController");

router.get("/options/:type", ManifestController.getOptions);
router.get("/options/lookup/:id", ManifestController.getById);
router.post("/options/:type", ManifestController.postOptions);
module.exports = router;
