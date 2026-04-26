const path = require("path");

const rootDir = path.join(__dirname, "..", "..");
const viewsDir = path.join(rootDir, "views");
const pageRoutes = [
  "shop",
  "product",
  "customize",
  "mustang-customizer",
  "cart",
  "checkout",
  "login",
  "signup",
  "account",
  "contact",
  "admin",
  "privacy",
  "terms",
  "faq",
  "order-success"
];
const toolRoutes = ["svg-converter", "decal-preview"];

function serveIndex(req, res) {
  res.sendFile(path.join(viewsDir, "index.html"));
}

function servePage(req, res) {
  const { page } = req.params;
  if (!pageRoutes.includes(page)) {
    res.status(404).sendFile(path.join(viewsDir, "index.html"));
    return;
  }

  res.sendFile(path.join(viewsDir, `${page}.html`));
}

function serveToolsIndex(req, res) {
  res.sendFile(path.join(viewsDir, "tools.html"));
}

function serveToolPage(req, res) {
  const { tool } = req.params;
  if (!toolRoutes.includes(tool)) {
    res.status(404).sendFile(path.join(viewsDir, "index.html"));
    return;
  }

  res.sendFile(path.join(viewsDir, `${tool}.html`));
}

function serveNotFound(req, res) {
  res.status(404).sendFile(path.join(viewsDir, "index.html"));
}

module.exports = {
  serveIndex,
  servePage,
  serveToolsIndex,
  serveToolPage,
  serveNotFound,
  pageRoutes,
  toolRoutes
};
