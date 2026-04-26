const { readDb, writeDb } = require("./dbModel");

function getSiteSettings() {
  const db = readDb();
  return db.siteSettings;
}

function updateSiteSettings(payload) {
  const db = readDb();
  db.siteSettings = {
    ...db.siteSettings,
    ...payload
  };
  writeDb(db);
  return db.siteSettings;
}

module.exports = {
  getSiteSettings,
  updateSiteSettings
};
