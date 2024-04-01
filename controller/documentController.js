const DocumentService = require("../services/documentService");

exports.getBatchDocuments = async (req, res) => {
  try {
    const batchId = req.params.batch;
    const documents = await DocumentService.getBatchDocuments({
      batchId,
    });
    res.json({ documents: documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateBatchDocuments = async (req, res) => {
  try {
    const batchId = req.params.batch;
    const documents = await DocumentService.updateBatchDocuments({
      ...req.body,
      batchId,
    });
    res.json({ documents: documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateFileEnabled = async (req, res) => {
  try {
    const id = req.params.id;
    await DocumentService.updateEnabledFile({
      ...req.body,
      id: id,
    });
    res.status(200).json({ msg: "successfuly patched" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.insertBatchDocuments = async (req, res) => {
  const id = req.params.id;
  try {
    const documents = await DocumentService.insertBatchDocuments({
      ...req.body,
      batch: id,
    });
    res.json({ id: documents });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubmittedDocuments = async (req, res) => {
  try {
    const documents = await DocumentService.getSubmittedDocuments();
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getSubmittedDocument = async (req, res) => {
  try {
    const submittedDocument = await DocumentService.getSubmittedDocument(
      req.params.id
    );
    res.json(submittedDocument);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getSubmittedDocumentCoordinator = async (req, res) => {
  try {
    const submittedDocument =
      await DocumentService.getSubmittedDocumentCoordinator({
        ...req.params,
      });
    res.json(submittedDocument);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateSubmittedDocuments = async (req, res) => {
  try {
    const submittedDocument = await DocumentService.updateSubmittedDocuments({
      ...req.body,
      documentID: req.params.documentID,
    });
    res.json(submittedDocument);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getDocumentsStudentView = async (req, res) => {
  try {
    const documentsStudentView = await DocumentService.getDocumentsStudentView({
      ...req.params,
    });
    res.json(documentsStudentView);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.submitDocument = async (req, res) => {
  try {
    const document = await DocumentService.submitDocument({
      ...req.body,
    });
    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.updateDocument = async (req, res) => {
  try {
    const document = await DocumentService.updateDocument({
      ...req.body,
    });
    res.status(200).json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
exports.getDocument = async (req, res) => {
  try {
    const document = await DocumentService.getDocument({
      ...req.params,
    });
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.documentFeedback = async (req, res) => {
  try {
    const documentFeedback = await DocumentService.documentFeedback({
      ...req.body,
    });
    res.json(documentFeedback);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.saveDeployment = async (req, res) => {
  try {
    const save = await DocumentService.saveDeployment({
      ...req.body,
    });
    res.json(save);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
