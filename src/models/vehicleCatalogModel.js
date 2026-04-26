const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..", "..");
const catalogFilePath = path.join(rootDir, "data", "vehicle_catalog.json");

let cachedIndex = null;

function normalizeVehicleLabel(value) {
  return String(value || "").trim();
}

function createVehicleRecord(record) {
  const year = String(Number(record?.year));
  const make = normalizeVehicleLabel(record?.make);
  const model = normalizeVehicleLabel(record?.model);
  const trim = normalizeVehicleLabel(record?.trim);
  const bodyStyle = normalizeVehicleLabel(record?.body_style);
  const market = normalizeVehicleLabel(record?.market);
  const kitSku = normalizeVehicleLabel(record?.kit_sku);

  if (!year || !make || !model) return null;

  const labelParts = [year, make, model];
  if (trim) labelParts.push(trim);

  return {
    id: kitSku || labelParts.join("-").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    year,
    make,
    model,
    trim,
    bodyStyle,
    market,
    kitSku,
    label: labelParts.join(" "),
    searchLabel: [year, make, model, trim, bodyStyle, market, kitSku].filter(Boolean).join(" ").toLowerCase()
  };
}

function sortYearsDescending(a, b) {
  return Number(b) - Number(a);
}

function buildCatalogIndex(records = []) {
  const yearsSet = new Set();
  const makesByYear = new Map();
  const modelsByYearMake = new Map();
  const trimsByYearMakeModel = new Map();
  const vehicles = [];
  const seenVehicleIds = new Set();

  for (const record of records) {
    const vehicle = createVehicleRecord(record);
    const year = Number(vehicle?.year);
    const make = vehicle?.make || "";
    const model = vehicle?.model || "";
    const trim = vehicle?.trim || "";

    if (!Number.isFinite(year) || !make || !model) continue;

    yearsSet.add(String(year));

    if (!makesByYear.has(String(year))) {
      makesByYear.set(String(year), new Set());
    }
    makesByYear.get(String(year)).add(make);

    const yearMakeKey = `${year}|${make.toLowerCase()}`;
    if (!modelsByYearMake.has(yearMakeKey)) {
      modelsByYearMake.set(yearMakeKey, new Set());
    }
    modelsByYearMake.get(yearMakeKey).add(model);

    const yearMakeModelKey = `${year}|${make.toLowerCase()}|${model.toLowerCase()}`;
    if (!trimsByYearMakeModel.has(yearMakeModelKey)) {
      trimsByYearMakeModel.set(yearMakeModelKey, new Set());
    }
    if (trim) {
      trimsByYearMakeModel.get(yearMakeModelKey).add(trim);
    }

    if (vehicle && !seenVehicleIds.has(vehicle.id)) {
      seenVehicleIds.add(vehicle.id);
      vehicles.push(vehicle);
    }
  }

  const years = [...yearsSet].sort(sortYearsDescending);
  const makes = {};
  const models = {};
  const trims = {};

  for (const year of years) {
    makes[year] = [...(makesByYear.get(year) || [])].sort((a, b) => a.localeCompare(b));
    for (const make of makes[year]) {
      const key = `${year}|${make.toLowerCase()}`;
      models[key] = [...(modelsByYearMake.get(key) || [])].sort((a, b) => a.localeCompare(b));
      for (const model of models[key]) {
        const trimKey = `${year}|${make.toLowerCase()}|${model.toLowerCase()}`;
        trims[trimKey] = [...(trimsByYearMakeModel.get(trimKey) || [])].sort((a, b) => a.localeCompare(b));
      }
    }
  }

  vehicles.sort((left, right) => {
    if (left.year !== right.year) return Number(right.year) - Number(left.year);
    return left.label.localeCompare(right.label);
  });

  return {
    years,
    makes,
    models,
    trims,
    vehicles
  };
}

function readVehicleCatalogIndex() {
  if (cachedIndex) return cachedIndex;

  try {
    const raw = fs.readFileSync(catalogFilePath, "utf8");
    const parsed = JSON.parse(raw);
    const records = Array.isArray(parsed?.records) ? parsed.records : [];
    cachedIndex = buildCatalogIndex(records);
    return cachedIndex;
  } catch {
    cachedIndex = { years: [], makes: {}, models: {} };
    return cachedIndex;
  }
}

module.exports = {
  readVehicleCatalogIndex
};
