const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const env = require("./config/env");
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const profileRoutes = require("./routes/profile.routes");
const userRoutes = require("./routes/user.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const notFoundMiddleware = require("./middleware/notfound.middleware");
const errorMiddleware = require("./middleware/error.middleware");

const app = express();

const defaultAllowedOrigins = [
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://ablabsbusiness-create.github.io"
];

const allowedOrigins = Array.from(
  new Set(
    [...defaultAllowedOrigins, ...String(env.clientUrl || "")
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)]
  )
);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow tools like Postman and your configured static frontend origins.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("CORS policy blocked this origin"));
  },
  credentials: true,
  optionsSuccessStatus: 204
};

app.set("trust proxy", true);
app.use(helmet());
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(express.json({ limit: "8mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Pagefolio API is running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/user", userRoutes);
app.use("/api/analytics", analyticsRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

module.exports = app;
