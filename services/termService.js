const db = require("../db");

exports.getCurrentTerm = async () => {
  const query = `
      SELECT "lookupID", value
      FROM practrack."Lookup"
      WHERE type = 'academicTerm'
      AND "isActive" = true
      ORDER BY "lookupID" DESC
      LIMIT 1;
    `;
  const { rows } = await db.query(query);
  return rows[0];
};
