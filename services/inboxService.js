const db = require("../db");

exports.getChats = async ({ userID }) => {
  const query = `
    SELECT * 
    FROM practrack.get_chats($1)
  `;
  const params = [userID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getMessages = async ({ chatId }) => {
  const query = `
    SELECT m.*,
    TO_CHAR(m."dateCreated" AT TIME ZONE 'Asia/Singapore', 'Mon DD, YYYY HH:MI AM') AS "formattedDateCreated",
    CONCAT(s."firstName", ' ', s."lastName") AS "fullName"
    FROM practrack."ChatMessages" m
    JOIN practrack."Users" s ON s."userID" = m."sender"
    WHERE "chatID" = $1
    ORDER BY m."dateCreated" DESC`;
  const params = [chatId];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.insertMessage = async ({ chatId, userID, message }) => {
  const query = `
    INSERT INTO
      practrack."ChatMessages"("chatID", "sender", "message")
    VALUES ($1, $2, $3)`;
  const params = [chatId, userID, message];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.setRead = async ({ chatId, userId }) => {
  const query = `
    UPDATE practrack."ChatMembers"
    SET "isRead" = NOT "isRead"
    WHERE "chatID" = $1
    AND "userID" = $2;
  `;
  const params = [chatId, userId];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.createChat = async ({ isGroup, mainId, batch }) => {
  let query;
  let params;

  if (isGroup) {
    query = `
      INSERT INTO
        practrack."ChatRooms"("isGroup", "mainID", "batch")
      VALUES ($1, $2, $3)
      RETURNING "chatID";
    `;
    params = [isGroup, mainId, batch];
  } else {
    query = `
      INSERT INTO
        practrack."ChatRooms"("isGroup")
      VALUES ($1)
      RETURNING "chatID";
    `;
    params = [isGroup];
  }

  const { rows } = await db.query(query, params);
  return rows;
};

exports.addMember = async ({ chatId, userId }) => {
  const query = `
    INSERT INTO
      practrack."ChatMembers"("chatID", "userID")
    VALUES ($1, $2)`;
  const params = [chatId, userId];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getMembers = async ({ chatId }) => {
  const query = `
    SELECT u."userID", u."firstName", u."lastName", u."roles"
    FROM practrack."Users" u
    JOIN practrack."ChatMembers" m ON u."userID" = m."userID"
    WHERE m."chatID" = $1
    ORDER BY u."roles", LOWER(u."lastName"), LOWER(u."firstName");
  `;
  const params = [chatId];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getChatCompany = async ({ chatId }) => {
  const query = `
    SELECT "mainID"
    FROM practrack."ChatRooms"
    WHERE "chatID" = $1;
  `;
  const params = [chatId];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getCompaniesWithInterns = async ({ batch, uid }) => {
  const query = `
  SELECT c."companyID" as "id", c."companyName" as "name"
  FROM practrack."CompanyList" c
  JOIN practrack."Students" s ON s."companyID" = c."companyID"
  WHERE s."ojtPhase" != 'Completed'
  AND c."companyID" NOT IN (
      SELECT cr."mainID"
      FROM practrack."ChatRooms" cr
      JOIN practrack."ChatMembers" m ON cr."chatID" = m."chatID"
      WHERE cr."batch" = $1
      AND m."userID" = $2
  )
  GROUP BY c."companyID", c."companyName"
  HAVING COUNT(s.*) > 1
  ORDER BY LOWER(c."companyName");
  `;
  const params = [batch, uid];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getInternsOfCompany = async ({ companyID }) => {
  const query = `
  SELECT u."userID"
  FROM practrack."Users" u
  JOIN practrack."Students" s ON s."userID" = u."userID"
  JOIN practrack."CompanyList" c ON c."companyID" = s."companyID"
  WHERE s."ojtPhase" != 'Completed'
  AND s."companyID" = $1;
  `;
  const params = [companyID];
  const { rows } = await db.query(query, params);
  return rows;
};
