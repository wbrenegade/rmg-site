const DECAL_HIERARCHY = {
  "By Placement": {
    Fender: ["Sponsor Stacks", "Brand Decals"],
    "Rear Quarter Panel": ["Racing Stripes", "Graphics", "Brand Decals", "Rips/Scratches/Tears"],
    "Rocker Panel/Side": ["Racing Stripes", "Graphics", "Brand Decals", "Sponsor Rows"],
    "Windshield/Rear Window": ["Banners", "Lettering"],
    Hood: ["Graphics", "Racing Stripes"],
    Custom: []
  },

  "By Style": {
    "Racing Stripes": [],
    Graphics: [],
    "Brand Decals": [],
    "Sponsor Stacks": [],
    "Sponsor Rows": [],
    "Rips/Scratches/Tears": [],
    Lettering: []
  },

  Custom: {}
};

const CATEGORY_HIERARCHY = {
  Decals: DECAL_HIERARCHY,

  "Window Tint": {
    "Precut Kits": {},
    "Full Rolls": {}
  },

  Lettering: {
    "Business Name": {},
    "Business Info": {}
  },

  Wraps: {
    "Full Rolls": {},
    "By The Foot": {}
  }
};

const FALLBACK_IMAGE = "/assets/imgs/main.PNG";

const CATEGORY_IMAGES = {
  Decals: "/assets/imgs/decal-cats/graphics.png",
  "Window Tint": "/assets/imgs/main.PNG",
  Lettering: "/assets/imgs/decal-cats/brands.png",
  Wraps: "/assets/imgs/main.PNG"
};

const DECAL_GROUP_IMAGES = {
  "By Placement": "/assets/imgs/decal-cats/graphics.png",
  "By Style": "/assets/imgs/decal-cats/platform_specific.png",
  Custom: "/assets/imgs/decal-cats/custom.png"
};

const PLACEMENT_IMAGES = {
  Fender: "/assets/imgs/decal-cats/fender.png",
  "Rear Quarter Panel": "/assets/imgs/product-cards/quarter_panel_kit.png",
  "Rocker Panel/Side": "/assets/imgs/decal-cats/rocker_panel_side.png",
  "Windshield/Rear Window": "/assets/imgs/decal-cats/windshield.png",
  Hood: "/assets/imgs/decal-cats/full_body_half_body.png",
  Custom: "/assets/imgs/decal-cats/custom.png"
};

const STYLE_IMAGES = {
  "Racing Stripes": "/assets/imgs/decal-sub-cats/racing_Stripes.png",
  Graphics: "/assets/imgs/decal-cats/graphics.png",
  "Brand Decals": "/assets/imgs/decal-cats/brands.png",
  "Sponsor Stacks": "/assets/imgs/decal-cats/sponsor_stacks.png",
  "Sponsor Rows": "/assets/imgs/decal-cats/sponsor_stacks.png",
  "Rips/Scratches/Tears": "/assets/imgs/product-cards/quarter_panel_kit.png",
  Banners: "/assets/imgs/product-cards/windshield_banner.png",
  Lettering: "/assets/imgs/decal-cats/brands.png"
};

const NON_DECAL_SUBCATEGORY_IMAGES = {
  "Precut Kits": "/assets/imgs/main.PNG",
  "Full Rolls": "/assets/imgs/main.PNG",
  "By The Foot": "/assets/imgs/main.PNG",
  "Business Name": "/assets/imgs/decal-cats/brands.png",
  "Business Info": "/assets/imgs/decal-cats/brands.png"
};

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeCategory(value) {
  const normalized = normalizeText(value);

  if (!normalized) return "";
  if (normalized === "decals") return "Decals";
  if (normalized.startsWith("vehicle decals")) return "Decals";
  if (normalized === "stickers") return "Decals";
  if (normalized === "window tint") return "Window Tint";
  if (normalized === "tint kits") return "Window Tint";
  if (normalized === "lettering") return "Lettering";
  if (normalized === "business lettering") return "Lettering";
  if (normalized === "wraps") return "Wraps";
  if (normalized === "wrap graphics") return "Wraps";

  return String(value || "").trim();
}

function normalizePlacement(value) {
  const text = normalizeText(value);

  if (!text) return "";

  if (text.includes("fender")) return "Fender";
  if (text.includes("quarter")) return "Rear Quarter Panel";
  if (text.includes("rocker") || text.includes("side")) return "Rocker Panel/Side";
  if (text.includes("windshield") || text.includes("rear window") || text.includes("banner")) return "Windshield/Rear Window";
  if (text.includes("hood")) return "Hood";
  if (text.includes("custom")) return "Custom";

  return "";
}

