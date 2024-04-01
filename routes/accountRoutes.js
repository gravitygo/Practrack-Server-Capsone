const express = require("express");
const router = express.Router();

const AccountController = require("../controller/accountController");

router.get("/userWithPhase", AccountController.getUsersWithPhase);
router.get("/:userID", AccountController.viewAccount);
router.post("/:userID", AccountController.updateAccount);
router.get("/:userID/coor", AccountController.viewAccountCoor);
router.get("/:userID/resetPassword", AccountController.getEmail);
router.get(
  "/userWithPhase/:userID",
  AccountController.getCurrentUsersWithPhase
);
router.patch("/claim/:userID", AccountController.setStudent);
router.post("/:userID/coor/turnover", AccountController.createCoordinator);
router.patch("/:userID/coor/turnover", AccountController.turnoverCoordinator);
router.post("/coor/deactivate", AccountController.deleteAccount);
router.get("/users/roled/:userId/:role", AccountController.getUserByRole);
module.exports = router;
