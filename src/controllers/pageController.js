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

function serveNotFound(req, res) {
  res.status(404).sendFile(path.join(viewsDir, "index.html"));
}

module.exports = {
  serveIndex,
  servePage,
  serveNotFound,
  pageRoutes
};
