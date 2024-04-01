const ManifestService = require("../services/manifestService");

exports.getOptions = async (req, res) => {
  try {
    console.log(req.params);
    const options = await ManifestService.getOptions(req.params.type);
    res.send(options);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.postOptions = async (req, res) => {
  try {
    const options = await ManifestService.postOptions({
      ...req.body,
      type: req.params.type,
    });
    res.send(options);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const options = await ManifestService.getById(req.params.id);
    res.send(options);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
