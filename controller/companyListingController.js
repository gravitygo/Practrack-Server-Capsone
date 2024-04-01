const CompanyListingService = require("../services/companyListingService");

exports.viewCompanyList = async (req, res) => {
  try {
    const userID = req.params.userID;
    const getCompanyListing = await CompanyListingService.viewCompanyList();
    const getNature = await CompanyListingService.viewNatureOfCompany();
    const getJobs = await CompanyListingService.viewJobList();
    const getProfile = await CompanyListingService.viewAccount({ userID });
    const getWorkSetup = await CompanyListingService.viewWorkSetup();
    res.json({
      companylist: getCompanyListing,
      nature: getNature,
      jobs: getJobs,
      profile: getProfile,
      worksetup: getWorkSetup,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addCompanyListing = async (req, res) => {
  try {
    console.log("From companylistingController.js");
    console.log(req.body);
    const newCompanyListing = await CompanyListingService.addCompany(req.body);
    res.json({ addCompany: newCompanyListing });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// View Company Modal export
exports.viewCompanyModal = async (req, res) => {
  try {
    const companyID = req.params.companyID;
    console.log("from controller" + companyID);
    const viewCompanyModal = await CompanyListingService.viewCompanyModal({
      companyID,
    });
    res.json({ companyID, viewCompanyModal: viewCompanyModal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Save edited Company Details
exports.saveCompany = async (req, res) => {
  try {
    const companyID = req.params.companyID;
    const saveCompany = await CompanyListingService.saveCompany({
      companyID,
      ...req.body,
    });
    res.json({ company: saveCompany });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteCompany = async (req, res) => {
  try {
    const companyID = req.params.companyID;
    const uid = req.query.uid;
    const deleteCompany = await CompanyListingService.deleteCompany({
      companyID,
      uid,
    });
    res.json({ deleteCompany: deleteCompany });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
