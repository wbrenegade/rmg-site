const express = require("express");
const path = require("path");
const apiRoutes = require("./routes/apiRoutes");
const { router: stripeRoutes, handleStripeWebhook } = require("./routes/stripeRoutes");
const webRoutes = require("./routes/webRoutes");
const { ensureDbFile } = require("./models/dbModel");
const { serveNotFound } = require("./controllers/pageController");
const { activityLogger } = require("./middleware/activityLogger");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
const rootDir = path.join(__dirname, "..");
const publicDir = path.join(rootDir, "public");

ensureDbFile();

app.disable("x-powered-by");
app.set("trust proxy", true);
app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), handleStripeWebhook);
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

app.use(express.static(publicDir));
app.use(activityLogger);
app.use("/api", apiRoutes);
app.use("/api/stripe", stripeRoutes);
app.use(webRoutes);
app.use(serveNotFound);
app.use(errorHandler);

module.exports = app;
