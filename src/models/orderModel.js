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

function createOrder({ userId, customer, items, subtotal, tax, total }) {
  const db = readDb();
  const order = {
    id: randomUUID(),
    userId: userId || "guest",
    customer,
    items,
    subtotal,
    tax,
    total,
    status: "Pending Fulfillment",
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(order);
  writeDb(db);
  return order;
}

module.exports = {
  getAllOrders,
  getOrdersByUserId,
  createOrder
};
