const express = require("express");
const router = express.Router();
const multer = require("multer");
const profileController = require("../controllers/profileController");
const { verifyToken, authorize } = require("../middleware/auth");

// ✅ Setup Multer (use memory storage if uploading to Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.use(verifyToken);

router.get("/get", authorize, profileController.getProfile);
router.post("/edit", authorize, profileController.saveProfile);

// ✅ Use upload + correct controller function
router.post(
  "/profile",
  upload.single("image"),
  profileController.saveProfile
);

module.exports = router;
