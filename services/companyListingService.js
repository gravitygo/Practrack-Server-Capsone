//companyListingService
const db = require("../db");

//Job Matching Profile
exports.viewAccount = async ({ userID }) => {
  const query = `
    SELECT "u".*, "s".*, "f".*
    FROM "practrack"."Users" "u"
    JOIN "practrack"."Students" "s" ON "u"."userID" = "s"."userID"
    LEFT JOIN "practrack"."FieldOfInterest" "f" ON "s"."fieldID" = "f"."fieldID"
    WHERE "u"."userID" = $1`;
  const params = [userID];
  const { rows } = await db.query(query, params);
  return rows;
};

//addCompany INSERT to DB /* Note: Still can't fix the timezone
exports.addCompany = async ({
  companyName,
  pointOfContact,
  companyAddress,
  natureOfCompany,
  effectivityEndDate,
  isActivePartner,
  createdBy,
  addrRegion,
  addrProvince,
  addrCity,
  jobPositions,
  workSetup,
}) => {
  const query = `
    INSERT INTO "practrack"."CompanyList" (
      "companyName",
      "pointOfContact",
      "companyAddress",
      "natureOfCompany",
      "effectivityEndDate",
      "isActivePartner",
      "createdBy",
      "dateCreated",
      "addrRegion",
      "addrProvince",
      "addrCity",
      "workSetup"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, now(), $8, $9, $10, $11);
  `;

  const params = [
    companyName,
    pointOfContact,
    companyAddress,
    natureOfCompany,
    effectivityEndDate,
    isActivePartner,
    createdBy,
    addrRegion,
    addrProvince,
    addrCity,
    workSetup,
  ];

  const { rows: insertedCompany } = await db.query(query, params);

  const insertedJobs = [];
  if (!Array.isArray(jobPositions)) {
    jobPositions = [jobPositions];
  }

  for (const jobPosition of jobPositions) {
    const query2 = `
        INSERT INTO "practrack"."CompanyJobs" (
          "companyName",
          "jobID"
        )
        VALUES ($1, $2);
      `;

    const params2 = [companyName, jobPosition];

    const { rows } = await db.query(query2, params2);
    insertedJobs.push(rows[0]); // Assuming only one row is inserted per iteration
  }

  return { insertedCompany, insertedJobs };
};

//TO UPDATE: No workSetup yet
exports.viewCompanyModal = async ({ companyID }) => {
  const query = `
  SELECT * 
  FROM "practrack"."CompanyList" "c"
  LEFT JOIN (
    SELECT  
    "cj"."companyName",
    jsonb_agg(
        jsonb_build_object(
          'jobTitle', "jl"."jobTitle",
          'jobID', "cj"."jobID"
        ) ORDER BY "cj"."companyName"
    ) AS "jobList"
    FROM   "practrack"."CompanyJobs" "cj"
    JOIN
    "practrack"."JobList" "jl" ON "cj"."jobID" = "jl"."jobID"
    GROUP by "cj"."companyName"
    ) "cj" ON "cj"."companyName" = "c"."companyName"
  WHERE
    "companyID" = $1;`;
  const params = [companyID];
  const { rows } = await db.query(query, params);
  return rows;
};

