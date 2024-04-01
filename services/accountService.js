const db = require("../db");
const admin = require("firebase-admin");

exports.viewAccount = async ({ userID }) => {
  const query = `
    SELECT "u".*, "s".*, "f".*
    FROM "practrack"."Users" "u"
    JOIN "practrack"."Students" "s" ON "u"."userID" = "s"."userID"
    LEFT JOIN "practrack"."FieldOfInterest" "f" ON "s"."fieldID" = "f"."fieldID"
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
    "jobPrefID" = $7
  WHERE "userID" = $8;`;

  const params = [
    fieldID,
    addrRegion,
    addrProvince,
    addrCity,
    workSetup,
    userID,
    jobPosition,
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
    *, 
    TO_CHAR("startDate", 'Mon DD, YYYY') AS "formattedStartDate",
    TO_CHAR("endDate", 'Mon DD, YYYY') AS "formattedEndDate"
  FROM practrack.student_ojt_phase_information`;
  const { rows } = await db.query(query);
  return rows;
};

exports.getCurrentUsersWithPhase = async (userId) => {
  const query = `
  SELECT 
    *
  FROM practrack.student_ojt_phase_information
  WHERE "createdBy" like $1`;
  const params = [userId];
  const { rows } = await db.query(query, params);
  return rows[0];
};

exports.setStudent = async (uid) => {
  console.log(uid);
  await admin.auth().setCustomUserClaims(uid, { role: "student" });
};

exports.createCoordinator = async ({ email }) => {
  var success;
  var createdUID;
  await admin
    .auth()
    .createUser({
      email: email,
      password: "12345678",
      disabled: false,
    })
    .then((userRecord) => {
      console.log("Successfully created new user:", userRecord.uid);
      createdUID = userRecord.uid;
      success = true;
    })
    .catch((error) => {
      console.log("Error creating new user:", error);
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
  console.log(uid);
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
      console.log("Account deleted: ", uid);
      success = true;
    })
    .catch((error) => {
      console.log("Error deleting account:", error);
      success = false;
    });

  return success;
};

exports.getUserByRole = async (userId, role) => {
  const query = `
  SELECT
    "userID",
    CONCAT("firstName", ' ', "lastName") AS "fullName"
  FROM
    practrack."Users"
  WHERE
    "isActive" = true
    AND lower("roles") != $1
    AND NOT exists (
      SELECT
        coordinator AS "userID"
      FROM
        practrack."Chats"
      WHERE
      "${role}" = $2
        AND practrack."Users"."userID" = practrack."Chats".${
          role == "student" ? "coordinator" : "student"
        }
    )
  ORDER BY
    "lastName",
    "firstName";
  `;

  const params = [role, userId];
  const { rows } = await db.query(query, params);
  return rows;
};
