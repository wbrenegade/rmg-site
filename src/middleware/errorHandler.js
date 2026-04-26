function errorHandler(error, req, res, next) {
  console.error(error);

  if (req.path.startsWith("/api/")) {
    res.status(500).json({ error: "Unexpected server error." });
    return;
  }

  res.status(500).send("Unexpected server error.");
}

module.exports = {
  errorHandler
};
