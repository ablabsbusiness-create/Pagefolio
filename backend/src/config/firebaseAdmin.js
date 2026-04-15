const admin = require("firebase-admin");
const fs = require("fs");
const env = require("./env");

const getServiceAccount = () => {
  if (env.firebaseServiceAccountJson) {
    const parsed = JSON.parse(env.firebaseServiceAccountJson);
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
    }
    return parsed;
  }

  if (!env.firebaseServiceAccountPath) {
    throw new Error("Firebase service account credentials are not configured");
  }

  const raw = fs.readFileSync(env.firebaseServiceAccountPath, "utf8");
  const parsed = JSON.parse(raw);
  if (parsed.private_key) {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }
  return parsed;
};

const getFirebaseApp = () => {
  if (admin.apps.length) {
    return admin.app();
  }

  const serviceAccount = getServiceAccount();
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
};

const getFirestore = () => getFirebaseApp().firestore();
const getAuth = () => getFirebaseApp().auth();

module.exports = {
  getFirestore,
  getAuth
};
