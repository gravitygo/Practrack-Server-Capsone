const CompanyEvalsService = require("../services/companyEvalsService");

exports.getCompanyEvalsData = async (req, res) => {
  try {
    const [grades, numStudents, evalStats] = await Promise.all([
      CompanyEvalsService.getEvalScores(),
      CompanyEvalsService.getPostDeployCount(req.query.term),
      CompanyEvalsService.getEvalStats(req.query.term),
    ]);

    // NOT TESTED
    let evalCounts = 0;
    if (numStudents.post_deployment_interns > 0) {
      evalCounts = await CompanyEvalsService.getEvalCounts(req.query.term);
    }

    const values = [grades, numStudents, evalCounts, evalStats];
    res.json(values);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
