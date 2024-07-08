const batchService = require("../services/batchService");

exports.getBatches = async (req, res) => {
  try {
    const getBatches = await batchService.getBatches();
    res.json({ batches: getBatches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getBatch = async (req, res) => {
  try {
    const batchID = req.params.batchID;
    const getBatch = await batchService.getBatch({ batchID });
    res.json({ batch: getBatch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveBatch = async (req, res) => {
  try {
    const saveBatch = await batchService.saveBatch({ ...req.body });
    res.json({ savedBatch: saveBatch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.computeBatch = async (req, res) => {
  try {
    const computeBatch = await batchService.computeBatch();
    res.json({ newBatch: computeBatch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.insertBatch = async (req, res) => {
  try {
    const insertBatch = await batchService.insertBatch({ ...req.body });
    res.json({ addedBatch: insertBatch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.disableBatch = async (req, res) => {
  try {
    const disableBatch = await batchService.disableBatch(req.params.batchID);
    res.json({ disabledBatch: disableBatch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.enableBatch = async (req, res) => {
  try {
    const enableBatch = await batchService.enableBatch(req.params.batchID);
    res.json({ enabledBatch: enableBatch });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