function normalizeStyle(value) {
  const text = normalizeText(value);

  if (!text) return "";

  if (text.includes("racing stripe") || text.includes("stripe")) return "Racing Stripes";
  if (text.includes("sponsor stack")) return "Sponsor Stacks";
  if (text.includes("sponsor row")) return "Sponsor Rows";
  if (text.includes("brand") || text.includes("trd") || text.includes("mopar") || text.includes("coyote") || text.includes("nismo")) return "Brand Decals";
  if (text.includes("rip") || text.includes("scratch") || text.includes("tear")) return "Rips/Scratches/Tears";
  if (text.includes("banner")) return "Banners";
  if (text.includes("letter")) return "Lettering";
  if (text.includes("graphic") || text.includes("geometric") || text.includes("pattern")) return "Graphics";

  return "";
}

function getProductPlacement(product) {
  return (
    product.placement ||
    normalizePlacement(product.subcategory) ||
    normalizePlacement(product.subSubcategory) ||
    normalizePlacement(product.name) ||
    normalizePlacement(product.description)
  );
}

function getProductStyle(product) {
  return (
    product.style ||
    product.decalType ||
    normalizeStyle(product.subSubcategory) ||
    normalizeStyle(product.subcategory) ||
    normalizeStyle(product.name) ||
    normalizeStyle(product.description)
  );
}

function getTaxonomyImage(product) {
  const category = product.category;
  const placement = getProductPlacement(product);
  const style = getProductStyle(product);

  const imagePath = product.imagePath || "";

  const isGeneric =
    !imagePath ||
    imagePath.includes("main.PNG") ||
    imagePath.includes("main.png");

  if (!isGeneric) return imagePath;

  if (category === "Decals") {
    return (
      STYLE_IMAGES[style] ||
      PLACEMENT_IMAGES[placement] ||
      CATEGORY_IMAGES.Decals ||
      FALLBACK_IMAGE
    );
  }

  return (
    NON_DECAL_SUBCATEGORY_IMAGES[product.subcategory] ||
    CATEGORY_IMAGES[category] ||
    FALLBACK_IMAGE
  );
}

function getImageForChip(category, group, value) {
  if (category === "Decals") {
    if (group === "category") {
      return CATEGORY_IMAGES.Decals;
    }

    if (group === "decalGroup") {
      return DECAL_GROUP_IMAGES[value] || CATEGORY_IMAGES.Decals || FALLBACK_IMAGE;
    }

    if (group === "placement") {
      return PLACEMENT_IMAGES[value] || CATEGORY_IMAGES.Decals || FALLBACK_IMAGE;
    }

    if (group === "style") {
      return STYLE_IMAGES[value] || CATEGORY_IMAGES.Decals || FALLBACK_IMAGE;
    }
  }

  if (group === "category") {
    return CATEGORY_IMAGES[category] || FALLBACK_IMAGE;
  }

  return NON_DECAL_SUBCATEGORY_IMAGES[value] || CATEGORY_IMAGES[category] || FALLBACK_IMAGE;
}

function toDisplayProduct(product) {
  const category = normalizeCategory(product.category);

  const placement = getProductPlacement(product);
  const style = getProductStyle(product);

  let subcategory = product.subcategory || "";
  let subSubcategory = product.subSubcategory || "";

  if (category === "Window Tint" && !subcategory) {
    subcategory = "Precut Kits";
  }

  if (category === "Decals") {
    if (!subcategory && placement) subcategory = placement;
    if (!subSubcategory && style) subSubcategory = style;
  }

  return {
    ...product,
    category,
    subcategory,
    subSubcategory,
    placement,
    style,
    imagePath: getTaxonomyImage({
      ...product,
      category,
      subcategory,
      subSubcategory,
      placement,
      style
    }),
    imageLabel: product.imageLabel || style || placement || subcategory || category || product.name
  };
}

function createTaxonomyButton({
  label,
  image,
  datasetName,
  datasetValue,
  active = false
}) {
  return `
    <button type="button" class="decal-chip taxonomy-card${active ? " active" : ""}" data-${datasetName}="${datasetValue}">
      <img src="${image}" alt="${label}" loading="lazy" onerror="this.src='${FALLBACK_IMAGE}'">
      <span>${label}</span>
    </button>
  `;
}

