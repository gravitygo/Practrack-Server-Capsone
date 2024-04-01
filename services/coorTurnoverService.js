const db = require("../db");

exports.countActiveCoors = async () => {
  const query = `
    SELECT COUNT(*) FROM practrack."Users"
    WHERE roles = 'Coordinator'
    AND "isActive" = true;
    `;
  const { rows } = await db.query(query);
  return rows[0].count;
};
