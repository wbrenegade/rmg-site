const { randomUUID } = require("crypto");
const { readDb, writeDb } = require("./dbModel");
const {
  getAllOrdersFromSqlite,
  getOrderByIdFromSqlite,
  getOrdersByUserIdFromSqlite,
  findOrderByStripeSessionIdFromSqlite,
  insertOrderIntoSqlite,
  updateOrderStatusInSqlite
} = require("./sqliteStoreModel");

const shouldUseSqliteReads = process.env.USE_SQLITE_READS !== "false";
const shouldDualWriteJson = process.env.DUAL_WRITE_JSON !== "false";

function createOrderRecord({ userId, customer, items, subtotal, tax, total, status, stripeSessionId, paymentStatus }) {
  return {
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
}

function readOrdersFromJson() {
  const db = readDb();
  return Array.isArray(db.orders) ? db.orders : [];
}

function writeOrderToJson(order) {
  const db = readDb();
  db.orders = Array.isArray(db.orders) ? db.orders : [];
  db.orders = db.orders.filter((entry) => entry.id !== order.id);
  db.orders.unshift(order);
  writeDb(db);
}

function getAllOrders() {
  if (shouldUseSqliteReads) {
    try {
      return getAllOrdersFromSqlite();
    } catch {
      return readOrdersFromJson();
    }
  }

  return readOrdersFromJson();
}

function getOrdersByUserId(userId) {
  if (shouldUseSqliteReads) {
    try {
      return getOrdersByUserIdFromSqlite(userId);
    } catch {
      const orders = readOrdersFromJson();
      if (!String(userId || "").trim()) return orders;
      return orders.filter((order) => order.userId === userId);
    }
  }

  const orders = readOrdersFromJson();
  if (!String(userId || "").trim()) return orders;
  return orders.filter((order) => order.userId === userId);
}

function findOrderByStripeSessionId(stripeSessionId) {
  const normalizedSessionId = String(stripeSessionId || "").trim();
  if (!normalizedSessionId) return null;

  if (shouldUseSqliteReads) {
    try {
      return findOrderByStripeSessionIdFromSqlite(normalizedSessionId);
    } catch {
      const orders = readOrdersFromJson();
      return orders.find((order) => order.stripeSessionId === normalizedSessionId) || null;
    }
  }

  const orders = readOrdersFromJson();
  return orders.find((order) => order.stripeSessionId === normalizedSessionId) || null;
}

function createOrder({ userId, customer, items, subtotal, tax, total, status, stripeSessionId, paymentStatus }) {
  const order = createOrderRecord({ userId, customer, items, subtotal, tax, total, status, stripeSessionId, paymentStatus });
  let sqliteWriteSucceeded = false;

  try {
    insertOrderIntoSqlite(order);
    sqliteWriteSucceeded = true;
  } catch {
    // Fall back to JSON-only behavior if SQLite is temporarily unavailable.
  }

  if (shouldDualWriteJson || !sqliteWriteSucceeded) {
    writeOrderToJson(order);
  }

  return order;
}

function markOrderFulfilled(orderId) {
  const normalizedOrderId = String(orderId || "").trim();
  if (!normalizedOrderId) {
    return null;
  }

  let sqliteUpdateSucceeded = false;
  let sqliteUpdatedOrder = null;

  try {
    sqliteUpdateSucceeded = updateOrderStatusInSqlite(normalizedOrderId, "Fulfilled");
    if (sqliteUpdateSucceeded) {
      sqliteUpdatedOrder = getOrderByIdFromSqlite(normalizedOrderId);
    }
  } catch {
    sqliteUpdateSucceeded = false;
  }

  const db = readDb();
  db.orders = Array.isArray(db.orders) ? db.orders : [];
  const orderIndex = db.orders.findIndex((order) => order.id === normalizedOrderId);
  const jsonOrderExists = orderIndex >= 0;

  if (jsonOrderExists) {
    db.orders[orderIndex] = {
      ...db.orders[orderIndex],
      status: "Fulfilled"
    };
  }

  if (shouldDualWriteJson || !sqliteUpdateSucceeded) {
    if (!jsonOrderExists) {
      return sqliteUpdatedOrder;
    }

    writeDb(db);
    return db.orders[orderIndex];
  }

  return sqliteUpdatedOrder;
}

module.exports = {
  getAllOrders,
  getOrdersByUserId,
  findOrderByStripeSessionId,
  createOrder,
  markOrderFulfilled
};
