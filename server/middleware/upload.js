const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directories exist
const studentsDir = path.join(__dirname, "../uploads/students");
if (!fs.existsSync(studentsDir)) {
  fs.mkdirSync(studentsDir, { recursive: true });
}

// Configure storage for student photos
const studentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, studentsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: student_admission_timestamp.extension
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "student_" + uniqueSuffix + ext);
  },
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const uploadStudentPhoto = multer({
  storage: studentStorage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB limit
  },
});

const schoolLogoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/school-logo/");
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "logo-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Multer instance for school logo uploads
const uploadLogo = multer({
  storage: schoolLogoStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

module.exports = {
  uploadStudentPhoto,
  uploadLogo,
};
