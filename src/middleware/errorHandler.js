function errorHandler(error, req, res, next) {
  console.error(error);

  if (error && error.code === "LIMIT_FILE_SIZE") {
    if (req.path.startsWith("/api/")) {
      res.status(413).json({ error: "Uploaded image is too large. Please upload a smaller photo." });
      return;
    }

    res.status(413).send("Uploaded image is too large.");
    return;
  }

  if (req.path.startsWith("/api/")) {
    res.status(500).json({ error: "Unexpected server error." });
    return;
  }

  res.status(500).send("Unexpected server error.");
}

module.exports = {
  errorHandler
};
