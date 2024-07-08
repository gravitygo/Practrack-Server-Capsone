const express = require("express");
const router = express.Router();

const AnnouncementController = require("../controller/announcementController");

// View All Announcements = STUDENT
router.get("/:id/student", AnnouncementController.getStudentProfile);
router.get(
  "/:id/student/:batch",
  AnnouncementController.viewBatchAnnouncements
);

// View All Announcements = COOR
router.get("/coor", AnnouncementController.viewAnnouncements);
router.get("/coor/:batch", AnnouncementController.viewFilteredAnnouncements);

// View One Announcement
router.get(
  "/:id/:announcementID/view/:role",
  AnnouncementController.viewAnnouncement
);

// CRUD
router.post("/read/:announcementId/:userId", AnnouncementController.setRead);
router.post("/:id/add", AnnouncementController.addAnnouncement);
router.post(
  "/:id/:announcementID/save",
  AnnouncementController.saveAnnouncement
);
router.delete(
  "/:id/:announcementID/delete",
  AnnouncementController.deleteAnnouncement
);
module.exports = router;
