const admin = require("firebase-admin");
const env = require("../config/env");
const slugifyUsername = require("../utils/slugifyUsername");
const apiResponse = require("../utils/apiResponse");
const fs = require("fs/promises");
const path = require("path");
const { getFirestore } = require("../config/firebaseAdmin");

const allowedProfileFields = [
  "displayName",
  "headline",
  "bio",
  "location",
  "profileImage",
  "coverImage",
  "whatsapp",
  "phone",
  "email",
  "website",
  "websiteType",
  "selectedTemplate",
  "socialLinks",
  "services",
  "projects",
  "theme",
  "category",
  "isPublic"
];

const publicProfileFields = [
  "uid",
  "username",
  "displayName",
  "headline",
  "bio",
  "location",
  "profileImage",
  "coverImage",
  "whatsapp",
  "phone",
  "email",
  "website",
  "websiteType",
  "selectedTemplate",
  "socialLinks",
  "services",
  "projects",
  "theme",
  "category",
  "isPublic",
  "createdAt",
  "updatedAt"
];

const buildProfilePayload = (body) => {
  const payload = {};

  allowedProfileFields.forEach((field) => {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  });

  return payload;
};

const templateRegistry = {
  "adv-dass-legal": {
    websiteType: "website",
    sourcePath: path.resolve(
      __dirname,
      "../../../frontend/templates/full-website/lawyer/1/adv-dass-legal.html"
    ),
    dashboardPath: path.resolve(
      __dirname,
      "../../../frontend/templates/full-website/lawyer/1/dashboard-adv-1.html"
    )
  }
};

const getTemplateDefinition = (templateId) => templateRegistry[templateId] || null;

const getUserCollection = () => getFirestore().collection("users");
const getWebsiteCollection = () => getFirestore().collection("websites");

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const replaceElementContentById = (html, id, content) => {
  const pattern = new RegExp(
    `(<([a-z0-9-]+)[^>]*id=["']${escapeRegex(id)}["'][^>]*>)([\\s\\S]*?)(</\\2>)`,
    "i"
  );

  return html.replace(pattern, (match, openTag, tagName, inner, closeTag) => {
    return `${openTag}${content}${closeTag}`;
  });
};

const replaceTagContent = (html, tagName, content) => {
  const pattern = new RegExp(`(<${tagName}[^>]*>)([\\s\\S]*?)(</${tagName}>)`, "i");
  return html.replace(pattern, (match, openTag, inner, closeTag) => {
    return `${openTag}${content}${closeTag}`;
  });
};

const replaceAttributeById = (html, id, attribute, value) => {
  const pattern = new RegExp(
    `(<[^>]*id=["']${escapeRegex(id)}["'][^>]*\\s${attribute}=["'])([^"']*)(["'][^>]*>)`,
    "i"
  );

  return html.replace(pattern, (match, start, current, end) => {
    return `${start}${value}${end}`;
  });
};

const buildServicesMarkup = (services = []) => {
  const safeServices = Array.isArray(services) ? services : [];
  return safeServices
    .map((service, index) => {
      const delay = index % 2 ? "2" : "1";
      return `
      <div class="practice-card fade-up delay-${delay}">
        <div class="practice-icon"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23c9a84c' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M12 3v18'/%3E%3Cpath d='M7 7h10'/%3E%3Cpath d='M5 7l-3 5h6L5 7Z'/%3E%3Cpath d='M19 7l-3 5h6l-3-5Z'/%3E%3Cpath d='M4 19h16'/%3E%3C/svg%3E" alt="Service icon"></div>
        <h4>${escapeHtml(service.name || "Service")}</h4>
        <p>${escapeHtml(service.description || service.tag || "")}</p>
      </div>`;
    })
    .join("");
};

