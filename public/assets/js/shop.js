const DECAL_IMAGE_BASE = "/assets/imgs/decals";
const FALLBACK_IMAGE = "/assets/imgs/main.PNG";
const SHOP_CATEGORIES = ["Decals", "Lettering", "Wraps"];

const DECAL_GROUPS = ["By Placement", "By Type", "Custom"];

const DECAL_FILTERS = {
  "By Placement": [
    "Fender",
    "Full Body/Half Body",
    "Hood",
    "Rear Quarter Panel",
    "Rocker Panel/Side",
    "Windshield/Rear Window"
  ],
  "By Type": [
    "Brands",
    "Geometrical Patterns",
    "Graphics",
    "Platform Specific",
    "Racing Stripes",
    "Rips/Scratches/Tears",
    "Sponsor Stacks/Rows"
  ],
  "Custom": []
};

const PLACEMENT_IMAGES = {
  "Fender": `${DECAL_IMAGE_BASE}/placements/fender.png`,
  "Full Body/Half Body": `${DECAL_IMAGE_BASE}/placements/full-body-half-body.png`,
  "Hood": `${DECAL_IMAGE_BASE}/placements/hood.png`,
  "Rear Quarter Panel": `${DECAL_IMAGE_BASE}/placements/rear-quarter-panel.png`,
  "Rocker Panel/Side": `${DECAL_IMAGE_BASE}/placements/rocker-panel-side.png`,
  "Windshield/Rear Window": `${DECAL_IMAGE_BASE}/placements/windhsield-rear-window.png`
};

const TYPE_IMAGES = {
  "Brands": `${DECAL_IMAGE_BASE}/types/brands.png`,
  "Geometrical Patterns": `${DECAL_IMAGE_BASE}/types/geometrical-patterns.png`,
  "Graphics": `${DECAL_IMAGE_BASE}/types/graphics.png`,
  "Platform Specific": `${DECAL_IMAGE_BASE}/types/platform-specific.png`,
  "Racing Stripes": `${DECAL_IMAGE_BASE}/types/racing-stripes.png`,
  "Rips/Scratches/Tears": `${DECAL_IMAGE_BASE}/types/rips-scratches-tears.png`,
  "Sponsor Stacks/Rows": `${DECAL_IMAGE_BASE}/types/sponsor-stacks-rows.png`
};

const CATEGORY_IMAGES = {
  "Decals": `${DECAL_IMAGE_BASE}/decals.png`,
  "Lettering": "/assets/imgs/lettering/lettering.png",
  "Wraps": "/assets/imgs/wraps/wraps.png"
};

const NON_DECAL_SUBCATEGORY_IMAGES = {
  "Precut Kits": FALLBACK_IMAGE,
  "Full Rolls": FALLBACK_IMAGE,
  "By The Foot": FALLBACK_IMAGE,
  "Business Name": CATEGORY_IMAGES.Lettering,
  "Business Info": CATEGORY_IMAGES.Lettering
};

