const express = require("express");
const router = express.Router();

router.get("/getStudents", (req, res) => {
  res.json({
    UserID: "1",
    FirstName: "Nicole Angela",
    LastName: "Lee",
    Email: "nicole_lee@dlsu.edu.ph",
    Password: "Yeahhhh",
    Role: "student",
    isActive: "true",
  });
});

router.get("/getUser", (req, res) => {
  res.json(
    {
      UserID: "1",
      FirstName: "Nicole Angela",
      LastName: "Lee",
      Email: "nicole_lee@dlsu.edu.ph",
      Password: "Yeahhhh",
      Role: "student",
      isActive: "true",
    },
    {
      UserID: "2",
      FirstName: "Ji An",
      LastName: "Franco",
      Email: "geanne.franco@dlsu.edu.ph",
      Password: "Yeahhhh",
      Role: "coordinator",
      isActive: "true",
    }
  );
});

// getStudentFieldOfInterest router
router.get("/getstudentFieldOfInterest", (req, res) => {
  res.json(
    {
      StudentID: "12012345",
      UserID: "1",
      FieldID: "1",
    },
    {
      StudentID: "12011111",
      UserID: "2",
      FieldID: "2",
    }
  );
});

// getDocumentsByUser router
router.get("/getDocumentsByUser/:studentID", (req, res) => {
  res.json(
    {
      DocumentID: "1",
      DocumentName: "OJT MOA Institutional 2022-DLSU_Lee_Nicole_Angela",
      Filepath: "gs://practrack-411303.appspot.com/OJT Student MOA.docx",
      Version: "1",
      SubmissionDate: "04-11-2024",
      OJTPhase: "Pre-Deployment",
      DocumentType: "MOA",
      Status: "Submitted",
      CreatedBy: "",
      CheckedBy: "",
      DueOn: "03-25-2023",
    },
    {
      DocumentID: "1",
      DocumentName: "CIS and Training Plan_Lee_Nicole_Angela",
      Filepath: "gs://practrack-411303.appspot.com/CIS and Training Plan.docx",
      Version: "1",
      SubmissionDate: "04-10-2024",
      OJTPhase: "Pre-Deployment",
      DocumentType: "CIS",
      Status: "Submitted",
      CreatedBy: "",
      CheckedBy: "",
      DueOn: "03-25-2023",
    }
  );
});

router.get("/getFieldOfInterest", (req, res) => {
  res.json(
    {
      FieldID: "1",
      FieldName: "Software Developer",
      Description:
        "A software developer is a professional who designs, creates, tests, and maintains software applications, systems, or solutions, employing various programming languages and technologies to meet specific user or business requirements.",
    },
    {
      FieldID: "2",
      FieldName: "UI/UX Designer",
      Description:
        "A UI/UX designer is a professional responsible for creating visually appealing and user-friendly interfaces, focusing on both the aesthetics (UI) and overall user experience (UX) to enhance usability and satisfaction in digital products or applications.",
    }
  );
});

router.get("/getCompanyList", (req, res) => {
  res.json(
    {
      CompanyID: "1",
      CompanyName: "Seven Seven Global Services, Inc.",
      PointOfContact: {
        PhoneNumber: "(02) 7915 7747",
        Link: "https://www.77soft.com/contactus-ph",
      },
      Address: "24 F. Ortigas Jr. Rd, San Antonio, Pasig, 1605 Metro Manila",
      NatureOfCompany: "IT Services",
      isActivePartner: "true",
      EffectivityEndDate: "2024-09-04",
      DSSAveRating: "3.5",
      StudentAveRating: "4.0",
    },
    {
      CompanyID: "2",
      CompanyName: "Digiteer",
      PointOfContact: {
        PhoneNumber: "0917 328 6935",
        Email: "careers@digiteer.digital",
        Link: "https://www.digiteer.digital/contact-us",
      },
      Address:
        "Salcedo Village, Bitspace 6/F PDCP Bank Centre, Rufino cor, L.P. Leviste Street, Makati, 1227 Metro Manila",
      NatureOfCompany: "Software Development",
      isActivePartner: "true",
      EffectivityEndDate: "2024-09-25",
      DSSAveRating: "4.0",
      StudentAveRating: "4.0",
    }
  );
});


router.get("/getJobListByCompany", (req, res) => {
  res.json({
    companyList: [{
      CompanyID: "1",
      FieldID: "1",
    },
    {
      CompanyID: "1",
      FieldID: "2",
    },
    {
      CompanyID: "2",
      FieldID: "2",
    }]
  });
});

router.get("/getAnnouncements", (req, res) => {
  res.json({
    AnnouncementID: "1",
    Title: "Orientation",
    Announcement:
      "Hi everyone! You are all required to attend the capstone orientation via Zoom.",
    Batch: "AY23-24 T2",
    DateCreated: "2024-01-08 09:00:00+08",
    CreatedBy: "2",
    DateLastEdited: null,
    LastEditedBy: null,
  });
});

module.exports = router;
