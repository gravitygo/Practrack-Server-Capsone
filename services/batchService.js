const db = require("../db");

exports.getBatches = async () => {
  const query = `
    SELECT ath.*, l.value AS batch, l."isActive", COUNT(s."studentID") AS students
    FROM "practrack"."AcadTermHours" ath 
    JOIN "practrack"."Lookup" l ON ath."acadTerm" = l."lookupID"
    LEFT JOIN "practrack"."Students" s ON ath."acadTerm" = s."AcademicTerm"
    GROUP BY ath."acadTerm", batch, l."isActive"
    ORDER BY ath."acadTerm" DESC;`;
  const { rows } = await db.query(query);
  return rows;
};

exports.getBatch = async ({ batchID }) => {
  const query = `
    SELECT ath.*, l.value AS batch
    FROM "practrack"."AcadTermHours" ath 
    JOIN "practrack"."Lookup" l ON ath."acadTerm" = l."lookupID"
    WHERE ath."acadTerm" = $1
    GROUP BY ath."acadTerm", batch;`;
  const params = [batchID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.saveBatch = async ({ batchID, minHours, lastEditedBy }) => {
  const query = `
    UPDATE "practrack"."AcadTermHours"
    SET "hours"= $1,
        "dateLastEdited" = now(),
        "lastEditedBy"= $2
    WHERE "acadTerm" = $3;`;
  const params = [minHours, lastEditedBy, batchID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.computeBatch = async () => {
  const query = `
    SELECT "value"
    FROM "practrack"."Lookup"
    WHERE "type" = 'academicTerm'
    ORDER BY "value" DESC
    LIMIT 1;
`;
  const { rows } = await db.query(query);
  return rows;
};

exports.insertBatch = async ({ batchAY, minHours, lastEditedBy }) => {
  const lookupQuery = `
  INSERT INTO "practrack"."Lookup" (
    "type",
    "value"
  )
  VALUES ('academicTerm', $1);
`;
  const lookupParams = [batchAY];
  const { rows: row1 } = await db.query(lookupQuery, lookupParams);

  const getID = `
  SELECT "lookupID"
  FROM "practrack"."Lookup"
  WHERE "type" = 'academicTerm'
  ORDER BY "value" DESC
  LIMIT 1;`;
  const { rows } = await db.query(getID);
  const acadTerm = rows[0].lookupID;

  const athQuery = `
    INSERT INTO "practrack"."AcadTermHours" (
    "acadTerm",
    "hours",
    "dateLastEdited",
    "lastEditedBy"
  )
  VALUES ($1, $2, now(), $3);
`;
  const athParams = [acadTerm, minHours, lastEditedBy];
  const { rows: row2 } = await db.query(athQuery, athParams);

  return { row1, row2 };
};

exports.disableBatch = async (batch) => {
  const query = `
  UPDATE "practrack"."Lookup"
  SET "isActive" = FALSE
  WHERE "lookupID" = $1;`;

  const params = [batch];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.enableBatch = async (batch) => {
  const query = `
  UPDATE "practrack"."Lookup"
  SET "isActive" = TRUE
  WHERE "lookupID" = $1;`;

  const params = [batch];
  const { rows } = await db.query(query, params);
  return rows;
};
