const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { readDb, writeDb, dbFilePath } = require("./dbModel");
const {
  getAllAnalyticsEventsFromSqlite,
  insertAnalyticsEventIntoSqlite,
  trimAnalyticsEventsInSqlite
} = require("./sqliteStoreModel");

const MAX_ANALYTICS_EVENTS = 5000;
const rootDir = path.join(__dirname, "..", "..");
const dataDir = path.join(rootDir, "data");
const analyticsFilePath = path.join(dataDir, "analytics.json");
const shouldUseSqliteReads = process.env.USE_SQLITE_READS !== "false";
const shouldDualWriteJson = process.env.DUAL_WRITE_JSON !== "false";

function hashValue(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex").slice(0, 16);
}

function normalizeAnalyticsStore(parsed = {}) {
  const events = Array.isArray(parsed.events)
    ? parsed.events.filter((event) => event && typeof event === "object")
    : [];

  return { events };
}

function readLegacyAnalyticsEvents() {
  try {
    const rawDb = fs.readFileSync(dbFilePath, "utf8");
    const parsedDb = JSON.parse(rawDb);
    const events = Array.isArray(parsedDb.analytics?.events) ? parsedDb.analytics.events : [];
    return events.filter((event) => event && typeof event === "object");
  } catch {
    return [];
  }
}

function removeLegacyAnalyticsFromDb() {
  const db = readDb();
  if (Object.prototype.hasOwnProperty.call(db, "analytics")) {
    delete db.analytics;
  }
  writeDb(db);
}

function ensureAnalyticsFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(analyticsFilePath)) {
    const migratedEvents = readLegacyAnalyticsEvents();
    fs.writeFileSync(analyticsFilePath, JSON.stringify(normalizeAnalyticsStore({ events: migratedEvents }), null, 2), "utf8");
    removeLegacyAnalyticsFromDb();
    return;
  }

  try {
    const raw = fs.readFileSync(analyticsFilePath, "utf8");
    const parsed = JSON.parse(raw);
    const normalized = normalizeAnalyticsStore(parsed);
    if (JSON.stringify(parsed) !== JSON.stringify(normalized)) {
      fs.writeFileSync(analyticsFilePath, JSON.stringify(normalized, null, 2), "utf8");
    }
  } catch {
    fs.writeFileSync(analyticsFilePath, JSON.stringify({ events: [] }, null, 2), "utf8");
  }

  removeLegacyAnalyticsFromDb();
}

function readAnalyticsStore() {
  ensureAnalyticsFile();
  try {
    const raw = fs.readFileSync(analyticsFilePath, "utf8");
    return normalizeAnalyticsStore(JSON.parse(raw));
  } catch {
    return { events: [] };
  }
}

function writeAnalyticsStore(store) {
  ensureAnalyticsFile();
  fs.writeFileSync(analyticsFilePath, JSON.stringify(normalizeAnalyticsStore(store), null, 2), "utf8");
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = req.headers["x-real-ip"];
  if (typeof realIp === "string" && realIp.trim()) {
    return realIp.trim();
  }

  return req.ip || req.socket?.remoteAddress || "unknown";
}

function getLocation(req) {
  return {
    country: req.headers["cf-ipcountry"] || req.headers["x-vercel-ip-country"] || req.headers["x-country-code"] || null,
    region: req.headers["x-vercel-ip-country-region"] || req.headers["x-region"] || null,
    city: req.headers["x-vercel-ip-city"] || req.headers["x-city"] || null
  };
}

function buildVisitorKey(req) {
  const ip = getClientIp(req);
  const userAgent = req.get("user-agent") || "unknown";
  return hashValue(`${ip}:${userAgent}`);
}

function sanitizePayload(payload = {}) {
  return Object.entries(payload).reduce((accumulator, [key, value]) => {
    if (value === undefined || value === null || value === "") {
      return accumulator;
    }

    if (typeof value === "string") {
      accumulator[key] = value.slice(0, 300);
      return accumulator;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      accumulator[key] = value;
    }

    return accumulator;
  }, {});
}

function createAnalyticsEvent(req, event = {}) {
  const timestamp = new Date().toISOString();

  return {
    id: crypto.randomUUID(),
    type: event.type || "custom",
    pathname: event.pathname || req.path,
    productId: event.productId || null,
    productName: event.productName || null,
    tool: event.tool || null,
    action: event.action || null,
    referrer: req.get("referer") || null,
    method: req.method,
    timestamp,
    date: timestamp.slice(0, 10),
    ip: getClientIp(req),
    visitorKey: buildVisitorKey(req),
    userAgent: req.get("user-agent") || "unknown",
    location: getLocation(req),
    payload: sanitizePayload(event.payload)
  };
}

function appendAnalyticsEvent(event) {
  let sqliteWriteSucceeded = false;

  try {
    insertAnalyticsEventIntoSqlite(event);
    trimAnalyticsEventsInSqlite(MAX_ANALYTICS_EVENTS);
    sqliteWriteSucceeded = true;
  } catch {
    // Keep file writes as a fallback path if SQLite is unavailable.
  }

  if (shouldDualWriteJson || !sqliteWriteSucceeded) {
    const analytics = readAnalyticsStore();
    analytics.events.push(event);

    if (analytics.events.length > MAX_ANALYTICS_EVENTS) {
      analytics.events = analytics.events.slice(-MAX_ANALYTICS_EVENTS);
    }

    writeAnalyticsStore(analytics);
  }

  return event;
}

function trackRequestEvent(req, event) {
  const entry = createAnalyticsEvent(req, event);
  return appendAnalyticsEvent(entry);
}

function countBy(items, getKey, getLabel) {
  const counts = new Map();

  for (const item of items) {
    const key = getKey(item);
    if (!key) {
      continue;
    }

    const current = counts.get(key) || { key, label: getLabel(item, key), count: 0 };
    current.count += 1;
    counts.set(key, current);
  }

  return [...counts.values()].sort((left, right) => right.count - left.count);
}

function getAnalyticsSummary() {
  const events = shouldUseSqliteReads
    ? (() => {
      try {
        return getAllAnalyticsEventsFromSqlite();
      } catch {
        return readAnalyticsStore().events;
      }
    })()
    : readAnalyticsStore().events;
  const pageViews = events.filter((event) => event.type === "page_view");
  const productViews = events.filter((event) => event.type === "product_view");
  const toolEvents = events.filter((event) => event.tool);

  return {
    totals: {
      events: events.length,
      pageViews: pageViews.length,
      productViews: productViews.length,
      toolEvents: toolEvents.length,
      uniqueVisitors: new Set(pageViews.map((event) => event.visitorKey)).size
    },
    topPages: countBy(pageViews, (event) => event.pathname, (event, key) => key).slice(0, 10),
    topProducts: countBy(productViews, (event) => event.productId || event.productName, (event, key) => event.productName || key).slice(0, 10),
    topTools: countBy(toolEvents, (event) => `${event.tool}:${event.action || event.type}`, (event) => `${event.tool} - ${event.action || event.type}`).slice(0, 10),
    topReferrers: countBy(pageViews, (event) => event.referrer, (event, key) => key).slice(0, 10),
    topCountries: countBy(pageViews, (event) => event.location?.country, (event, key) => key).slice(0, 10),
    recentEvents: events.slice(-25).reverse()
  };
}

module.exports = {
  getAnalyticsSummary,
  trackRequestEvent
};