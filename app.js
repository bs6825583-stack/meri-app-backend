const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { notFound, errorHandler } = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");
const placeRoutes = require("./routes/placeRoutes");
const tripRoutes = require("./routes/tripRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const app = express();

// ---- Security ----
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false,

  })
);

// ---- CORS ----
const allowed = (process.env.CLIENT_URL || "*")
  .split(",")
  .map((s) => s.trim());

app.use(
  cors({
    origin: allowed.includes("*") ? true : allowed,
    credentials: true,
  })
);

// ---- Body parsing ----
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ---- Logging ----
if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

// ---- Rate limiting ----
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try later." },
});
app.use("/api", generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: "Too many auth attempts, please try again later.",
  },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ---- Static files ----
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---- Health check ----
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Tourism App API is running 🚀",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    time: new Date().toISOString(),
  });
});


// Static files serve karne ke liye
app.use(express.static(path.join(__dirname, "public")));

// Reset password link is page ko serve karega
app.get("/reset-password/:token", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "reset-password.html"));
});

// 🚨 DEBUG: Trip routes check (IMPORTANT FIX)
app.use("/api/trips", (req, res, next) => {
  console.log("🔥 Trip API HIT:", req.method, req.url);
  next();
});

// ---- Routes ----
app.use("/api/auth", authRoutes);
app.use("/api/places", placeRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/categories", categoryRoutes);

// ---- Error handling ----
app.use(notFound);
app.use(errorHandler);

module.exports = app;