const express = require("express");
const {
  getMyUser,
  updateMyUser
} = require("../controllers/user.controller");
const authMiddleware = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/me", authMiddleware, getMyUser);
router.put("/me", authMiddleware, updateMyUser);

module.exports = router;
