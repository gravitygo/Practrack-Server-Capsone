const db = require("../db");
exports.insertBatchDocuments = async ({
  batch,
  phase,
  date,
  document,
  createdBy,
}) => {
  const query = `
                INSERT INTO
                  practrack."AcadTermFileList" ("Requirement", "AcadTerm", "ojtPhase", "dateCreated" , "createdBy"
                  ${date !== "null" ? ', "dueDate"' : ""})
                VALUES
                  ($1,$2,$3, now(), $4 ${date !== "null" ? ", $5" : ""})
                RETURNING "AcadTermFileListID"`;
  var params = [document, batch, phase, createdBy];
  if (date != "null") params.push(date);

  const { rows } = await db.query(query, params);
  return rows[0].AcadTermFileListID;
};
exports.getBatchDocuments = async ({ batchId }) => {
  const query = `
                SELECT
                  "AcadTermFileListID" as id,
                  "DocumentID",
                  "requirement",
                  op.value as "phase",
                  op."lookupID" as "phaseId",
                  "enabled",
                  "dueDate" as "dueOn",
                  "isFileSubmission"
                FROM
                  (
                      (
                          SELECT
                              "lookupID" AS "DocumentID",
                              value AS "requirement"
                          FROM
                              practrack."Lookup"
                          WHERE
                              "type" like 'documentType'
                              AND "isActive" = true
                      ) y
                      CROSS JOIN (
                          SELECT
                              "lookupID" AS "AcadTermID",
                              value AS "AcadTermValue"
                          FROM
                              practrack."Lookup"
                          WHERE
                              "type" like 'academicTerm'
                              AND "lookupID" = $1
                              AND "isActive" = true
                      ) z
                  ) "completeFiles"
                  LEFT JOIN practrack."AcadTermFileList" atfl ON atfl."AcadTerm" = "completeFiles"."AcadTermID"
                  and atfl."Requirement" = "completeFiles"."DocumentID"
                  LEFT JOIN (
                      SELECT
                          *
                      FROM
                          practrack."Lookup"
                      WHERE
                          "type" like 'ojtPhase'
                  ) op ON atfl."ojtPhase" = op."lookupID"
                ORDER BY
                  op."lookupID",
                  "DocumentID" DESC`;

  const params = [batchId];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.updateBatchDocuments = async ({
  batchId,
  dueDate,
  ojtPhase,
  fileSubmission,
  docuName,
}) => {
  const query = `
                UPDATE practrack."AcadTermFileList"
                SET "ojtPhase" = $2 ${
                  dueDate !== "null" ? ', "dueDate" = $4' : ', "dueDate" = null'
                },
                "isFileSubmission" = $3
                WHERE "AcadTermFileListID" = $1;`;
  var params = [batchId, ojtPhase, fileSubmission];
  if (dueDate != "null") params.push(dueDate);
  const { rows: row1 } = await db.query(query, params);

  // get atfl.Requirement = l.lookupID
  const lookupQuery = `
    SELECT l."lookupID"
    FROM practrack."Lookup" l
    JOIN practrack."AcadTermFileList" atfl ON l."lookupID" = atfl."Requirement"
    WHERE "AcadTermFileListID" = $1;
  `;
  var lookupParams = [batchId];
  var { rows: rowLookup } = await db.query(lookupQuery, lookupParams);
  const lookupID = rowLookup[0].lookupID;

  const query2 = `
    UPDATE practrack."Lookup"
    SET "value" = $1
    WHERE "lookupID" = $2;
  `;
  var params2 = [docuName, lookupID];
  const { rows: row2 } = await db.query(query2, params2);

  return { row1, row2 };
};

exports.updateEnabledFile = async ({ id, enabled }) => {
  const query = `
                UPDATE practrack."AcadTermFileList"
                SET "enabled" = $2
                WHERE "AcadTermFileListID" = $1;`;
  var params = [id, enabled];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getDocumentsStudentView = async ({ userID, acadTerm, phase }) => {
  const query = `
                SELECT * FROM
                (
                  SELECT
                    *,
                    ROW_NUMBER() OVER (
                      PARTITION BY
                        "acadTermFileId"
                      ORDER BY 
                        accepted, rownumber
                    ) as "values"
                  FROM
                    (
                      SELECT
                        raw."requirement",
                        raw."version",
                        raw."dueDate",
                        raw."submittedOn",
                        fs.value as "status",
                        raw."acadTermFileId",
                        raw."documentID",
                        raw."requirementId",
                        raw."isFileSubmission",
                        ROW_NUMBER() OVER (
                          PARTITION BY
                            raw."acadTermFileId"
                          ORDER BY
                            raw."submittedOn"
                          DESC
                        ) as rownumber,
                        CASE WHEN raw."fileStatus"=15 THEN 0
                        ELSE 1
                        END AS accepted
                      FROM
                        (
                          SELECT
                            dt.value as "requirement",
                            d."version",
                            atfl."dueDate",
                            coalesce(d."dateLastEdited", d."dateCreated", null) as "submittedOn",
                            coalesce(d."fileStatus", 12) as "submissionStatus",
                            atfl."AcadTermFileListID" as "acadTermFileId",
                            d."documentID",
                            atfl."required",
                            atfl."Requirement" as "requirementId",
                            atfl."isFileSubmission",
                            d."fileStatus"
                          FROM
                            (
                              SELECT
                                *
                              FROM
                                practrack."AcadTermFileList"
                              WHERE
                                "AcadTerm" = $2
                                AND "ojtPhase" = $3
                                AND "enabled" = true
                            ) atfl
                            LEFT JOIN (
                              SELECT
                                *
                              FROM
                                practrack."Documents"
                              WHERE
                                "createdBy" LIKE $1
                            ) d ON atfl."AcadTermFileListID" = d."acadTermFileID"
                            LEFT JOIN (
                              SELECT
                                *
                              FROM
                                practrack."Lookup"
                              WHERE
                              type like 'documentType'
                            ) dt ON atfl."Requirement" = dt."lookupID"
                        ) raw
                        LEFT JOIN (
                          SELECT
                            *
                          FROM
                            practrack."Lookup"
                          WHERE
                          type like 'status'
                        ) fs ON raw."submissionStatus" = fs."lookupID"
                    ) t
                ) x
                  WHERE "values" = 1`;
  const params = [userID, acadTerm, phase];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getSubmittedDocumentsOULC = async () => {
  const query = `
  WITH LatestDocuments AS (
    SELECT 
      d."documentID", 
      r."value" AS "documentName",
      CONCAT(u."firstName", ' ', u."lastName") AS "student",
      s."value" AS "remarks",
      d."dateCreated" AS "dateReceived",
      atfl.enabled,
      d.version,
      ROW_NUMBER() OVER (PARTITION BY d."createdBy", d."acadTermFileID" ORDER BY d."dateCreated" DESC, d."documentID" DESC) AS rn
    FROM practrack."Documents" d
    LEFT JOIN practrack."AcadTermFileList" atfl
      ON atfl."AcadTermFileListID" = d."acadTermFileID"
    LEFT JOIN (
      SELECT *
      FROM practrack."Lookup"
      WHERE "type" LIKE 'status'
    ) s
      ON s."lookupID" = d."fileStatus"
    LEFT JOIN (
      SELECT *
      FROM practrack."Lookup"
      WHERE "type" LIKE 'documentType'
    ) r
      ON r."lookupID" = atfl."Requirement"
    LEFT JOIN practrack."Users" u
      ON u."userID" = d."createdBy"
    LEFT JOIN practrack."Students" st
      ON st."userID" = d."createdBy"
    LEFT JOIN (
      SELECT *
      FROM practrack."Lookup"
      WHERE "type" LIKE 'academicTerm'
    ) t
      ON t."lookupID" = st."AcademicTerm"
    WHERE 
      atfl."ojtPhase" = (
        SELECT "lookupID" 
        FROM practrack."Lookup"
        WHERE "value" LIKE 'Pre-Deployment'
      )
    AND atfl."enabled" = TRUE
    AND t."isActive" = TRUE
  )
  SELECT 
    "documentID", 
    "documentName",
    "student",
    "remarks",
    "dateReceived",
    "version"
  FROM LatestDocuments
  WHERE rn = 1
  AND ("remarks" = 'Submitted' OR "remarks" = 'Disapproved')
  ORDER BY "dateReceived" DESC, "documentID" DESC, "student";
  `;
  const { rows } = await db.query(query);
  return rows;
};

exports.submitDtr = async ({
  startDate,
  endDate,
  hoursRendered,
  requirementId,
  atfl,
  nextVersion,
  createdBy,
}) => {
  var query = `
  INSERT INTO practrack."Documents"(
    "documentName", 
    "version",
    "filepath", 
    "createdBy", 
    "acadTermFileID", 
    "fileStatus",
    "hours",
    "startDate",
    "endDate"
  )
  VALUES ($4,$6,$9,$7,$5,$8,$3,$1,$2)
  RETURNING "documentID";`;
  var params = [
    startDate,
    endDate,
    hoursRendered,
    requirementId,
    atfl,
    nextVersion,
    createdBy,
    13,
    `${createdBy}/${atfl}`,
  ];
  const { rows } = await db.query(query, params);
  return rows[0].documentID;
};
exports.submitDocumentV2 = async ({
  documentName,
  version,
  filePath,
  createdBy,
  fileId,
}) => {
  var query = `
  UPDATE practrack."Documents" SET "fileStatus" = 16 WHERE "acadTermFileID" = $1`;
  var params = [fileId];
  await db.query(query, params);
  query = `
  INSERT INTO practrack."Documents"(
    "documentName", 
    "version",
    "filepath", 
    "createdBy", 
    "acadTermFileID", 
    "fileStatus"
  )
  VALUES ($1,$6,$2,$3,$4,$5)
  RETURNING "documentID";`;
  params = [documentName, filePath, createdBy, fileId, 13, version];
  const { rows } = await db.query(query, params);
  return rows[0].documentID;
};
exports.submitDocument = async ({
  documentName,
  filePath,
  createdBy,
  fileId,
}) => {
  const query = `
  INSERT INTO practrack."Documents"(
    "documentName", 
    "filepath", 
    "createdBy", 
    "acadTermFileID", 
    "fileStatus"
  )
  VALUES ($1,$2,$3,$4,$5)
  RETURNING "documentID"`;
  const params = [documentName, filePath, createdBy, fileId, 13];
  const { rows } = await db.query(query, params);
  return rows[0].documentID;
};

exports.getSubmittedDocument = async (documentID) => {
  const query = `
  SELECT 
    CONCAT(dt."value", ' - ', LPAD(CAST(d."version" AS TEXT),2,'0')) AS "documentName",
    d."dateLastEdited",
    "fileStatus",
    "feedback",
    l."value" AS "statusValue"
  FROM practrack."Documents" d
  LEFT JOIN practrack."AcadTermFileList" atfl
    ON atfl."AcadTermFileListID" = d."acadTermFileID"
  LEFT JOIN practrack."Lookup" l 
    ON l."lookupID" = d."fileStatus"
  LEFT JOIN practrack."Lookup" dt
    ON dt."lookupID" = atfl."Requirement"
  WHERE d."documentID" = $1`;

  var params = [documentID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getSubmittedDocumentCoordinator = async ({
  userID,
  acadTerm,
  ojtPhase,
}) => {
  const query = `
SELECT * FROM
  (SELECT 
    *,
    ROW_NUMBER() OVER(PARTITION BY "Requirement" ORDER BY "Requirement", "fileStatus", "rowNumber") AS "numberer"
  FROM (
    SELECT
      d."documentID",
      dt.value as "requirement",
      d."version",
      d."dateCreated" as "submittedOn",
      s."value" as "status",
      d."acadTermFileID",
      atfl."Requirement",
      ROW_NUMBER() OVER(PARTITION BY atfl."Requirement" ORDER BY d."dateCreated") AS "rowNumber",
      CASE WHEN d."fileStatus" = 16 THEN 1 ELSE 0 END AS "fileStatus"
    FROM
      (
        SELECT
          *
        FROM
          practrack."AcadTermFileList"
        WHERE
          "AcadTerm" = $2
          AND "ojtPhase" = $3
          AND "enabled" = true
      ) atfl
      LEFT JOIN (
        SELECT
          *
        FROM
          practrack."Documents"
        WHERE
          "createdBy" LIKE $1
      ) d ON atfl."AcadTermFileListID" = d."acadTermFileID"
      LEFT JOIN (
        SELECT
          *
        FROM
          practrack."Lookup"
        WHERE
        type like 'documentType'
      ) dt ON dt."lookupID" = atfl."Requirement"
      LEFT JOIN (
        SELECT *
        FROM
          practrack."Lookup"
        WHERE
        type like 'status'
      ) s ON s."lookupID" = d."fileStatus"
  ) t
  ) r WHERE numberer = 1
  `;

  var params = [userID, acadTerm, ojtPhase];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.updateSubmittedDocuments = async ({
  documentID,
  feedback,
  status,
  currentUser,
}) => {
  const query = `
  UPDATE practrack."Documents"
  SET "checkedBy" = $1, 
  "dateLastEdited" = NOW(), 
  "fileStatus" = $2,
  "feedback" = $3
  WHERE "documentID"=$4`;

  var params = [currentUser, status, feedback, documentID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.updateDocument = async ({ id, accountId }) => {
  const query = `
  UPDATE practrack."Documents" 
  SET 
  "lastEditedBy" = $2,
  "dateLastEdited" = now(),
  "version" = "version"+1
  WHERE "documentID" = $1`;
  const params = [id, accountId];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getDocument = async ({ id }) => {
  // console.log(id);

  const query = `
  SELECT
    d.*,
    lu."value"
  FROM
    practrack."Documents" d
    LEFT JOIN practrack."AcadTermFileList" atfl ON atfl."AcadTermFileListID" = d."acadTermFileID"
    LEFT JOIN practrack."Lookup" lu ON lu."lookupID" = atfl."Requirement"
  WHERE
    "documentID" = $1
  `;
  var params = [id];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.documentFeedback = async ({
  feedback,
  fileStatus,
  checkedBy,
  documentID,
}) => {
  // console.log(feedback, fileStatus, checkedBy, documentID);
  const query = `
  UPDATE practrack."Documents"
  SET
    "feedback" = $1,
    "fileStatus" = $2,
    "checkedBy" = $3,
    "dateChecked" = now(),
    "lastEditedBy" = $4,
    "dateLastEdited" = now()
  WHERE "documentID" = $5;`;
  var params = [feedback, fileStatus, checkedBy, checkedBy, documentID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getUnchecked = async () => {
  const query = `
  SELECT
    d."documentID", d."createdBy",
    dt.value as "requirement",
    d."version",
    d."dateCreated" as "submittedOn",
    s."value" as "status"
  FROM practrack."Documents" d
  JOIN practrack."AcadTermFileList" atfl ON atfl."AcadTermFileListID" = d."acadTermFileID" AND atfl."enabled" = true
  LEFT JOIN (
    SELECT *
    FROM practrack."Lookup"
    WHERE type like 'documentType'
  ) dt ON dt."lookupID" = atfl."Requirement"
  LEFT JOIN (
    SELECT *
    FROM practrack."Lookup"
    WHERE type like 'status'
  ) s ON s."lookupID" = d."fileStatus"
  WHERE s."value" = 'Submitted'`;
  const { rows } = await db.query(query);
  return rows;
};

exports.saveDeployment = async ({
  userID,
  startDate,
  endDate,
  companyID,
  supvName,
  supvEmail,
}) => {
  const query = `
  UPDATE "practrack"."Students"
  SET 
    "startDate" = $2,
    "endDate" = $3,
    "companyID" = $4,
    "lastEditedBy" = $1,
    "dateLastEdited" = now(),
    "supvName" = $5,
    "supvEmail" = $6
  WHERE "userID" = $1;`;

  const params = [userID, startDate, endDate, companyID, supvName, supvEmail];

  const { rows } = await db.query(query, params);

  return { rows };
};

exports.resetDeployment = async (userID) => {
  const query = `
  UPDATE "practrack"."Students"
  SET 
    "startDate" = NULL,
    "endDate" = NULL,
    "companyID" = NULL,
    "lastEditedBy" = NULL,
    "dateLastEdited" = now(),
    "supvName" = NULL,
    "supvEmail" = NULL
  WHERE "userID" = $1;`;

  const params = [userID];
  const { rows } = await db.query(query, params);

  return { rows };
};

exports.requestMigrate = async ({ userID, reasonForMigration }) => {
  const query = `
  UPDATE "practrack"."Students"
  SET 
    "reasonForMigration" = $2,
    "requestMigrate" = TRUE
  WHERE "userID" = $1;`;

  const params = [userID, reasonForMigration];
  const { rows } = await db.query(query, params);
  return { rows };
};

exports.decisionMigrate = async ({ userID, decision }) => {
  // resetRequest
  const query1 = `
    UPDATE "practrack"."Students"
    SET
      "reasonForMigration" = NULL,
      "requestMigrate" = FALSE
    WHERE "userID" = $1;`;

  const params1 = [userID];
  const { rows: rows1 } = await db.query(query1, params1);

  // voidDocuments
  if (decision == "acceptRetain" || decision == "acceptReset") {
    const query2 = `
      UPDATE "practrack"."Documents"
      SET "fileStatus" = (
        SELECT "lookupID"
        FROM "practrack"."Lookup"
        WHERE "type" = 'status' AND "value" = 'Void'
        LIMIT 1  -- Ensures only one row is returned
      )
      WHERE "createdBy" = $1;
    `;

    const params2 = [userID];
    const { rows: rows2 } = await db.query(query2, params2);

    // resetDetails
    const query3 = `
    UPDATE "practrack"."Students"
    SET
      "companyID" = NULL,
      "startDate" = NULL,
      "endDate" = NULL,
      "supvName" = NULL,
      "supvEmail" = NULL
      WHERE "userID" = $1;`;

    const params3 = [userID];
    const { rows: rows3 } = await db.query(query3, params3);

    // resetHours
    if (decision == "acceptReset") {
      const query4 = `
        UPDATE "practrack"."Students"
        SET
          "hoursRendered" = 0
        WHERE "userID" = $1;`;

      const params4 = [userID];
      const { rows: rows4 } = await db.query(query4, params4);
      return { rows1, rows2, rows3, rows4 };
    }
    return { rows1, rows2, rows3 };
  }

  return { rows1 };
};
// exports.resetRequest = async ({userID}) => {
//   const query = `
//   UPDATE "practrack"."Students"
//   SET
//     "reasonForMigration" = NULL,
//     "requestMigrate" = FALSE
//   WHERE "userID" = $1;`;

//   const params = [userID];
//   const { rows } = await db.query(query, params);
//   return { rows };
// };

// exports.voidDocuments = async ({userID}) => {
//   const query = `
//   UPDATE "practrack"."Documents"
//   SET
//     "fileStatus" = 35
//   WHERE "filepath" = $1;`;

//   const params = [userID];
//   const { rows } = await db.query(query, params);
//   return { rows };
// };

// exports.resetHours = async ({userID}) => {
//   const query = `
//   UPDATE "practrack"."Students"
//   SET
//     "hoursRendered" = 0
//   WHERE "userID" = $1;`;

//   const params = [userID];
//   const { rows } = await db.query(query, params);
//   return { rows };
// };

exports.getAllSubmittedDocumentsRequirement = async ({
  userId,
  requirementId,
}) => {
  const query = `
SELECT
  "nextVersion",
  COALESCE("documents", '[]'::JSON) AS "documents",
  a."Requirement",
  a."AcadTermFileListID"
FROM
  (
    SELECT 
      COALESCE("nextVersion", 0) AS "nextVersion",
      1 as equalizer,
      atfl."Requirement",
      atfl."AcadTermFileListID"
    FROM 
    practrack."Students" s
    CROSS JOIN practrack."AcadTermFileList" atfl
    LEFT JOIN (
      SELECT 
        COUNT(VERSION) AS "nextVersion",
        d."createdBy",
        atfl."Requirement"
      FROM
        practrack."AcadTermFileList" atfl 
        LEFT JOIN practrack."Documents" d
        ON atfl."AcadTermFileListID" = d."acadTermFileID"
      GROUP BY 
        "Requirement","acadTermFileID", d."createdBy"
    ) cv ON s."userID" = cv."createdBy" AND cv."Requirement" =  atfl."Requirement"

    WHERE
    s."userID" like $3
        AND atfl."Requirement" = $4
    AND s."AcademicTerm" = atfl."AcadTerm"
  ) a
  LEFT JOIN (
    SELECT
      JSON_AGG(d) AS documents,
      "Requirement",
      1 as equalizer
    FROM
      (
        SELECT
          JSON_BUILD_OBJECT(
            'documentID',
            "documentID",
            'documentName',
            "documentName",
            'filepath',
            "filepath",
            'version',
            "version",
            'createdBy',
            docs."createdBy",
            'dateCreated',
            docs."dateCreated",
            'checkedBy',
            docs."checkedBy",
            'dateChecked',
            docs."dateChecked",
            'lastEditedBy',
            docs."lastEditedBy",
            'dateLastEdited',
            docs."dateLastEdited",
            'acadTermFileID',
            docs."acadTermFileID",
            'fileStatus',
            "fileStatus",
            'feedback',
            "feedback",
            'hours',
            "hours",
            'startDate',
            "startDate",
            'endDate',
            "endDate"
          ) d,
          atfl."Requirement"
        FROM
        practrack."AcadTermFileList" atfl 
         LEFT JOIN  practrack."Documents" docs ON atfl."AcadTermFileListID" = docs."acadTermFileID"
        WHERE
          docs."createdBy" like $1
          AND atfl."Requirement" = $2
        ORDER BY
          version
      ) docs
    GROUP BY
      "Requirement"
  ) b on a.equalizer = b.equalizer`;

  const params = [userId, requirementId, userId, requirementId];

  const { rows } = await db.query(query, params);

  return { rows };
};
exports.getAllSubmittedDocuments = async ({ userId, acadTermID }) => {
  const query = `
SELECT
  "nextVersion",
  "documents",
  "Requirement",
  "isFileSubmission"
FROM
  (
    SELECT
      COUNT(VERSION) AS "nextVersion",
      1 as equalizer
    FROM
      practrack."Documents" d
    WHERE
      "createdBy" like $3
      AND "acadTermFileID" = $4
    GROUP BY
      "acadTermFileID"
  ) a
  LEFT JOIN (
    SELECT
      JSON_AGG(d) AS documents,
      "Requirement",
      1 as equalizer,
      "isFileSubmission"
    FROM
      (
        SELECT
          JSON_BUILD_OBJECT(
            'documentID',
            "documentID",
            'documentName',
            "documentName",
            'filepath',
            "filepath",
            'version',
            "version",
            'createdBy',
            docs."createdBy",
            'dateCreated',
            docs."dateCreated",
            'checkedBy',
            docs."checkedBy",
            'dateChecked',
            docs."dateChecked",
            'lastEditedBy',
            docs."lastEditedBy",
            'dateLastEdited',
            docs."dateLastEdited",
            'acadTermFileID',
            docs."acadTermFileID",
            'fileStatus',
            "fileStatus",
            'feedback',
            "feedback",
            'hours',
            "hours",
            'startDate',
            "startDate",
            'endDate',
            "endDate"
          ) d,
          atfl."Requirement",
          atfl."isFileSubmission"
        FROM
          practrack."Documents" docs
          LEFT JOIN practrack."AcadTermFileList" atfl ON atfl."AcadTermFileListID" = docs."acadTermFileID"
        WHERE
          docs."createdBy" like $1
          AND docs."acadTermFileID" = $2
        ORDER BY
          version
      ) docs
    GROUP BY
      "Requirement", "isFileSubmission"
  ) b on a.equalizer = b.equalizer`;

  const params = [userId, acadTermID, userId, acadTermID];

  const query2 = ``;
  const params2 = [];

  const { rows } = await db.query(query, params);

  return { rows };
};

exports.checkApprovedMigration = async (userId) => {
  const query = ` 
    SELECT EXISTS (
      SELECT *
      FROM practrack."Documents"
      WHERE "fileStatus" = (
        SELECT "lookupID"
        FROM practrack."Lookup"
        WHERE "type" = 'status' AND "value" = 'Void'
        LIMIT 1
      )
      AND NOT EXISTS (
        SELECT *
        FROM practrack."Documents"
        WHERE "fileStatus" IN (
          SELECT "lookupID"
          FROM practrack."Lookup"
          WHERE "type" = 'status' AND "value" IN ('Submitted', 'Disapproved', 'Approved')
      )
        AND "createdBy" = $1
      )
      AND "createdBy" = $1
    );
`;

  const params = [userId];

  const { rows } = await db.query(query, params);

  return rows[0];
};
