const express = require("express");
const router = express.Router();
const multer = require("multer");
const profileController = require("../controllers/profileController");
const { verifyToken } = require("../middleware/auth");

// Memory storage for multer (for Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use((req, res, next) => {
  console.log('Profile route hit:', req.method, req.originalUrl);
  next();
});

router.use(verifyToken);

// Get profile
router.get("/", profileController.getProfile);

// Save / update profile with image
router.post("/", upload.single("image"), profileController.saveProfile);

router.put("/", profileController.updateProfile);

module.exports = router;
