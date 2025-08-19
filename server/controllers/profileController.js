const User = require('../models/User');
const Profile = require('../models/Profile');
const cloudinary = require('cloudinary').v2;

// Upload image to Cloudinary helper
const uploadToCloudinary = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: "profiles", // optional folder in cloudinary
      resource_type: "auto"
    });
    return result.secure_url; // Cloudinary hosted URL
  } catch (error) {
    throw new Error("Image upload failed");
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate("mcpId");
    if (!profile) {
      return res.status(404).json({ success: false, message: "Profile not found" });
    }
    res.status(200).json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error fetching profile", error: err.message });
  }
};

// Create or update user profile
exports.saveProfile = async (req, res) => {
  try {
    const { name, phone, role, mcpId } = req.body;
    let imageUrl;

    // Check if file uploaded
    if (req.file) {
      imageUrl = await uploadToCloudinary(req.file.path);
    }

    // Find existing profile
    let profile = await Profile.findOne({ user: req.user.id });

    if (profile) {
      // Update existing profile
      profile.name = name || profile.name;
      profile.phone = phone || profile.phone;
      profile.image = imageUrl || profile.image;
      profile.role = role || profile.role;
      profile.mcpId = mcpId || profile.mcpId;
      await profile.save();
      return res.status(200).json({ success: true, message: 'Profile updated successfully', profile });
    } else {
      // Create new profile
      profile = await Profile.create({
        user: req.user.id,
        name,
        phone,
        image: imageUrl || "",
        role,
        mcpId,
      });
      return res.status(201).json({ success: true, message: 'Profile created successfully', profile });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Error saving profile", error: err.message });
  }
};
