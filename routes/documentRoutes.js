const express = require("express");
const router = express.Router();

const DocumentController = require("../controller/documentController");

router.get("/file/:id", DocumentController.getSubmittedDocument);
router.post("/file/:id", DocumentController.insertBatchDocuments);
router.get("/batch/:batch", DocumentController.getBatchDocuments);
router.patch("/batch/:batch", DocumentController.updateBatchDocuments);
router.patch("/file/:id", DocumentController.updateFileEnabled);
router.get(
  "/oulc/submittedDocuments",
  DocumentController.getSubmittedDocuments
);
router.patch("/oulc/:documentID", DocumentController.updateSubmittedDocuments);
router.get(
  "/student/documents/:userID/:acadTerm/:phase",
  DocumentController.getDocumentsStudentView
);
router.get("/document/:id", DocumentController.getDocument);
router.get(
  "/document/:userID/:ojtPhase",
  DocumentController.getSubmittedDocumentCoordinator
);
router.post("/document", DocumentController.submitDocument);
router.patch("/document", DocumentController.updateDocument);
router.patch("/feedback", DocumentController.documentFeedback);
router.post("/save", DocumentController.saveDeployment);

module.exports = router;
