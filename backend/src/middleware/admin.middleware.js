const env = require("../config/env");

const adminMiddleware = (req, res, next) => {
  if (!req.user || !req.user.uid) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access"
    });
  }

  if (req.user.uid !== env.adminUid) {
    return res.status(403).json({
      success: false,
      message: "Admin access only"
    });
  }

  return next();
};

module.exports = adminMiddleware;
