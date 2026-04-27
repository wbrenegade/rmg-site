const { trackRequestEvent } = require("../models/analyticsModel");

function shouldTrackPageVisit(req, res) {
  if (req.method !== "GET") {
    return false;
  }

  if (req.path.startsWith("/api")) {
    return false;
  }

  if (/\.[a-z0-9]+$/i.test(req.path)) {
    return false;
  }

  const acceptedTypes = req.headers.accept || "";
  return acceptedTypes.includes("text/html");
}

function activityLogger(req, res, next) {
  if (!shouldTrackPageVisit(req, res)) {
    next();
    return;
  }

  res.on("finish", () => {
    if (res.statusCode >= 400) {
      return;
    }

    trackRequestEvent(req, {
      type: "page_view",
      pathname: req.path
    });
  });

  next();
}

module.exports = {
  activityLogger
};