const { getAllProducts } = require("../models/productModel");

function listProducts(req, res) {
  res.json(getAllProducts());
}

module.exports = {
  listProducts
};
