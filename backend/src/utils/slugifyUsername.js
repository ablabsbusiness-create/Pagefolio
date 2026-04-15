const slugifyUsername = (value = "") => {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/_{2,}/g, "_");
};

module.exports = slugifyUsername;
