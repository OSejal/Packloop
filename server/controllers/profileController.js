const Profile = require("../models/Profile");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

// Upload buffer to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "profiles" },
      (error, result) => {
        if (result) resolve(result.secure_url);
        else reject(error);
      }
    );
    streamifier.createReadStream(fileBuffer).pipe(stream);
  });
};

// Save / update profile
exports.saveProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    let imageUrl;

    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.buffer);
      console.log('Cloudinary URL:', imageUrl); // Add this log
    }

    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      profile.name = name || profile.name;
      profile.phone = phone || profile.phone;
      profile.image = imageUrl || profile.image;
      
      await profile.save();
      console.log('Profile saved successfully'); // Add this log
      
      return res.status(200).json({ success: true, profile });
    } else {
      profile = await Profile.create({
        user: req.user.id,
        name,
        phone,
        image: imageUrl || "",
      });
      console.log('New profile created with image:', profile.image); // Add this log
      return res.status(201).json({ success: true, profile });
    }
  } catch (err) {
    console.error("Error saving profile:", err);
    res.status(500).json({ success: false, message: "Error saving profile", error: err.message });
  }
};

// Update profile without image upload
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    
    let profile = await Profile.findOne({ user: req.user.id });
    
    if (profile) {
      profile.name = name || profile.name;
      profile.phone = phone || profile.phone;
      // Keep existing image
      await profile.save();
      return res.status(200).json({ success: true, profile });
    } else {
      profile = await Profile.create({
        user: req.user.id,
        name,
        phone,
        image: "",
      });
      return res.status(201).json({ success: true, profile });
    }
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ success: false, message: "Error updating profile", error: err.message });
  }
};

// Get profile
exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    if (!profile) return res.status(404).json({ success: false, message: "Profile not found" });
    res.status(200).json({ success: true, profile });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).json({ success: false, message: "Error fetching profile", error: err.message });
  }
};