const buildTestimonialsMarkup = (testimonials = []) => {
  const safeTestimonials = Array.isArray(testimonials) ? testimonials : [];
  const slides = safeTestimonials
    .map((item, index) => {
      return `
      <div class="testimonial-slide${index === 0 ? " active" : ""}">
        <div class="testimonial-quote-mark">"</div>
        <p class="testimonial-text">${escapeHtml(item.feedback || "")}</p>
        <div class="testimonial-author-name">${escapeHtml(item.clientName || "Client")}</div>
        <div class="testimonial-author-role">Client</div>
      </div>`;
    })
    .join("");

  const dots = safeTestimonials
    .map((item, index) => {
      return `<div class="slider-dot${index === 0 ? " active" : ""}" data-idx="${index}"></div>`;
    })
    .join("");

  return `
      ${slides}
      <div class="slider-controls">
        <button class="slider-btn" id="prevBtn">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="slider-dots">${dots}</div>
        <button class="slider-btn" id="nextBtn">
          <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>`;
};

const buildFaqMarkup = (faqs = []) => {
  const safeFaqs = Array.isArray(faqs) ? faqs : [];
  return safeFaqs
    .map((item, index) => {
      const delay = Math.min(index, 4);
      return `
      <details class="faq-item fade-up delay-${delay}" ${index === 0 ? "open" : ""}>
        <summary class="faq-question">${escapeHtml(item.question || "")}</summary>
        <div class="faq-answer">${escapeHtml(item.answer || "")}</div>
      </details>`;
    })
    .join("");
};

