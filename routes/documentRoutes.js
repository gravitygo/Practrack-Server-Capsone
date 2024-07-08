const express = require("express");
const router = express.Router();

const DocumentController = require("../controller/documentController");

router.get("/file/:id", DocumentController.getSubmittedDocument);
router.post("/file/:id", DocumentController.insertBatchDocuments);
router.get("/batch/:batch", DocumentController.getBatchDocuments);
router.get("/oulc", DocumentController.getSubmittedDocumentsOULC);
router.patch("/batch/:batch", DocumentController.updateBatchDocuments);
router.patch("/file/:id", DocumentController.updateFileEnabled);
router.patch("/oulc/:documentID", DocumentController.updateSubmittedDocuments);
router.get(
  "/student/documents/:userID/:acadTerm/:phase",
  DocumentController.getDocumentsStudentView
);
router.get("/document/:id", DocumentController.getDocument);
router.get(
  "/document/:userID/:ojtPhase/:acadTerm",
  DocumentController.getSubmittedDocumentCoordinator
);
router.post("/document", DocumentController.submitDocument);
router.post("/dtr", DocumentController.submitDtr);
router.post("/document/v2", DocumentController.submitDocumentV2);
router.patch("/document", DocumentController.updateDocument);
router.patch("/feedback", DocumentController.documentFeedback);
router.post("/save", DocumentController.saveDeployment);
router.post("/reset/:uid", DocumentController.resetDeployment);
router.post("/request", DocumentController.requestMigrate);
router.post("/decision", DocumentController.decisionMigrate);

router.post(
  "/getAllSubmittedDocumentsRequirement",
  DocumentController.getAllSubmittedDocumentsRequirement
);
router.post(
  "/getAllSubmittedDocuments",
  DocumentController.getAllSubmittedDocuments
);
module.exports = router;
