const express = require("express");
const router = express.Router();

const BatchController = require("../controller/batchController");

router.get("/", BatchController.getBatches);
router.get("/computeBatch", BatchController.computeBatch);
router.post("/computeBatch", BatchController.insertBatch);
router.get("/:batchID", BatchController.getBatch);
router.post("/:batchID", BatchController.saveBatch);
router.post("/disableBatch/:batchID", BatchController.disableBatch);
router.post("/enableBatch/:batchID", BatchController.enableBatch);

module.exports = router;
