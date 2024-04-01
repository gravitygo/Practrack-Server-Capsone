const express = require("express");
const router = express.Router();
const inboxController = require("../controller/inboxController");

router.get("/chats/:userID/:role", inboxController.getChats);
router.get("/chats/:chatId", inboxController.getMessages);
router.post("/chats/:chatId/:userID", inboxController.insertMessage);

router.post("/chat", inboxController.createChat);
module.exports = router;
