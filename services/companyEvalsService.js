const { google } = require("googleapis");
const fs = require("fs");

const SERVICE_ACCOUNT_KEY_FILE = "./sheetsAccountKey.json";
const RESPONSES_SHEET_ID = "1-kOscezmiqWkWtQ1eEy1yjMYmQLu3EoRbX7RwCe_yVc";

const db = require("../db");

exports.getPostDeployCount = async (term) => {
  const query = `
    SELECT COALESCE(COUNT(*), 0) AS post_deployment_interns
    FROM practrack."Students"
    WHERE "ojtPhase" = 'Post-Deployment'
    OR "ojtPhase" = 'Completed'
    AND "AcademicTerm" = $1;
  `;
  const params = [term];
  const { rows } = await db.query(query, params);
  return rows[0];
};

exports.getEvalStats = async (term) => {
  // For Line Chart and Table
  // Chart = Show last 9 terms only
  // Table = Show lifetime data
  // Batch, Evaluation Count

  // Get current batch
  const query = `
    SELECT value
    FROM practrack."Lookup"
    WHERE "lookupID" =$1;
  `;
  const params = [term];
  const { rows } = await db.query(query, params);
  const value = rows[0].value; // format: AYXX-XX TX
  const currentAY = value.slice(5);
  const currentTerm = value.slice(value.length - 1);

  try {
    // Load service account credentials from the JSON key file
    const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_KEY_FILE));

    // Create an OAuth2 client with the credentials
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Obtain an authorized Google Sheets API client
    const sheets = google.sheets({ version: "v4", auth });

    // Fetch the data from the Google Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: RESPONSES_SHEET_ID,
      range: "Form Responses 1!F:H",
    });

    const values = response.data.values;

    // Assign each value in every row to its designated column
    const json = values.map((row) => {
      return {
        degree: row[0],
        term: row[1],
        year: row[2],
      };
    });

    // Drop the first row
    const rows = json.slice(1);

    // Filter based on degree
    const filterByDegree = rows.filter((row) => {
      const degree = row.degree;
      return degree.endsWith("CSE") || degree.endsWith("NIS");
    });

    // Get earliest year
    const startYear = filterByDegree.reduce((minYear, row) => {
      const parts = row.year.split(" "); // Separate "AY" from "XXXX-XXXX" (format: AY XXXX-XXXX)
      const years = parts[1].split("-"); // Separate the two years
      const currentYear = parseInt(years[0].slice(2), 10); // Store the first year (since it is the lower year)
      return minYear === null || currentYear < minYear ? currentYear : minYear; // Save currentYear as new minYear if it is lower than existing minYear
    }, null);

    // Get earliest term
    const startTerm = filterByDegree.reduce((minTerm, row) => {
      const currentTerm = parseInt(row.term.slice(5), 10); // Store the current term
      return minTerm === null || currentTerm < minTerm ? currentTerm : minTerm; // Save currentTerm as new minTerm if it is lower than existing minTerm
    }, null);

    // Get latest year and term (based on currentAY and currentTerm)
    const endYear = parseInt(currentAY, 10);
    const endTerm = parseInt(currentTerm, 10);
    let lastTerm = 3;

    // Create AYXX-XX TX keys
    const allKeys = [];
    for (let year = startYear; year < endYear; year++) {
      if (year === endYear - 1) {
        lastTerm = endTerm;
      }
      for (let term = startTerm; term <= lastTerm; term++) {
        const key = `AY${year.toString()}-${(
          year + 1
        ).toString()} T${term.toString()}`;
        allKeys.push(key);
      }
    }

    // Create groups based on the keys
    const grouped = {};
    for (const key of allKeys) {
      grouped[key] = 0; // Initial count per group
    }

    // Count rows per group
    filterByDegree.forEach((row) => {
      const year = row.year;
      const term = row.term;
      const key = `AY${year.slice(5, 7)}-${year.slice(10)} T${term.slice(5)}`; // format: AYXX-XX TX

      grouped[key]++; // Increment count
    });

    // Sort groups in descending order
    const sorted = Object.entries(grouped)
      .sort((a, b) => {
        return b[0].localeCompare(a[0]);
      })
      .reduce((sort, [key, value]) => {
        sort[key] = value;
        return sort;
      }, {});

    // Reformat
    const formatted = {
      stats: Object.entries(sorted).map(([acadTerm, count]) => ({
        acadTerm,
        count,
      })),
    };

    return formatted;
  } catch (error) {
    throw error;
  }
};

