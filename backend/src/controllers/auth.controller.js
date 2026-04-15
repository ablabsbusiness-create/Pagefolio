const admin = require("firebase-admin");
const apiResponse = require("../utils/apiResponse");
const { getAuth, getFirestore } = require("../config/firebaseAdmin");

const sanitizeUser = (data = {}) => ({
  uid: data.uid || "",
  name: data.name || "",
  email: data.email || "",
  username: data.username || "",
  phoneNumber: data.phoneNumber || "",
  websiteName: data.websiteName || "",
  websiteType: data.websiteType || "",
  selectedTemplate: data.selectedTemplate || "",
  website: data.website || "",
  dashboard: data.dashboard || ""
});

const signup = async (req, res) => {
  res.status(410).json(
    apiResponse({
      success: false,
      message: "Email signup is disabled. Use Google login instead."
    })
  );
};

const login = async (req, res) => {
  res.status(410).json(
    apiResponse({
      success: false,
      message: "Email login is disabled. Use Google login instead."
    })
  );
};

const googleLogin = async (req, res, next) => {
  try {
    const token = (req.body.credential || req.body.idToken || "").trim();

    if (!token) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "Firebase ID token is required"
        })
      );
    }

    const decoded = await getAuth().verifyIdToken(token);
    const db = getFirestore();
    const userRef = db.collection("users").doc(decoded.uid);
    const userSnapshot = await userRef.get();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    const payload = {
      uid: decoded.uid,
      name: decoded.name || decoded.email || "",
      email: decoded.email || "",
      updatedAt: timestamp
    };

    if (!userSnapshot.exists) {
      payload.createdAt = timestamp;
    }

    await userRef.set(payload, { merge: true });
    const storedUser = (await userRef.get()).data() || payload;

    res.status(200).json(
      apiResponse({
        message: "Firebase login successful",
        data: {
          token,
          user: sanitizeUser(storedUser)
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const db = getFirestore();
    const snapshot = await db.collection("users").doc(req.user.uid).get();
    const userData = snapshot.exists ? snapshot.data() : {};

    res.status(200).json(
      apiResponse({
        message: "Authenticated user fetched successfully",
        data: {
          user: sanitizeUser({
            uid: req.user.uid,
            name: req.user.name,
            email: req.user.email,
            ...userData
          })
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  signup,
  login,
  googleLogin,
  getMe
};
