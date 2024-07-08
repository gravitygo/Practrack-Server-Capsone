const { google } = require("googleapis");
const AHP = require("ahp");
const fs = require("fs");
const db = require("../db");
const SERVICE_ACCOUNT_KEY_FILE = "./sheetsAccountKey.json";
const RESPONSES_SHEET_ID = "1-kOscezmiqWkWtQ1eEy1yjMYmQLu3EoRbX7RwCe_yVc";

exports.computeDSSConfigure = async ({
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

exports.computeDSS = async ({ companies, coorConfig }) => {
  const items = ["yes", "no"];
  const criteria = ["relevance", "scope", "career"];
  const dssArray = [];
  // const companylist = Object.keys(itemranks); // Extract company names
  const ahpContext = new AHP();
  const itemranks = [];
  const criteriaranks = [];
  const preferredCriteria = [];

  // Transforming coor config into itemranks, criteriaranks, and preferredCriteria
  const questions = [coorConfig[0].q1, coorConfig[0].q2, coorConfig[0].q3];
  const criteriaPair = [];
  // Setting preferred criteria
  // Q1: Relevance vs Scope of Work
  if (questions[0].charAt(0) == "a" || questions[0] == "e") {
    criteriaPair.push(["relevance", "scope"]);
  } else if (questions[0].charAt(0) == "b") {
    criteriaPair.push(["scope", "relevance"]);
  }
  // Q2: Relevance vs Career Development
  if (questions[1].charAt(0) == "a" || questions[1] == "e") {
    criteriaPair.push(["relevance", "career"]);
  } else if (questions[1].charAt(0) == "b") {
    criteriaPair.push(["career", "relevance"]);
  }
  // Q3: Scope of Work vs Career Development
  if (questions[2].charAt(0) == "a" || questions[2] == "e") {
    criteriaPair.push(["scope", "career"]);
  } else if (questions[2].charAt(0) == "b") {
    criteriaPair.push(["career", "scope"]);
  }
  preferredCriteria.push(criteriaPair);

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

  // Converting company data into item ranks
  // [A <= 3.01]		    1 indicates equal importance
  // [3.01 < A <= 3.34]	3 indicates moderate importance
  // [3.34 < A <= 3.67]	5 indicates strong importance
  // [3.67 < A <= 3.8]	7 indicates very strong importance
  // [3.8 < A <= 4]		  9 indicates extreme importance
  for (let i = 0; i < companies.length; i++) {
    var perCompanyItemRanks = [];
    var key = companies[i][0];
    itemranks[key] = [];
    // relevance
    if (companies[i][5]) {
      var val = companies[i][5];
      if (val > 3.8) {
        perCompanyItemRanks.push(9);
      } else if (val <= 3.8 && val > 3.67) {
        perCompanyItemRanks.push(7);
      } else if (val <= 3.67 && val > 3.34) {
        perCompanyItemRanks.push(5);
      } else if (val <= 3.34 && val > 3.01) {
        perCompanyItemRanks.push(3);
      } else if (val <= 3.01) {
        perCompanyItemRanks.push(1);
      }
    }
    // scope
    if (companies[i][12]) {
      var val = companies[i][12];
      if (val > 3.8) {
        perCompanyItemRanks.push(9);
      } else if (val <= 3.8 && val > 3.67) {
        perCompanyItemRanks.push(7);
      } else if (val <= 3.67 && val > 3.34) {
        perCompanyItemRanks.push(5);
      } else if (val <= 3.34 && val > 3.01) {
        perCompanyItemRanks.push(3);
      } else if (val <= 3.01) {
        perCompanyItemRanks.push(1);
      }
    }
    // career
    if (companies[i][25]) {
      var val = companies[i][25];
      if (val > 3.8) {
        perCompanyItemRanks.push(9);
      } else if (val <= 3.8 && val > 3.67) {
        perCompanyItemRanks.push(7);
      } else if (val <= 3.67 && val > 3.34) {
        perCompanyItemRanks.push(5);
      } else if (val <= 3.34 && val > 3.01) {
        perCompanyItemRanks.push(3);
      } else if (val <= 3.01) {
        perCompanyItemRanks.push(1);
      }
    }
    itemranks[key].push(perCompanyItemRanks);
  }
  // Iterate per company
  for (let company of companies) {
    ahpContext.addItems(items);
    ahpContext.addCriteria(criteria);

    // Set item ranks
    ahpContext.rankCriteriaItem(criteria[0], [
      [items[0], items[1], itemranks[company[0]][0][0]],
    ]);
    ahpContext.rankCriteriaItem(criteria[1], [
      [items[0], items[1], itemranks[company[0]][0][1]],
    ]);
    ahpContext.rankCriteriaItem(criteria[2], [
      [items[0], items[1], itemranks[company[0]][0][2]],
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
    this.saveDSSResult(company[0], res);
    dssArray.push({ [company[0]]: dss });
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

exports.getCoorConfig = async ({ coorID }) => {
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
      range: "Summarization!A2:Z",
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
      range: "Summarization!A2:Z",
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
      range: "Form Responses 1!F:I",
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

  const soloItemranks = [];
  const soloCriteriaranks = [];
  const solopreferredCriteria = [];

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
  const soloQuestions = [q1, q2, q3];

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
    range: "Summarization!A2:Z",
  });
  const soloCompanies = response.data.values;

  // Get item ranks only for the selected company
  for (let i = 0; i < soloCompanies.length; i++) {
    var key = soloCompanies[i][0];
    if (key === companyStr) {
      // relevance
      if (soloCompanies[i][6]) {
        var val = soloCompanies[i][6];
        if (val > 3.8) {
          soloItemranks.push(9);
        } else if (val <= 3.8 && val > 3.67) {
          soloItemranks.push(7);
        } else if (val <= 3.67 && val > 3.34) {
          soloItemranks.push(5);
        } else if (val <= 3.34 && val > 3.01) {
          soloItemranks.push(3);
        } else if (val <= 3.01) {
          soloItemranks.push(1);
        }
      }
      // scope
      if (soloCompanies[i][12]) {
        var val = soloCompanies[i][12];
        if (val > 3.8) {
          soloItemranks.push(9);
        } else if (val <= 3.8 && val > 3.67) {
          soloItemranks.push(7);
        } else if (val <= 3.67 && val > 3.34) {
          soloItemranks.push(5);
        } else if (val <= 3.34 && val > 3.01) {
          soloItemranks.push(3);
        } else if (val <= 3.01) {
          soloItemranks.push(1);
        }
      }
      // career
      if (soloCompanies[i][25]) {
        var val = soloCompanies[i][25];
        if (val > 3.8) {
          soloItemranks.push(9);
        } else if (val <= 3.8 && val > 3.67) {
          soloItemranks.push(7);
        } else if (val <= 3.67 && val > 3.34) {
          soloItemranks.push(5);
        } else if (val <= 3.34 && val > 3.01) {
          soloItemranks.push(3);
        } else if (val <= 3.01) {
          soloItemranks.push(1);
        }
      }
      break;
    }
  }

  // Get preferred criteria

  // Q1: Relevance vs Scope of Work
  if (q1.charAt(0) == "a" || q1 == "e") {
    solopreferredCriteria.push(["relevance", "scope"]);
  } else if (q1.charAt(0) == "b") {
    solopreferredCriteria.push(["scope", "relevance"]);
  }
  // Q2: Relevance vs Career Development
  if (q2.charAt(0) == "a" || q2 == "e") {
    solopreferredCriteria.push(["relevance", "career"]);
  } else if (q2.charAt(0) == "b") {
    solopreferredCriteria.push(["career", "relevance"]);
  }
  // Q3: Scope of Work vs Career Development
  if (q3.charAt(0) == "a" || q3 == "e") {
    solopreferredCriteria.push(["scope", "career"]);
  } else if (q3.charAt(0) == "b") {
    solopreferredCriteria.push(["career", "scope"]);
  }

  // Converting question answers into criteria ranks
  soloQuestions.forEach((q) => {
    if (q == "a9b" || q == "b9a") {
      soloCriteriaranks.push(9);
    } else if (q == "a7b" || q == "b7a") {
      soloCriteriaranks.push(7);
    } else if (q == "a5b" || q == "b5a") {
      soloCriteriaranks.push(5);
    } else if (q == "a3b" || q == "b3a") {
      soloCriteriaranks.push(3);
    } else if (q == "e") {
      soloCriteriaranks.push(1);
    }
  });

  // AHP
  ahpContext.addItems(items);
  ahpContext.addCriteria(criteria);

  // Set item ranks
  ahpContext.rankCriteriaItem(criteria[0], [
    [items[0], items[1], soloItemranks[0]],
  ]);
  ahpContext.rankCriteriaItem(criteria[1], [
    [items[0], items[1], soloItemranks[1]],
  ]);
  ahpContext.rankCriteriaItem(criteria[2], [
    [items[0], items[1], soloItemranks[2]],
  ]);

  // Set criteria ranks
  ahpContext.rankCriteria([
    [
      solopreferredCriteria[0][0],
      solopreferredCriteria[0][1],
      soloCriteriaranks[0],
    ],
    [
      solopreferredCriteria[1][0],
      solopreferredCriteria[1][1],
      soloCriteriaranks[1],
    ],
    [
      solopreferredCriteria[2][0],
      solopreferredCriteria[2][1],
      soloCriteriaranks[2],
    ],
  ]);

  // Execute AHP process
  dss = ahpContext.run();
  return dss;
};
