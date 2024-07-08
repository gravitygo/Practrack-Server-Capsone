const db = require("../db");
const admin = require("firebase-admin");

exports.viewAccount = async ({ userID }) => {
  const query = `
    SELECT "u".*, "s".*, "f".*, c."companyName",
    TO_CHAR(s."startDate", 'Mon DD, YYYY') AS "startDate",
    TO_CHAR(s."endDate", 'Mon DD, YYYY') AS "endDate"
    FROM "practrack"."Users" "u"
    JOIN "practrack"."Students" "s" ON "u"."userID" = "s"."userID"
    LEFT JOIN "practrack"."FieldOfInterest" "f" ON "s"."fieldID" = "f"."fieldID"
    LEFT JOIN practrack."CompanyList" c ON s."companyID" = c."companyID" 
    WHERE "u"."userID" = $1`;
  const params = [userID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.viewAccountCoor = async ({ userID }) => {
  const query = `
    SELECT *
    FROM "practrack"."Users"
    WHERE "userID" = $1`;
  const params = [userID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.viewInterests = async () => {
  const query = `
  SELECT *
  FROM "practrack"."FieldOfInterest"`;
  const { rows } = await db.query(query);
  return rows;
};

exports.viewWorkSetup = async () => {
  const query = `
  SELECT *
  FROM "practrack"."Lookup"
  WHERE "type" = 'workSetup'`;
  const { rows } = await db.query(query);
  return rows;
};

exports.viewJobList = async () => {
  const query = `
  SELECT *
  FROM "practrack"."JobList"`;
  const { rows } = await db.query(query);
  return rows;
};

exports.updateAccount = async ({
  userID,
  fieldID,
  addrRegion,
  addrProvince,
  addrCity,
  workSetup,
  jobPosition,
  allowance,
}) => {
  const query = `
  UPDATE "practrack"."Students"
  SET 
    "fieldID" = $1,
    "addrRegion" = $2, 
    "addrProvince" = $3, 
    "addrCity" = $4,
    "workSetup" = $5,
    "lastEditedBy" = $6,
    "dateLastEdited" = now(),
    "jobPrefID" = $7,
    "allowance" = $8
  WHERE "userID" = $9;`;

  const params = [
    fieldID,
    addrRegion,
    addrProvince,
    addrCity,
    workSetup,
    userID,
    jobPosition,
    allowance,
    userID,
  ];

  const { rows } = await db.query(query, params);

  return { rows };
};

exports.getEmail = async ({ userID }) => {
  const query = `
  SELECT "email"
  FROM "practrack"."Users"
  WHERE "userID" = $1`;
  const params = [userID];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getUsersWithPhase = async () => {
  const query = `
  SELECT 
    *
  FROM practrack.student_ojt_phase_info`;
  const { rows } = await db.query(query);
  return rows;
};

exports.getUsersWithSpecificPhase = async (phaseId) => {
  const query = `
  SELECT 
    *
  FROM practrack.student_ojt_phase_info
  WHERE "ojtPhaseID" = $1`;
  const params = [phaseId];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.getCurrentUsersWithPhase = async (userId) => {
  const query = `
  SELECT 
    *
  FROM practrack.student_ojt_phase_info
  WHERE "createdBy" like $1`;
  const params = [userId];
  const { rows } = await db.query(query, params);
  return rows[0];
};

exports.setStudent = async (uid) => {
  await admin.auth().setCustomUserClaims(uid, { role: "student" });
};

exports.createCoordinator = async ({ email }) => {
  var success;
  var createdUID;

  // Generate random string of alphanumeric characters
  const upperCase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowerCase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const specialChars = "!@#$%^&*()_+[]{}|;:,.<>?";

  const allChars = upperCase + lowerCase + numbers + specialChars;

  let randomString = "";
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * allChars.length);
    randomString += allChars[randomIndex];
  }

  await admin
    .auth()
    .createUser({
      email: email,
      password: randomString,
      disabled: false,
    })
    .then((userRecord) => {
      console.log("Successfully created new user");
      createdUID = userRecord.uid;
      success = true;
    })
    .catch((error) => {
      console.error(error);
      success = false;
      createdUID = 0;
    });
  return { createdUID, success };
};

exports.registerCoordinator = async ({
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

  const query2 = `
  INSERT INTO "practrack"."MOAConfiguration"("coorID") VALUES($1)`;

  const params = [userID, firstName, lastName, email, isActive, roles, userID];
  const params2 = [userID];

  const { rows } = await db.query(query, params);
  const { rows2 } = await db.query(query2, params2);

  return { rows, rows2 };
};

exports.setCoordinator = async (uid) => {
  await admin.auth().setCustomUserClaims(uid, { role: "coordinator" });
};

exports.deleteAccount = async (user) => {
  // user = auth.currentUser;
  const uid = user.uid;
  const query = `
  UPDATE practrack."Users"
  SET 
    "isActive" = false,
    "lastEditedBy" = $1,
    "dateLastEdited" = now()
  WHERE "userID" = $1;
  `;
  const params = [uid];
  var success;

  // DELETE FROM FIREBASE
  await admin
    .auth()
    .deleteUser(uid)
    .then(() => {
      // UPDATE SUPABASE
      db.query(query, params);
      console.log("Account deleted");
      success = true;
    })
    .catch((error) => {
      console.error(error);
      success = false;
    });

  return success;
};

exports.getUserByRole = async (userId, role) => {
  const query = `
  SELECT
    u."userID" AS "id",
    CONCAT(u."firstName", ' ', u."lastName") AS "name"
  FROM
    practrack."Users" u
  LEFT JOIN
    practrack."Students" s ON u."userID" = s."userID"
  LEFT JOIN
    practrack."Lookup" l ON s."AcademicTerm" = l."lookupID"
  WHERE
    u."isActive" = true
    AND lower(u."roles") != $1
    AND (
      lower($1) != 'coordinator'
      OR (lower($1) = 'coordinator' AND l."isActive" = true)
    )
    AND u."userID" NOT IN (
      SELECT m."userID"
      FROM practrack."ChatMembers" m
      JOIN practrack."ChatRooms" cr ON m."chatID" = cr."chatID"
      WHERE m."userID" = u."userID"
      AND cr."isGroup" = false
      AND cr."chatID" IN (
        SELECT cm."chatID"
        FROM practrack."ChatMembers" cm
        WHERE cm."userID" = $2
      )
    )
  ORDER BY LOWER(u."lastName"), LOWER(u."firstName");
  `;

  const params = [role, userId];
  const { rows } = await db.query(query, params);
  return rows;
};

exports.saveCriteria = async (userID, criteria) => {
  const query = `
  UPDATE "practrack"."Students"
  SET 
    "prefRank" = $1
  WHERE "userID" = $2;`;

  const params = [criteria, userID];

  const { rows } = await db.query(query, params);

  return { rows };
};

exports.getCriteria = async (userID) => {
  const query = `
  SELECT "prefRank"
  FROM "practrack"."Students"
  WHERE "userID" = $1;`;

  const params = [userID];

  const { rows } = await db.query(query, params);

  return { rows };
};