const renderAdvDassWebsite = (templateHtml, payload) => {
  const websiteDetails = payload.websiteDetails || {};
  const contact = payload.contact || {};
  const servicesMarkup = buildServicesMarkup(payload.services || []);
  const testimonialsMarkup = buildTestimonialsMarkup(payload.testimonials || []);
  const faqMarkup = buildFaqMarkup(payload.faqs || []);
  const professionalName = escapeHtml(websiteDetails.professionalName || "Advocate");
  const professionalTitle = escapeHtml(
    websiteDetails.professionalTitle || "Advocate & Legal Consultant"
  );
  const heroHeadline = escapeHtml(websiteDetails.heroHeadline || "");
  const heroDescription = escapeHtml(websiteDetails.heroDescription || "");
  const yearsExperience = escapeHtml(websiteDetails.yearsExperience || "");
  const aboutSection = escapeHtml(websiteDetails.aboutSection || "");
  const advocatePhoto = String(
    websiteDetails.advocatePhoto ||
    "https://via.placeholder.com/900x1100?text=Advocate+Photo"
  ).trim();
  const consultationCopy = escapeHtml(contact.consultationCopy || "");
  const officeAddress = escapeHtml(contact.officeAddress || "").replace(/\r?\n/g, "<br>");
  const officeHours = escapeHtml(contact.officeHours || "").replace(/\r?\n/g, "<br>");
  const googleMapLink = String(
    contact.googleMapLink ||
    "https://www.google.com/maps?q=India&z=4&output=embed"
  ).trim();
  const phoneNumbers = [contact.primaryPhone, contact.whatsappNumber]
    .filter(Boolean)
    .map((entry) => escapeHtml(entry))
    .join("<br>");
  const email = escapeHtml(contact.email || "");
  const whatsappDigits = String(contact.whatsappNumber || "").replace(/[^\d]/g, "");
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=Hello%2C%20I%20would%20like%20to%20book%20a%20consultation.`
    : "#";

  let html = templateHtml;
  html = replaceTagContent(html, "title", `${professionalName} — Advocate & Legal Consultant`);
  html = replaceElementContentById(html, "liveBrandName", professionalName);
  html = replaceElementContentById(html, "liveFooterBrandName", professionalName);
  html = replaceElementContentById(html, "liveTeamName", professionalName);
  html = replaceElementContentById(html, "liveBrandTagline", professionalTitle);
  html = replaceElementContentById(html, "liveTeamRole", professionalTitle);
  html = replaceElementContentById(html, "liveFooterBrandTagline", professionalTitle);
  html = replaceElementContentById(html, "liveHeroHeadline", heroHeadline);
  html = replaceElementContentById(html, "liveHeroDescription", heroDescription);
  html = replaceElementContentById(html, "liveYearsExperience", yearsExperience);
  html = replaceElementContentById(html, "liveTeamBio", aboutSection);
  html = replaceElementContentById(html, "liveConsultationCopy", consultationCopy);
  html = replaceElementContentById(html, "liveOfficeAddress", officeAddress);
  html = replaceElementContentById(html, "livePhoneNumbers", phoneNumbers);
  html = replaceElementContentById(
    html,
    "liveHeaderPhone",
    escapeHtml(contact.primaryPhone || "")
  );
  html = replaceElementContentById(html, "liveEmail", email);
  html = replaceElementContentById(html, "liveFooterEmail", email);
  html = replaceElementContentById(
    html,
    "liveFooterPhone",
    escapeHtml(contact.primaryPhone || "")
  );
  html = replaceElementContentById(html, "liveOfficeHours", officeHours);
  html = replaceElementContentById(
    html,
    "liveFooterAddress",
    escapeHtml(contact.officeAddress || "")
  );
  html = replaceElementContentById(
    html,
    "liveFooterAbout",
    aboutSection || consultationCopy
  );
  html = replaceElementContentById(html, "liveServicesGrid", servicesMarkup);
  html = replaceElementContentById(html, "liveTestimonialsSlider", testimonialsMarkup);
  html = replaceElementContentById(html, "liveFaqList", faqMarkup);
  html = replaceAttributeById(html, "liveTeamPhoto", "src", advocatePhoto);
  html = replaceAttributeById(html, "liveTeamPhoto", "alt", professionalName || "Advocate photo");
  html = replaceAttributeById(html, "liveOfficeMap", "src", googleMapLink);
  html = replaceAttributeById(html, "liveWhatsappLink", "href", whatsappHref);

  if (websiteDetails.primaryCtaLabel) {
    html = html.replace(
      /(<a href="#contact" class="btn btn-gold">[\s\S]*?<\/svg>\s*)([\s\S]*?)(\s*<\/a>)/i,
      (match, start, current, end) =>
        `${start}${escapeHtml(websiteDetails.primaryCtaLabel)}${end}`
    );
  }

  return html;
};

const pickFields = (data, fields) => {
  const output = {};
  fields.forEach((field) => {
    if (data[field] !== undefined) {
      output[field] = data[field];
    }
  });
  return output;
};

const checkGithubPathExists = async (username) => {
  const apiUrl = `https://api.github.com/repos/${env.githubRepoOwner}/${env.githubRepoName}/contents/${encodeURIComponent(
    username
  )}?ref=${encodeURIComponent(env.githubRepoBranch)}`;

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(env.githubToken ? { Authorization: `Bearer ${env.githubToken}` } : {}),
      "User-Agent": "pagefolio-availability-check"
    }
  });

  if (response.status === 404) {
    return false;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Could not verify GitHub repo availability"
    );
  }

  return true;
};

const getGithubFileSha = async (repoPath) => {
  const apiUrl = `https://api.github.com/repos/${env.githubRepoOwner}/${env.githubRepoName}/contents/${repoPath}?ref=${encodeURIComponent(
    env.githubRepoBranch
  )}`;

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.githubToken}`,
      "User-Agent": "pagefolio-folder-creator"
    }
  });

  if (response.status === 404) {
    return "";
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Could not inspect the GitHub repo file");
  }

  const data = await response.json();
  return data.sha || "";
};

