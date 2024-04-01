const AccountService = require("../services/accountService");
const DocumentService = require("../services/documentService");

exports.viewAccount = async (req, res) => {
  try {
    const userID = req.params.userID;
    const viewAccount = await AccountService.viewAccount({
      userID,
    });
    const viewInterests = await AccountService.viewInterests();
    const viewWorkSetup = await AccountService.viewWorkSetup();
    const viewJobs = await AccountService.viewJobList();
    res.json({
      account: viewAccount,
      interests: viewInterests,
      workSetup: viewWorkSetup,
      jobs: viewJobs,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.viewAccountCoor = async (req, res) => {
  try {
    const userID = req.params.userID;
    const viewAccount = await AccountService.viewAccountCoor({
      userID,
    });
    res.json({
      account: viewAccount,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const userID = req.params.userID;
    const updateAccount = await AccountService.updateAccount({
      userID,
      ...req.body,
    });
    res.json({ account: updateAccount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getEmail = async (req, res) => {
  try {
    const userID = req.params.userID;
    const getEmail = await AccountService.getEmail({
      userID,
    });
    res.json({ email: getEmail });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.setStudent = async (req, res) => {
  try {
    const userID = req.params.userID;
    console.log(userID);
    await AccountService.setStudent(userID);
    res.status(200).json({ message: "Student claim added." });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUsersWithPhase = async (req, res) => {
  try {
    const getUsersWithPhase = await AccountService.getUsersWithPhase();
    const getUnchecked = await DocumentService.getUnchecked();
    console.log(getUsersWithPhase);
    res.json({ users: getUsersWithPhase, unchecked: getUnchecked });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.createCoordinator = async (req, res) => {
  try {
    const createCoordinator = await AccountService.createCoordinator({
      ...req.body,
    });
    res.json({ status: createCoordinator });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.turnoverCoordinator = async (req, res) => {
  try {
    const registerCoordinator = await AccountService.registerCoordinator({
      ...req.body,
    });
    console.log(req.body.userID);
    const setCoordinator = await AccountService.setCoordinator(req.body.userID);
    res.json({ registerCoor: registerCoordinator });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getCurrentUsersWithPhase = async (req, res) => {
  try {
    const getCurrentUsersWithPhase =
      await AccountService.getCurrentUsersWithPhase(req.params.userID);
    console.log(getCurrentUsersWithPhase);
    res.json(getCurrentUsersWithPhase);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const deleteAccount = await AccountService.deleteAccount(req.body.user);
    res.json({ status: deleteAccount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserByRole = async (req, res) => {
  try {
    const users = await AccountService.getUserByRole(
      req.params.userId,
      req.params.role
    );
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
