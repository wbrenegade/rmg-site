const { getAllCategories } = require("../models/categoryModel");

function listCategories(req, res) {
  res.json(getAllCategories());
}

module.exports = {
  listCategories
};
