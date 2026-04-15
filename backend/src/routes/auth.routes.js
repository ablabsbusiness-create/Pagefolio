const express = require("express");
const {
  signup,
  login,
  googleLogin,
  getMe
} = require("../controllers/auth.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", authMiddleware, getMe);

module.exports = router;
