const express = require("express");
const authMiddleware = require("../middleware/auth.middleware");
const adminMiddleware = require("../middleware/admin.middleware");
const {
  listFolders,
  renameFolder,
  removeFolder
} = require("../controllers/admin.controller");

const router = express.Router();

router.get("/folders", authMiddleware, adminMiddleware, listFolders);
router.post("/folders/rename", authMiddleware, adminMiddleware, renameFolder);
router.post("/folders/delete", authMiddleware, adminMiddleware, removeFolder);

module.exports = router;
