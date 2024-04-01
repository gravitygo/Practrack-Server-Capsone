const db = require("../db");

// BOTH COOR AND STUDENT HOME

exports.getUnread = async (uid) => {
  const query = `
    SELECT COALESCE(COUNT(m.*), 0) AS unread_messages_count 
    FROM practrack."Chats" c
    JOIN (
        SELECT "chatID", MAX("dateCreated") AS max_date
        FROM practrack."Messages"
        WHERE "sender" != $1
        AND "isReceived" = false
        GROUP BY "chatID"
    ) max_dates ON c.id = max_dates."chatID"
    JOIN practrack."Messages" m ON c.id = m."chatID" AND max_dates.max_date = m."dateCreated";`;
  const params = [uid];
  const { rows } = await db.query(query, params);
  return rows[0];
};

// COOR HOME

exports.getUnchecked = async () => {
  const query = `
    SELECT COALESCE(COUNT(*), 0) AS unchecked_submissions_count 
    FROM practrack."Documents" 
    WHERE "fileStatus" = 13;
  `;
  const { rows } = await db.query(query);
  return rows[0];
};

exports.getMissing = async (term) => {
  const query = `
    SELECT u."firstName", u."lastName", s."degreeCode", STRING_AGG(DISTINCT dl."value", ', ') AS missing_docs 
    FROM practrack."AcadTermFileList" f 
    JOIN practrack."Lookup" dl ON f."Requirement" = dl."lookupID" 
    JOIN practrack."Lookup" tl ON f."AcadTerm" = tl."lookupID" 
    JOIN practrack."Lookup" pl ON f."ojtPhase" = pl."lookupID" 
    JOIN practrack."Students" s ON s."ojtPhase" = pl."value" 
    JOIN practrack."Users" u ON s."userID" = u."userID" 
    LEFT JOIN practrack."Documents" d ON d."acadTermFileID" = f."AcadTermFileListID" 
    AND d."createdBy" = s."userID" 
    WHERE pl."value" = s."ojtPhase" 
    AND s."AcademicTerm" = $1
    AND u."isActive" = 'true' 
    AND u.roles = 'Student'
    AND (d."documentID" IS NULL OR d."fileStatus" = 12) 
    AND f.enabled = true 
    GROUP BY s."ojtPhase", u."userID", u."lastName", u."firstName", s."degreeCode" 
    ORDER BY u."lastName", u."firstName", s."degreeCode", u."userID";
  `;
  const params = [term];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getChartData = async (term) => {
  const query = `
    SELECT COALESCE(COUNT(u."userID"), 0) AS total, 
    COALESCE(COUNT(CASE WHEN s."ojtPhase" = 'Pre-Deployment' THEN u."userID" END), 0) AS total_pre, 
    COALESCE(COUNT(CASE WHEN s."ojtPhase" = 'Deployment' THEN u."userID" END), 0) AS total_ongoing, 
    COALESCE(COUNT(CASE WHEN s."ojtPhase" = 'Post-Deployment' THEN u."userID" END), 0) AS total_post 
    FROM practrack."Users" u 
    JOIN practrack."Students" s ON u."userID" = s."userID" 
    WHERE u.roles = 'Student' 
    AND u."isActive" = 'true' 
    AND s."AcademicTerm" = $1;
  `;
  const params = [term];
  const { rows } = await db.query(query, params);
  return rows[0];
};

// STUDENT HOME

// Based off getMissing
exports.getPending = async (uid) => {
  const query = `
    SELECT COALESCE(COUNT(*), 0) AS pending_submissions_count 
    FROM practrack."AcadTermFileList" f 
    JOIN practrack."Lookup" dl ON f."Requirement" = dl."lookupID" 
    JOIN practrack."Lookup" tl ON f."AcadTerm" = tl."lookupID" 
    JOIN practrack."Lookup" pl ON f."ojtPhase" = pl."lookupID" 
    JOIN practrack."Students" s ON s."ojtPhase" = pl."value" 
    JOIN practrack."Users" u ON s."userID" = u."userID" 
    LEFT JOIN practrack."Documents" d ON d."acadTermFileID" = f."AcadTermFileListID" 
    AND d."createdBy" = s."userID" 
    WHERE pl."value" = s."ojtPhase" 
    AND (d."documentID" IS NULL OR d."fileStatus" = 12) 
    AND f.enabled = true
    AND s."userID" = $1;
  `;
  const params = [uid];
  const { rows } = await db.query(query, params);
  return rows[0];
};

exports.getStudentData = async (uid) => {
  const query =
    'SELECT u."firstName", s."studentID", s."ojtPhase", ' +
    'c."companyName", s."startDate", s."endDate" ' +
    'FROM practrack."Users" u ' +
    'JOIN practrack."Students" s ON u."userID" = s."userID" ' +
    'LEFT JOIN practrack."CompanyList" c ON s."companyID" = c."companyID" ' +
    'WHERE s."userID" = $1';
  const params = [uid];
  const { rows } = await db.query(query, params);
  return rows[0];
};