function slugify(input) {
  return String(input || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\//g, "-")
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
  if (normalized === "lettering") return "Lettering";
  if (normalized === "business lettering") return "Lettering";
  if (normalized === "wraps") return "Wraps";
  if (normalized === "wrap graphics") return "Wraps";
  if (normalized === "custom orders") return "Decals";

  return String(value || "").trim();
}

function normalizePlacement(value) {
  const text = normalizeText(value);

  if (!text) return "";

  if (text.includes("fender")) return "Fender";
  if (text.includes("full body") || text.includes("half body")) return "Full Body/Half Body";
  if (text.includes("hood")) return "Hood";
  if (text.includes("quarter")) return "Rear Quarter Panel";
  if (text.includes("rocker") || text.includes("side skirt") || text.includes("side")) return "Rocker Panel/Side";
  if (text.includes("windshield") || text.includes("rear window") || text.includes("banner")) return "Windshield/Rear Window";

  return "";
}

function normalizeType(value) {
  const text = normalizeText(value);

  if (!text) return "";

  if (text.includes("racing stripe") || text.includes("stripe")) return "Racing Stripes";
  if (text.includes("sponsor stack") || text.includes("sponsor row")) return "Sponsor Stacks/Rows";
  if (text.includes("geometrical") || text.includes("geometric") || text.includes("pattern")) return "Geometrical Patterns";
  if (text.includes("platform")) return "Platform Specific";
  if (text.includes("brand") || text.includes("trd") || text.includes("mopar") || text.includes("coyote") || text.includes("nismo")) return "Brands";
  if (text.includes("rip") || text.includes("scratch") || text.includes("tear")) return "Rips/Scratches/Tears";
  if (text.includes("graphic") || text.includes("banner") || text.includes("letter")) return "Graphics";

  return "";
}

function getProductPlacement(product) {
  return (
    product.placement ||
    normalizePlacement(product.subcategory) ||
    normalizePlacement(product.subSubcategory) ||
    normalizePlacement(product.name) ||
    normalizePlacement(product.description) ||
    ""
  );
}

function getProductType(product) {
  return (
    product.type ||
    product.style ||
    product.decalType ||
    normalizeType(product.subSubcategory) ||
    normalizeType(product.subcategory) ||
    normalizeType(product.name) ||
    normalizeType(product.description) ||
    ""
  );
}

function isGenericImage(path) {
  return (
    !path ||
    path.includes("main.PNG") ||
    path.includes("main.png") ||
    path.includes("placeholder")
  );
}

function buildDecalProductImagePath(product) {
  const placement = getProductFolderSlug(product.placement || "custom", "placement");
  const type = getProductFolderSlug(product.decalType || product.type || product.style || "graphics", "type");
  const productSlug = product.slug || slugify(product.name || "product");

  return `${DECAL_IMAGE_BASE}/products/${placement}__${type}/${productSlug}.png`;
}

function getProductFolderSlug(value, group) {
  const label = String(value || "").trim();

  if (group === "type" && label === "Racing Stripes") return "stripes";
  if (group === "type" && label === "Sponsor Stacks/Rows") return "sponsor-stacks-rows";

  return slugify(label);
}

function getLegacyDecalImagePath(product) {
  const path = String(product.imagePath || "");
  if (!path.includes("/rocker_panel_side_stripes/")) return "";

  const fileName = path.split("/").pop();
  return `${DECAL_IMAGE_BASE}/products/rocker-panel-side__stripes/${fileName}`;
}

function getProductImage(product) {
  const legacyPath = getLegacyDecalImagePath(product);
  if (legacyPath) return legacyPath;

  if (!isGenericImage(product.imagePath)) {
    return product.imagePath;
  }

  if (product.category === "Decals") {
    return buildDecalProductImagePath(product);
  }

  return (
    NON_DECAL_SUBCATEGORY_IMAGES[product.subcategory] ||
    CATEGORY_IMAGES[product.category] ||
    FALLBACK_IMAGE
  );
}

function toDisplayProduct(product) {
  const category = normalizeCategory(product.category);
  const placement = getProductPlacement(product);
  const decalType = getProductType(product);

  let subcategory = product.subcategory || "";
  let subSubcategory = product.subSubcategory || "";

  if (category === "Decals") {
    if (!subcategory && placement) subcategory = placement;
    if (!subSubcategory && decalType) subSubcategory = decalType;
  }

  const displayProduct = {
    ...product,
    category,
    placement,
    decalType,
    type: decalType,
    style: decalType,
    subcategory,
    subSubcategory
  };

  return {
    ...displayProduct,
    imagePath: getProductImage(displayProduct),
    imageLabel:
      product.imageLabel ||
      decalType ||
      placement ||
      subcategory ||
      category ||
      product.name
  };
}

function imageWithFallback(src, alt) {
  return `<img src="${src || FALLBACK_IMAGE}" alt="${alt || ""}" loading="lazy" onerror="this.onerror=null;this.src='${FALLBACK_IMAGE}'">`;
}

function createTaxonomyButton({ label, image, datasetName, datasetValue, active = false }) {
  return `
    <button type="button" class="decal-chip taxonomy-card${active ? " active" : ""}" data-${datasetName}="${datasetValue}">
      ${imageWithFallback(image, label)}
      <span>${label}</span>
    </button>
  `;
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

  let activeDecalTab = "By Placement";
  let activeDecalFilter = "all";

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

  function getCategories() {
    const categories = [...new Set((window.PRODUCTS || PRODUCTS || [])
      .map((product) => normalizeCategory(product.category))
      .filter((category) => SHOP_CATEGORIES.includes(category)))];

    SHOP_CATEGORIES.forEach((category) => {
      if (!categories.includes(category)) categories.push(category);
    });

    return categories;
  }

  function syncCategorySelect() {
    if (!categoryFilter) return;
    setSelectOptions(categoryFilter, getCategories(), "All Categories");
  }

  function syncLegacySelects() {
    if (!categoryFilter || !subcategoryFilter || !subcategoryDetailFilter) return;

    const category = categoryFilter.value;

    if (category === "Decals") {
      setSelectOptions(subcategoryFilter, DECAL_GROUPS, "All Decal Groups");
      subcategoryFilter.value = activeDecalTab;

      setSelectOptions(subcategoryDetailFilter, DECAL_FILTERS[activeDecalTab], "All");
      subcategoryDetailFilter.value = activeDecalFilter;
      return;
    }

    if (category === "Lettering") {
      setSelectOptions(subcategoryFilter, ["Business Name", "Business Info"], "All Subcategories");
      setSelectOptions(subcategoryDetailFilter, [], "All Details");
      return;
    }

    if (category === "Wraps") {
      setSelectOptions(subcategoryFilter, ["Full Rolls", "By The Foot"], "All Subcategories");
      setSelectOptions(subcategoryDetailFilter, [], "All Details");
      return;
    }

    setSelectOptions(subcategoryFilter, [], "All Subcategories");
    setSelectOptions(subcategoryDetailFilter, [], "All Details");
  }

  function syncHierarchyVisibility() {
    const category = categoryFilter?.value || "all";
    const hasDecalDetails = category === "Decals" && (DECAL_FILTERS[activeDecalTab] || []).length > 0;

    if (subcategoryWrap) {
      subcategoryWrap.hidden = category === "all";
    }

    if (subcategoryDetailWrap) {
      subcategoryDetailWrap.hidden = !hasDecalDetails;
    }
  }

  function renderCategoryPicks() {
    if (!categoryPicks) return;

    const selectedCategory = categoryFilter?.value || "all";

    categoryPicks.innerHTML = ["all", ...getCategories()].map((category) => {
      const label = category === "all" ? "All Products" : category;
      const image = category === "all" ? FALLBACK_IMAGE : CATEGORY_IMAGES[category] || FALLBACK_IMAGE;

      return createTaxonomyButton({
        label,
        image,
        datasetName: "category",
        datasetValue: category,
        active: category === selectedCategory
      });
    }).join("");
  }

  function getDecalGroupImage(group) {
    if (group === "By Placement") return PLACEMENT_IMAGES["Fender"] || CATEGORY_IMAGES.Decals;
    if (group === "By Type") return TYPE_IMAGES["Graphics"] || CATEGORY_IMAGES.Decals;
    return CATEGORY_IMAGES.Decals;
  }

  function renderDecalTabs() {
    if (!subcategoryPicks || !categoryFilter) return;

    const category = categoryFilter.value;

    if (category !== "Decals") {
      renderNonDecalSubcategoryPicks();
      return;
    }

    subcategoryPicks.innerHTML = `
      <div class="decal-filter-card-grid">
        ${DECAL_GROUPS.map((value) => {
          return createTaxonomyButton({
            label: value,
            image: getDecalGroupImage(value),
            datasetName: "decalGroup",
            datasetValue: value,
            active: activeDecalTab === value
          });
        }).join("")}
      </div>
    `;
  }

  function renderNonDecalSubcategoryPicks() {
    if (!subcategoryPicks || !categoryFilter || !subcategoryFilter) return;

    const category = categoryFilter.value;

    if (category === "all" || category === "Decals") {
      subcategoryPicks.innerHTML = "";
      return;
    }

    let values = [];

    if (category === "Lettering") values = ["Business Name", "Business Info"];
    if (category === "Wraps") values = ["Full Rolls", "By The Foot"];

    const selected = subcategoryFilter.value || "all";

    subcategoryPicks.innerHTML = `
      <div class="decal-filter-card-grid">
        ${["all", ...values].map((value) => {
          const label = value === "all" ? "All" : value;
          const image = value === "all"
            ? CATEGORY_IMAGES[category] || FALLBACK_IMAGE
            : NON_DECAL_SUBCATEGORY_IMAGES[value] || FALLBACK_IMAGE;

          return createTaxonomyButton({
            label,
            image,
            datasetName: "subcategory",
            datasetValue: value,
            active: selected === value
          });
        }).join("")}
      </div>
    `;
  }

  function renderSubcategoryDetailPicks() {
    if (!subcategoryDetailPicks || !categoryFilter) return;

    const category = categoryFilter.value;
    const filters = DECAL_FILTERS[activeDecalTab] || [];

    if (category !== "Decals" || !filters.length) {
      subcategoryDetailPicks.innerHTML = "";
      return;
    }

    subcategoryDetailPicks.innerHTML = `
      <div class="decal-filter-card-grid">
        ${["all", ...filters].map((value) => {
          const label = value === "all" ? `All ${activeDecalTab.replace("By ", "")}` : value;
          const image = value === "all"
            ? getDecalGroupImage(activeDecalTab)
            : activeDecalTab === "By Placement"
              ? PLACEMENT_IMAGES[value]
              : TYPE_IMAGES[value];

          return createTaxonomyButton({
            label,
            image,
            datasetName: "decalFilter",
            datasetValue: value,
            active: activeDecalFilter === value
          });
        }).join("")}
      </div>
    `;
  }

  function syncAllHierarchyUI() {
    syncLegacySelects();
    syncHierarchyVisibility();
    renderCategoryPicks();
    renderDecalTabs();
    renderSubcategoryDetailPicks();
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
    return [];
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

  syncCategorySelect();
  syncAllHierarchyUI();

  function productMatchesSearch(product, search) {
    if (!search) return true;

    const searchableText = [
      product.name,
      product.category,
      product.subcategory,
      product.subSubcategory,
      product.placement,
      product.type,
      product.style,
      product.decalType,
      product.description,
      ...(Array.isArray(product.tags) ? product.tags : [])
    ].join(" ").toLowerCase();

    return searchableText.includes(search);
  }

  function matchesDecalFilter(product) {
    if (activeDecalTab === "Custom") {
      return Boolean(product.custom) ||
        normalizeText(product.subcategory) === "custom" ||
        normalizeText(product.subSubcategory) === "custom";
    }

    if (activeDecalFilter === "all") return true;

    if (activeDecalTab === "By Placement") {
      return product.placement === activeDecalFilter;
    }

    if (activeDecalTab === "By Type") {
      return product.decalType === activeDecalFilter ||
        product.type === activeDecalFilter ||
        product.style === activeDecalFilter;
    }

    return true;
  }

  function render() {
    const productsSource = window.PRODUCTS || PRODUCTS || [];
    const search = searchInput?.value.trim().toLowerCase() || "";
    const category = categoryFilter?.value || "all";
    const subcategory = subcategoryFilter?.value || "all";
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

    const vehicleKits = [];

    let filtered = productsSource.map(toDisplayProduct).filter((product) => {
      const matchesSearch = productMatchesSearch(product, search);
      const matchesCategory = category === "all" || product.category === category;
      const matchesStoreCategory = SHOP_CATEGORIES.includes(product.category);

      if (!matchesStoreCategory || !matchesSearch || !matchesCategory) return false;

      if (category === "Decals") {
        return matchesDecalFilter(product);
      }

      if (category !== "all" && subcategory !== "all") {
        return product.subcategory === subcategory;
      }

      return true;
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
    const hierarchyActive = Boolean(category !== "all" || subcategory !== "all" || activeDecalFilter !== "all");

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

  if (categoryFilter) {
    categoryFilter.addEventListener("change", () => {
      if (categoryFilter.value === "Decals") {
        activeDecalTab = "By Placement";
        activeDecalFilter = "all";
      }

      syncAllHierarchyUI();
      render();
    });
  }

  if (subcategoryFilter) {
    subcategoryFilter.addEventListener("change", () => {
      if (categoryFilter?.value === "Decals") {
        activeDecalTab = DECAL_GROUPS.includes(subcategoryFilter.value) ? subcategoryFilter.value : "By Placement";
        activeDecalFilter = "all";
      }

      syncAllHierarchyUI();
      render();
    });
  }

  if (subcategoryDetailFilter) {
    subcategoryDetailFilter.addEventListener("change", () => {
      if (categoryFilter?.value === "Decals") {
        activeDecalFilter = subcategoryDetailFilter.value || "all";
      }

      renderSubcategoryDetailPicks();
      render();
    });
  }

  [searchInput, sortFilter]
    .filter(Boolean)
    .forEach((element) => element.addEventListener("input", render));

  if (categoryPicks) {
    categoryPicks.addEventListener("click", (event) => {
      const chip = event.target.closest("[data-category]");
      if (!chip || !categoryFilter) return;

      categoryFilter.value = chip.dataset.category || "all";

      if (categoryFilter.value === "Decals") {
        activeDecalTab = "By Placement";
        activeDecalFilter = "all";
      }

      syncAllHierarchyUI();
      render();
    });
  }

  if (subcategoryPicks) {
    subcategoryPicks.addEventListener("click", (event) => {
      const group = event.target.closest("[data-decal-group]");
      if (group) {
        activeDecalTab = group.dataset.decalGroup;
        activeDecalFilter = "all";

        if (subcategoryFilter) subcategoryFilter.value = activeDecalTab;
        if (subcategoryDetailFilter) subcategoryDetailFilter.value = "all";

        syncAllHierarchyUI();
        render();
        return;
      }

      const decalFilter = event.target.closest("[data-decal-filter]");
      if (decalFilter) {
        activeDecalFilter = decalFilter.dataset.decalFilter || "all";

        if (subcategoryDetailFilter) {
          subcategoryDetailFilter.value = activeDecalFilter;
        }

        renderSubcategoryDetailPicks();
        render();
        return;
      }

      const subcategoryChip = event.target.closest("[data-subcategory]");
      if (subcategoryChip && subcategoryFilter) {
        subcategoryFilter.value = subcategoryChip.dataset.subcategory || "all";
        renderNonDecalSubcategoryPicks();
        render();
      }
    });
  }

  if (subcategoryDetailPicks) {
    subcategoryDetailPicks.addEventListener("click", (event) => {
      const decalFilter = event.target.closest("[data-decal-filter]");
      if (!decalFilter) return;

      activeDecalFilter = decalFilter.dataset.decalFilter || "all";

      if (subcategoryDetailFilter) {
        subcategoryDetailFilter.value = activeDecalFilter;
      }

      renderSubcategoryDetailPicks();
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

      activeDecalTab = "By Placement";
      activeDecalFilter = "all";

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

  render();
}

document.addEventListener("DOMContentLoaded", initShop);
