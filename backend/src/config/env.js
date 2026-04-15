const dotenv = require("dotenv");

dotenv.config();

const requiredEnvVars = [
  "CLIENT_URL",
  "ADMIN_UID",
  "PUBLIC_SITE_BASE"
];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

module.exports = {
  port: process.env.PORT || 5000,
  clientUrl: process.env.CLIENT_URL,
  githubToken: process.env.GITHUB_TOKEN || "",
  githubRepoOwner: process.env.GITHUB_REPO_OWNER || "ablabsbusiness-create",
  githubRepoName: process.env.GITHUB_REPO_NAME || "Pagefolio",
  githubRepoBranch: process.env.GITHUB_REPO_BRANCH || "main",
  firebaseServiceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "",
  firebaseServiceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "",
  adminUid: process.env.ADMIN_UID,
  publicSiteBase: process.env.PUBLIC_SITE_BASE,
  nodeEnv: process.env.NODE_ENV || "development"
};
