const db = require("../db");
const fs = require("fs");
const { google } = require("googleapis");
const SERVICE_ACCOUNT_KEY_FILE = "./sheetsAccountKey.json";
const RESPONSES_SHEET_ID = "14WCeU_Jew4H3BqADMQ7_qG8okjkQywSzdf99jO1v-ok";

exports.getCompanySheets = async () => {
  try {
    const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_KEY_FILE));
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: RESPONSES_SHEET_ID,
      range: "Summarization!A2:M",
    });

    const companies = response.data.values;
    return companies;
  } catch (error) {
    throw error;
  }
};

exports.getCompanyDB = async () => {
  const query = `SELECT "c".*, "l"."value" AS worksetupstr
  FROM "practrack"."CompanyList" "c"
   LEFT JOIN 
      "practrack"."Lookup" "l" ON "c"."workSetup" = "l"."lookupID"
  WHERE "dssAveRating" IS NOT NULL;`;
  const { rows } = await db.query(query);
  return rows;
};

exports.getStudentDB = async () => {
  const query = `
    SELECT "s".*, "u"."lastName", "u"."firstName", "f"."fieldName"
    FROM 
        "practrack"."Students" "s"
    JOIN 
        "practrack"."Users" "u" ON "s"."userID" = "u"."userID"
    LEFT JOIN 
        "practrack"."FieldOfInterest" "f" ON "s"."fieldID" = "f"."fieldID"          
    WHERE 
        "ojtPhase" = 'Pre-Deployment'
    ORDER BY 
      "u"."lastName" ASC`;
  const { rows } = await db.query(query);
  return rows;
};
