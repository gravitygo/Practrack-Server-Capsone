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
  hasAllowance,
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
      "workSetup",
      "hasAllowance"
    )
    VALUES ($1, $2, $3, $4, $5 AT TIME ZONE 'Asia/Singapore', $6, $7, now(), $8, $9, $10, $11, $12);
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
    hasAllowance,
  ];

  const { rows: insertedCompany } = await db.query(query, params);

  // Select CompanyID
  const getID = `
    SELECT *
    FROM practrack."CompanyList"
    ORDER BY "companyID" DESC
    LIMIT 1;`;

  const { rows: cid } = await db.query(getID);
  const companyID = cid[0].companyID;

  const insertedJobs = [];
  if (!Array.isArray(jobPositions)) {
    jobPositions = [jobPositions];
  }

  for (const jobPosition of jobPositions) {
    const query2 = `
        INSERT INTO "practrack"."CompanyJobs" (
          "companyID",
          "jobID"
        )
        VALUES ($1, $2);
      `;

    const params2 = [companyID, jobPosition];

    const { rows } = await db.query(query2, params2);
    insertedJobs.push(rows[0]); // Assuming only one row is inserted per iteration
  }

  return { insertedCompany, insertedJobs };
};

exports.viewCompanyModal = async ({ companyID }) => {
  const query = `
  SELECT * 
  FROM "practrack"."CompanyList" "c"
  LEFT JOIN (
    SELECT  
    "cj"."companyID",
    jsonb_agg(
        jsonb_build_object(
          'jobTitle', "jl"."jobTitle",
          'jobID', "cj"."jobID"
        ) ORDER BY "cj"."companyID"
    ) AS "jobList"
    FROM   "practrack"."CompanyJobs" "cj"
    JOIN
    "practrack"."JobList" "jl" ON "cj"."jobID" = "jl"."jobID"
    GROUP by "cj"."companyID"
    ) "cj" ON "cj"."companyID" = "c"."companyID"
  WHERE
    "c"."companyID" = $1;`;
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
  hasAllowance,
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
        "workSetup" = $11,
        "hasAllowance" = $13
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
    hasAllowance,
  ];

  // Deleting first all preexisting jobs
  const deleteQuery = `
  DELETE FROM "practrack"."CompanyJobs"
  WHERE
    "companyID" = $1;`;

  const deleteParams = [companyID];

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
          "companyID",
          "jobID"
        )
        VALUES ($1, $2);
      `;

    const params2 = [companyID, jobPosition];

    const { rows } = await db.query(query2, params2);
    insertedJobs.push(rows[0]); // Assuming only one row is inserted per iteration
  }

  return { row1, row2, insertedJobs };
};

// DELETE query for company
exports.deleteCompany = async ({ companyID, uid }) => {
  // Check  company first if there are existing records in Student & Chatrooms
  // Related Students
  const checkStudents = `
  SELECT s."userID", CONCAT(u."firstName",' ', u."lastName") AS fullName, s."degreeCode"
    FROM "practrack"."Students" s
    JOIN "practrack"."CompanyList" cl ON cl."companyID" = s."companyID"
    JOIN "practrack"."Users" u ON s."userID" = u."userID"
    WHERE cl."companyID" = $1
    AND s."ojtPhase" NOT LIKE 'Completed'
`;
  const params = [companyID];
  const { rows: students } = await db.query(checkStudents, params);
  // console.log("Students deployed: " + students.length); // student count

  // Related Chatrooms
  const checkChats = `
  SELECT  CONCAT(cl."companyName", ' ', l."value") AS groupName
    FROM "practrack"."ChatRooms" cr
    JOIN "practrack"."CompanyList" cl ON cl."companyID" = cr."mainID"
    JOIN "practrack"."Lookup" l ON cr."batch" = l."lookupID"
    JOIN "practrack"."Students" s ON cl."companyID" = s."companyID"
    JOIN "practrack"."Users" u ON s."userID" = u."userID"
    WHERE cl."companyID" = $1
    AND s."ojtPhase" NOT LIKE 'Completed'
    GROUP BY groupName
  `;
  const { rows: chats } = await db.query(checkChats, params);
  // console.log("Chats active: " + chats.length); // chats count

  if (students.length > 0 || chats.length > 0) {
    return { students, chats };
  } else {
    const query = `
    DELETE FROM "practrack"."CompanyList"
    WHERE
      "companyID" = $1;
  `;
    const query2 = `
  DELETE FROM "practrack"."CompanyJobs" "cj"
  USING "practrack"."CompanyList" "cl"
  WHERE "cj"."companyID" = "cl"."companyID"
  AND "cl"."companyID" = $1;
  `;
    const { rows: row1 } = await db.query(query, params);
    const { rows: row2 } = await db.query(query2, params);
    return { row1, row2, students, chats };
  }
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
    "cj"."companyID",
    jsonb_agg(
        jsonb_build_object(
          'jobTitle', "jl"."jobTitle",
          'jobID', "cj"."jobID"
        ) ORDER BY "cj"."companyID"
    ) AS "jobList"
    FROM   "practrack"."CompanyJobs" "cj"
    JOIN
    "practrack"."JobList" "jl" ON "cj"."jobID" = "jl"."jobID"
    GROUP by "cj"."companyID"
    ) "cj" ON "cj"."companyID" = "c"."companyID"
  LEFT JOIN
    "practrack"."FieldOfInterest" "f" ON "c"."natureOfCompany" = "f"."fieldID"
  JOIN
    "practrack"."Lookup" "l" ON "c"."workSetup" = "l"."lookupID"
  ORDER BY
    LOWER("c"."companyName") ASC`;
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
