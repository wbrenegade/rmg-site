const fs = require("fs");
const path = require("path");
const Database = require("better-sqlite3");
const { dbFilePath } = require("./dbModel");

const rootDir = path.join(__dirname, "..", "..");
const dataDir = path.join(rootDir, "data");
const sqliteFilePath = path.join(dataDir, "app.sqlite");
const analyticsFilePath = path.join(dataDir, "analytics.json");

let dbInstance;

function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function getLegacyOrders() {
  const parsed = readJson(dbFilePath, {});
  return Array.isArray(parsed.orders) ? parsed.orders : [];
}

function getLegacyAnalyticsEvents() {
  const analytics = readJson(analyticsFilePath, { events: [] });
  if (Array.isArray(analytics.events) && analytics.events.length) {
    return analytics.events.filter((event) => event && typeof event === "object");
  }

  const parsedDb = readJson(dbFilePath, {});
  const legacyEvents = Array.isArray(parsedDb.analytics?.events) ? parsedDb.analytics.events : [];
  return legacyEvents.filter((event) => event && typeof event === "object");
}

function runMigrations(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      customer_json TEXT NOT NULL,
      items_json TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax REAL NOT NULL,
      total REAL NOT NULL,
      status TEXT NOT NULL,
      stripe_session_id TEXT,
      payment_status TEXT,
      created_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_session
    ON orders(stripe_session_id)
    WHERE stripe_session_id IS NOT NULL;

    CREATE INDEX IF NOT EXISTS idx_orders_created_at
    ON orders(created_at DESC);

    CREATE TABLE IF NOT EXISTS analytics_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      pathname TEXT,
      product_id TEXT,
      product_name TEXT,
      tool TEXT,
      action TEXT,
      referrer TEXT,
      method TEXT,
      timestamp TEXT NOT NULL,
      event_date TEXT,
      ip TEXT,
      visitor_key TEXT,
      user_agent TEXT,
      location_json TEXT NOT NULL,
      payload_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_analytics_timestamp
    ON analytics_events(timestamp DESC);

    CREATE INDEX IF NOT EXISTS idx_analytics_type
    ON analytics_events(type);

    CREATE INDEX IF NOT EXISTS idx_analytics_visitor
    ON analytics_events(visitor_key);
  `);

  const orderCount = db.prepare("SELECT COUNT(*) AS count FROM orders").get().count;
  if (!orderCount) {
    const insertLegacyOrder = db.prepare(`
      INSERT OR IGNORE INTO orders (
        id,
        user_id,
        customer_json,
        items_json,
        subtotal,
        tax,
        total,
        status,
        stripe_session_id,
        payment_status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertManyOrders = db.transaction((orders) => {
      for (const order of orders) {
        insertLegacyOrder.run(
          String(order.id || ""),
          String(order.userId || "guest"),
          JSON.stringify(order.customer || {}),
          JSON.stringify(Array.isArray(order.items) ? order.items : []),
          Number(order.subtotal || 0),
          Number(order.tax || 0),
          Number(order.total || 0),
          String(order.status || "Pending Fulfillment"),
          order.stripeSessionId ? String(order.stripeSessionId) : null,
          order.paymentStatus ? String(order.paymentStatus) : null,
          String(order.createdAt || new Date().toISOString())
        );
      }
    });

    insertManyOrders(getLegacyOrders().filter((order) => order && typeof order === "object"));
  }

  const analyticsCount = db.prepare("SELECT COUNT(*) AS count FROM analytics_events").get().count;
  if (!analyticsCount) {
    const insertLegacyAnalyticsEvent = db.prepare(`
      INSERT OR IGNORE INTO analytics_events (
        id,
        type,
        pathname,
        product_id,
        product_name,
        tool,
        action,
        referrer,
        method,
        timestamp,
        event_date,
        ip,
        visitor_key,
        user_agent,
        location_json,
        payload_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertManyEvents = db.transaction((events) => {
      for (const event of events) {
        insertLegacyAnalyticsEvent.run(
          String(event.id || ""),
          String(event.type || "custom"),
          event.pathname ? String(event.pathname) : null,
          event.productId ? String(event.productId) : null,
          event.productName ? String(event.productName) : null,
          event.tool ? String(event.tool) : null,
          event.action ? String(event.action) : null,
          event.referrer ? String(event.referrer) : null,
          event.method ? String(event.method) : null,
          String(event.timestamp || new Date().toISOString()),
          event.date ? String(event.date) : null,
          event.ip ? String(event.ip) : null,
          event.visitorKey ? String(event.visitorKey) : null,
          event.userAgent ? String(event.userAgent) : null,
          JSON.stringify(event.location || {}),
          JSON.stringify(event.payload || {})
        );
      }
    });

    insertManyEvents(getLegacyAnalyticsEvents());
  }
}

function getSqliteDb() {
  if (dbInstance) {
    return dbInstance;
  }

  ensureDataDir();
  dbInstance = new Database(sqliteFilePath);
  dbInstance.pragma("journal_mode = WAL");
  dbInstance.pragma("synchronous = NORMAL");
  runMigrations(dbInstance);
  return dbInstance;
}

function mapOrderRow(row) {
  return {
    id: row.id,
    userId: row.user_id,
    customer: safeJsonParse(row.customer_json, {}),
    items: safeJsonParse(row.items_json, []),
    subtotal: Number(row.subtotal || 0),
    tax: Number(row.tax || 0),
    total: Number(row.total || 0),
    status: row.status,
    stripeSessionId: row.stripe_session_id,
    paymentStatus: row.payment_status,
    createdAt: row.created_at
  };
}

function mapAnalyticsRow(row) {
  return {
    id: row.id,
    type: row.type,
    pathname: row.pathname,
    productId: row.product_id,
    productName: row.product_name,
    tool: row.tool,
    action: row.action,
    referrer: row.referrer,
    method: row.method,
    timestamp: row.timestamp,
    date: row.event_date,
    ip: row.ip,
    visitorKey: row.visitor_key,
    userAgent: row.user_agent,
    location: safeJsonParse(row.location_json, {}),
    payload: safeJsonParse(row.payload_json, {})
  };
}

function getAllOrdersFromSqlite() {
  const db = getSqliteDb();
  const rows = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
  return rows.map(mapOrderRow);
}

function getOrderByIdFromSqlite(orderId) {
  const db = getSqliteDb();
  const normalizedOrderId = String(orderId || "").trim();
  if (!normalizedOrderId) {
    return null;
  }

  const row = db.prepare("SELECT * FROM orders WHERE id = ? LIMIT 1").get(normalizedOrderId);
  return row ? mapOrderRow(row) : null;
}

function getOrdersByUserIdFromSqlite(userId) {
  const db = getSqliteDb();
  const normalizedUserId = String(userId || "").trim();
  if (!normalizedUserId) {
    return getAllOrdersFromSqlite();
  }

  const rows = db.prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC").all(normalizedUserId);
  return rows.map(mapOrderRow);
}

function findOrderByStripeSessionIdFromSqlite(stripeSessionId) {
  const db = getSqliteDb();
  const normalizedSessionId = String(stripeSessionId || "").trim();
  if (!normalizedSessionId) {
    return null;
  }

  const row = db.prepare("SELECT * FROM orders WHERE stripe_session_id = ? LIMIT 1").get(normalizedSessionId);
  return row ? mapOrderRow(row) : null;
}

function insertOrderIntoSqlite(order) {
  const db = getSqliteDb();
  db.prepare(`
    INSERT OR REPLACE INTO orders (
      id,
      user_id,
      customer_json,
      items_json,
      subtotal,
      tax,
      total,
      status,
      stripe_session_id,
      payment_status,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(order.id),
    String(order.userId || "guest"),
    JSON.stringify(order.customer || {}),
    JSON.stringify(Array.isArray(order.items) ? order.items : []),
    Number(order.subtotal || 0),
    Number(order.tax || 0),
    Number(order.total || 0),
    String(order.status || "Pending Fulfillment"),
    order.stripeSessionId ? String(order.stripeSessionId) : null,
    order.paymentStatus ? String(order.paymentStatus) : null,
    String(order.createdAt || new Date().toISOString())
  );
}

function updateOrderStatusInSqlite(orderId, status) {
  const db = getSqliteDb();
  const normalizedOrderId = String(orderId || "").trim();
  const normalizedStatus = String(status || "").trim();

  if (!normalizedOrderId || !normalizedStatus) {
    return false;
  }

  const result = db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(normalizedStatus, normalizedOrderId);
  return result.changes > 0;
}

function getAllAnalyticsEventsFromSqlite() {
  const db = getSqliteDb();
  const rows = db.prepare("SELECT * FROM analytics_events ORDER BY timestamp ASC").all();
  return rows.map(mapAnalyticsRow);
}

function insertAnalyticsEventIntoSqlite(event) {
  const db = getSqliteDb();
  db.prepare(`
    INSERT OR REPLACE INTO analytics_events (
      id,
      type,
      pathname,
      product_id,
      product_name,
      tool,
      action,
      referrer,
      method,
      timestamp,
      event_date,
      ip,
      visitor_key,
      user_agent,
      location_json,
      payload_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    String(event.id),
    String(event.type || "custom"),
    event.pathname ? String(event.pathname) : null,
    event.productId ? String(event.productId) : null,
    event.productName ? String(event.productName) : null,
    event.tool ? String(event.tool) : null,
    event.action ? String(event.action) : null,
    event.referrer ? String(event.referrer) : null,
    event.method ? String(event.method) : null,
    String(event.timestamp || new Date().toISOString()),
    event.date ? String(event.date) : null,
    event.ip ? String(event.ip) : null,
    event.visitorKey ? String(event.visitorKey) : null,
    event.userAgent ? String(event.userAgent) : null,
    JSON.stringify(event.location || {}),
    JSON.stringify(event.payload || {})
  );
}

function trimAnalyticsEventsInSqlite(maxEvents) {
  const db = getSqliteDb();
  db.prepare(`
    DELETE FROM analytics_events
    WHERE id IN (
      SELECT id
      FROM analytics_events
      ORDER BY timestamp DESC
      LIMIT -1 OFFSET ?
    )
  `).run(Number(maxEvents || 0));
}

module.exports = {
  getSqliteDb,
  sqliteFilePath,
  getAllOrdersFromSqlite,
  getOrderByIdFromSqlite,
  getOrdersByUserIdFromSqlite,
  findOrderByStripeSessionIdFromSqlite,
  insertOrderIntoSqlite,
  updateOrderStatusInSqlite,
  getAllAnalyticsEventsFromSqlite,
  insertAnalyticsEventIntoSqlite,
  trimAnalyticsEventsInSqlite
};
