const { readDb } = require("./dbModel");

function getAllCategories() {
  const db = readDb();
  return Array.isArray(db.categories) ? db.categories : [];
}

module.exports = {
  getAllCategories
};
