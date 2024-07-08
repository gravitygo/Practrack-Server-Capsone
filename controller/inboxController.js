const inboxService = require("../services/inboxService");

exports.getChats = async (req, res) => {
  try {
    const chats = await inboxService.getChats({
      userID: req.params.userID,
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

exports.setRead = async (req, res) => {
  try {
    const read = await inboxService.setRead({
      chatId: req.params.chatId,
      userId: req.params.userId,
    });
    res.json(read);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.createChat = async (req, res) => {
  try {
    const chat = await inboxService.createChat({
      isGroup: req.body.isGroup,
      mainId: req.body.mainId,
      batch: req.body.batch,
    });
    res.json(chat);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const member = await inboxService.addMember({
      chatId: req.body.chatId,
      userId: req.body.userId,
    });
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getMembers = async (req, res) => {
  try {
    const members = await inboxService.getMembers({
      chatId: req.params.chatId,
    });
    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getChatCompany = async (req, res) => {
  try {
    const companyID = await inboxService.getChatCompany({
      chatId: req.params.chatId,
    });
    res.json(companyID);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getCompaniesWithInterns = async (req, res) => {
  try {
    const companies = await inboxService.getCompaniesWithInterns({
      batch: req.params.batch,
      uid: req.params.uid,
    });
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getInternsOfCompany = async (req, res) => {
  try {
    const interns = await inboxService.getInternsOfCompany({
      companyID: req.params.companyID,
    });
    res.json(interns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
