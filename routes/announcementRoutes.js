const express = require("express");
const router = express.Router();

const AnnouncementController = require("../controller/announcementController");

// All Announcements
router.get("/:id/coor", AnnouncementController.viewAnnouncements);
router.get(
  "/:id/coor/:batch",
  AnnouncementController.viewFilteredAnnouncements
);
router.get("/:id", AnnouncementController.getStudentProfile);
router.get("/:id/:batch", AnnouncementController.viewBatchAnnouncements);
router.get(
  "/:id/coor/:announcementID/view",
  AnnouncementController.viewAnnouncement
);
router.get(
  "/:id/:announcementID/view",
  AnnouncementController.viewAnnouncement
);
router.post(
  "/:id/coor/addAnnouncement",
  AnnouncementController.addAnnouncement
);
router.post(
  "/:id/coor/:announcementID/save",
  AnnouncementController.saveAnnouncement
);
router.delete(
  "/:id/coor/:announcementID",
  AnnouncementController.deleteAnnouncement
);

// Announcement Details
router.get(
  "/announcementDetails/:announcementID",
  AnnouncementController.viewAnnouncement
);
router.get(
  "/:id/announcementDetails/:announcementID",
  AnnouncementController.viewAnnouncement
);
router.post(
  "/announcementDetails/:announcementID/save",
  AnnouncementController.saveAnnouncement
);
router.delete(
  "/announcementDetails/:announcementID",
  AnnouncementController.deleteAnnouncement
);

module.exports = router;
