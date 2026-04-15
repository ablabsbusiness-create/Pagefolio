const env = require("../config/env");
const apiResponse = require("../utils/apiResponse");
const slugifyUsername = require("../utils/slugifyUsername");
const { getFirestore } = require("../config/firebaseAdmin");

const githubHeaders = () => ({
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${env.githubToken}`,
  "User-Agent": "pagefolio-admin"
});

const getRepoContents = async (repoPath = "") => {
  const encodedPath = repoPath ? `/${encodeURIComponent(repoPath)}` : "";
  const apiUrl = `https://api.github.com/repos/${env.githubRepoOwner}/${env.githubRepoName}/contents${encodedPath}?ref=${encodeURIComponent(
    env.githubRepoBranch
  )}`;

  const response = await fetch(apiUrl, { headers: githubHeaders() });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Could not fetch repository contents");
  }

  return response.json();
};

const getRepoFileContent = async (repoPath) => {
  const apiUrl = `https://api.github.com/repos/${env.githubRepoOwner}/${env.githubRepoName}/contents/${encodeURIComponent(
    repoPath
  )}?ref=${encodeURIComponent(env.githubRepoBranch)}`;

  const response = await fetch(apiUrl, { headers: githubHeaders() });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Could not fetch repository file");
  }

  return response.json();
};

const putRepoFile = async ({ repoPath, content, message, sha }) => {
  const apiUrl = `https://api.github.com/repos/${env.githubRepoOwner}/${env.githubRepoName}/contents/${repoPath}`;
  const response = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      ...githubHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString("base64"),
      branch: env.githubRepoBranch,
      ...(sha ? { sha } : {})
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Could not write repository file");
  }

  return response.json();
};

const deleteRepoFile = async ({ repoPath, sha, message }) => {
  const apiUrl = `https://api.github.com/repos/${env.githubRepoOwner}/${env.githubRepoName}/contents/${repoPath}`;
  const response = await fetch(apiUrl, {
    method: "DELETE",
    headers: {
      ...githubHeaders(),
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message,
      sha,
      branch: env.githubRepoBranch
    })
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || "Could not delete repository file");
  }
};

const getWebsiteCollection = () => getFirestore().collection("websites");
const getUserCollection = () => getFirestore().collection("users");

const getWebsiteMap = async () => {
  const snapshot = await getWebsiteCollection().get();
  const websiteMap = new Map();

  snapshot.forEach((doc) => {
    const data = doc.data() || {};
    const username = slugifyUsername(data.username || "");
    if (!username) return;

    websiteMap.set(username, {
      id: doc.id,
      ...data
    });
  });

  return websiteMap;
};

const listFolders = async (req, res, next) => {
  try {
    const contents = await getRepoContents("");
    const websiteMap = await getWebsiteMap();
    const folders = contents
      .filter((entry) => entry.type === "dir")
      .map((entry) => {
        const website = websiteMap.get(entry.name) || {};
        return {
          name: entry.name,
          uid: website.uid || "",
          repoUrl: entry.html_url,
          repoFolderUrl: entry.html_url,
          siteUrl: website.websiteUrl || `${env.publicSiteBase}/${entry.name}/`,
          liveUrl: website.websiteUrl || `${env.publicSiteBase}/${entry.name}/`,
          dashboardUrl: website.dashboardUrl || ""
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    res.status(200).json(
      apiResponse({
        message: "Folders fetched successfully",
        data: folders
      })
    );
  } catch (error) {
    next(error);
  }
};

const copyFolder = async (sourcePath, destPath) => {
  const contents = await getRepoContents(sourcePath);
  for (const entry of contents) {
    if (entry.type === "dir") {
      await copyFolder(`${sourcePath}/${entry.name}`, `${destPath}/${entry.name}`);
      continue;
    }

    const fileData = await getRepoFileContent(`${sourcePath}/${entry.name}`);
    const decoded = Buffer.from(fileData.content || "", "base64").toString("utf8");
    await putRepoFile({
      repoPath: `${destPath}/${entry.name}`,
      content: decoded,
      message: `Copy ${sourcePath}/${entry.name} to ${destPath}/${entry.name}`
    });
  }
};

const deleteFolder = async (folderPath) => {
  const contents = await getRepoContents(folderPath);
  for (const entry of contents) {
    if (entry.type === "dir") {
      await deleteFolder(`${folderPath}/${entry.name}`);
      continue;
    }

    await deleteRepoFile({
      repoPath: `${folderPath}/${entry.name}`,
      sha: entry.sha,
      message: `Delete ${folderPath}/${entry.name}`
    });
  }
};

const renameFolder = async (req, res, next) => {
  try {
    const from = slugifyUsername(req.body.from || "");
    const to = slugifyUsername(req.body.to || "");

    if (!from || !to || from.length < 1 || to.length < 1) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "Both current and new folder names are required"
        })
      );
    }

    if (from === to) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "Folder name is the same"
        })
      );
    }

    const currentExists = await getRepoContents(from).catch(() => null);
    if (!currentExists) {
      return res.status(404).json(
        apiResponse({
          success: false,
          message: "Folder not found"
        })
      );
    }

    const targetExists = await getRepoContents(to).catch(() => null);
    if (targetExists) {
      return res.status(409).json(
        apiResponse({
          success: false,
          message: "Target folder already exists"
        })
      );
    }

    await copyFolder(from, to);
    await deleteFolder(from);

    res.status(200).json(
      apiResponse({
        message: "Folder renamed successfully",
        data: {
          from,
          to,
          siteUrl: `${env.publicSiteBase}/${to}/`
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

const removeFolder = async (req, res, next) => {
  try {
    const name = slugifyUsername(req.body.name || "");

    if (!name) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "Folder name is required"
        })
      );
    }

    await deleteFolder(name);

    const websiteSnapshot = await getWebsiteCollection()
      .where("username", "==", name)
      .get();
    for (const doc of websiteSnapshot.docs) {
      await doc.ref.delete();
    }

    const userSnapshot = await getUserCollection()
      .where("username", "==", name)
      .get();
    for (const doc of userSnapshot.docs) {
      await doc.ref.set(
        {
          website: "",
          dashboard: "",
          selectedTemplate: "",
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    }

    res.status(200).json(
      apiResponse({
        message: "Folder deleted successfully",
        data: { name }
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listFolders,
  renameFolder,
  removeFolder
};
