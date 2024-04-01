const TermService = require("../services/termService");

exports.getCurrentTerm = async (req, res) => {
  try {
    const currentTerm = await TermService.getCurrentTerm();
    res.send(currentTerm);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
