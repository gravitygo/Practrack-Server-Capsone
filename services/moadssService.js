const { google } = require("googleapis");
const AHP = require("ahp");
const fs = require("fs");
const db = require("../db");
const SERVICE_ACCOUNT_KEY_FILE = "./sheetsAccountKey.json";
const RESPONSES_SHEET_ID = "14WCeU_Jew4H3BqADMQ7_qG8okjkQywSzdf99jO1v-ok";

exports.computeDSS = async ({
  itemranks,
  criteriaranks,
  preferredCriteria,
}) => {
  const items = ["yes", "no"];
  const criteria = ["relevance", "scope", "career"];
  const dssArray = [];
  const companies = Object.keys(itemranks); // Extract company names
  const ahpContext = new AHP();

  // Iterate per company
  for (let company of companies) {
    ahpContext.addItems(items);
    ahpContext.addCriteria(criteria);

    // Set item ranks
    ahpContext.rankCriteriaItem(criteria[0], [
      [items[0], items[1], itemranks[company][0][0]],
    ]);
    ahpContext.rankCriteriaItem(criteria[1], [
      [items[0], items[1], itemranks[company][0][1]],
    ]);
    ahpContext.rankCriteriaItem(criteria[2], [
      [items[0], items[1], itemranks[company][0][2]],
    ]);

    // Set criteria ranks
    ahpContext.rankCriteria([
      [
        preferredCriteria[0][0][0],
        preferredCriteria[0][0][1],
        criteriaranks[0],
      ],
      [
        preferredCriteria[0][1][0],
        preferredCriteria[0][1][1],
        criteriaranks[1],
      ],
      [
        preferredCriteria[0][2][0],
        preferredCriteria[0][2][1],
        criteriaranks[2],
      ],
    ]);

    // Execute AHP process
    dss = ahpContext.run();
    var res = dss.rankedScoreMap.yes;
    this.saveDSSResult(company, res);

    dssArray.push({ [company]: dss });
  }
  return dssArray;
};

exports.saveDSSResult = async (company, dss) => {
  const query = `UPDATE "practrack"."CompanyList"
    SET "dssAveRating" = $1
    WHERE "companyName" = $2`;
  const params = [dss, company];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.viewMOA = async ({ coorID }) => {
  const query = `SELECT *
   FROM "practrack"."MOAConfiguration"
   WHERE "coorID" = $1`;
  const params = [coorID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.saveConfig = async ({ coorID, q1, q2, q3 }) => {
  const query = `UPDATE "practrack"."MOAConfiguration"
    SET "q1" = $1,
        "q2" = $2,
        "q3" = $3
    WHERE "coorID" = $4`;
  const params = [q1, q2, q3, coorID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getCompaniesDB = async () => {
  const query = `SELECT *,  TO_CHAR("effectivityEndDate", 'Mon DD, YYYY') AS "formattedEffectivityEndDate"
  FROM "practrack"."CompanyList"
  WHERE "dssAveRating" IS NOT NULL
 ORDER BY LOWER("companyName") ASC`;
  const { rows } = await db.query(query);
  return rows;
};

exports.getCompanies = async () => {
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
      range: "Summarization!A2:M",
    });

    // Extract company names from the response
    const companies = response.data.values;
    // const companies = values.map((row) => row[0]);

    return companies;
  } catch (error) {
    throw error;
  }
};

exports.getRowDB = async ({ companyStr }) => {
  const query = ` SELECT *,  TO_CHAR("effectivityEndDate", 'Mon DD, YYYY') AS "formattedEffectivityEndDate"
  FROM "practrack"."CompanyList"
  WHERE "companyName" = $1 `;
  const params = [companyStr];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getRow = async ({ companyStr }) => {
  try {
    var company = [];
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
      range: "Summarization!A2:M",
    });

    // Extract company names from the response
    const companies = response.data.values;
    for (i = 0; i < companies.length; i++) {
      const row = companies[i][0];
      if (row === companyStr) {
        company = companies[i];
        break;
      }
    }

    return company;
  } catch (error) {
    throw error;
  }
};

exports.getSurveyCounts = async ({ companyStr }) => {
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
    const resCounts = await sheets.spreadsheets.values.get({
      spreadsheetId: RESPONSES_SHEET_ID,
      range: "Form Responses 1!E:H",
    });
    const values = resCounts.data.values;

    // Assign each value in every row to its designated column
    const json = values.map((row) => {
      return {
        degree: row[0],
        term: row[1],
        year: row[2],
        company: row[3],
      };
    });

    // Drop the first row
    const countRows = json.slice(1);

    // Filter based on company
    const filterByCompany = countRows.filter((row) => {
      const company = row.company;
      return company === companyStr;
    });

    // Filter based on degree
    const CSE = filterByCompany.filter((row) => {
      const degree = row.degree;
      return degree.endsWith("CSE");
    });

    const NIS = filterByCompany.filter((row) => {
      const degree = row.degree;
      return degree.endsWith("NIS");
    });

    const counts = [CSE.length, NIS.length, CSE.length + NIS.length];

    return counts;
  } catch (error) {
    throw error;
  }
};

