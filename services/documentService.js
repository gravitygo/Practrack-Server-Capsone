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
                  "dueDate" as "dueOn"
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
                  "DocumentID"`;

  const params = [batchId];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.updateBatchDocuments = async ({ batchId, dueDate, ojtPhase }) => {
  const query = `
                UPDATE practrack."AcadTermFileList"
                SET "ojtPhase" = $2 ${
                  dueDate !== "null" ? ', "dueDate" = $3' : ', "dueDate" = null'
                }
                WHERE "AcadTermFileListID" = $1;`;
  var params = [batchId, ojtPhase];
  if (dueDate != "null") params.push(dueDate);

  const { rows } = await db.query(query, params);
  return rows;
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
  SELECT 
    raw."requirement", 
    raw."version", 
    raw."dueDate", 
    raw."submittedOn", 
    fs.value as "status",
    raw."acadTermFileId",
    raw."documentID",
    raw."requirementId"
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
      atfl."Requirement" as "requirementId"
    FROM
    (
      SELECT * 
      FROM practrack."AcadTermFileList"
      WHERE 
        "AcadTerm" = $2
        AND "ojtPhase" = $3
        AND "enabled" = true
    ) atfl 
    LEFT JOIN (
      SELECT * 
      FROM practrack."Documents" 
      WHERE "createdBy" LIKE $1
    ) d ON  atfl."AcadTermFileListID" = d."acadTermFileID"
    LEFT JOIN (
      SELECT * FROM practrack."Lookup"
      WHERE type like 'documentType'
    ) dt ON atfl."Requirement" = dt."lookupID"
  ) raw
  LEFT JOIN (
    SELECT * FROM practrack."Lookup"
      WHERE type like 'status'
  ) fs ON raw."submissionStatus" = fs."lookupID"`;
  const params = [userID, acadTerm, phase];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getSubmittedDocuments = async () => {
  const query = `
  SELECT 
    d."documentID", 
    d."documentName" AS "documentName",
    CONCAT(u."firstName", ' ', u."lastName") AS "student",
    s."value" AS "remarks",
    d."dateCreated" AS "dateReceived"
  FROM practrack."Documents" d
  LEFT JOIN practrack."AcadTermFileList" atfl
    ON atfl."AcadTermFileListID" = d."acadTermFileID"
  LEFT JOIN (
    SELECT *
    FROM practrack."Lookup"
    WHERE "type" like 'status'
  ) s
    ON s."lookupID" = d."fileStatus"
  LEFT JOIN practrack."Users" u
    ON u."userID" = d."createdBy"
  ORDER BY d."dateCreated"`;

  const { rows } = await db.query(query);
  return rows;
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

exports.getSubmittedDocumentCoordinator = async ({ userID, ojtPhase }) => {
  const query = `
  SELECT
    d."documentID",
    dt.value as "requirement",
    d."version",
    d."dateCreated" as "submittedOn",
    s."value" as "status"
  FROM
    practrack."Documents" d
    LEFT JOIN practrack."AcadTermFileList" atfl ON atfl."AcadTermFileListID" = d."acadTermFileID"
    LEFT JOIN (
      SELECT
        *
      FROM
        practrack."Lookup"
      WHERE
      type like 'documentType'
    ) dt ON dt."lookupID" = atfl."Requirement"
    LEFT JOIN (
      SELECT
        *
      FROM
        practrack."Lookup"
      WHERE
      type like 'status'
    ) s ON s."lookupID" = d."fileStatus"
    WHERE d."createdBy" like $1
    AND atfl."ojtPhase" = $2
  `;

  var params = [userID, ojtPhase];
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
  console.log(id);

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
  console.log(feedback, fileStatus, checkedBy, documentID);
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
FROM
  practrack."Documents" d
  LEFT JOIN practrack."AcadTermFileList" atfl ON atfl."AcadTermFileListID" = d."acadTermFileID"
  LEFT JOIN (
    SELECT
      *
    FROM
      practrack."Lookup"
    WHERE
    type like 'documentType'
  ) dt ON dt."lookupID" = atfl."Requirement"
  LEFT JOIN (
    SELECT
      *
    FROM
      practrack."Lookup"
    WHERE
    type like 'status'
  ) s ON s."lookupID" = d."fileStatus"
  
  WHERE 
   s."value" = 'Submitted'
  `;
  const { rows } = await db.query(query);
  return rows;
};

exports.saveDeployment = async ({ userID, startDate, endDate, companyID }) => {
  const query = `
  UPDATE "practrack"."Students"
  SET 
    "startDate" = $2,
    "endDate" = $3,
    "companyID" = $4,
    "lastEditedBy" = $1,
    "dateLastEdited" = now()
  WHERE "userID" = $1;`;

  const params = [userID, startDate, endDate, companyID];

  const { rows } = await db.query(query, params);

  return { rows };
};
