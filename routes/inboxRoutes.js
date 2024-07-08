const express = require("express");
const router = express.Router();
const inboxController = require("../controller/inboxController");

router.get("/chats/:userID", inboxController.getChats);
router.get("/chatmsgs/:chatId", inboxController.getMessages);
router.post("/chats/:chatId/:userID", inboxController.insertMessage);
router.post("/read/:chatId/:userId", inboxController.setRead);
router.post("/chat", inboxController.createChat);
router.post("/member", inboxController.addMember);
router.get("/members/:chatId", inboxController.getMembers);
router.get("/company/:chatId", inboxController.getChatCompany);
router.get("/companies/:batch/:uid", inboxController.getCompaniesWithInterns);
router.get("/interns/:companyID", inboxController.getInternsOfCompany);
module.exports = router;
