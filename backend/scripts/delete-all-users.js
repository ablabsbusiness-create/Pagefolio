const admin = require("firebase-admin");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

dotenv.config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
if (!serviceAccountPath) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_PATH is required");
}

const absolutePath = path.resolve(serviceAccountPath);
const raw = fs.readFileSync(absolutePath, "utf8");
const serviceAccount = JSON.parse(raw);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const deleteFirestoreUsers = async () => {
  const batchSize = 200;
  let deleted = 0;

  while (true) {
    const snapshot = await db.collection("users").limit(batchSize).get();
    if (snapshot.empty) break;

    const batch = db.batch();
    snapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    deleted += snapshot.size;
  }

  return deleted;
};

const deleteAuthUsers = async () => {
  let deleted = 0;
  let pageToken;

  do {
    const result = await admin.auth().listUsers(1000, pageToken);
    const uids = result.users.map((user) => user.uid);
    if (uids.length) {
      const deleteResult = await admin.auth().deleteUsers(uids);
      deleted += deleteResult.successCount;
    }
    pageToken = result.pageToken;
  } while (pageToken);

  return deleted;
};

const run = async () => {
  console.log("Deleting Firestore users...");
  const firestoreDeleted = await deleteFirestoreUsers();
  console.log(`Deleted Firestore docs: ${firestoreDeleted}`);

  console.log("Deleting Firebase Auth users...");
  const authDeleted = await deleteAuthUsers();
  console.log(`Deleted Auth users: ${authDeleted}`);
};

run().catch((error) => {
  console.error("Delete failed:", error);
  process.exitCode = 1;
});
