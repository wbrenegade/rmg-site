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
  "order-success",
  "installers"
];

const toolRoutes = [
  "svg-converter",
  "decal-preview",
  "windshield-banner-calculator"
];

function sendView(res, fileName, statusCode = 200) {
  res.status(statusCode).sendFile(path.join(viewsDir, fileName));
}

function serveIndex(req, res) {
  sendView(res, "index.html");
}

function servePage(req, res) {
  const { page } = req.params;

  if (!pageRoutes.includes(page)) {
    return serveNotFound(req, res);
  }

  sendView(res, `${page}.html`);
}

function serveOrderSuccess(req, res) {
  sendView(res, "order-success.html");
}

function serveCheckout(req, res) {
  sendView(res, "checkout.html");
}

function serveCart(req, res) {
  sendView(res, "cart.html");
}

function serveToolsIndex(req, res) {
  sendView(res, "tools.html");
}

function serveToolPage(req, res) {
  const { tool } = req.params;

  if (!toolRoutes.includes(tool)) {
    return serveNotFound(req, res);
  }

  sendView(res, `${tool}.html`);
}

function serveNotFound(req, res) {
  sendView(res, "index.html", 404);
}

module.exports = {
  serveIndex,
  servePage,
  serveOrderSuccess,
  serveCheckout,
  serveCart,
  serveToolsIndex,
  serveToolPage,
  serveNotFound,
  pageRoutes,
  toolRoutes
};