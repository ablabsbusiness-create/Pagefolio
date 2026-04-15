const jwt = require("jsonwebtoken");
const env = require("../config/env");

const generateToken = (payload) => {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
};

module.exports = generateToken;
