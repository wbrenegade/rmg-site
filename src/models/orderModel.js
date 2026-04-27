const { randomUUID } = require("crypto");
const { readDb, writeDb } = require("./dbModel");

function getAllOrders() {
  const db = readDb();
  return db.orders;
}

function getOrdersByUserId(userId) {
  const db = readDb();
  if (!String(userId || "").trim()) return db.orders;
  return db.orders.filter((order) => order.userId === userId);
}

function findOrderByStripeSessionId(stripeSessionId) {
  const db = readDb();
  const normalizedSessionId = String(stripeSessionId || "").trim();
  if (!normalizedSessionId) return null;
  return db.orders.find((order) => order.stripeSessionId === normalizedSessionId) || null;
}

function createOrder({ userId, customer, items, subtotal, tax, total, status, stripeSessionId, paymentStatus }) {
  const db = readDb();
  const order = {
    id: randomUUID(),
    userId: userId || "guest",
    customer,
    items,
    subtotal,
    tax,
    total,
    status: status || "Pending Fulfillment",
    stripeSessionId: stripeSessionId || null,
    paymentStatus: paymentStatus || null,
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(order);
  writeDb(db);
  return order;
}

module.exports = {
  getAllOrders,
  getOrdersByUserId,
  findOrderByStripeSessionId,
  createOrder
};