const getGithubFile = async (repoPath) => {
  const apiUrl = `https://api.github.com/repos/${env.githubRepoOwner}/${env.githubRepoName}/contents/${repoPath}?ref=${encodeURIComponent(
    env.githubRepoBranch
  )}`;

  const response = await fetch(apiUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.githubToken}`,
      "User-Agent": "pagefolio-folder-creator"
    }
  });

  if (response.status === 404) {
    return {
      sha: "",
      content: ""
    };
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Could not fetch the GitHub file");
  }

  const data = await response.json();
  const encodedContent = String(data.content || "").replace(/\n/g, "");

  return {
    sha: data.sha || "",
    content: encodedContent ? Buffer.from(encodedContent, "base64").toString("utf8") : ""
  };
};

const createGithubFolder = async (username) => {
  if (!env.githubToken) {
    throw new Error("GitHub token is not configured on the server yet");
  }

  const apiUrl = `https://api.github.com/repos/${env.githubRepoOwner}/${env.githubRepoName}/contents/${encodeURIComponent(
    username
  )}/.gitkeep`;

  const response = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.githubToken}`,
      "Content-Type": "application/json",
      "User-Agent": "pagefolio-folder-creator"
    },
    body: JSON.stringify({
      message: `Create ${username} profile folder`,
      content: Buffer.from("Pagefolio profile folder\n").toString("base64"),
      branch: env.githubRepoBranch
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message || "Could not create the folder in the GitHub Pagefolio repo"
    );
  }

  return {
    repoPath: `${username}/.gitkeep`
  };
};