exports.getEvalScores = async () => {
  // For Donut Charts
  // Relevance, Scope of Work, Career Development

  try {
    // Load service account credentials from the JSON key file
    const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_KEY_FILE));

    // Create an OAuth2 client with the credentials
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Obtain an authorized Google Sheets API client
    const sheets = google.sheets({ version: "v4", auth });

    // Fetch the data from the Google Sheet
    const resRelevance = await sheets.spreadsheets.values.get({
      spreadsheetId: RESPONSES_SHEET_ID,
      range: "Summarization!F2:F",
    });

    const resScope = await sheets.spreadsheets.values.get({
      spreadsheetId: RESPONSES_SHEET_ID,
      range: "Summarization!M2:M",
    });

    const resDev = await sheets.spreadsheets.values.get({
      spreadsheetId: RESPONSES_SHEET_ID,
      range: "Summarization!Z2:Z",
    });

    // Get grades
    const rValues = resRelevance.data.values;
    const rMap = rValues.map((row) => Number(row[0]));
    const rSum = rMap.reduce((sum, value) => sum + value, 0);
    const rAve = rSum / rMap.length;
    const relevance = Number(((rAve / 4) * 100).toFixed(2));

    const sValues = resScope.data.values;
    const sMap = sValues.map((row) => Number(row[0]));
    const sSum = sMap.reduce((sum, value) => sum + value, 0);
    const sAve = sSum / sMap.length;
    const scope = Number(((sAve / 4) * 100).toFixed(2));

    const dValues = resDev.data.values;
    const dMap = dValues.map((row) => Number(row[0]));
    const dSum = dMap.reduce((sum, value) => sum + value, 0);
    const dAve = dSum / dMap.length;
    const dev = Number(((dAve / 4) * 100).toFixed(2));

    const grades = [relevance, scope, dev];
    return grades;
  } catch (error) {
    throw error;
  }
};

exports.getEvalCounts = async (term) => {
  // For Evaluation Respondents
  // Length of results = Number of answered evaluations
  // Result of getPostDeployCount - Length of results = Number of unanswered evaluations

  // Get current batch
  const query = `
    SELECT value
    FROM practrack."Lookup"
    WHERE "lookupID" = $1;
  `;
  const params = [term];
  const { rows } = await db.query(query, params);
  const value = rows[0].value; // format: AYXX-XX TX
  const currentAY = value.slice(5, 7);
  const currentTerm = value.slice(value.length - 1);

  try {
    // Load service account credentials from the JSON key file
    const credentials = JSON.parse(fs.readFileSync(SERVICE_ACCOUNT_KEY_FILE));

    // Create an OAuth2 client with the credentials
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Obtain an authorized Google Sheets API client
    const sheets = google.sheets({ version: "v4", auth });

    // Fetch the data from the Google Sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: RESPONSES_SHEET_ID,
      range: "Form Responses 1!F:H",
    });

    const values = response.data.values;

    // Assign each value in every row to its designated column
    const json = values.map((row) => {
      return {
        degree: row[0],
        term: row[1],
        year: row[2],
      };
    });

    // Drop the first row
    const rows = json.slice(1);

    // Filter based on degree
    const filterByDegree = rows.filter((row) => {
      const degree = row.degree;
      return degree.endsWith("CSE") || degree.endsWith("NIS");
    });

    // Filter based on year
    const filterByYear = filterByDegree.filter((row) => {
      const year = row.year;
      return year.endsWith(currentAY);
    });

    // Filter based on term
    const filterByTerm = filterByYear.filter((row) => {
      const term = row.term;
      return term.endsWith(currentTerm);
    });

    return filterByTerm.length; // Number of answered evaluations
  } catch (error) {
    throw error;
  }
};
