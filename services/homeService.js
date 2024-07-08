const db = require("../db");

// BOTH COOR AND STUDENT HOME

exports.getNotifs = async (uid) => {
  const query = `
    SELECT * 
    FROM practrack.notif_counts
    WHERE "userID" = $1`;
  const params = [uid];
  const { rows } = await db.query(query, params);
  return rows[0];
};

exports.getUnread = async (uid) => {
  const query = `
    SELECT COALESCE(COUNT(m.*), 0) AS unread_messages_count 
    FROM practrack."ChatMembers" m
    WHERE m."userID" = $1 AND m."isRead" = false;`;
  const params = [uid];
  const { rows } = await db.query(query, params);
  return rows[0];
};

// COOR HOME

exports.getUnchecked = async () => {
  const query = `
    SELECT COALESCE(COUNT(d.*), 0) AS unchecked_submissions_count
    FROM practrack."Documents" d
    JOIN practrack."AcadTermFileList" f ON f."AcadTermFileListID" = d."acadTermFileID"
    JOIN practrack."Lookup" l ON f."AcadTerm" = l."lookupID"
    WHERE d."fileStatus" = (
      SELECT "lookupID"
      FROM practrack."Lookup"
      WHERE type = 'status' AND value = 'Submitted'
      LIMIT 1
    )
    AND f."enabled" = true
    AND l."isActive" = true;
  `;
  const { rows } = await db.query(query);
  return rows[0];
};

exports.getMissing = async () => {
  const query = `
    SELECT u."firstName", u."lastName", s."degreeCode", s."ojtPhase", tl.value AS "acadTerm", STRING_AGG(DISTINCT dl."value", ', ') AS missing_docs 
    FROM practrack."AcadTermFileList" f 
    JOIN practrack."Lookup" dl ON f."Requirement" = dl."lookupID" 
    JOIN practrack."Lookup" pl ON f."ojtPhase" = pl."lookupID" 
    JOIN practrack."Students" s ON s."ojtPhase" = pl."value" 
    JOIN practrack."Lookup" tl ON f."AcadTerm" = tl."lookupID" AND s."AcademicTerm" = tl."lookupID"
    JOIN practrack."Users" u ON s."userID" = u."userID" 
    LEFT JOIN practrack."Documents" d ON d."acadTermFileID" = f."AcadTermFileListID" 
    AND d."createdBy" = s."userID" 
    AND d."version" = (
        SELECT MAX(d2."version")
        FROM practrack."Documents" d2
        WHERE d2."acadTermFileID" = f."AcadTermFileListID"
        AND d2."createdBy" = s."userID"
    )
    WHERE pl."value" = s."ojtPhase" 
    AND u."isActive" = 'true' 
    AND u.roles = 'Student'
    AND (
      d."documentID" IS NULL 
      OR d."fileStatus" = (
        SELECT "lookupID"
        FROM practrack."Lookup"
        WHERE type = 'status' AND value = 'No Submission'
        LIMIT 1
      )
      OR d."fileStatus" = (
        SELECT "lookupID"
        FROM practrack."Lookup"
        WHERE type = 'status' AND value = 'Disapproved'
        LIMIT 1
      )
      OR d."fileStatus" = (
        SELECT "lookupID"
        FROM practrack."Lookup"
        WHERE type = 'status' AND value = 'Void'
        LIMIT 1
      )
    ) 
    AND f.enabled = true 
    AND tl."isActive" = true
    GROUP BY s."ojtPhase", f."ojtPhase", "acadTerm", s."AcademicTerm", u."userID", u."lastName", u."firstName", s."degreeCode" 
    ORDER BY f."ojtPhase", s."AcademicTerm", LOWER(u."lastName"), LOWER(u."firstName"), s."degreeCode";
  `;
  const { rows } = await db.query(query);
  return rows;
};

