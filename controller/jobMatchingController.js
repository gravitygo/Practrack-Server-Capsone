const JobMatchingService = require("../services/jobMatchingService");

exports.getCompanySheets = async (req, res) => {
  try {
    const companySheets = await JobMatchingService.getCompanySheets();
    const companyDB = await JobMatchingService.getCompanyDB();
    const studentDB = await JobMatchingService.getStudentDB();
    res.json({ companySheets, companyDB, studentDB });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
