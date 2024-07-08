const MoaDSSService = require("../services/moadssService");

exports.viewMOA = async (req, res) => {
  try {
    const coorID = req.params.coorID;
    const coorConfig = await MoaDSSService.getCoorConfig({ coorID });
    const companies = await MoaDSSService.getCompanies();
    const companyDB = await MoaDSSService.getCompaniesDB();
    let dssArray = null;

    if (coorConfig.q1 != null) {
      dssArray = await MoaDSSService.computeDSS({
        companies,
        coorConfig,
      });
    }
    res.json({ coorConfig, companyDB, dssArray });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.checkConfig = async (req, res) => {
  try {
    const dssArray = await MoaDSSService.computeDSSConfigure({ ...req.body });
    res.json({ dssArray });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", ...req.body });
  }
};

exports.saveConfig = async (req, res) => {
  try {
    const coorID = req.params.coorID;
    const config = await MoaDSSService.saveConfig({ coorID, ...req.body });
    res.json({ config });
  } catch (error) {
    res.status(500).json({ message: "Internal server error", ...req.body });
  }
};

exports.getRow = async (req, res) => {
  try {
    const companyStr = req.params.company;
    const uid = req.params.coorID;
    const company = await MoaDSSService.getRow({ companyStr });
    const companyDB = await MoaDSSService.getRowDB({ companyStr });
    const counts = await MoaDSSService.getSurveyCounts({ companyStr });
    const data = await MoaDSSService.getSoloDSS({ companyStr, uid });
    res.json({ company, companyDB, counts, data });
  } catch (error) {
    console.error("Error reading Google Sheets:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getCompanies = async (req, res) => {
  try {
    const companies = await MoaDSSService.getCompanies();
    const companyDB = await MoaDSSService.getCompaniesDB();
    res.json({ companies, companyDB });
  } catch (error) {
    console.error("Error fetching companies:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
