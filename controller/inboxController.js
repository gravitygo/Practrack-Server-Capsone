const inboxService = require("../services/inboxService");

exports.getChats = async (req, res) => {
  try {
    const chats = await inboxService.getChats({
      userID: req.params.userID,
      role: req.params.role,
    });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const messages = await inboxService.getMessages({
      chatId: req.params.chatId,
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.insertMessage = async (req, res) => {
  try {
    const messages = await inboxService.insertMessage({
      chatId: req.params.chatId,
      userID: req.params.userID,
      message: req.body.message,
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createChat = async (req, res) => {
  try {
    const chat = await inboxService.createChat({
      studentId: req.body.studentId,
      coordinatorId: req.body.coordinatorId,
    });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
