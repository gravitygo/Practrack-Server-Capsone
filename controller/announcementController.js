const AnnouncementService = require("../services/announcementService");

// View All Announcements = STUDENT

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
    const uid = req.params.id;
    const getAnnouncements = await AnnouncementService.viewBatchAnnouncements({
      batch,
      uid,
    });
    res.json({ announcements: getAnnouncements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// View All Announcements = COOR

exports.viewAnnouncements = async (req, res) => {
  try {
    const userID = req.params.id;
    const getAnnouncements = await AnnouncementService.viewAnnouncements();
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
        batch,
      });
    res.json({ announcements: getAnnouncements });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// View One Announcement
exports.viewAnnouncement = async (req, res) => {
  try {
    const announcementID = req.params.announcementID;
    const uid = req.params.id;
    const role = req.params.role;

    if (role == "student") {
      const viewAnnouncement =
        await AnnouncementService.viewAnnouncementStudent({
          announcementID,
          uid,
        });
      res.json({ announcement: viewAnnouncement });
    } else {
      const viewAnnouncement = await AnnouncementService.viewAnnouncementCoor({
        announcementID,
      });
      res.json({ announcement: viewAnnouncement });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// CRUD

exports.setRead = async (req, res) => {
  try {
    const read = await AnnouncementService.setRead({
      announcementId: req.params.announcementId,
      userId: req.params.userId,
    });
    res.json(read);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.addAnnouncement = async (req, res) => {
  try {
    const newAnnouncement = await AnnouncementService.addAnnouncement(req.body);
    res.json({ announcement: newAnnouncement });
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
