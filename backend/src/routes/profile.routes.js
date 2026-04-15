const express = require("express");
const {
  getPublicProfile,
  upsertProfile,
  checkUsernameAvailability,
  createProfileFolder,
  publishTemplateToProfile,
  saveWebsiteContent
} = require("../controllers/profile.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/check-username/:username", checkUsernameAvailability);
router.post("/create-folder", authMiddleware, createProfileFolder);
router.post("/publish-template", authMiddleware, publishTemplateToProfile);
router.post("/save-website-content", saveWebsiteContent);
router.get("/:username", getPublicProfile);
router.post("/", authMiddleware, upsertProfile);
router.put("/", authMiddleware, upsertProfile);

module.exports = router;
