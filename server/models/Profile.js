// models/Profile.js
const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // link profile to user
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    image: { type: String }, // cloudinary url
    role: { type: String, enum: ["MCP", "PICKUP_PARTNER"], default: "PICKUP_PARTNER" },
    mcpId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "MCP", // if MCP is another model
    },
  },
  { timestamps: true }
);

module.exports =  mongoose.model("Profile", profileSchema);
