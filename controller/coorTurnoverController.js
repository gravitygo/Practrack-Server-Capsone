const CoorTurnoverService = require("../services/coorTurnoverService");

exports.coorTurnoverBool = async (req, res) => {
  try {
    const count = await CoorTurnoverService.countActiveCoors();
    const toggleTurnover = count > 1;
    res.send(toggleTurnover);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
