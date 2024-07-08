const HomeService = require("../services/homeService");
const DocumentService = require("../services/documentService");

exports.getValues = async (req, res) => {
  try {
    const [
      uncheckedSubmissions,
      unreadMessages,
      missingReports,
      chartData,
      requestForMigrate,
    ] = await Promise.all([
      HomeService.getUnchecked(),
      HomeService.getUnread(req.query.uid),
      HomeService.getMissing(),
      HomeService.getChartData(req.query.term),
      HomeService.getRequests(),
    ]);
    const values = [
      uncheckedSubmissions,
      unreadMessages,
      missingReports,
      chartData,
      requestForMigrate,
    ];
    res.json(values);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStudentHome = async (req, res) => {
  try {
    const [
      studentData,
      pendingSubmissions,
      unreadMessages,
      checkApproval,
      deadlineAlerts,
    ] = await Promise.all([
      HomeService.getStudentData(req.query.uid),
      HomeService.getPending(req.query.uid),
      HomeService.getUnread(req.query.uid),
      DocumentService.checkApprovedMigration(req.query.uid),
      HomeService.getDue(req.query.uid),
    ]);
    const values = [
      studentData,
      pendingSubmissions,
      unreadMessages,
      checkApproval,
      deadlineAlerts,
    ];
    res.json(values);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getNotifs = async (req, res) => {
  try {
    const counts = await HomeService.getNotifs(req.query.uid);
    res.json(counts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
