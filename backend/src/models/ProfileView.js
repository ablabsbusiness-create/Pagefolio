const mongoose = require("mongoose");

const profileViewSchema = new mongoose.Schema(
  {
    profileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Profile",
      required: true
    },
    username: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    ip: {
      type: String,
      trim: true,
      maxlength: 100
    },
    userAgent: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  {
    timestamps: false
  }
);

profileViewSchema.index({ username: 1, viewedAt: -1 });

module.exports = mongoose.model("ProfileView", profileViewSchema);
