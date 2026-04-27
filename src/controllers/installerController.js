const path = require("path");
const fs = require("fs");

const listingsPath = path.join(__dirname, "../../data/shop_listings.json");

let _cache = null;

function getListings() {
  if (_cache) return _cache;
  const raw = fs.readFileSync(listingsPath, "utf8");
  const byState = JSON.parse(raw);

  let id = 0;
  const flat = [];

  for (const [state, entries] of Object.entries(byState)) {
    for (const entry of entries) {
      flat.push({
        _id: String(++id),
        name: entry.name || "",
        services: entry.services || "",
        address: entry.address || "",
        city: entry.city || "",
        state: entry.state || state,
        zip: entry.zip || "",
        phone: entry.phone || "",
        lat: entry.lat ?? null,
        lng: entry.lng ?? null,
      });
    }
  }

  _cache = flat;
  return flat;
}

function listInstallers(req, res) {
  try {
    const listings = getListings();
    const { state, service, q } = req.query;

    let results = listings;

    if (state) {
      results = results.filter(l => l.state.toLowerCase() === state.toLowerCase());
    }

    if (service) {
      results = results.filter(
        l => l.services.toLowerCase().trim() === service.toLowerCase().trim()
      );
    }

    if (q) {
      const term = q.toLowerCase();
      results = results.filter(l =>
        `${l.name} ${l.city} ${l.address}`.toLowerCase().includes(term)
      );
    }

    res.json(results);
  } catch (err) {
    console.error("listInstallers error:", err);
    res.status(500).json({ error: "Failed to load installer directory." });
  }
}

module.exports = { listInstallers };
