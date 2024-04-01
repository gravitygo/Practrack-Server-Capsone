const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const config = require("./config");
// const userRoutes = require('./routes/userRoutes');
const routes = require("./routes");
const userRoutes = require("./routes/userRoutes");
const manifestRoutes = require("./routes/manifestRoutes");
const homeRoutes = require("./routes/homeRoutes");
const companyListingRoutes = require("./routes/companyListingRoutes");
const announcementRoutes = require("./routes/announcementRoutes");
const accountRoutes = require("./routes/accountRoutes");
const documentRoutes = require("./routes/documentRoutes");
const moadssRoutes = require("./routes/moadssRoutes");
const jobMatchingRoutes = require("./routes/jobMatchingRoutes");
const companyEvalsRoutes = require("./routes/companyEvalsRoutes");
const termRoutes = require("./routes/termRoutes");
const coorTurnoverRoutes = require("./routes/coorTurnoverRoutes");
const inboxRoutes = require("./routes/inboxRoutes");

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

app.use("/", routes);

app.use("/user", userRoutes);
app.use("/manifest", manifestRoutes);
app.use("/home", homeRoutes);
app.use("/companylisting", companyListingRoutes);

app.use("/announcements", announcementRoutes);
app.use("/account", accountRoutes);
app.use("/document", documentRoutes);
app.use("/moaDSS", moadssRoutes);
app.use("/jobMatching", jobMatchingRoutes);
app.use("/companyEvaluations", companyEvalsRoutes);
app.use("/term", termRoutes);
app.use("/coorAccts", coorTurnoverRoutes);
app.use("/inbox", inboxRoutes);

app.listen(config.port || 2000, () => {
  console.log(`Listening on port ${config.port || 2000}`);
});