exports.getSoloDSS = async ({ companyStr, uid }) => {
  const items = ["yes", "no"];
  const criteria = ["relevance", "scope", "career"];
  const ahpContext = new AHP();

  const itemranks = [];
  const criteriaranks = [];
  const preferredCriteria = [];

  // Get coor's config
  const query = `SELECT *
   FROM "practrack"."MOAConfiguration"
   WHERE "coorID" = $1`;
  const params = [uid];
  const { rows: rows } = await db.query(query, params);
  const config = rows[0];

  const q1 = config.q1;
  const q2 = config.q2;
  const q3 = config.q3;
  const questions = [q1, q2, q3];

  // Get item ranks

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
    range: "Summarization!A2:M",
  });
  const companies = response.data.values;

  // Get item ranks only for the selected company
  for (let i = 0; i < companies.length; i++) {
    var key = companies[i][0];
    if (key === companyStr) {
      // relevance
      if (companies[i][6]) {
        var val = companies[i][6];
        if (val > 3.8) {
          itemranks.push(9);
        } else if (val <= 3.8 && val > 3.67) {
          itemranks.push(7);
        } else if (val <= 3.67 && val > 3.34) {
          itemranks.push(5);
        } else if (val <= 3.34 && val > 3.01) {
          itemranks.push(3);
        } else if (val <= 3.01) {
          itemranks.push(1);
        }
      }
      // scope
      if (companies[i][10]) {
        var val = companies[i][10];
        if (val > 3.8) {
          itemranks.push(9);
        } else if (val <= 3.8 && val > 3.67) {
          itemranks.push(7);
        } else if (val <= 3.67 && val > 3.34) {
          itemranks.push(5);
        } else if (val <= 3.34 && val > 3.01) {
          itemranks.push(3);
        } else if (val <= 3.01) {
          itemranks.push(1);
        }
      }
      // career
      if (companies[i][12]) {
        var val = companies[i][12];
        if (val > 3.8) {
          itemranks.push(9);
        } else if (val <= 3.8 && val > 3.67) {
          itemranks.push(7);
        } else if (val <= 3.67 && val > 3.34) {
          itemranks.push(5);
        } else if (val <= 3.34 && val > 3.01) {
          itemranks.push(3);
        } else if (val <= 3.01) {
          itemranks.push(1);
        }
      }
      break;
    }
  }

  // Get preferred criteria

  // Q1: Relevance vs Scope of Work
  if (q1.charAt(0) == "a" || q1 == "e") {
    preferredCriteria.push(["relevance", "scope"]);
  } else if (q1.charAt(0) == "b") {
    preferredCriteria.push(["scope", "relevance"]);
  }
  // Q2: Relevance vs Career Development
  if (q2.charAt(0) == "a" || q2 == "e") {
    preferredCriteria.push(["relevance", "career"]);
  } else if (q2.charAt(0) == "b") {
    preferredCriteria.push(["career", "relevance"]);
  }
  // Q3: Scope of Work vs Career Development
  if (q3.charAt(0) == "a" || q3 == "e") {
    preferredCriteria.push(["scope", "career"]);
  } else if (q3.charAt(0) == "b") {
    preferredCriteria.push(["career", "scope"]);
  }

  // Converting question answers into criteria ranks
  questions.forEach((q) => {
    if (q == "a9b" || q == "b9a") {
      criteriaranks.push(9);
    } else if (q == "a7b" || q == "b7a") {
      criteriaranks.push(7);
    } else if (q == "a5b" || q == "b5a") {
      criteriaranks.push(5);
    } else if (q == "a3b" || q == "b3a") {
      criteriaranks.push(3);
    } else if (q == "e") {
      criteriaranks.push(1);
    }
  });

  // AHP
  ahpContext.addItems(items);
  ahpContext.addCriteria(criteria);

  // Set item ranks
  ahpContext.rankCriteriaItem(criteria[0], [
    [items[0], items[1], itemranks[0]],
  ]);
  ahpContext.rankCriteriaItem(criteria[1], [
    [items[0], items[1], itemranks[1]],
  ]);
  ahpContext.rankCriteriaItem(criteria[2], [
    [items[0], items[1], itemranks[2]],
  ]);

  // Set criteria ranks
  ahpContext.rankCriteria([
    [preferredCriteria[0][0], preferredCriteria[0][1], criteriaranks[0]],
    [preferredCriteria[1][0], preferredCriteria[1][1], criteriaranks[1]],
    [preferredCriteria[2][0], preferredCriteria[2][1], criteriaranks[2]],
  ]);

  // Execute AHP process
  dss = ahpContext.run();

  /*
  console.log(itemranks);
  console.log(preferredCriteria);
  console.log(criteriaranks);
  console.log(dss);*/
  return dss;
};
