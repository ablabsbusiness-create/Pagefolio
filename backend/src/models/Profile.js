const mongoose = require("mongoose");

const socialLinkSchema = new mongoose.Schema(
  {
    platform: {
      type: String,
      trim: true,
      maxlength: 50
    },
    url: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  { _id: false }
);

const serviceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1500
    },
    link: {
      type: String,
      trim: true,
      maxlength: 500
    },
    image: {
      type: String,
      trim: true,
      maxlength: 500
    }
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    displayName: {
      type: String,
      trim: true,
      maxlength: 120
    },
    headline: {
      type: String,
      trim: true,
      maxlength: 200
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 3000
    },
    location: {
      type: String,
      trim: true,
      maxlength: 120
    },
    profileImage: {
      type: String,
      trim: true,
      maxlength: 500
    },
    coverImage: {
      type: String,
      trim: true,
      maxlength: 500
    },
    whatsapp: {
      type: String,
      trim: true,
      maxlength: 30
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200
    },
    website: {
      type: String,
      trim: true,
      maxlength: 500
    },
    websiteType: {
      type: String,
      enum: ["website", "webpage"],
      default: "website"
    },
    selectedTemplate: {
      type: String,
      trim: true,
      maxlength: 100
    },
    socialLinks: {
      type: [socialLinkSchema],
      default: []
    },
    services: {
      type: [serviceSchema],
      default: []
    },
    projects: {
      type: [projectSchema],
      default: []
    },
    theme: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    isPublic: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Profile", profileSchema);
