// userService.js
const db = require("../db");

exports.getOptions = async (type) => {
  const query =
    'SELECT "lookupID" as "id", "value" FROM practrack."Lookup" WHERE "type" like $1 AND "isActive"=true ORDER BY "id"';
  const params = [type];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.postOptions = async ({ type, name }) => {
  const query =
    'INSERT INTO practrack."Lookup"("type", "value", "isActive" ) VALUES($1,$2,true)';
  const params = [type, name];
  const { rows } = await db.query(query, params);
  return rows;
};
exports.getById = async (id) => {
  const query = `SELECT "lookupID" as "id", "value", atfl."ojtPhase" 
    FROM practrack."Lookup" l
    JOIN practrack."AcadTermFileList" atfl ON l."lookupID" = atfl."Requirement"
    WHERE "lookupID" = $1`;
  const params = [id];
  const { rows } = await db.query(query, params);
  return rows[0];
};
