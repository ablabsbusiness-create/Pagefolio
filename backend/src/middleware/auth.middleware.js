const { getAuth } = require("../config/firebaseAdmin");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token is missing"
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = await getAuth().verifyIdToken(token);

    if (!decoded || !decoded.uid) {
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token"
      });
    }

    req.user = {
      uid: decoded.uid,
      email: decoded.email || "",
      name: decoded.name || decoded.email || ""
    };
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access"
    });
  }
};

module.exports = authMiddleware;
