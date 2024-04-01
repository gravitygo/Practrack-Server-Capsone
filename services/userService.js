// userService.js
const db = require("../db");
const admin = require("firebase-admin");

exports.register = async ({
  userID,
  firstName,
  lastName,
  email,
  isActive,
  roles,
}) => {
  const query =
    "" +
    'INSERT INTO "practrack"."Users"(' +
    '    "userID",' +
    '    "firstName",' +
    '    "lastName",' +
    '    "email",' +
    '    "isActive",' +
    '    "roles",' +
    '    "createdBy",' +
    '    "dateCreated"' +
    ") " +
    "VALUES(" +
    "    $1," +
    "    $2," +
    "    $3," +
    "    $4," +
    "    $5," +
    "    $6," +
    "    $7," +
    "    now()" +
    ")";
  const params = [userID, firstName, lastName, email, isActive, roles, userID];
  const { rows } = await db.query(query, params);

  // Add custom claims with role
  try {
    await admin
      .auth()
      .setCustomUserClaims(userID, { role: roles.toLowerCase() });
  } catch (error) {
    console.error("Error setting custom claims:", error);
    // Handle error appropriately
  }

  return rows;
};

exports.studentInformation = async (
  { userID, studentID, degreeCode },
  term
) => {
  const query =
    "" +
    'INSERT INTO "practrack"."Students"(' +
    '    "userID",' +
    '    "studentID",' +
    '    "degreeCode",' +
    '    "createdBy",' +
    '    "dateCreated",' +
    '    "ojtPhase",' +
    '    "AcademicTerm"' +
    ") " +
    "VALUES(" +
    "    $1," +
    "    $2," +
    "    $3," +
    "    $4," +
    "    now()," +
    "    $5," +
    "    $6" +
    ")";
  const params = [
    userID,
    studentID,
    degreeCode,
    userID,
    "Pre-Deployment",
    term,
  ];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.login = async ({ uid }) => {
  const query = 'SELECT * FROM "practrack"."Users" WHERE "userID" = $1';
  const params = [uid];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.setCustomUserClaims = async ({ users, role }) => {
  try {
    await Promise.all(
      users.map((element) =>
        admin.auth().setCustomUserClaims(element, { role: role })
      )
    );
    return "done";
  } catch (error) {
    console.error("Error setting custom claims:", error);
    // Handle error appropriately
    return error;
  }
};