const putGithubFile = async ({ repoPath, message, content, sha = "" }) => {
  if (!env.githubToken) {
    throw new Error("GitHub token is not configured on the server yet");
  }

  const apiUrl = `https://api.github.com/repos/${env.githubRepoOwner}/${env.githubRepoName}/contents/${repoPath}`;
  const response = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${env.githubToken}`,
      "Content-Type": "application/json",
      "User-Agent": "pagefolio-folder-creator"
    },
    body: JSON.stringify({
      message,
      content: Buffer.from(content).toString("base64"),
      branch: env.githubRepoBranch,
      ...(sha ? { sha } : {})
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage =
      errorData.message || "Could not write the template into the GitHub Pagefolio repo";

    if (!sha && errorMessage.toLowerCase().includes("sha")) {
      const refreshedSha = await getGithubFileSha(repoPath);
      if (refreshedSha) {
        return putGithubFile({
          repoPath,
          message,
          content,
          sha: refreshedSha
        });
      }
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

const findUserByUsername = async (username) => {
  const snapshot = await getUserCollection()
    .where("username", "==", username)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  return snapshot.docs[0];
};

const getPublicProfile = async (req, res, next) => {
  try {
    const username = slugifyUsername(req.params.username);
    const snapshot = await getUserCollection()
      .where("username", "==", username)
      .where("isPublic", "==", true)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json(
        apiResponse({
          success: false,
          message: "Public profile not found"
        })
      );
    }

    const profile = pickFields(snapshot.docs[0].data(), publicProfileFields);

    res.status(200).json(
      apiResponse({
        message: "Public profile fetched successfully",
        data: profile
      })
    );
  } catch (error) {
    next(error);
  }
};

const upsertProfile = async (req, res, next) => {
  try {
    const payload = buildProfilePayload(req.body);
    const currentUsername = req.body.currentUsername
      ? slugifyUsername(req.body.currentUsername)
      : "";
    const requestedUsername = req.body.username
      ? slugifyUsername(req.body.username)
      : currentUsername;

    if (requestedUsername && requestedUsername.length < 3) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "Username must be at least 3 valid characters long"
        })
      );
    }

    if (requestedUsername) {
      const existing = await findUserByUsername(requestedUsername);
      if (existing && existing.id !== req.user.uid) {
        return res.status(409).json(
          apiResponse({
            success: false,
            message: "Username is already taken"
          })
        );
      }

      payload.username = requestedUsername;
    }

    payload.uid = req.user.uid;
    payload.email = payload.email || req.user.email;
    payload.displayName = payload.displayName || req.user.name;
    payload.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await getUserCollection().doc(req.user.uid).set(payload, { merge: true });
    const updatedDoc = await getUserCollection().doc(req.user.uid).get();

    res.status(200).json(
      apiResponse({
        message: "Profile saved successfully",
        data: updatedDoc.data()
      })
    );
  } catch (error) {
    next(error);
  }
};

const checkUsernameAvailability = async (req, res, next) => {
  try {
    const username = slugifyUsername(req.params.username);

    if (username.length < 3) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "Username must be at least 3 valid characters long"
        })
      );
    }

    const existingUser = await findUserByUsername(username);
    const existingGithubPath = await checkGithubPathExists(username);
    const available = !existingUser && !existingGithubPath;

    res.status(200).json(
      apiResponse({
        message: available
          ? "Username is available"
          : existingGithubPath
            ? "Preferred link already exists in the GitHub Pagefolio repo"
            : "Username is not available",
        data: {
          username,
          available,
          existingGithubPath
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

const createProfileFolder = async (req, res, next) => {
  try {
    const username = slugifyUsername(req.body.username);

    if (username.length < 3) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "Username must be at least 3 valid characters long"
        })
      );
    }

    const existingUser = await findUserByUsername(username);
    const existingGithubPath = await checkGithubPathExists(username);

    if (existingUser && existingUser.id !== req.user.uid) {
      return res.status(409).json(
        apiResponse({
          success: false,
          message: "Username is already taken"
        })
      );
    }

    if (existingGithubPath) {
      return res.status(409).json(
        apiResponse({
          success: false,
          message: "Preferred link already exists in the GitHub Pagefolio repo"
        })
      );
    }

    const githubResult = await createGithubFolder(username);
    await getUserCollection().doc(req.user.uid).set(
      {
        username,
        uid: req.user.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
    );

    res.status(201).json(
      apiResponse({
        message: "Profile folder created successfully in GitHub",
        data: {
          username,
          repoPath: githubResult.repoPath
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

const publishTemplateToProfile = async (req, res, next) => {
  try {
    const preferredLink = slugifyUsername(req.body.username || "");
    const templateId = (req.body.template || "").trim();
    const templateDefinition = getTemplateDefinition(templateId);

    if (!templateDefinition) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "This template is not ready to publish yet"
        })
      );
    }

    if (!preferredLink) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "Preferred link is required"
        })
      );
    }

    const existingGithubPath = await checkGithubPathExists(preferredLink);
    if (!existingGithubPath) {
      await createGithubFolder(preferredLink);
    }

    const htmlContent = await fs.readFile(templateDefinition.sourcePath, "utf8");
    const dashboardContent = templateDefinition.dashboardPath
      ? await fs.readFile(templateDefinition.dashboardPath, "utf8")
      : "";
    const dashboardStylesPath = path.resolve(
      __dirname,
      "../../../frontend/styles/dashboard.css"
    );
    const baseStylesPath = path.resolve(
      __dirname,
      "../../../frontend/styles/styles.css"
    );
    const dashboardStyles = await fs.readFile(dashboardStylesPath, "utf8");
    const baseStyles = await fs.readFile(baseStylesPath, "utf8");
    const repoPath = `${preferredLink}/index.html`;
    const dashboardFolder = `${preferredLink}/${req.user.uid}`;
    const dashboardRepoPath = `${dashboardFolder}/index.html`;
    const existingSha = await getGithubFileSha(repoPath);
    const existingDashboardSha = await getGithubFileSha(dashboardRepoPath);

    await putGithubFile({
      repoPath,
      message: `Publish ${templateId} for ${preferredLink}`,
      content: htmlContent,
      sha: existingSha
    });

    if (dashboardContent) {
      const combinedStyles = `${baseStyles}\n\n${dashboardStyles}`;
      const strippedDashboard = dashboardContent
        .replace(/<link[^>]*styles\.css[^>]*>\s*/gi, "")
        .replace(/<link[^>]*dashboard\.css[^>]*>\s*/gi, "");
      const rewrittenDashboard = strippedDashboard.replace(
        /<\/head>/i,
        `<style>\n${combinedStyles}\n</style>\n</head>`
      );

      await putGithubFile({
        repoPath: dashboardRepoPath,
        message: `Publish dashboard for ${preferredLink}`,
        content: rewrittenDashboard,
        sha: existingDashboardSha
      });
    }

    const websiteUrl = `${env.publicSiteBase}/${preferredLink}/`;
    const dashboardUrl = `${env.publicSiteBase}/${preferredLink}/${req.user.uid}/index.html`;
    const userRef = getUserCollection().doc(req.user.uid);
    const userSnapshot = await userRef.get();
    const existing = userSnapshot.exists ? userSnapshot.data() : {};

    await userRef.set(
      {
        uid: req.user.uid,
        username: preferredLink,
        selectedTemplate: templateId,
        websiteType: templateDefinition.websiteType,
        website: websiteUrl,
        dashboard: dashboardUrl,
        displayName: existing.displayName || req.user.name,
        email: existing.email || req.user.email,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      },
      { merge: true }
      );

    const websiteRef = getWebsiteCollection().doc(req.user.uid);
    const websiteSnapshot = await websiteRef.get();
    const websiteExisting = websiteSnapshot.exists ? websiteSnapshot.data() : {};
    const now = admin.firestore.FieldValue.serverTimestamp();

    await websiteRef.set(
      {
        uid: req.user.uid,
        username: preferredLink,
        templateId: templateId,
        websiteType: templateDefinition.websiteType,
        websiteUrl,
        dashboardUrl,
        createdAt: websiteExisting.createdAt || now,
        updatedAt: now,
        websiteChangedAt: now,
        sections: websiteExisting.sections || {
          hero: {
            name: "",
            title: "",
            headline: "",
            description: "",
            years: "",
            ctaLabel: "",
            about: ""
          },
          services: [],
          reviews: [],
          faqs: [],
          contact: {
            phone: "",
            whatsapp: "",
            email: "",
            hours: "",
            address: "",
            ctaCopy: ""
          }
        }
      },
      { merge: true }
    );

    res.status(200).json(
      apiResponse({
        message: "Template published successfully",
        data: {
          username: preferredLink,
          template: templateId,
          repoPath,
          websiteUrl,
          dashboardUrl
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

const saveWebsiteContent = async (req, res, next) => {
  try {
    const preferredLink = slugifyUsername(req.body.username || "");
    const templateId = (req.body.template || "").trim();
    const templateDefinition = getTemplateDefinition(templateId);

    if (!templateDefinition) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "This template is not ready to save yet"
        })
      );
    }

    if (!preferredLink) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "Website username is required"
        })
      );
    }

    const templateHtml = await fs.readFile(templateDefinition.sourcePath, "utf8");
    const renderedHtml = renderAdvDassWebsite(templateHtml, req.body);
    const repoPath = `${preferredLink}/index.html`;
    const currentFile = await getGithubFile(repoPath);

    if (currentFile.content === renderedHtml) {
      return res.status(200).json(
        apiResponse({
          message: "No changes detected",
          data: {
            updated: false,
            websiteUrl: `${env.publicSiteBase}/${preferredLink}/`
          }
        })
      );
    }

    await putGithubFile({
      repoPath,
      message: `Update website content for ${preferredLink}`,
      content: renderedHtml,
      sha: currentFile.sha
    });

    res.status(200).json(
      apiResponse({
        message: "Website updated successfully",
        data: {
          updated: true,
          websiteUrl: `${env.publicSiteBase}/${preferredLink}/`
        }
      })
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPublicProfile,
  upsertProfile,
  checkUsernameAvailability,
  createProfileFolder,
  publishTemplateToProfile,
  saveWebsiteContent
};
