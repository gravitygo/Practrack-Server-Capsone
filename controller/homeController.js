const HomeService = require("../services/homeService");

exports.getValues = async (req, res) => {
  try {
    const [uncheckedSubmissions, unreadMessages, missingReports, chartData] =
      await Promise.all([
        HomeService.getUnchecked(),
        HomeService.getUnread(req.query.uid),
        HomeService.getMissing(req.query.term),
        HomeService.getChartData(req.query.term),
      ]);
    const values = [
      uncheckedSubmissions,
      unreadMessages,
      missingReports,
      chartData,
    ];
    res.json(values);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStudentHome = async (req, res) => {
  try {
    const [studentData, pendingSubmissions, unreadMessages] = await Promise.all(
      [
        HomeService.getStudentData(req.query.uid),
        HomeService.getPending(req.query.uid),
        HomeService.getUnread(req.query.uid),
      ]
    );
    const values = [studentData, pendingSubmissions, unreadMessages];
    res.json(values);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
