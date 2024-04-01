const UserService = require("../services/userService");

exports.register = async (req, res) => {
  try {
    const users = await UserService.register(req.body);
    const students = await UserService.studentInformation(
      req.body,
      req.query.term
    );
    res.json({ user: users, student: students });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const user = await UserService.login(req.user);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.setCustomUserClaims = async (req, res) => {
  try {
    const user = await UserService.setCustomUserClaims(req.body);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