function getCategoryOptions() {
  return Object.keys(CATEGORY_HIERARCHY);
}

function getTopLevelOptions(category) {
  if (category === "Decals") {
    return Object.keys(DECAL_HIERARCHY);
  }

  return Object.keys(CATEGORY_HIERARCHY[category] || {});
}

function getDetailOptions(category, topLevel) {
  if (category === "Decals") {
    const branch = DECAL_HIERARCHY[topLevel];

    if (!branch || Array.isArray(branch)) return [];

    return Object.keys(branch);
  }

  return [];
}

function getFinalOptions(category, topLevel, detail) {
  if (category === "Decals") {
    const branch = DECAL_HIERARCHY[topLevel];

    if (!branch || Array.isArray(branch)) return [];

    return branch[detail] || [];
  }

  return [];
}

async function initShop() {
  const productsEl = document.getElementById("shopProducts");
  const resultsMeta = document.getElementById("resultsMeta");
  const categoryPicks = document.getElementById("categoryPicks");
  const subcategoryWrap = document.getElementById("subcategoryWrap");
  const subcategoryPicks = document.getElementById("subcategoryPicks");
  const subcategoryDetailWrap = document.getElementById("subcategoryDetailWrap");
  const subcategoryDetailPicks = document.getElementById("subcategoryDetailPicks");
  const toggleAdvancedFilters = document.getElementById("toggleAdvancedFilters");
  const advancedFilters = document.getElementById("advancedFilters");

  const vehicleSearchInput = document.getElementById("vehicleSearchInput");
  const vehicleSearchOptions = document.getElementById("vehicleSearchOptions");
  const yearFilter = document.getElementById("yearFilter");
  const makeFilter = document.getElementById("makeFilter");
  const modelFilter = document.getElementById("modelFilter");
  const trimFilter = document.getElementById("trimFilter");

  const searchInput = document.getElementById("searchInput");
  const categoryFilter = document.getElementById("categoryFilter");
  const subcategoryFilter = document.getElementById("subcategoryFilter");
  const subcategoryDetailFilter = document.getElementById("subcategoryDetailFilter");
  const sortFilter = document.getElementById("sortFilter");
  const clearFilters = document.getElementById("clearFilters");

  if (!productsEl) return;

  if (typeof window.ensureProductsLoaded === "function") {
    await window.ensureProductsLoaded();
  }

  function setAdvancedFiltersVisibility(expanded) {
    if (!toggleAdvancedFilters || !advancedFilters) return;

    advancedFilters.hidden = !expanded;
    toggleAdvancedFilters.setAttribute("aria-expanded", String(expanded));
    toggleAdvancedFilters.textContent = expanded ? "Hide Advanced Filters" : "Show Advanced Filters";
  }

  function syncAdvancedFiltersLayout() {
    if (!toggleAdvancedFilters || !advancedFilters || typeof window.matchMedia !== "function") return;

    const isCompact = window.matchMedia("(max-width: 980px)").matches;
    toggleAdvancedFilters.hidden = !isCompact;
    setAdvancedFiltersVisibility(!isCompact);
  }

  if (toggleAdvancedFilters && advancedFilters) {
    toggleAdvancedFilters.addEventListener("click", () => {
      const isExpanded = toggleAdvancedFilters.getAttribute("aria-expanded") === "true";
      setAdvancedFiltersVisibility(!isExpanded);
    });

    window.addEventListener("resize", syncAdvancedFiltersLayout);
    syncAdvancedFiltersLayout();
  }

  function setSelectOptions(select, values, allLabel) {
    if (!select) return;

    select.innerHTML = [
      `<option value="all">${allLabel}</option>`,
      ...values.map((value) => `<option value="${value}">${value}</option>`)
    ].join("");
  }

  function setVehicleSelectOptions(select, values, placeholder) {
    if (!select) return;

    select.innerHTML = [
      `<option value="">${placeholder}</option>`,
      ...values.map((value) => `<option value="${value}">${value}</option>`)
    ].join("");
  }

  function setDatalistOptions(list, values) {
    if (!list) return;
    list.innerHTML = values.map((value) => `<option value="${value}"></option>`).join("");
  }

  function buildVehicleLabel(vehicle) {
    return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
  }

  function getVehicleSearchLabel(vehicle) {
    return [buildVehicleLabel(vehicle), vehicle.bodyStyle].filter(Boolean).join(" ");
  }

  function buildVehicleCustomizeUrl(vehicle) {
    const params = new URLSearchParams();
    params.set("type", "vehicle-tint-kit");
    params.set("year", vehicle.year);
    params.set("make", vehicle.make);
    params.set("model", vehicle.model);
    if (vehicle.trim) params.set("trim", vehicle.trim);
    if (vehicle.kitSku) params.set("sku", vehicle.kitSku);
    return `/mustang-customizer?${params.toString()}`;
  }

  function buildVehicleProductUrl(vehicle) {
    const params = new URLSearchParams();
    params.set("type", "vehicle-tint-kit");
    params.set("year", vehicle.year);
    params.set("make", vehicle.make);
    params.set("model", vehicle.model);
    if (vehicle.trim) params.set("trim", vehicle.trim);
    if (vehicle.kitSku) params.set("sku", vehicle.kitSku);
    return `/product?${params.toString()}`;
  }

  function createVehicleKitProducts(vehicles) {
    return vehicles.map((vehicle) => {
      const vehicleLabel = buildVehicleLabel(vehicle);
      const fitmentLabel = [vehicleLabel, vehicle.bodyStyle].filter(Boolean).join(" ");

      return {
        id: `vehicle-tint-kit-${slugify(vehicle.kitSku || vehicle.id)}`,
        name: `${vehicleLabel} Tint Kit`,
        slug: slugify(`${vehicleLabel} tint kit`),
        category: "Window Tint",
        subcategory: "Precut Kits",
        subSubcategory: null,
        price: 149.99,
        featured: true,
        description: `Pre-cut tint kit matched to ${fitmentLabel}.`,
        tags: ["Window Tint", "Precut Kits"].concat(vehicle.kitSku ? [vehicle.kitSku] : []),
        imagePath: "/assets/imgs/main.PNG",
        imageLabel: `${vehicleLabel} Tint Kit`,
        custom: true,
        productUrl: buildVehicleProductUrl(vehicle),
        customizeUrl: buildVehicleCustomizeUrl(vehicle)
      };
    });
  }

  function matchesVehicleSearch(vehicle, query) {
    if (!query) return true;

    const terms = query.split(/\s+/).filter(Boolean);
    const haystack = normalizeText(vehicle.searchLabel || getVehicleSearchLabel(vehicle));

    return terms.every((term) => haystack.includes(term));
  }

  let vehicleCatalogIndex = {
    years: [],
    makes: {},
    models: {},
    trims: {},
    vehicles: []
  };

  try {
    const payload = typeof window.RMGApi?.getVehicleCatalog === "function"
      ? await window.RMGApi.getVehicleCatalog()
      : await fetch("/api/vehicles/catalog").then((response) => response.ok ? response.json() : null);

    if (payload && Array.isArray(payload.years) && payload.makes && payload.models) {
      vehicleCatalogIndex = {
        years: payload.years,
        makes: payload.makes || {},
        models: payload.models || {},
        trims: payload.trims || {},
        vehicles: Array.isArray(payload.vehicles) ? payload.vehicles : []
      };
    }
  } catch {
    vehicleCatalogIndex = {
      years: [],
      makes: {},
      models: {},
      trims: {},
      vehicles: []
    };
  }

  function getModelsForSelection(year, make) {
    if (!year || !make) return [];
    return vehicleCatalogIndex.models[`${year}|${normalizeText(make)}`] || [];
  }

  function getTrimsForSelection(year, make, model) {
    if (!year || !make || !model) return [];
    return vehicleCatalogIndex.trims[`${year}|${normalizeText(make)}|${normalizeText(model)}`] || [];
  }

  function updateVehicleSearchSuggestions() {
    if (!vehicleSearchInput || !vehicleSearchOptions) return;

    const year = yearFilter?.value || "";
    const make = makeFilter?.value || "";
    const model = modelFilter?.value || "";
    const trim = trimFilter?.value || "";
    const query = normalizeText(vehicleSearchInput.value);

    const suggestions = vehicleCatalogIndex.vehicles
      .filter((vehicle) => {
        if (year && vehicle.year !== year) return false;
        if (make && vehicle.make !== make) return false;
        if (model && vehicle.model !== model) return false;
        if (trim && vehicle.trim !== trim) return false;
        return matchesVehicleSearch(vehicle, query);
      })
      .slice(0, 20)
      .map(getVehicleSearchLabel);

    setDatalistOptions(vehicleSearchOptions, [...new Set(suggestions)]);
  }

  function syncFiltersFromVehicleSearch() {
    if (!vehicleSearchInput) return;

    const selectedLabel = normalizeText(vehicleSearchInput.value);
    if (!selectedLabel) return;

    const matchedVehicle = vehicleCatalogIndex.vehicles.find(
      (vehicle) =>
        normalizeText(getVehicleSearchLabel(vehicle)) === selectedLabel ||
        normalizeText(buildVehicleLabel(vehicle)) === selectedLabel
    );

    if (!matchedVehicle) return;

    yearFilter.value = matchedVehicle.year;

    setVehicleSelectOptions(makeFilter, vehicleCatalogIndex.makes[matchedVehicle.year] || [], "Select Make");
    makeFilter.disabled = false;
    makeFilter.value = matchedVehicle.make;

    setVehicleSelectOptions(modelFilter, getModelsForSelection(matchedVehicle.year, matchedVehicle.make), "Select Model");
    modelFilter.disabled = false;
    modelFilter.value = matchedVehicle.model;

    setVehicleSelectOptions(trimFilter, getTrimsForSelection(matchedVehicle.year, matchedVehicle.make, matchedVehicle.model), "Select Trim");
    trimFilter.disabled = false;
    trimFilter.value = matchedVehicle.trim || "";

    if (typeof window.setSelectedVehicle === "function") {
      window.setSelectedVehicle(matchedVehicle);
    }
  }

  function persistSelectedVehicleFromFilters(vehicles) {
    if (typeof window.setSelectedVehicle !== "function") return;

    const selectedYear = yearFilter?.value || "";
    const selectedMake = makeFilter?.value || "";
    const selectedModel = modelFilter?.value || "";
    const selectedTrim = trimFilter?.value || "";

    if (!(selectedYear && selectedMake && selectedModel)) return;

    const exact = vehicles.find((vehicle) => {
      if (vehicle.year !== selectedYear) return false;
      if (vehicle.make !== selectedMake) return false;
      if (vehicle.model !== selectedModel) return false;
      if (selectedTrim && vehicle.trim !== selectedTrim) return false;
      return true;
    });

    if (exact) {
      window.setSelectedVehicle(exact);
    }
  }

  function applyStoredVehicleSelection() {
    const selectedVehicle = typeof window.getSelectedVehicle === "function"
      ? window.getSelectedVehicle()
      : null;

    if (!(selectedVehicle && yearFilter && makeFilter && modelFilter && trimFilter)) return;
    if (!vehicleCatalogIndex.years.includes(selectedVehicle.year)) return;

    yearFilter.value = selectedVehicle.year;

    setVehicleSelectOptions(makeFilter, vehicleCatalogIndex.makes[selectedVehicle.year] || [], "Select Make");
    makeFilter.disabled = false;

    if (selectedVehicle.make) {
      makeFilter.value = selectedVehicle.make;
      setVehicleSelectOptions(modelFilter, getModelsForSelection(selectedVehicle.year, selectedVehicle.make), "Select Model");
      modelFilter.disabled = false;
    }

    if (selectedVehicle.model) {
      modelFilter.value = selectedVehicle.model;
      setVehicleSelectOptions(trimFilter, getTrimsForSelection(selectedVehicle.year, selectedVehicle.make, selectedVehicle.model), "Select Trim");
      trimFilter.disabled = false;
    }

    if (selectedVehicle.trim) {
      trimFilter.value = selectedVehicle.trim;
    }

    if (vehicleSearchInput && selectedVehicle.label) {
      vehicleSearchInput.value = selectedVehicle.label;
    }
  }

  if (yearFilter && makeFilter && modelFilter && trimFilter) {
    setVehicleSelectOptions(yearFilter, vehicleCatalogIndex.years, "Select Year");
    updateVehicleSearchSuggestions();

    yearFilter.addEventListener("change", () => {
      const year = yearFilter.value;
      const makes = year ? (vehicleCatalogIndex.makes[year] || []) : [];

      setVehicleSelectOptions(makeFilter, makes, "Select Make");
      setVehicleSelectOptions(modelFilter, [], "Select Model");
      setVehicleSelectOptions(trimFilter, [], "Select Trim");

      makeFilter.disabled = !year;
      modelFilter.disabled = true;
      trimFilter.disabled = true;

      updateVehicleSearchSuggestions();
      render();
    });

    makeFilter.addEventListener("change", () => {
      const year = yearFilter.value;
      const make = makeFilter.value;
      const models = getModelsForSelection(year, make);

      setVehicleSelectOptions(modelFilter, models, "Select Model");
      setVehicleSelectOptions(trimFilter, [], "Select Trim");

      modelFilter.disabled = !(year && make);
      trimFilter.disabled = true;

      updateVehicleSearchSuggestions();
      render();
    });

    modelFilter.addEventListener("change", () => {
      const year = yearFilter.value;
      const make = makeFilter.value;
      const model = modelFilter.value;
      const trims = getTrimsForSelection(year, make, model);

      setVehicleSelectOptions(trimFilter, trims, "Select Trim");
      trimFilter.disabled = !(year && make && model);

      updateVehicleSearchSuggestions();
      render();
    });

    trimFilter.addEventListener("change", () => {
      updateVehicleSearchSuggestions();
      render();
    });
  }

  if (vehicleSearchInput) {
    vehicleSearchInput.addEventListener("input", () => {
      updateVehicleSearchSuggestions();
      render();
    });

    vehicleSearchInput.addEventListener("change", () => {
      syncFiltersFromVehicleSearch();
      updateVehicleSearchSuggestions();
      render();
    });
  }

  applyStoredVehicleSelection();
  updateVehicleSearchSuggestions();

  function syncCategorySelect() {
    if (!categoryFilter) return;

    setSelectOptions(categoryFilter, getCategoryOptions(), "All Categories");
  }

  function syncSubcategorySelect() {
    if (!categoryFilter || !subcategoryFilter) return;

    const category = categoryFilter.value;

    if (category === "all") {
      setSelectOptions(subcategoryFilter, [], "Select Category First");
      subcategoryFilter.value = "all";
      syncDetailSelect();
      return;
    }

    const options = getTopLevelOptions(category);

    setSelectOptions(
      subcategoryFilter,
      options,
      category === "Decals" ? "Choose By Placement / By Style" : "All Subcategories"
    );

    if (!options.includes(subcategoryFilter.value)) {
      subcategoryFilter.value = "all";
    }

    syncDetailSelect();
  }

  function syncDetailSelect() {
    if (!categoryFilter || !subcategoryFilter || !subcategoryDetailFilter) return;

    const category = categoryFilter.value;
    const topLevel = subcategoryFilter.value;

    if (category === "all" || topLevel === "all") {
      setSelectOptions(subcategoryDetailFilter, [], "All Details");
      subcategoryDetailFilter.value = "all";
      return;
    }

    const details = getDetailOptions(category, topLevel);

    setSelectOptions(
      subcategoryDetailFilter,
      details,
      category === "Decals" && topLevel === "By Placement" ? "All Placements" :
      category === "Decals" && topLevel === "By Style" ? "All Styles" :
      "All Details"
    );

    if (!details.includes(subcategoryDetailFilter.value)) {
      subcategoryDetailFilter.value = "all";
    }
  }

  function syncHierarchyVisibility() {
    const category = categoryFilter?.value || "all";
    const topLevel = subcategoryFilter?.value || "all";

    if (subcategoryWrap) {
      subcategoryWrap.hidden = category === "all";
    }

    if (subcategoryDetailWrap) {
      subcategoryDetailWrap.hidden = category === "all" || topLevel === "all";
    }
  }

  function renderCategoryPicks() {
    if (!categoryPicks) return;

    const selectedCategory = categoryFilter?.value || "all";

    categoryPicks.innerHTML = ["all", ...getCategoryOptions()].map((category) => {
      const label = category === "all" ? "All Products" : category;
      const image = category === "all" ? FALLBACK_IMAGE : getImageForChip(category, "category", category);

      return createTaxonomyButton({
        label,
        image,
        datasetName: "category",
        datasetValue: category,
        active: category === selectedCategory
      });
    }).join("");
  }

  function renderSubcategoryPicks() {
    if (!subcategoryPicks || !categoryFilter) return;

    const category = categoryFilter.value;

    if (category === "all") {
      subcategoryPicks.innerHTML = "";
      return;
    }

    const selected = subcategoryFilter?.value || "all";
    const options = getTopLevelOptions(category);

    subcategoryPicks.innerHTML = ["all", ...options].map((value) => {
      const label = value === "all" ? "All" : value;
      const image = value === "all"
        ? getImageForChip(category, "category", category)
        : getImageForChip(category, category === "Decals" ? "decalGroup" : "subcategory", value);

      return createTaxonomyButton({
        label,
        image,
        datasetName: "subcategory",
        datasetValue: value,
        active: value === selected
      });
    }).join("");
  }

  function renderDetailPicks() {
    if (!subcategoryDetailPicks || !categoryFilter || !subcategoryFilter) return;

    const category = categoryFilter.value;
    const topLevel = subcategoryFilter.value;

    if (category === "all" || topLevel === "all") {
      subcategoryDetailPicks.innerHTML = "";
      return;
    }

    const selected = subcategoryDetailFilter?.value || "all";
    const details = getDetailOptions(category, topLevel);

    subcategoryDetailPicks.innerHTML = ["all", ...details].map((value) => {
      const label = value === "all"
        ? topLevel === "By Placement" ? "All Placements" :
          topLevel === "By Style" ? "All Styles" :
          "All Details"
        : value;

      let image = FALLBACK_IMAGE;

      if (category === "Decals") {
        if (value === "all") {
          image = getImageForChip(category, "decalGroup", topLevel);
        } else if (topLevel === "By Placement") {
          image = getImageForChip(category, "placement", value);
        } else if (topLevel === "By Style") {
          image = getImageForChip(category, "style", value);
        }
      }

      return createTaxonomyButton({
        label,
        image,
        datasetName: "subsubcategory",
        datasetValue: value,
        active: value === selected
      });
    }).join("");
  }

  function syncAllHierarchyUI() {
    syncSubcategorySelect();
    syncDetailSelect();
    syncHierarchyVisibility();
    renderCategoryPicks();
    renderSubcategoryPicks();
    renderDetailPicks();
  }

  syncCategorySelect();
  syncAllHierarchyUI();

  function productMatchesDecalHierarchy(product, group, detail) {
    const placement = product.placement || getProductPlacement(product);
    const style = product.style || getProductStyle(product);

    if (group === "all") return true;

    if (group === "Custom") {
      return normalizeText(product.name).includes("custom") ||
        normalizeText(product.description).includes("custom") ||
        normalizeText(product.subcategory).includes("custom");
    }

    if (group === "By Placement") {
      if (detail === "all") return Boolean(placement);
      return placement === detail;
    }

    if (group === "By Style") {
      if (detail === "all") return Boolean(style);
      return style === detail;
    }

    return true;
  }

  function productMatchesSearch(product, search) {
    if (!search) return true;

    const searchableText = [
      product.name,
      product.category,
      product.subcategory,
      product.subSubcategory,
      product.placement,
      product.style,
      product.description,
      ...(Array.isArray(product.tags) ? product.tags : [])
    ].join(" ").toLowerCase();

    return searchableText.includes(search);
  }

  function render() {
    const search = searchInput?.value.trim().toLowerCase() || "";
    const category = categoryFilter?.value || "all";
    const subcategory = subcategoryFilter?.value || "all";
    const detail = subcategoryDetailFilter?.value || "all";
    const sort = sortFilter?.value || "default";

    const vehicleQuery = normalizeText(vehicleSearchInput?.value || "");
    const selectedYear = yearFilter?.value || "";
    const selectedMake = makeFilter?.value || "";
    const selectedModel = modelFilter?.value || "";
    const selectedTrim = trimFilter?.value || "";

    const matchedVehicles = vehicleCatalogIndex.vehicles.filter((vehicle) => {
      if (selectedYear && vehicle.year !== selectedYear) return false;
      if (selectedMake && vehicle.make !== selectedMake) return false;
      if (selectedModel && vehicle.model !== selectedModel) return false;
      if (selectedTrim && vehicle.trim !== selectedTrim) return false;
      return matchesVehicleSearch(vehicle, vehicleQuery);
    });

    persistSelectedVehicleFromFilters(matchedVehicles);

    const vehicleKits = createVehicleKitProducts(matchedVehicles.slice(0, 12));

    let filtered = PRODUCTS.map(toDisplayProduct).filter((product) => {
      const matchesSearch = productMatchesSearch(product, search);
      const matchesCategory = category === "all" || product.category === category;

      let matchesHierarchy = true;

      if (category === "Decals") {
        matchesHierarchy = productMatchesDecalHierarchy(product, subcategory, detail);
      } else if (category !== "all") {
        matchesHierarchy = subcategory === "all" || product.subcategory === subcategory;
      }

      return matchesSearch && matchesCategory && matchesHierarchy;
    });

    if (vehicleKits.length) {
      const kitProducts = vehicleKits.map(toDisplayProduct).filter((product) => {
        const matchesSearch = productMatchesSearch(product, search);
        const matchesCategory = category === "all" || product.category === category;
        const matchesSubcategory = subcategory === "all" || product.subcategory === subcategory;

        return matchesSearch && matchesCategory && matchesSubcategory;
      });

      filtered = kitProducts.concat(filtered);
    }

    if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);
    if (sort === "name-asc") filtered.sort((a, b) => a.name.localeCompare(b.name));

    const vehicleSearchActive = Boolean(vehicleQuery || selectedYear || selectedMake || selectedModel || selectedTrim);
    const hierarchyActive = Boolean(category !== "all" || subcategory !== "all" || detail !== "all");

    const vehicleMeta = vehicleSearchActive
      ? ` • ${matchedVehicles.length} vehicle match${matchedVehicles.length !== 1 ? "es" : ""}`
      : "";

    const hierarchyMeta = hierarchyActive ? " • filters active" : "";

    if (resultsMeta) {
      resultsMeta.textContent = `${filtered.length} product${filtered.length !== 1 ? "s" : ""} found${vehicleMeta}${hierarchyMeta}`;
    }

    productsEl.innerHTML = filtered.length
      ? filtered.map(renderProductCard).join("")
      : '<div class="card empty-state">No matching products found.</div>';
  }

  [searchInput, categoryFilter, subcategoryFilter, subcategoryDetailFilter, sortFilter]
    .filter(Boolean)
    .forEach((element) => {
      element.addEventListener("input", () => {
        if (element === categoryFilter) {
          syncAllHierarchyUI();
        }

        if (element === subcategoryFilter) {
          syncDetailSelect();
          syncHierarchyVisibility();
          renderSubcategoryPicks();
          renderDetailPicks();
        }

        render();
      });

      element.addEventListener("change", () => {
        if (element === categoryFilter) {
          syncAllHierarchyUI();
        }

        if (element === subcategoryFilter) {
          syncDetailSelect();
          syncHierarchyVisibility();
          renderSubcategoryPicks();
          renderDetailPicks();
        }

        render();
      });
    });

  if (categoryPicks) {
    categoryPicks.addEventListener("click", (event) => {
      const chip = event.target.closest(".decal-chip");
      if (!chip || !categoryFilter) return;

      categoryFilter.value = chip.dataset.category || "all";
      syncAllHierarchyUI();
      render();
    });
  }

  if (subcategoryPicks) {
    subcategoryPicks.addEventListener("click", (event) => {
      const chip = event.target.closest(".decal-chip");
      if (!chip || !subcategoryFilter) return;

      subcategoryFilter.value = chip.dataset.subcategory || "all";
      syncDetailSelect();
      syncHierarchyVisibility();
      renderSubcategoryPicks();
      renderDetailPicks();
      render();
    });
  }

  if (subcategoryDetailPicks) {
    subcategoryDetailPicks.addEventListener("click", (event) => {
      const chip = event.target.closest(".decal-chip");
      if (!chip || !subcategoryDetailFilter) return;

      subcategoryDetailFilter.value = chip.dataset.subsubcategory || "all";
      renderDetailPicks();
      render();
    });
  }

  if (clearFilters) {
    clearFilters.addEventListener("click", () => {
      if (vehicleSearchInput) vehicleSearchInput.value = "";
      if (searchInput) searchInput.value = "";
      if (categoryFilter) categoryFilter.value = "all";
      if (subcategoryFilter) subcategoryFilter.value = "all";
      if (subcategoryDetailFilter) subcategoryDetailFilter.value = "all";
      if (sortFilter) sortFilter.value = "default";

      if (yearFilter && makeFilter && modelFilter && trimFilter) {
        yearFilter.value = "";

        setVehicleSelectOptions(makeFilter, [], "Select Make");
        setVehicleSelectOptions(modelFilter, [], "Select Model");
        setVehicleSelectOptions(trimFilter, [], "Select Trim");

        makeFilter.disabled = true;
        modelFilter.disabled = true;
        trimFilter.disabled = true;
      }

      if (typeof window.setSelectedVehicle === "function") {
        window.setSelectedVehicle(null);
      }

      syncAllHierarchyUI();
      updateVehicleSearchSuggestions();
      render();
    });
  }

  syncAllHierarchyUI();
  render();
}

document.addEventListener("DOMContentLoaded", initShop);