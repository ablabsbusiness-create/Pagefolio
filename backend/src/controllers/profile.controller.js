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
  },
  "little-care-child": {
    websiteType: "website",
    sourcePath: path.resolve(
      __dirname,
      "../../../frontend/templates/full-website/Children Doctor/1/child-care.html"
    ),
    dashboardPath: path.resolve(
      __dirname,
      "../../../frontend/templates/full-website/Children Doctor/1/dashboard-child-1.html"
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
  const openPattern = new RegExp(
    `<([a-z0-9-]+)[^>]*id=["']${escapeRegex(id)}["'][^>]*>`,
    "i"
  );
  const openMatch = openPattern.exec(html);

  if (!openMatch) {
    return html;
  }

  const tagName = openMatch[1];
  const openTag = openMatch[0];
  const openIndex = openMatch.index;
  const innerStart = openIndex + openTag.length;
  const tagPattern = new RegExp(`<\\/?${tagName}\\b[^>]*>`, "gi");
  tagPattern.lastIndex = innerStart;

  let depth = 1;
  let closingStart = -1;
  let closingEnd = -1;
  let tagMatch;

  while ((tagMatch = tagPattern.exec(html))) {
    const tag = tagMatch[0];
    const isClosing = /^<\//.test(tag);
    const isSelfClosing = /\/>$/.test(tag);

    if (isClosing) {
      depth -= 1;
      if (depth === 0) {
        closingStart = tagMatch.index;
        closingEnd = tagPattern.lastIndex;
        break;
      }
    } else if (!isSelfClosing) {
      depth += 1;
    }
  }

  if (closingStart === -1) {
    return html;
  }

  return `${html.slice(0, innerStart)}${content}${html.slice(closingStart, html.length)}`;
};

const replaceTagContent = (html, tagName, content) => {
  const pattern = new RegExp(`(<${tagName}[^>]*>)([\\s\\S]*?)(</${tagName}>)`, "i");
  return html.replace(pattern, (match, openTag, inner, closeTag) => {
    return `${openTag}${content}${closeTag}`;
  });
};

const replaceAttributeById = (html, id, attribute, value) => {
  const pattern = new RegExp(`(<[^>]*id=["']${escapeRegex(id)}["'][^>]*>)`, "i");

  return html.replace(pattern, (match) => {
    const attributePattern = new RegExp(`(${attribute}=["'])([^"']*)(["'])`, "i");
    if (attributePattern.test(match)) {
      return match.replace(attributePattern, `$1${value}$3`);
    }

    return match.replace(/>$/, ` ${attribute}="${value}">`);
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

const buildChildServicesMarkup = (services = []) => {
  const safeServices = Array.isArray(services) ? services : [];
  return safeServices
    .map((service) => {
      return `
        <div class="service-card">
          <h3>${escapeHtml(service.name || "Service")}</h3>
          <p>${escapeHtml(service.description || "")}</p>
          <span class="service-link">${escapeHtml(service.tag || "Learn more")}</span>
        </div>`;
    })
    .join("");
};

const buildChildTestimonialsMarkup = (testimonials = []) => {
  const safeTestimonials = Array.isArray(testimonials) ? testimonials : [];
  const slides = safeTestimonials
    .map((item, index) => {
      const initials = String(item.clientName || "PR")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || "")
        .join("") || "PR";

      return `
        <div class="testi-slide">
          <div class="testi-card">
            <div class="testi-quote">"</div>
            <div class="testi-stars">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
            <p class="testi-text">${escapeHtml(item.feedback || "")}</p>
            <div class="testi-author">
              <div class="author-avatar av-${(index % 3) + 1}">${escapeHtml(initials)}</div>
              <div>
                <div class="author-name">${escapeHtml(item.clientName || "Parent review")}</div>
                <div class="author-rel">Parent review</div>
              </div>
            </div>
          </div>
        </div>`;
    })
    .join("");

  const dots = safeTestimonials
    .map((item, index) => {
      return `<button class="testi-dot${index === 0 ? " is-active" : ""}" type="button" aria-label="Show review ${index + 1}"></button>`;
    })
    .join("");

  return `
    <div class="testi-grid" id="liveTestimonialsGrid">${slides}</div>
    <div class="testi-controls">
      <button class="testi-btn testi-prev" type="button" aria-label="Previous review">&lsaquo;</button>
      <div class="testi-dots" aria-label="Review navigation">${dots}</div>
      <button class="testi-btn testi-next" type="button" aria-label="Next review">&rsaquo;</button>
    </div>`;
};

const buildChildFaqMarkup = (faqs = []) => {
  const safeFaqs = Array.isArray(faqs) ? faqs : [];
  return safeFaqs
    .map((item, index) => {
      return `
        <div class="why-card">
          <div class="why-icon">${String(index + 1).padStart(2, "0")}</div>
          <div>
            <h4>${escapeHtml(item.question || "")}</h4>
            <p>${escapeHtml(item.answer || "")}</p>
          </div>
        </div>`;
    })
    .join("");
};

const buildChildHoursMarkup = (officeHours = "") => {
  const rows = String(officeHours || "")
    .split(/\r?\n|\|/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const separatorIndex = row.indexOf(":");
      const left = separatorIndex >= 0 ? row.slice(0, separatorIndex).trim() : "Hours";
      const right = separatorIndex >= 0 ? row.slice(separatorIndex + 1).trim() : row;
      const closedClass = /closed/i.test(right) ? ' class="closed"' : "";
      return `<tr><td>${escapeHtml(left)}</td><td${closedClass}>${escapeHtml(right)}</td></tr>`;
    })
    .join("");

  return `<table class="timing-table">${rows}</table>`;
};

const renderChildCareWebsite = (templateHtml, payload) => {
  const websiteDetails = payload.websiteDetails || {};
  const contact = payload.contact || {};
  const clinicName = escapeHtml(websiteDetails.professionalName || "Little Care Child Clinic");
  const doctorLine = escapeHtml(
    websiteDetails.professionalTitle || "Dr. Aarav Sharma | Pediatrician, Jaipur"
  );
  const rawDoctorLine = String(
    websiteDetails.professionalTitle || "Dr. Aarav Sharma | Pediatrician, Jaipur"
  );
  const doctorName = rawDoctorLine.split("|")[0].trim() || rawDoctorLine.trim() || "Dr. Aarav Sharma";
  const heroHeadline = escapeHtml(
    websiteDetails.heroHeadline || "Expert care for every little one you love"
  );
  const heroDescription = escapeHtml(websiteDetails.heroDescription || "");
  const yearsExperience = escapeHtml(websiteDetails.yearsExperience || "10+");
  const aboutSection = escapeHtml(websiteDetails.aboutSection || "");
  const primaryCtaLabel = escapeHtml(websiteDetails.primaryCtaLabel || "Book appointment");
  const doctorPhoto = String(
    websiteDetails.advocatePhoto ||
    "https://images.pexels.com/photos/5998446/pexels-photo-5998446.jpeg?auto=compress&cs=tinysrgb&w=900"
  ).trim();
  const phone = escapeHtml(contact.primaryPhone || "");
  const whatsapp = escapeHtml(contact.whatsappNumber || "");
  const email = escapeHtml(contact.email || "");
  const address = escapeHtml(contact.officeAddress || "").replace(/\r?\n/g, "<br>");
  const plainAddress = escapeHtml(contact.officeAddress || "");
  const mapLink = String(
    contact.googleMapLink ||
    "https://maps.google.com/maps?q=Jaipur&z=12&output=embed"
  ).trim();
  const consultationCopy = escapeHtml(contact.consultationCopy || "");
  const hoursMarkup = buildChildHoursMarkup(contact.officeHours || "");
  const footerHours = escapeHtml(contact.officeHours || "").replace(/\s*\|\s*/g, "<br>");
  const whatsappDigits = String(contact.whatsappNumber || "").replace(/[^\d]/g, "");
  const phoneDigits = String(contact.primaryPhone || "").replace(/[^\d+]/g, "");
  const whatsappHref = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=Hello%20Doctor%2C%20I%20would%20like%20to%20book%20an%20appointment.`
    : "#";
  const callHref = phoneDigits ? `tel:${phoneDigits}` : "#";

  let html = templateHtml;
  html = replaceTagContent(html, "title", `${clinicName} | ${doctorLine}`);
  html = html.replace(
    /(<meta\s+name=["']description["']\s+content=["'])([^"']*)(["'][^>]*>)/i,
    `$1${escapeHtml(
      `Book trusted pediatric care with ${doctorName} at ${clinicName}.`
    )}$3`
  );
  html = replaceElementContentById(html, "liveClinicName", clinicName);
  html = replaceElementContentById(html, "liveClinicSubtitle", doctorLine);
  html = replaceElementContentById(html, "liveFooterClinicName", clinicName);
  html = replaceElementContentById(html, "liveFooterClinicSubtitle", doctorLine);
  html = replaceElementContentById(html, "liveHeroHeadline", heroHeadline);
  html = replaceElementContentById(html, "liveHeroDescription", heroDescription);
  html = replaceElementContentById(html, "liveYearsExperience", yearsExperience);
  html = replaceElementContentById(html, "liveDoctorYearsBadge", yearsExperience);
  html = replaceElementContentById(
    html,
    "liveDoctorHeading",
    escapeHtml(`Meet ${doctorName}, a pediatrician who truly listens`)
  );
  html = replaceElementContentById(
    html,
    "liveDoctorIntro",
    escapeHtml(
      `With over ${String(websiteDetails.yearsExperience || "10+").trim()} years of dedicated pediatric practice, ${doctorName} has become a trusted choice for families looking for calm, child-first care.`
    )
  );
  html = replaceElementContentById(
    html,
    "liveDoctorQuote",
    consultationCopy
      ? `"${consultationCopy}"`
      : '"Every child is unique. My goal is to provide personalized care that supports lifelong health and wellbeing."'
  );
  html = replaceElementContentById(html, "liveDoctorBio", aboutSection);
  html = replaceElementContentById(html, "livePrimaryCta", primaryCtaLabel);
  html = replaceElementContentById(html, "liveEmergencyPhoneLabel", phone);
  html = replaceElementContentById(html, "liveClinicAddress", address);
  html = replaceElementContentById(html, "liveClinicPhone", phone);
  html = replaceElementContentById(html, "liveClinicWhatsapp", whatsapp);
  html = replaceElementContentById(html, "liveClinicEmail", email);
  html = replaceElementContentById(html, "liveEmergencyCopy", consultationCopy || `Call ${phone} for urgent child-health guidance or same-day appointment support.`);
  html = replaceElementContentById(html, "liveClinicMapFallback", plainAddress);
  html = replaceElementContentById(html, "liveClinicHours", hoursMarkup);
  html = replaceElementContentById(html, "liveFooterAbout", aboutSection || heroDescription);
  html = replaceElementContentById(html, "liveFooterAddress", address);
  html = replaceElementContentById(html, "liveFooterPhone", phone);
  html = replaceElementContentById(html, "liveFooterHours", footerHours);
  html = replaceElementContentById(html, "liveFooterEmail", email);
  html = replaceElementContentById(html, "liveServicesGrid", buildChildServicesMarkup(payload.services || []));
  html = replaceElementContentById(html, "liveTestimonialsCarousel", buildChildTestimonialsMarkup(payload.testimonials || []));
  html = replaceElementContentById(html, "liveFaqList", buildChildFaqMarkup(payload.faqs || []));
  html = replaceAttributeById(html, "liveDoctorPhoto", "src", doctorPhoto);
  html = replaceAttributeById(html, "liveDoctorPhoto", "alt", `${doctorName} portrait`);
  html = replaceAttributeById(html, "liveClinicMap", "src", mapLink);
  html = replaceAttributeById(html, "liveEmergencyPhoneLink", "href", callHref);
  html = replaceAttributeById(html, "liveCallCta", "href", callHref);
  html = replaceAttributeById(html, "liveAppointmentCall", "href", callHref);
  html = replaceAttributeById(html, "liveAppointmentWhatsapp", "href", whatsappHref);
  html = replaceElementContentById(html, "liveAppointmentCall", `Call: ${phone}`);

  return html;
};

const renderTemplateHtml = (templateId, templateHtml, payload) => {
  if (templateId === "adv-dass-legal") {
    return renderAdvDassWebsite(templateHtml, payload);
  }

  if (templateId === "little-care-child") {
    return renderChildCareWebsite(templateHtml, payload);
  }

  return templateHtml;
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

const putGithubFileBase64 = async ({ repoPath, message, contentBase64, sha = "" }) => {
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
      "User-Agent": "pagefolio-asset-uploader"
    },
    body: JSON.stringify({
      message,
      content: contentBase64,
      branch: env.githubRepoBranch,
      ...(sha ? { sha } : {})
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Could not upload the website asset");
  }

  return response.json();
};

const getImageExtension = (fileName = "", mimeType = "") => {
  const normalizedName = String(fileName || "").toLowerCase();
  const extensionMatch = normalizedName.match(/\.([a-z0-9]+)$/);
  const extension = extensionMatch ? extensionMatch[1] : "";

  if (["jpg", "jpeg", "png", "webp", "gif"].includes(extension)) {
    return extension === "jpeg" ? "jpg" : extension;
  }

  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  return "jpg";
};

const uploadWebsiteAsset = async (req, res, next) => {
  try {
    const preferredLink = slugifyUsername(req.body.username || "");
    const fileName = String(req.body.fileName || "advocate-photo").trim();
    const dataUrl = String(req.body.dataUrl || "").trim();

    if (!preferredLink) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "Website username is required"
        })
      );
    }

    const match = dataUrl.match(/^data:(image\/(?:png|jpe?g|webp|gif));base64,([A-Za-z0-9+/=]+)$/i);
    if (!match) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "Please upload a valid image file"
        })
      );
    }

    const mimeType = match[1].toLowerCase();
    const contentBase64 = match[2];
    const byteSize = Buffer.byteLength(contentBase64, "base64");

    if (byteSize > 4 * 1024 * 1024) {
      return res.status(400).json(
        apiResponse({
          success: false,
          message: "Image must be 4MB or smaller"
        })
      );
    }

    const extension = getImageExtension(fileName, mimeType);
    const repoPath = `${preferredLink}/assets/advocate-photo-${Date.now()}.${extension}`;

    await putGithubFileBase64({
      repoPath,
      message: `Upload advocate photo for ${preferredLink}`,
      contentBase64
    });

    res.status(200).json(
      apiResponse({
        message: "Photo uploaded successfully",
        data: {
          repoPath,
          assetUrl: `${String(env.publicSiteBase || "").replace(/\/+$/, "")}/${repoPath}`
        }
      })
    );
  } catch (error) {
    next(error);
  }
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
    const renderedHtml = renderTemplateHtml(templateId, templateHtml, req.body);
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
  uploadWebsiteAsset,
  saveWebsiteContent
};
