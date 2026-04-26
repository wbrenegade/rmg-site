const CATEGORY_HIERARCHY = {
  Decals: {
    Custom: [],
    Fender: ['Sponsor Stacks'],
    'Full Body/Half Body': ['Racing Stripes'],
    'Platform Specific': ['Graphics', 'Racing Stripes'],
    'Rear Quarter Panel': ['Geometrical Patterns', 'Graphics', 'Racing Stripes', 'Rips/Scratches/Tears'],
    'Rocker Panel/Side': ['Brands', 'Racing Stripes', 'Sponsor Rows'],
    'Windshield/Rear Window Banners': []
  },
  'Window Tint': {
    'Full Rolls': [],
    'Precut Kits': []
  },
  Lettering: {
    'Business Info': [],
    'Business Name': []
  },
  Wraps: {
    'Full Rolls': [],
    'By The Foot': []
  }
};

const CATEGORY_IMAGES = {
  Decals: "/assets/imgs/decal-cats/graphics.png",
  "Window Tint": "/assets/imgs/main.PNG",
  Lettering: "/assets/imgs/decal-cats/brands.png",
  Wraps: "/assets/imgs/main.PNG"
};

const SUBCATEGORY_IMAGES = {
  Custom: "/assets/imgs/decal-cats/custom.png",
  Fender: "/assets/imgs/decal-cats/fender.png",
  "Full Body/Half Body": "/assets/imgs/decal-cats/full_body_half_body.png",
  "Platform Specific": "/assets/imgs/decal-cats/platform_specific.png",
  "Rear Quarter Panel": "/assets/imgs/decal-cats/rear_window_banners.png",
  "Rocker Panel/Side": "/assets/imgs/decal-cats/rocker_panel_side.png",
  "Windshield/Rear Window Banners": "/assets/imgs/decal-cats/windshield.png",
  "Full Rolls": "/assets/imgs/main.PNG",
  "Precut Kits": "/assets/imgs/main.PNG",
  "Business Info": "/assets/imgs/decal-cats/brands.png",
  "Business Name": "/assets/imgs/decal-cats/brands.png",
  "By The Foot": "/assets/imgs/main.PNG"
};

const DETAIL_IMAGES = {
  "Sponsor Stacks": "/assets/imgs/decal-cats/sponsor_stacks.png",
  "Racing Stripes": "/assets/imgs/decal-sub-cats/racing_Stripes.png",
  Graphics: "/assets/imgs/decal-cats/graphics.png",
  "Geometrical Patterns": "/assets/imgs/product-cards/quarter_panel_kit.png",
  "Rips/Scratches/Tears": "/assets/imgs/product-cards/quarter_panel_kit.png",
  Brands: "/assets/imgs/decal-cats/brands.png",
  "Sponsor Rows": "/assets/imgs/decal-cats/sponsor_stacks.png"
};

const FALLBACK_IMAGE = "/assets/imgs/main.PNG";

function getTaxonomyImage(category, subcategory, subSubcategory) {
  return (
    DETAIL_IMAGES[subSubcategory] ||
    SUBCATEGORY_IMAGES[subcategory] ||
    CATEGORY_IMAGES[category] ||
    FALLBACK_IMAGE
  );
}

