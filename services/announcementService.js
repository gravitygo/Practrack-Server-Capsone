const db = require("../db");

exports.getStudentProfile = async ({ userID }) => {
  const query = `
    SELECT "s".*, "l".value AS ayterm
    FROM "practrack"."Students" "s"
    JOIN "practrack"."Lookup" "l" ON "s"."AcademicTerm" = "l"."lookupID"
    WHERE "s"."userID" = $1`;
  const params = [userID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.viewBatchAnnouncements = async ({ batch }) => {
  const query = `
  SELECT
  "a".*,
  TO_CHAR("a"."dateCreated", 'YYYYMMDDHH24MISS') AS "formattedDateCreatedSortable",
  TO_CHAR("a"."dateLastEdited", 'YYYYMMDDHH24MISS') AS "formattedDateEditedSortable",
  TO_CHAR("a"."dateCreated", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateCreated",
  TO_CHAR("a"."dateLastEdited", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateEdited",
  CONCAT("u"."firstName", ' ', "u"."lastName") AS "name"
  FROM
    "practrack"."Users" "u"
  JOIN
    "practrack"."Announcements" "a" ON "a"."createdBy" = "u"."userID"
  JOIN
    "practrack"."Students" "s" ON "s"."userID" = "u"."userID"
  WHERE 
    "a"."batch" = $1
  ORDER BY
    COALESCE("a"."dateLastEdited", "a"."dateCreated") DESC
`;
  const params = [batch];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.addAnnouncement = async ({ title, announcement, batch, createdBy }) => {
  const query =
    'INSERT INTO "practrack"."Announcements"(' +
    '    "title",' +
    '    "announcement",' +
    '    "batch",' +
    '    "createdBy",' +
    '    "dateCreated"' +
    ") " +
    "VALUES($1, $2, $3, $4, now() AT TIME ZONE 'Asia/Singapore')";
  const params = [title, announcement, batch, createdBy];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.viewAnnouncements = async ({ userID }) => {
  const query = `
  SELECT
  "a".*,
  TO_CHAR("a"."dateCreated", 'YYYYMMDDHH24MISS') AS "formattedDateCreatedSortable",
  TO_CHAR("a"."dateLastEdited", 'YYYYMMDDHH24MISS') AS "formattedDateEditedSortable",
  TO_CHAR("a"."dateCreated", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateCreated",
  TO_CHAR("a"."dateLastEdited", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateEdited",
  CONCAT("u"."firstName", ' ', "u"."lastName") AS "name"
  FROM
    "practrack"."Users" "u"
  JOIN
    "practrack"."Announcements" "a" ON "a"."createdBy" = "u"."userID"
  WHERE "a"."createdBy" = $1
  ORDER BY
    COALESCE("a"."dateLastEdited", "a"."dateCreated") DESC
`;
  const params = [userID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.viewFilteredAnnouncements = async ({ userID, batch }) => {
  const query = `
  SELECT
  "a".*,
  TO_CHAR("a"."dateCreated", 'YYYYMMDDHH24MISS') AS "formattedDateCreatedSortable",
  TO_CHAR("a"."dateLastEdited", 'YYYYMMDDHH24MISS') AS "formattedDateEditedSortable",
  TO_CHAR("a"."dateCreated", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateCreated",
  TO_CHAR("a"."dateLastEdited", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateEdited",
  CONCAT("u"."firstName", ' ', "u"."lastName") AS "name"
  FROM
    "practrack"."Users" "u"
  JOIN
    "practrack"."Announcements" "a" ON "a"."createdBy" = "u"."userID"
  WHERE "a"."createdBy" = $1
  AND "a"."batch" = $2
  ORDER BY
    COALESCE("a"."dateLastEdited", "a"."dateCreated") DESC
`;
  const params = [userID, batch];
  const { rows } = await db.query(query, params);
  console.log(rows);
  return rows;
};

exports.viewAnnouncement = async ({ announcementID }) => {
  const query = `
  SELECT "a".*, 
  CONCAT("u"."firstName", ' ', "u"."lastName") AS "name",
  TO_CHAR("a"."dateCreated", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateCreated",
  TO_CHAR("a"."dateLastEdited", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateEdited"
  FROM "practrack"."Announcements" "a"
  JOIN
  "practrack"."Users" "u" ON "a"."createdBy" = "u"."userID"
  WHERE 
      "a"."announcementID" = $1; 
  `;
  const params = [announcementID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.saveAnnouncement = async ({
  announcementID,
  title,
  announcement,
  batch,
  createdBy,
}) => {
  const query = `
    UPDATE "practrack"."Announcements"
    SET 
        "title" = $1,
        "announcement" = $2,
        "batch" = $3,
        "lastEditedBy" = $4,
        "dateLastEdited" = now() AT TIME ZONE 'Asia/Singapore'
    WHERE 
        "announcementID" = $5; 
    `;
  const params = [title, announcement, batch, createdBy, announcementID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.deleteAnnouncement = async ({ announcementID, uid }) => {
  const query = `
  DELETE FROM "practrack"."Announcements"
  WHERE 
      "announcementID" = $1;
  `;
  const params = [announcementID];

  const audit_query = `
  UPDATE "practrack"."audit_Announcements"
  SET "changeUserID" = $1
  WHERE "announcementID" = $2
  AND "changeType" = 'DELETE'; 
  `;
  const audit_params = [uid, announcementID];

  const { rows } = await db.query(query, params);
  await db.query(audit_query, audit_params);

  return rows;
};
