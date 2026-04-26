const { readVehicleCatalogIndex } = require("../models/vehicleCatalogModel");

function listVehicleCatalog(req, res) {
  res.json(readVehicleCatalogIndex());
}

module.exports = {
  listVehicleCatalog
};
