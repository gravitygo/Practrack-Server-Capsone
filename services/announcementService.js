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

exports.viewBatchAnnouncements = async ({ batch, uid }) => {
  const query = `
  SELECT
    a.*,
    TO_CHAR(a."dateCreated", 'YYYYMMDDHH24MISS') AS "formattedDateCreatedSortable",
    TO_CHAR(a."dateLastEdited", 'YYYYMMDDHH24MISS') AS "formattedDateEditedSortable",
    TO_CHAR(a."dateCreated", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateCreated",
    TO_CHAR(a."dateLastEdited", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateEdited",
    CONCAT(
        COALESCE("u2"."firstName", "u"."firstName"), 
        ' ', 
        COALESCE("u2"."lastName", "u"."lastName")
    ) AS "name",
    ar."isRead"
  FROM "practrack"."Announcements" a
  JOIN "practrack"."AnnouncementsRead" ar ON a."announcementID" = ar."announcementID"
  LEFT JOIN "practrack"."Users" "u" ON "a"."createdBy" = "u"."userID"
  LEFT JOIN "practrack"."Users" "u2" ON "a"."lastEditedBy" = "u2"."userID"
  WHERE a."batch" = $1
  AND ar."userID" = $2
  ORDER BY ar."isRead", COALESCE(a."dateLastEdited", a."dateCreated") DESC
`;
  const params = [batch, uid];
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

exports.viewAnnouncements = async () => {
  const query = `
  SELECT
    "a".*,
    TO_CHAR("a"."dateCreated", 'YYYYMMDDHH24MISS') AS "formattedDateCreatedSortable",
    TO_CHAR("a"."dateLastEdited", 'YYYYMMDDHH24MISS') AS "formattedDateEditedSortable",
    TO_CHAR("a"."dateCreated", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateCreated",
    TO_CHAR("a"."dateLastEdited", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateEdited",
    CONCAT(
        COALESCE("u2"."firstName", "u"."firstName"), 
        ' ', 
        COALESCE("u2"."lastName", "u"."lastName")
    ) AS "name"
  FROM "practrack"."Announcements" "a"
  LEFT JOIN "practrack"."Users" "u" ON "a"."createdBy" = "u"."userID"
  LEFT JOIN "practrack"."Users" "u2" ON "a"."lastEditedBy" = "u2"."userID"
  JOIN "practrack"."Lookup" "l" ON "a"."batch" = "l"."value" AND "l"."isActive" = true
  ORDER BY COALESCE("a"."dateLastEdited", "a"."dateCreated") DESC;
  `;
  const { rows } = await db.query(query);
  return rows;
};

exports.viewFilteredAnnouncements = async ({ batch }) => {
  const query = `
  SELECT
    "a".*,
    TO_CHAR("a"."dateCreated", 'YYYYMMDDHH24MISS') AS "formattedDateCreatedSortable",
    TO_CHAR("a"."dateLastEdited", 'YYYYMMDDHH24MISS') AS "formattedDateEditedSortable",
    TO_CHAR("a"."dateCreated", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateCreated",
    TO_CHAR("a"."dateLastEdited", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateEdited",
    CONCAT(
      COALESCE("u2"."firstName", "u"."firstName"), 
      ' ', 
      COALESCE("u2"."lastName", "u"."lastName")
    ) AS "name"
  FROM "practrack"."Announcements" "a"
  LEFT JOIN "practrack"."Users" "u" ON "a"."createdBy" = "u"."userID"
  LEFT JOIN "practrack"."Users" "u2" ON "a"."lastEditedBy" = "u2"."userID"
  WHERE "a"."batch" = $1
  ORDER BY COALESCE("a"."dateLastEdited", "a"."dateCreated") DESC;
`;
  const params = [batch];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.viewAnnouncementCoor = async ({ announcementID }) => {
  const query = `
  SELECT 
    "a".*, 
    CONCAT(
      COALESCE("u2"."firstName", "u"."firstName"), 
      ' ', 
      COALESCE("u2"."lastName", "u"."lastName")
    ) AS "name",
    TO_CHAR("a"."dateCreated", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateCreated",
    TO_CHAR("a"."dateLastEdited", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateEdited"
  FROM "practrack"."Announcements" "a"
  LEFT JOIN "practrack"."Users" "u" ON "a"."createdBy" = "u"."userID"
  LEFT JOIN "practrack"."Users" "u2" ON "a"."lastEditedBy" = "u2"."userID"
  JOIN "practrack"."Lookup" "l" ON "a"."batch" = "l"."value"
  WHERE "a"."announcementID" = $1
  AND "l"."isActive" = true; 
  `;
  const params = [announcementID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.viewAnnouncementStudent = async ({ announcementID, uid }) => {
  const query = `
  SELECT 
    a.*, 
    CONCAT(
      COALESCE("u2"."firstName", "u"."firstName"), 
      ' ', 
      COALESCE("u2"."lastName", "u"."lastName")
    ) AS "name",
    TO_CHAR(a."dateCreated", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateCreated",
    TO_CHAR(a."dateLastEdited", 'Mon DD, YYYY HH12:MI AM') AS "formattedDateEdited",
    ar."isRead"
  FROM "practrack"."Announcements" a
  LEFT JOIN "practrack"."Users" "u" ON "a"."createdBy" = "u"."userID"
  LEFT JOIN "practrack"."Users" "u2" ON "a"."lastEditedBy" = "u2"."userID"
  JOIN "practrack"."AnnouncementsRead" ar ON a."announcementID" = ar."announcementID"
  WHERE a."announcementID" = $1
  AND ar."userID" = $2;
  `;
  const params = [announcementID, uid];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.setRead = async ({ announcementId, userId }) => {
  const query = `
    UPDATE practrack."AnnouncementsRead"
    SET "isRead" = NOT "isRead"
    WHERE "announcementID" = $1
    AND "userID" = $2;
  `;
  const params = [announcementId, userId];
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

  const { rows } = await db.query(query, params);

  return rows;
};
