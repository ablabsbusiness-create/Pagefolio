const express = require("express");
const {
  trackProfileView,
  getAnalyticsByUsername
} = require("../controllers/analytics.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/view/:username", trackProfileView);
router.get("/:username", authMiddleware, getAnalyticsByUsername);

module.exports = router;