exports.getChartData = async (term) => {
  const query = `
    SELECT COALESCE(COUNT(u."userID"), 0) AS total, 
    COALESCE(COUNT(CASE WHEN s."ojtPhase" = 'Pre-Deployment' THEN u."userID" END), 0) AS total_pre, 
    COALESCE(COUNT(CASE WHEN s."ojtPhase" = 'Deployment' THEN u."userID" END), 0) AS total_ongoing, 
    COALESCE(COUNT(CASE WHEN s."ojtPhase" = 'Post-Deployment' THEN u."userID" END), 0) AS total_post,  
    COALESCE(COUNT(CASE WHEN s."ojtPhase" = 'Completed' THEN u."userID" END), 0) AS total_completed
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

exports.getRequests = async () => {
  const query = `
    SELECT s."userID", s."degreeCode", CONCAT(u."firstName", ' ', u."lastName") AS "fullName"
    FROM practrack."Students" s
    JOIN practrack."Users" u ON u."userID" = s."userID" 
    WHERE "requestMigrate" = TRUE;
  `;
  const { rows } = await db.query(query);
  return rows;
};

// STUDENT HOME

// Based off getMissing
exports.getPending = async (uid) => {
  const query = `
    SELECT COALESCE(COUNT(DISTINCT f."AcadTermFileListID"), 0) AS pending_submissions_count 
    FROM practrack."AcadTermFileList" f 
    JOIN practrack."Lookup" dl ON f."Requirement" = dl."lookupID" 
    JOIN practrack."Lookup" tl ON f."AcadTerm" = tl."lookupID" 
    JOIN practrack."Lookup" pl ON f."ojtPhase" = pl."lookupID" 
    JOIN practrack."Students" s ON s."ojtPhase" = pl."value" 
    JOIN practrack."Users" u ON s."userID" = u."userID" 
    LEFT JOIN practrack."Documents" d ON d."acadTermFileID" = f."AcadTermFileListID" 
    AND d."createdBy" = s."userID" 
    AND d."version" = (
        SELECT MAX(d2."version")
        FROM practrack."Documents" d2
        WHERE d2."acadTermFileID" = f."AcadTermFileListID"
        AND d2."createdBy" = s."userID"
    )
    WHERE pl."value" = s."ojtPhase" 
    AND (
      d."documentID" IS NULL 
      OR d."fileStatus" = (
        SELECT "lookupID"
        FROM practrack."Lookup"
        WHERE type = 'status' AND value = 'No Submission'
        LIMIT 1
      )
      OR d."fileStatus" = (
        SELECT "lookupID"
        FROM practrack."Lookup"
        WHERE type = 'status' AND value = 'Disapproved'
        LIMIT 1
      )
      OR d."fileStatus" = (
        SELECT "lookupID"
        FROM practrack."Lookup"
        WHERE type = 'status' AND value = 'Void'
        LIMIT 1
      )
    ) 
    AND f.enabled = true
    AND f."AcadTerm" = s."AcademicTerm"
    AND s."userID" = $1;
  `;
  const params = [uid];
  const { rows } = await db.query(query, params);
  return rows[0];
};

// Based off getPending
exports.getDue = async (uid) => {
  const query = `
  SELECT DISTINCT GREATEST(DATE_PART('day', f."dueDate"::timestamp - now()::timestamp), -1) as date_diff
  FROM practrack."AcadTermFileList" f 
  JOIN practrack."Lookup" dl ON f."Requirement" = dl."lookupID" 
  JOIN practrack."Lookup" tl ON f."AcadTerm" = tl."lookupID" 
  JOIN practrack."Lookup" pl ON f."ojtPhase" = pl."lookupID" 
  JOIN practrack."Students" s ON s."ojtPhase" = pl."value" 
  JOIN practrack."Users" u ON s."userID" = u."userID" 
  LEFT JOIN practrack."Documents" d ON d."acadTermFileID" = f."AcadTermFileListID" 
  AND d."createdBy" = s."userID" 
  AND d."version" = (
      SELECT MAX(d2."version")
      FROM practrack."Documents" d2
      WHERE d2."acadTermFileID" = f."AcadTermFileListID"
      AND d2."createdBy" = s."userID"
  )
  WHERE pl."value" = s."ojtPhase" 
  AND (
    d."documentID" IS NULL 
    OR d."fileStatus" = (
      SELECT "lookupID"
      FROM practrack."Lookup"
      WHERE type = 'status' AND value = 'No Submission'
      LIMIT 1
    )
    OR d."fileStatus" = (
      SELECT "lookupID"
      FROM practrack."Lookup"
      WHERE type = 'status' AND value = 'Disapproved'
      LIMIT 1
    )
    OR d."fileStatus" = (
      SELECT "lookupID"
      FROM practrack."Lookup"
      WHERE type = 'status' AND value = 'Void'
      LIMIT 1
    )
  ) 
  AND f.enabled = true
  AND f."AcadTerm" = s."AcademicTerm"
  AND s."userID" = $1
  GROUP BY f."AcadTermFileListID"
  HAVING 
    (GREATEST(DATE_PART('day', f."dueDate"::timestamp - now()::timestamp), -1) BETWEEN 0 AND 7)
  OR
    (GREATEST(DATE_PART('day', f."dueDate"::timestamp - now()::timestamp), -1) < 0)
  ORDER BY date_diff ASC
  LIMIT 2;
  `;
  const params = [uid];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getStudentData = async (uid) => {
  const query = `
    SELECT u."firstName", s."studentID", s."ojtPhase", s."requestMigrate", s."hoursRendered", h."hours", c."companyName",
    TO_CHAR(s."startDate", 'Mon DD, YYYY') AS "startDate",
    TO_CHAR(s."endDate", 'Mon DD, YYYY') AS "endDate"
    FROM practrack."Users" u 
    JOIN practrack."Students" s ON u."userID" = s."userID" 
    LEFT JOIN practrack."CompanyList" c ON s."companyID" = c."companyID" 
    LEFT JOIN practrack."AcadTermHours" h ON s."AcademicTerm" = h."acadTerm" 
    WHERE s."userID" = $1;
  `;
  const params = [uid];
  const { rows } = await db.query(query, params);
  return rows[0];
};
