const AnnouncementService = require("../services/announcementService");

exports.addAnnouncement = async (req, res) => {
  try {
    const newAnnouncement = await AnnouncementService.addAnnouncement(req.body);
    res.json({ announcement: newAnnouncement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.viewAnnouncements = async (req, res) => {
  try {
    const userID = req.params.id;
    const getAnnouncements = await AnnouncementService.viewAnnouncements({
      userID,
    });
    res.json({ announcements: getAnnouncements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.viewFilteredAnnouncements = async (req, res) => {
  try {
    const userID = req.params.id;
    const batch = req.params.batch;
    const getAnnouncements =
      await AnnouncementService.viewFilteredAnnouncements({
        userID,
        batch,
      });
    res.json({ announcements: getAnnouncements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getStudentProfile = async (req, res) => {
  try {
    const userID = req.params.id;
    const getStudentProfile = await AnnouncementService.getStudentProfile({
      userID,
    });
    res.json({ profile: getStudentProfile });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.viewBatchAnnouncements = async (req, res) => {
  try {
    const batch = req.params.batch;
    const getAnnouncements = await AnnouncementService.viewBatchAnnouncements({
      batch,
    });
    res.json({ announcements: getAnnouncements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.viewAnnouncement = async (req, res) => {
  try {
    const announcementID = req.params.announcementID;
    const viewAnnouncement = await AnnouncementService.viewAnnouncement({
      announcementID,
    });
    res.json({ announcement: viewAnnouncement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveAnnouncement = async (req, res) => {
  try {
    const announcementID = req.params.announcementID;
    const saveAnnouncement = await AnnouncementService.saveAnnouncement({
      announcementID,
      ...req.body,
    });
    res.json({ announcement: saveAnnouncement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAnnouncement = async (req, res) => {
  try {
    const announcementID = req.params.announcementID;
    const uid = req.params.id;
    const deleteAnnouncement = await AnnouncementService.deleteAnnouncement({
      announcementID,
      uid,
    });
    res.json({ announcement: deleteAnnouncement });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
