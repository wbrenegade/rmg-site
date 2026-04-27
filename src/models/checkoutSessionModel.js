const { readDb, writeDb } = require("./dbModel");

function savePendingCheckout(checkout = {}) {
  const db = readDb();
  const sessionId = String(checkout.sessionId || "").trim();

  if (!sessionId) {
    throw new Error("Pending checkout requires a Stripe session ID.");
  }

  const pendingCheckout = {
    sessionId,
    userId: checkout.userId || "guest",
    customer: checkout.customer || {},
    items: Array.isArray(checkout.items) ? checkout.items : [],
    subtotal: Number(checkout.subtotal || 0),
    tax: Number(checkout.tax || 0),
    total: Number(checkout.total || 0),
    createdAt: checkout.createdAt || new Date().toISOString()
  };

  db.pendingCheckouts = Array.isArray(db.pendingCheckouts) ? db.pendingCheckouts : [];
  db.pendingCheckouts = db.pendingCheckouts.filter((entry) => entry.sessionId !== sessionId);
  db.pendingCheckouts.unshift(pendingCheckout);
  writeDb(db);
  return pendingCheckout;
}

function getPendingCheckoutBySessionId(sessionId) {
  const db = readDb();
  const normalizedSessionId = String(sessionId || "").trim();

  return (db.pendingCheckouts || []).find((entry) => entry.sessionId === normalizedSessionId) || null;
}

function deletePendingCheckout(sessionId) {
  const db = readDb();
  const normalizedSessionId = String(sessionId || "").trim();
  const nextPendingCheckouts = (db.pendingCheckouts || []).filter((entry) => entry.sessionId !== normalizedSessionId);

  if (nextPendingCheckouts.length === (db.pendingCheckouts || []).length) {
    return false;
  }

  db.pendingCheckouts = nextPendingCheckouts;
  writeDb(db);
  return true;
}

module.exports = {
  savePendingCheckout,
  getPendingCheckoutBySessionId,
  deletePendingCheckout
};
