const { getOrdersByUserId, createOrder } = require("../models/orderModel");

function listOrders(req, res) {
  const userId = String(req.query.userId || "").trim();
  const orders = getOrdersByUserId(userId);
  res.json(orders);
}

function createNewOrder(req, res) {
  const { userId, customer, items, subtotal, tax, total } = req.body || {};

  if (!Array.isArray(items) || !items.length || !customer) {
    res.status(400).json({ error: "Order must include customer details and at least one item." });
    return;
  }

  const order = createOrder({ userId, customer, items, subtotal, tax, total });
  res.status(201).json(order);
}

module.exports = {
  listOrders,
  createNewOrder
};