async function initShop() {
  const productsEl = document.getElementById('shopProducts');
  const resultsMeta = document.getElementById('resultsMeta');
  const categoryPicks = document.getElementById('categoryPicks');
  const subcategoryWrap = document.getElementById('subcategoryWrap');
  const subcategoryPicks = document.getElementById('subcategoryPicks');
  const subcategoryDetailWrap = document.getElementById('subcategoryDetailWrap');
  const subcategoryDetailPicks = document.getElementById('subcategoryDetailPicks');
  const toggleAdvancedFilters = document.getElementById('toggleAdvancedFilters');
  const advancedFilters = document.getElementById('advancedFilters');
  const vehicleSearchInput = document.getElementById('vehicleSearchInput');
  const vehicleSearchOptions = document.getElementById('vehicleSearchOptions');
  const yearFilter = document.getElementById('yearFilter');
  const makeFilter = document.getElementById('makeFilter');
  const modelFilter = document.getElementById('modelFilter');
  const trimFilter = document.getElementById('trimFilter');
  const searchInput = document.getElementById('searchInput');
  const categoryFilter = document.getElementById('categoryFilter');
  const subcategoryFilter = document.getElementById('subcategoryFilter');
  const subcategoryDetailFilter = document.getElementById('subcategoryDetailFilter');
  const sortFilter = document.getElementById('sortFilter');
  const clearFilters = document.getElementById('clearFilters');

  if (!productsEl) return;

  if (typeof window.ensureProductsLoaded === 'function') {
    await window.ensureProductsLoaded();
  }

  function setAdvancedFiltersVisibility(expanded) {
    if (!toggleAdvancedFilters || !advancedFilters) return;
    advancedFilters.hidden = !expanded;
    toggleAdvancedFilters.setAttribute('aria-expanded', String(expanded));
    toggleAdvancedFilters.textContent = expanded ? 'Hide Advanced Filters' : 'Show Advanced Filters';
  }

  function syncAdvancedFiltersLayout() {
    if (!toggleAdvancedFilters || !advancedFilters || typeof window.matchMedia !== 'function') return;
    const isCompact = window.matchMedia('(max-width: 980px)').matches;
    toggleAdvancedFilters.hidden = !isCompact;
    setAdvancedFiltersVisibility(!isCompact);
  }

  if (toggleAdvancedFilters && advancedFilters) {
    toggleAdvancedFilters.addEventListener('click', () => {
      const isExpanded = toggleAdvancedFilters.getAttribute('aria-expanded') === 'true';
      setAdvancedFiltersVisibility(!isExpanded);
    });
    window.addEventListener('resize', syncAdvancedFiltersLayout);
    syncAdvancedFiltersLayout();
  }

  function setSelectOptions(select, values, allLabel) {
    if (!select) return;
    const options = [`<option value="all">${allLabel}</option>`]
      .concat(values.map((value) => `<option value="${value}">${value}</option>`));
    select.innerHTML = options.join('');
  }

  function setVehicleSelectOptions(select, values, placeholder) {
    if (!select) return;
    const options = [`<option value="">${placeholder}</option>`]
      .concat(values.map((value) => `<option value="${value}">${value}</option>`));
    select.innerHTML = options.join('');
  }

  function setDatalistOptions(list, values) {
    if (!list) return;
    list.innerHTML = values.map((value) => `<option value="${value}"></option>`).join('');
  }

  function slugify(input) {
    return String(input || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function normalizeText(value) {
    return String(value || '').trim().toLowerCase();
  }

  function normalizeCategory(value) {
    const normalized = normalizeText(value);
    if (!normalized) return '';
    if (normalized === 'decals') return 'Decals';
    if (normalized.startsWith('vehicle decals')) return 'Decals';
    if (normalized === 'stickers') return 'Decals';
    if (normalized === 'window tint') return 'Window Tint';
    if (normalized === 'tint kits') return 'Window Tint';
    if (normalized === 'lettering') return 'Lettering';
    if (normalized === 'business lettering') return 'Lettering';
    if (normalized === 'wraps') return 'Wraps';
    if (normalized === 'wrap graphics') return 'Wraps';
    if (normalized === 'custom orders') return 'Wraps';
    return String(value || '').trim();
  }

  function getValidSubcategories(category) {
    return Object.keys(CATEGORY_HIERARCHY[category] || {});
  }

  function getValidSubcategoryDetails(category, subcategory) {
    const categoryMap = CATEGORY_HIERARCHY[category] || {};
    return categoryMap[subcategory] || [];
  }

  function normalizeProductTaxonomy(product) {
    const category = normalizeCategory(product?.category);

    let subcategory = String(product?.subcategory || '').trim();
    let subSubcategory = String(product?.subSubcategory || '').trim();

    if (!subcategory && category === 'Window Tint') {
      subcategory = 'Precut Kits';
    }

    const validSubcategories = getValidSubcategories(category);
    if (subcategory && !validSubcategories.includes(subcategory)) {
      subcategory = '';
      subSubcategory = '';
    }

    const validDetails = getValidSubcategoryDetails(category, subcategory);
    if (subSubcategory && !validDetails.includes(subSubcategory)) {
      subSubcategory = '';
    }

    return {
      category,
      subcategory,
      subSubcategory
    };
  }

 function toDisplayProduct(product) {
  const taxonomy = normalizeProductTaxonomy(product);

  const category = taxonomy.category || product.category;
  const subcategory = taxonomy.subcategory;
  const subSubcategory = taxonomy.subSubcategory;

  const currentImage = product.imagePath || "";
  const isGenericImage =
    !currentImage ||
    currentImage.includes("main.PNG") ||
    currentImage.includes("main.png");

  return {
    ...product,
    category,
    subcategory,
    subSubcategory,
    imagePath: isGenericImage
      ? getTaxonomyImage(category, subcategory, subSubcategory)
      : currentImage,
    imageLabel:
      product.imageLabel ||
      subSubcategory ||
      subcategory ||
      category ||
      product.name
  };
}

  function syncHierarchyPickState() {
    const selectedCategory = categoryFilter?.value || 'all';
    const selectedSubcategory = subcategoryFilter?.value || 'all';
    const selectedDetail = subcategoryDetailFilter?.value || 'all';

    if (subcategoryWrap) {
      subcategoryWrap.hidden = selectedCategory === 'all';
    }

    if (subcategoryDetailWrap) {
      const hasDetails = selectedCategory !== 'all'
        && selectedSubcategory !== 'all'
        && getValidSubcategoryDetails(selectedCategory, selectedSubcategory).length > 0;
      subcategoryDetailWrap.hidden = !hasDetails;
    }

    if (categoryPicks) {
      [...categoryPicks.querySelectorAll('.decal-chip')].forEach((button) => {
        const isActive = (button.dataset.category || 'all') === selectedCategory;
        button.classList.toggle('active', isActive);
      });
    }

    if (subcategoryPicks) {
      [...subcategoryPicks.querySelectorAll('.decal-chip')].forEach((button) => {
        const isActive = (button.dataset.subcategory || 'all') === selectedSubcategory;
        button.classList.toggle('active', isActive);
      });
    }

    if (subcategoryDetailPicks) {
      [...subcategoryDetailPicks.querySelectorAll('.decal-chip')].forEach((button) => {
        const isActive = (button.dataset.subsubcategory || 'all') === selectedDetail;
        button.classList.toggle('active', isActive);
      });
    }
  }

  function renderSubcategoryPicks() {
  if (!subcategoryPicks || !categoryFilter) return;

  const selectedCategory = categoryFilter.value;

  if (selectedCategory === "all") {
    subcategoryPicks.innerHTML = "";
    return;
  }

  const subcategories = getValidSubcategories(selectedCategory);
  const selectedSubcategory = subcategoryFilter?.value || "all";

  subcategoryPicks.innerHTML = ["all", ...subcategories].map((value) => {
    const label = value === "all" ? "All Subcategories" : value;
    const activeClass = value === selectedSubcategory ? " active" : "";
    const img =
      value === "all"
        ? CATEGORY_IMAGES[selectedCategory] || FALLBACK_IMAGE
        : SUBCATEGORY_IMAGES[value] || CATEGORY_IMAGES[selectedCategory] || FALLBACK_IMAGE;

    return `
      <button type="button" class="decal-chip taxonomy-card${activeClass}" data-subcategory="${value}">
        <img src="${img}" alt="${label}" onerror="this.src='${FALLBACK_IMAGE}'">
        <span>${label}</span>
      </button>
    `;
  }).join("");
}

  function renderSubcategoryDetailPicks() {
  if (!subcategoryDetailPicks || !categoryFilter || !subcategoryFilter) return;

  const selectedCategory = categoryFilter.value;
  const selectedSubcategory = subcategoryFilter.value;

  if (selectedCategory === "all" || selectedSubcategory === "all") {
    subcategoryDetailPicks.innerHTML = "";
    return;
  }

  const details = getValidSubcategoryDetails(selectedCategory, selectedSubcategory);
  const selectedDetail = subcategoryDetailFilter?.value || "all";

  subcategoryDetailPicks.innerHTML = ["all", ...details].map((value) => {
    const label = value === "all" ? "All Details" : value;
    const activeClass = value === selectedDetail ? " active" : "";
    const img =
      value === "all"
        ? SUBCATEGORY_IMAGES[selectedSubcategory] || CATEGORY_IMAGES[selectedCategory] || FALLBACK_IMAGE
        : DETAIL_IMAGES[value] || SUBCATEGORY_IMAGES[selectedSubcategory] || FALLBACK_IMAGE;

    return `
      <button type="button" class="decal-chip taxonomy-card${activeClass}" data-subsubcategory="${value}">
        <img src="${img}" alt="${label}" onerror="this.src='${FALLBACK_IMAGE}'">
        <span>${label}</span>
      </button>
    `;
  }).join("");
}

  function syncHierarchyFiltersFromCategory() {
    if (!categoryFilter || !subcategoryFilter || !subcategoryDetailFilter) return;

    const selectedCategory = categoryFilter.value;
    if (selectedCategory === 'all') {
      setSelectOptions(subcategoryFilter, [], 'All Subcategories');
      setSelectOptions(subcategoryDetailFilter, [], 'All Details');
      subcategoryFilter.value = 'all';
      subcategoryDetailFilter.value = 'all';
      renderSubcategoryPicks();
      renderSubcategoryDetailPicks();
      syncHierarchyPickState();
      return;
    }

    const subcategories = getValidSubcategories(selectedCategory);
    let currentSubcategory = subcategories.includes(subcategoryFilter.value) ? subcategoryFilter.value : 'all';
    if (selectedCategory === 'Decals' && currentSubcategory === 'all' && subcategories.length) {
      currentSubcategory = subcategories[0];
    }
    setSelectOptions(subcategoryFilter, subcategories, 'All Subcategories');
    subcategoryFilter.value = currentSubcategory;
    syncHierarchyFiltersFromSubcategory();
  }

  function syncHierarchyFiltersFromSubcategory() {
    if (!categoryFilter || !subcategoryFilter || !subcategoryDetailFilter) return;

    const selectedCategory = categoryFilter.value;
    const selectedSubcategory = subcategoryFilter.value;

    if (selectedCategory === 'all' || selectedSubcategory === 'all') {
      setSelectOptions(subcategoryDetailFilter, [], 'All Details');
      subcategoryDetailFilter.value = 'all';
      renderSubcategoryPicks();
      renderSubcategoryDetailPicks();
      syncHierarchyPickState();
      return;
    }

    const details = getValidSubcategoryDetails(selectedCategory, selectedSubcategory);
    const currentDetail = details.includes(subcategoryDetailFilter.value) ? subcategoryDetailFilter.value : 'all';
    setSelectOptions(subcategoryDetailFilter, details, 'All Details');
    subcategoryDetailFilter.value = currentDetail;

    renderSubcategoryPicks();
    renderSubcategoryDetailPicks();
    syncHierarchyPickState();
  }

  function buildVehicleLabel(vehicle) {
    return [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(' ');
  }

  function getVehicleSearchLabel(vehicle) {
    return [buildVehicleLabel(vehicle), vehicle.bodyStyle].filter(Boolean).join(' ');
  }

  function buildVehicleCustomizeUrl(vehicle) {
    const params = new URLSearchParams();
    params.set('type', 'vehicle-tint-kit');
    params.set('year', vehicle.year);
    params.set('make', vehicle.make);
    params.set('model', vehicle.model);
    if (vehicle.trim) params.set('trim', vehicle.trim);
    if (vehicle.kitSku) params.set('sku', vehicle.kitSku);
    return `mustang-customizer.html?${params.toString()}`;
  }

  function buildVehicleProductUrl(vehicle) {
    const params = new URLSearchParams();
    params.set('type', 'vehicle-tint-kit');
    params.set('year', vehicle.year);
    params.set('make', vehicle.make);
    params.set('model', vehicle.model);
    if (vehicle.trim) params.set('trim', vehicle.trim);
    if (vehicle.kitSku) params.set('sku', vehicle.kitSku);
    return `product.html?${params.toString()}`;
  }

  function createVehicleKitProducts(vehicles) {
    return vehicles.map((vehicle) => {
      const vehicleLabel = buildVehicleLabel(vehicle);
      const fitmentLabel = [vehicleLabel, vehicle.bodyStyle].filter(Boolean).join(' ');

      return {
        id: `vehicle-tint-kit-${slugify(vehicle.kitSku || vehicle.id)}`,
        name: `${vehicleLabel} Tint Kit`,
        slug: slugify(`${vehicleLabel} tint kit`),
        category: 'Window Tint',
        subcategory: 'Precut Kits',
        subSubcategory: null,
        price: 149.99,
        featured: true,
        description: `Pre-cut tint kit matched to ${fitmentLabel}.`,
        tags: ['Window Tint', 'Precut Kits'].concat(vehicle.kitSku ? [vehicle.kitSku] : []),
        imagePath: '/assets/imgs/main.PNG',
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

  let vehicleCatalogIndex = { years: [], makes: {}, models: {}, trims: {}, vehicles: [] };
  try {
    const payload = typeof window.RMGApi?.getVehicleCatalog === 'function'
      ? await window.RMGApi.getVehicleCatalog()
      : await fetch('/api/vehicles/catalog').then((response) => response.ok ? response.json() : null);

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
    vehicleCatalogIndex = { years: [], makes: {}, models: {}, trims: {}, vehicles: [] };
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

    const year = yearFilter?.value || '';
    const make = makeFilter?.value || '';
    const model = modelFilter?.value || '';
    const trim = trimFilter?.value || '';
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
      (vehicle) => normalizeText(getVehicleSearchLabel(vehicle)) === selectedLabel || normalizeText(buildVehicleLabel(vehicle)) === selectedLabel
    );

    if (!matchedVehicle) return;

    yearFilter.value = matchedVehicle.year;
    setVehicleSelectOptions(makeFilter, vehicleCatalogIndex.makes[matchedVehicle.year] || [], 'Select Make');
    makeFilter.disabled = false;
    makeFilter.value = matchedVehicle.make;

    setVehicleSelectOptions(modelFilter, getModelsForSelection(matchedVehicle.year, matchedVehicle.make), 'Select Model');
    modelFilter.disabled = false;
    modelFilter.value = matchedVehicle.model;

    setVehicleSelectOptions(trimFilter, getTrimsForSelection(matchedVehicle.year, matchedVehicle.make, matchedVehicle.model), 'Select Trim');
    trimFilter.disabled = false;
    trimFilter.value = matchedVehicle.trim || '';

    if (typeof window.setSelectedVehicle === 'function') {
      window.setSelectedVehicle(matchedVehicle);
    }
  }

  function persistSelectedVehicleFromFilters(vehicles) {
    if (typeof window.setSelectedVehicle !== 'function') return;

    const selectedYear = yearFilter?.value || '';
    const selectedMake = makeFilter?.value || '';
    const selectedModel = modelFilter?.value || '';
    const selectedTrim = trimFilter?.value || '';

    if (!(selectedYear && selectedMake && selectedModel)) {
      return;
    }

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
    const selectedVehicle = typeof window.getSelectedVehicle === 'function'
      ? window.getSelectedVehicle()
      : null;

    if (!(selectedVehicle && yearFilter && makeFilter && modelFilter && trimFilter)) {
      return;
    }

    if (!vehicleCatalogIndex.years.includes(selectedVehicle.year)) {
      return;
    }

    yearFilter.value = selectedVehicle.year;
    setVehicleSelectOptions(makeFilter, vehicleCatalogIndex.makes[selectedVehicle.year] || [], 'Select Make');
    makeFilter.disabled = false;

    if (selectedVehicle.make) {
      makeFilter.value = selectedVehicle.make;
      setVehicleSelectOptions(modelFilter, getModelsForSelection(selectedVehicle.year, selectedVehicle.make), 'Select Model');
      modelFilter.disabled = false;
    }

    if (selectedVehicle.model) {
      modelFilter.value = selectedVehicle.model;
      setVehicleSelectOptions(trimFilter, getTrimsForSelection(selectedVehicle.year, selectedVehicle.make, selectedVehicle.model), 'Select Trim');
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
    setVehicleSelectOptions(yearFilter, vehicleCatalogIndex.years, 'Select Year');
    updateVehicleSearchSuggestions();

    yearFilter.addEventListener('change', () => {
      const year = yearFilter.value;
      const makes = year ? (vehicleCatalogIndex.makes[year] || []) : [];
      setVehicleSelectOptions(makeFilter, makes, 'Select Make');
      setVehicleSelectOptions(modelFilter, [], 'Select Model');
      setVehicleSelectOptions(trimFilter, [], 'Select Trim');
      makeFilter.disabled = !year;
      modelFilter.disabled = true;
      trimFilter.disabled = true;
      updateVehicleSearchSuggestions();
      render();
    });

    makeFilter.addEventListener('change', () => {
      const year = yearFilter.value;
      const make = makeFilter.value;
      const models = getModelsForSelection(year, make);
      setVehicleSelectOptions(modelFilter, models, 'Select Model');
      setVehicleSelectOptions(trimFilter, [], 'Select Trim');
      modelFilter.disabled = !(year && make);
      trimFilter.disabled = true;
      updateVehicleSearchSuggestions();
      render();
    });

    modelFilter.addEventListener('change', () => {
      const year = yearFilter.value;
      const make = makeFilter.value;
      const model = modelFilter.value;
      const trims = getTrimsForSelection(year, make, model);
      setVehicleSelectOptions(trimFilter, trims, 'Select Trim');
      trimFilter.disabled = !(year && make && model);
      updateVehicleSearchSuggestions();
      render();
    });

    trimFilter.addEventListener('change', () => {
      updateVehicleSearchSuggestions();
      render();
    });
  }

  if (vehicleSearchInput) {
    vehicleSearchInput.addEventListener('input', () => {
      updateVehicleSearchSuggestions();
      render();
    });

    vehicleSearchInput.addEventListener('change', () => {
      syncFiltersFromVehicleSearch();
      updateVehicleSearchSuggestions();
      render();
    });
  }

  applyStoredVehicleSelection();
  updateVehicleSearchSuggestions();

  const categories = [...new Set(PRODUCTS.map((product) => normalizeCategory(product.category)).filter(Boolean))];
  Object.keys(CATEGORY_HIERARCHY).forEach((category) => {
    if (!categories.includes(category)) {
      categories.push(category);
    }
  });

  categories.forEach((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  syncHierarchyFiltersFromCategory();

  function render() {
    const search = searchInput.value.trim().toLowerCase();
    const category = categoryFilter.value;
    const subcategory = subcategoryFilter?.value || 'all';
    const subcategoryDetail = subcategoryDetailFilter?.value || 'all';
    const sort = sortFilter.value;
    const vehicleQuery = normalizeText(vehicleSearchInput?.value || '');
    const selectedYear = yearFilter?.value || '';
    const selectedMake = makeFilter?.value || '';
    const selectedModel = modelFilter?.value || '';
    const selectedTrim = trimFilter?.value || '';

    if (category === 'Decals' && subcategory === 'all') {
      resultsMeta.textContent = 'Select a decals subcategory to continue';
      productsEl.innerHTML = '<div class="card empty-state"><h3>Pick a Decals subcategory</h3><p>Select one of the subcategories above to view decals.</p></div>';
      return;
    }

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
      const searchableText = [
        product.name,
        product.category,
        product.subcategory,
        product.subSubcategory,
        product.description
      ].join(' ').toLowerCase();

      const matchesSearch = !search || searchableText.includes(search);
      const matchesCategory = category === 'all' || product.category === category;
      const matchesSubcategory = subcategory === 'all' || product.subcategory === subcategory;
      const matchesDetail = subcategoryDetail === 'all' || product.subSubcategory === subcategoryDetail;

      return matchesSearch && matchesCategory && matchesSubcategory && matchesDetail;
    });

    if (vehicleKits.length) {
      filtered = vehicleKits
        .map(toDisplayProduct)
        .filter((product) => {
          const matchesSearch = !search || [product.name, product.category, product.subcategory, product.description].join(' ').toLowerCase().includes(search);
          const matchesCategory = category === 'all' || product.category === category;
          const matchesSubcategory = subcategory === 'all' || product.subcategory === subcategory;
          const matchesDetail = subcategoryDetail === 'all' || product.subSubcategory === subcategoryDetail;
          return matchesSearch && matchesCategory && matchesSubcategory && matchesDetail;
        })
        .concat(filtered);
    }

    if (sort === 'price-asc') filtered.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    if (sort === 'name-asc') filtered.sort((a, b) => a.name.localeCompare(b.name));

    const vehicleSearchActive = Boolean(vehicleQuery || selectedYear || selectedMake || selectedModel || selectedTrim);
    const hierarchyFilterActive = Boolean(category !== 'all' || subcategory !== 'all' || subcategoryDetail !== 'all');
    const vehicleMeta = vehicleSearchActive
      ? ` • ${matchedVehicles.length} vehicle match${matchedVehicles.length !== 1 ? 'es' : ''}`
      : '';
    const hierarchyMeta = hierarchyFilterActive ? ' • hierarchy filters active' : '';

    resultsMeta.textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''} found${vehicleMeta}${hierarchyMeta}`;
    productsEl.innerHTML = filtered.length
      ? filtered.map(renderProductCard).join('')
      : '<div class="card empty-state">No matching products found.</div>';
  }

  [searchInput, categoryFilter, subcategoryFilter, subcategoryDetailFilter, sortFilter]
    .filter(Boolean)
    .forEach((element) => element.addEventListener('input', render));

  categoryFilter?.addEventListener('change', () => {
    syncHierarchyFiltersFromCategory();
    render();
  });

  subcategoryFilter?.addEventListener('change', () => {
    syncHierarchyFiltersFromSubcategory();
    render();
  });

  subcategoryDetailFilter?.addEventListener('change', () => {
    syncHierarchyPickState();
    render();
  });

  if (categoryPicks) {
    categoryPicks.addEventListener('click', (event) => {
      const chip = event.target.closest('.decal-chip');
      if (!chip || !categoryFilter) return;

      categoryFilter.value = chip.dataset.category || 'all';
      syncHierarchyFiltersFromCategory();
      if (categoryFilter.value === 'Decals' && subcategoryFilter) {
        const decalSubcategories = getValidSubcategories('Decals');
        if (decalSubcategories.length && subcategoryFilter.value === 'all') {
          subcategoryFilter.value = decalSubcategories[0];
          syncHierarchyFiltersFromSubcategory();
        }
      }
      render();
    });
  }

  if (subcategoryPicks) {
    subcategoryPicks.addEventListener('click', (event) => {
      const chip = event.target.closest('.decal-chip');
      if (!chip || !subcategoryFilter) return;

      subcategoryFilter.value = chip.dataset.subcategory || 'all';
      syncHierarchyFiltersFromSubcategory();
      render();
    });
  }

  if (subcategoryDetailPicks) {
    subcategoryDetailPicks.addEventListener('click', (event) => {
      const chip = event.target.closest('.decal-chip');
      if (!chip || !subcategoryDetailFilter) return;

      subcategoryDetailFilter.value = chip.dataset.subsubcategory || 'all';
      syncHierarchyPickState();
      render();
    });
  }

  clearFilters.addEventListener('click', () => {
    if (vehicleSearchInput) {
      vehicleSearchInput.value = '';
    }
    searchInput.value = '';
    categoryFilter.value = 'all';
    if (subcategoryFilter) subcategoryFilter.value = 'all';
    if (subcategoryDetailFilter) subcategoryDetailFilter.value = 'all';
    sortFilter.value = 'default';

    if (yearFilter && makeFilter && modelFilter && trimFilter) {
      yearFilter.value = '';
      setVehicleSelectOptions(makeFilter, [], 'Select Make');
      setVehicleSelectOptions(modelFilter, [], 'Select Model');
      setVehicleSelectOptions(trimFilter, [], 'Select Trim');
      makeFilter.disabled = true;
      modelFilter.disabled = true;
      trimFilter.disabled = true;
    }

    if (typeof window.setSelectedVehicle === 'function') {
      window.setSelectedVehicle(null);
    }

    syncHierarchyFiltersFromCategory();
    updateVehicleSearchSuggestions();
    render();
  });

  syncHierarchyFiltersFromCategory();
  syncHierarchyPickState();
  render();
}

document.addEventListener('DOMContentLoaded', initShop);
