const { getAnalyticsSummary, trackRequestEvent } = require("../models/analyticsModel");

function createAnalyticsEvent(req, res) {
  const { type, pathname, productId, productName, tool, action, payload } = req.body || {};

  const event = trackRequestEvent(req, {
    type: typeof type === "string" && type.trim() ? type.trim() : "custom",
    pathname: typeof pathname === "string" && pathname.trim() ? pathname.trim() : req.path,
    productId: typeof productId === "string" ? productId.trim() : null,
    productName: typeof productName === "string" ? productName.trim() : null,
    tool: typeof tool === "string" ? tool.trim() : null,
    action: typeof action === "string" ? action.trim() : null,
    payload: payload && typeof payload === "object" ? payload : {}
  });

  res.status(201).json({ ok: true, eventId: event.id });
}

function getCmsAnalyticsSummary(req, res) {
  res.json(getAnalyticsSummary());
}

module.exports = {
  createAnalyticsEvent,
  getCmsAnalyticsSummary
};