// UPDATE edited company details to DB
exports.saveCompany = async ({
  companyID,
  companyName,
  pointOfContact,
  companyAddress,
  natureOfCompany,
  effectivityEndDate,
  isActivePartner,
  createdBy,
  addrRegion,
  addrProvince,
  addrCity,
  jobPositions,
  workSetup,
}) => {
  const query = `
    UPDATE "practrack"."CompanyList"
    SET "companyName" = $1,
        "pointOfContact" = $2,
        "companyAddress" = $3,
        "natureOfCompany" = $4,
        "isActivePartner" = $5,
        "effectivityEndDate" = $6,
        "lastEditedBy" = $7,
        "dateLastEdited" = now(),
        "addrRegion" = $8,
        "addrProvince" = $9,
        "addrCity" = $10,
        "workSetup" = $11
    WHERE "companyID" = $12;
  `;
  const params = [
    companyName,
    pointOfContact,
    companyAddress,
    natureOfCompany,
    isActivePartner,
    effectivityEndDate,
    createdBy,
    addrRegion,
    addrProvince,
    addrCity,
    workSetup,
    companyID,
  ];

  // Deleting first all preexisting jobs
  const deleteQuery = `
  DELETE FROM "practrack"."CompanyJobs"
  WHERE
    "companyName" = $1;`;

  const deleteParams = [companyName];

  const { rows: row1 } = await db.query(query, params);
  const { rows: row2 } = await db.query(deleteQuery, deleteParams);

  // Reinserting updated jobs
  const insertedJobs = [];
  if (!Array.isArray(jobPositions)) {
    jobPositions = [jobPositions];
  }

  for (const jobPosition of jobPositions) {
    const query2 = `
        INSERT INTO "practrack"."CompanyJobs" (
          "companyName",
          "jobID"
        )
        VALUES ($1, $2);
      `;

    const params2 = [companyName, jobPosition];

    const { rows } = await db.query(query2, params2);
    insertedJobs.push(rows[0]); // Assuming only one row is inserted per iteration
  }

  return { row1, row2, insertedJobs };
};

// DELETE query for company
exports.deleteCompany = async ({ companyID, uid }) => {
  const query = `
    DELETE FROM "practrack"."CompanyList"
    WHERE
      "companyID" = $1;
  `;
  const query2 = `
  DELETE FROM "practrack"."CompanyJobs" "cj"
  USING "practrack"."CompanyList" "cl"
  WHERE "cj"."companyName" = "cl"."companyName"
  AND "cl"."companyID" = $1;
  `;
  const params = [companyID];

  const audit_query = `
  UPDATE "practrack"."audit_CompanyList"
  SET "changeUserID" = $1
  WHERE "companyID" = $2
  AND "changeType" = 'DELETE'; 
  `;
  const audit_params = [uid, companyID];

  const { rows: row2 } = await db.query(query2, params);
  const { rows: row1 } = await db.query(query, params);
  await db.query(audit_query, audit_params);

  return { row1, row2 };
};

// GET company details from DB
exports.viewCompanyList = async () => {
  const query = `
  SELECT
    "c".*,  
    "l"."value" AS workSetupStr,
    "f"."fieldName" AS natureOfCompanyStr,
    TO_CHAR("c"."effectivityEndDate", 'Mon DD, YYYY') AS "formattedEffectivityEndDate",
    jsonb_build_object('jobs', "cj"."jobList") AS jobs
  FROM
    "practrack"."CompanyList" "c"
  LEFT JOIN (
    SELECT  
    "cj"."companyName",
    jsonb_agg(
        jsonb_build_object(
          'jobTitle', "jl"."jobTitle",
          'jobID', "cj"."jobID"
        ) ORDER BY "cj"."companyName"
    ) AS "jobList"
    FROM   "practrack"."CompanyJobs" "cj"
    JOIN
    "practrack"."JobList" "jl" ON "cj"."jobID" = "jl"."jobID"
    GROUP by "cj"."companyName"
    ) "cj" ON "cj"."companyName" = "c"."companyName"
  LEFT JOIN
    "practrack"."FieldOfInterest" "f" ON "c"."natureOfCompany" = "f"."fieldID"
  JOIN
    "practrack"."Lookup" "l" ON "c"."workSetup" = "l"."lookupID"
  ORDER BY
    "c"."companyName" ASC`;
  const { rows } = await db.query(query);
  return rows;
};

exports.viewNatureOfCompany = async () => {
  const query = `
  SELECT *
  FROM "practrack"."FieldOfInterest"`;
  const { rows } = await db.query(query);
  return rows;
};

exports.viewJobList = async () => {
  const query = `
  SELECT *
  FROM "practrack"."JobList"`;
  const { rows } = await db.query(query);
  return rows;
};

exports.viewWorkSetup = async () => {
  const query = `
  SELECT *
FROM "practrack"."Lookup"
WHERE "type" = 'workSetup';`;
  const { rows } = await db.query(query);
  return rows;
};
