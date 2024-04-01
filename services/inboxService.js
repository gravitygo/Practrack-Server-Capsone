const db = require("../db");

exports.getChats = async ({ userID, role }) => {
  const query = `
    SELECT * 
    FROM practrack.get_notifications($1, $2)
  `;
  const params = [userID, role];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getMessages = async ({ chatId }) => {
  const query = `
        SELECT * 
        FROM practrack."Messages"
        WHERE "chatID" = $1
        ORDER BY "dateCreated" DESC`;
  const params = [chatId];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.insertMessage = async ({ chatId, userID, message }) => {
  const query = `
    INSERT INTO
      practrack."Messages"("chatID", "sender", "message")
    VALUES ($1, $2, $3)`;
  const params = [chatId, userID, message];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.createChat = async ({ studentId, coordinatorId }) => {
  const query = `
    INSERT INTO
      practrack."Chats"("student", "coordinator")
    VALUES ($1, $2)`;
  const params = [studentId, coordinatorId];
  const { rows, error } = await db.query(query, params);
  console.log(rows, error);
  return rows;
};
