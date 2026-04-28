async function initHomePage() {
  const heroVideo = document.getElementById('heroVideo');
  const tabsWrap = document.getElementById('homeCategoryTabs');
  const grid = document.getElementById('homeCategoryProducts');
  const homeEyebrow = document.getElementById('homeEyebrow');
  const homeTitle = document.getElementById('homeTitle');
  const homePhrase = document.getElementById('homePhrase');
  const preferredCategoryOrder = [
    'Decals',
    'Window Tint',
    'Lettering',
    'Wraps'
  ];

  if (heroVideo) {
    heroVideo.playbackRate = 0.5;
  }

  try {
    const response = await fetch('/api/settings/public');
    if (response.ok) {
      const settings = await response.json();
      if (homeEyebrow && settings.homeEyebrow) homeEyebrow.textContent = settings.homeEyebrow;
      if (homeTitle && settings.homeTitle) homeTitle.textContent = settings.homeTitle;
      if (homePhrase && settings.homePhrase) homePhrase.textContent = settings.homePhrase;
    }
  } catch {
    // If settings API is unavailable, keep static homepage fallback content.
  }

  if (!tabsWrap || !grid) return;

  if (typeof window.ensureProductsLoaded === 'function') {
    await window.ensureProductsLoaded();
  }

  const products = typeof window.getProductsList === 'function' ? window.getProductsList() : (window.PRODUCTS || []);
  const featuredProducts = products.filter((product) => Boolean(product && product.featured));
  const showcaseProducts = featuredProducts.length ? featuredProducts : products.slice(0, 8);
  let categories = [];

  try {
    if (window.RMGApi && typeof window.RMGApi.getCategories === 'function') {
      const apiCategories = await window.RMGApi.getCategories();
      if (Array.isArray(apiCategories)) {
        categories = apiCategories;
      }
    }
  } catch {
    categories = [];
  }

  if (!categories.length) {
    const dedupe = (items) => [...new Set(items.filter(Boolean))];
    categories = dedupe(products.map((product) => product.category)).map((categoryName) => {
      const byCategory = products.filter((product) => product.category === categoryName);
      const subcategoryNames = dedupe(byCategory.map((product) => product.subcategory || 'Other'));
      return {
        name: categoryName,
        imagePath: '/assets/imgs/main.PNG',
        hasSubcategories: Boolean(subcategoryNames.length),
        subcategories: subcategoryNames.map((subcategoryName) => {
          const bySubcategory = byCategory.filter((product) => (product.subcategory || 'Other') === subcategoryName);
          const subSubcategoryNames = dedupe(bySubcategory.map((product) => product.subSubcategory));
          return {
            name: subcategoryName,
            imagePath: '/assets/imgs/main.PNG',
            hasSubcategories: Boolean(subSubcategoryNames.length),
            subcategories: subSubcategoryNames.map((subSubcategoryName) => ({
              name: subSubcategoryName,
              imagePath: '/assets/imgs/main.PNG',
              hasSubcategories: false,
              subcategories: null
            }))
          };
        })
      };
    });
  }

  const categoriesByName = categories.reduce((map, category) => {
    map[category.name] = category;
    return map;
  }, {});

  const categoryCounts = products.reduce((map, product) => {
    map[product.category] = (map[product.category] || 0) + 1;
    return map;
  }, {});

  const uniqueCategories = [...new Set(products.map((product) => product.category))];
  const orderedCategories = [
    ...preferredCategoryOrder.filter((category) => uniqueCategories.includes(category)),
    ...uniqueCategories.filter((category) => !preferredCategoryOrder.includes(category))
  ];
  const tabs = ['featured', 'all', ...orderedCategories];

  if (!orderedCategories.length) {
    grid.innerHTML = '<div class="card empty-state">No products available right now.</div>';
    return;
  }

  let activeCategory = 'featured';
  let activeSubcategory = null;
  let activeSubSubcategory = null;
  let activeDecalsSearchBy = 'position';
  let activeDecalsType = null;

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  function renderBrowseCards(items, level, categoryName, selectedSubcategory) {
    return items.map((item) => {
      const itemName = item.name || 'Untitled';
      const imagePath = item.imagePath || '/assets/imgs/main.PNG';

      const count = level === 'subcategory'
        ? products.filter((product) => product.category === categoryName && (product.subcategory || 'Other') === itemName).length
        : products.filter((product) => product.category === categoryName && (product.subcategory || 'Other') === selectedSubcategory && product.subSubcategory === itemName).length;

      return `
        <article class="card home-browse-card" data-home-browse-card="true" data-level="${escapeHtml(level)}" data-name="${escapeHtml(itemName)}">
          <div class="home-browse-media">
            <img src="${escapeHtml(imagePath)}" alt="${escapeHtml(itemName)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';" />
            <span class="media-fallback">${escapeHtml(itemName)}</span>
          </div>
          <div class="home-browse-body">
            <h3 class="home-browse-title">${escapeHtml(itemName)}</h3>
            <p class="home-browse-count">${count} product${count === 1 ? '' : 's'}</p>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderDecalsSearchByControls() {
    return `
      <div class="home-search-by" role="group" aria-label="Search decals by">
        <span class="home-search-by-label">Search by</span>
        <button type="button" class="home-search-by-option ${activeDecalsSearchBy === 'position' ? 'active' : ''}" data-home-search-by="position">Position</button>
        <button type="button" class="home-search-by-option ${activeDecalsSearchBy === 'type' ? 'active' : ''}" data-home-search-by="type">Type</button>
      </div>
    `;
  }

  const promotedDecalTypes = ['Platform Specific'];

  function normalizeLabel(value) {
    return String(value || '').trim().toLowerCase();
  }

  function isPromotedDecalType(name) {
    return promotedDecalTypes.some((typeName) => normalizeLabel(typeName) === normalizeLabel(name));
  }

  function productMatchesDecalType(product, typeName) {
    const target = normalizeLabel(typeName);
    return normalizeLabel(product?.subSubcategory) === target || normalizeLabel(product?.subcategory) === target;
  }

  function getDecalTypeNames(categoryNode, categoryProducts) {
    const typesFromProducts = categoryProducts
      .map((product) => String(product.subSubcategory || '').trim())
      .filter(Boolean);

    const promotedFromProducts = categoryProducts
      .map((product) => String(product.subcategory || '').trim())
      .filter((name) => isPromotedDecalType(name));

    const typesFromCategory = Array.isArray(categoryNode?.subcategories)
      ? categoryNode.subcategories.flatMap((subcategory) =>
        Array.isArray(subcategory?.subcategories)
          ? subcategory.subcategories.map((typeNode) => String(typeNode?.name || '').trim())
          : []
      ).filter(Boolean)
      : [];

    const promotedFromCategory = Array.isArray(categoryNode?.subcategories)
      ? categoryNode.subcategories
        .map((subcategory) => String(subcategory?.name || '').trim())
        .filter((name) => isPromotedDecalType(name))
      : [];

    return [...new Set([...typesFromProducts, ...typesFromCategory, ...promotedFromProducts, ...promotedFromCategory])];
  }

  function renderDecalTypeCards(typeNames, categoryProducts, categoryNode) {
    function getTypeImagePath(typeName) {
      if (!categoryNode || !Array.isArray(categoryNode.subcategories)) {
        return '/assets/imgs/main.PNG';
      }

      for (const subcategory of categoryNode.subcategories) {
        if (subcategory?.name === typeName) {
          return subcategory.imagePath || '/assets/imgs/main.PNG';
        }

        if (Array.isArray(subcategory?.subcategories)) {
          for (const typeNode of subcategory.subcategories) {
            if (typeNode?.name === typeName) {
              return typeNode.imagePath || '/assets/imgs/main.PNG';
            }
          }
        }
      }
      return '/assets/imgs/main.PNG';
    }

    return typeNames.map((typeName) => {
      const count = categoryProducts.filter((product) => productMatchesDecalType(product, typeName)).length;
      const imagePath = getTypeImagePath(typeName);
      return `
        <article class="card home-browse-card" data-home-type-card="true" data-type="${escapeHtml(typeName)}">
          <div class="home-browse-media">
            <img src="${escapeHtml(imagePath)}" alt="${escapeHtml(typeName)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid';" />
            <span class="media-fallback">${escapeHtml(typeName)}</span>
          </div>
          <div class="home-browse-body">
            <h3 class="home-browse-title">${escapeHtml(typeName)}</h3>
            <p class="home-browse-count">${count} product${count === 1 ? '' : 's'}</p>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderProducts(category) {
    if (category === 'featured') {
      grid.innerHTML = showcaseProducts.length
        ? showcaseProducts.map((product) => renderProductCard(product)).join('')
        : '<div class="card empty-state">No featured products available right now.</div>';
      return;
    }

    if (category === 'all') {
      grid.innerHTML = products.length
        ? products.map((product) => renderProductCard(product)).join('')
        : '<div class="card empty-state">No products available right now.</div>';
      return;
    }

    const categoryProducts = products.filter((product) => product.category === category);

    if (category !== 'Decals') {
      grid.innerHTML = categoryProducts.length
        ? categoryProducts.map((product) => renderProductCard(product)).join('')
        : '<div class="card empty-state">No products in this category yet.</div>';
      return;
    }

    const categoryNode = categoriesByName[category] || null;

    if (!categoryNode || !Array.isArray(categoryNode.subcategories) || !categoryNode.subcategories.length) {
      grid.innerHTML = categoryProducts.length
        ? categoryProducts.map((product) => renderProductCard(product)).join('')
        : '<div class="card empty-state">No products in this category yet.</div>';
      return;
    }

    if (activeDecalsSearchBy === 'type') {
      const decalTypes = getDecalTypeNames(categoryNode, categoryProducts);

      if (!activeDecalsType) {
        grid.innerHTML = `
          <div class="home-browse-wrap">
            <div class="home-browse-head">
              <p class="home-browse-path">${escapeHtml(category)}</p>
              ${renderDecalsSearchByControls()}
            </div>
            <div class="product-grid">
              ${renderDecalTypeCards(decalTypes, categoryProducts, categoryNode)}
            </div>
          </div>
        `;
        return;
      }

      const typedProducts = categoryProducts.filter((product) => productMatchesDecalType(product, activeDecalsType));
      grid.innerHTML = `
        <div class="home-browse-wrap">
          <div class="home-browse-head">
            <button class="home-browse-back" type="button" data-home-action="back">Back</button>
            <p class="home-browse-path">${escapeHtml(category)} / Type / ${escapeHtml(activeDecalsType)}</p>
            ${renderDecalsSearchByControls()}
          </div>
          ${typedProducts.length
            ? `<div class="product-grid">${typedProducts.map((product) => renderProductCard(product)).join('')}</div>`
            : '<div class="card empty-state">No products in this selection yet.</div>'}
        </div>
      `;
      return;
    }

    if (!activeSubcategory) {
      const positionSubcategories = categoryNode.subcategories.filter((subcategory) => !isPromotedDecalType(subcategory?.name));
      grid.innerHTML = `
        <div class="home-browse-wrap">
          <div class="home-browse-head">
            <p class="home-browse-path">${escapeHtml(category)}</p>
            ${renderDecalsSearchByControls()}
          </div>
          <div class="product-grid">
            ${renderBrowseCards(positionSubcategories, 'subcategory', category, null)}
          </div>
        </div>
      `;
      return;
    }

    const subcategoryNode = categoryNode.subcategories.find((item) => item.name === activeSubcategory) || null;
    if (!subcategoryNode) {
      activeSubcategory = null;
      activeSubSubcategory = null;
      renderProducts(category);
      return;
    }

    const subSubcategoryNodes = Array.isArray(subcategoryNode.subcategories) ? subcategoryNode.subcategories : [];

    if (subSubcategoryNodes.length && !activeSubSubcategory) {
      grid.innerHTML = `
        <div class="home-browse-wrap">
          <div class="home-browse-head">
            <button class="home-browse-back" type="button" data-home-action="back">Back</button>
            <p class="home-browse-path">${escapeHtml(category)} / ${escapeHtml(activeSubcategory)}</p>
            ${renderDecalsSearchByControls()}
          </div>
          <div class="product-grid">
            ${renderBrowseCards(subSubcategoryNodes, 'subsubcategory', category, activeSubcategory)}
          </div>
        </div>
      `;
      return;
    }

    const scoped = categoryProducts.filter((product) => {
      if ((product.subcategory || 'Other') !== activeSubcategory) return false;
      if (activeSubSubcategory) {
        // Only include products that match the sub-subcategory
        return product.subSubcategory === activeSubSubcategory;
      }
      // If no sub-subcategory selected, but sub-subcategories exist, don't show anything
      // (the sub-subcategory browse cards should be shown instead)
      if (subSubcategoryNodes.length > 0) return false;
      // Otherwise show all products for this subcategory
      return true;
    });

    const pathLabel = activeSubSubcategory
      ? `${escapeHtml(category)} / ${escapeHtml(activeSubcategory)} / ${escapeHtml(activeSubSubcategory)}`
      : `${escapeHtml(category)} / ${escapeHtml(activeSubcategory)}`;

    grid.innerHTML = `
      <div class="home-browse-wrap">
        <div class="home-browse-head">
          <button class="home-browse-back" type="button" data-home-action="back">Back</button>
          <p class="home-browse-path">${pathLabel}</p>
          ${renderDecalsSearchByControls()}
        </div>
        ${scoped.length
          ? `<div class="product-grid">${scoped.map((product) => renderProductCard(product)).join('')}</div>`
          : '<div class="card empty-state">No products in this selection yet.</div>'}
      </div>
    `;
  }

  function getTabLabel(category) {
    if (category === 'featured') return `Featured (${showcaseProducts.length})`;
    if (category === 'all') return `All Products (${products.length})`;
    return category;
  }

  function scrollToRenderedCards() {
    window.requestAnimationFrame(() => {
      const nextCard = grid.querySelector('.card, .product-card, .home-browse-wrap');
      if (nextCard && typeof nextCard.scrollIntoView === 'function') {
        nextCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (typeof grid.scrollIntoView === 'function') {
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  function renderTabs() {
    tabsWrap.innerHTML = tabs.map((category) => `
      <button class="home-tab ${category === activeCategory ? 'active' : ''}" data-category="${category}" role="tab" aria-selected="${category === activeCategory}">${getTabLabel(category)}</button>
    `).join('');

    tabsWrap.querySelectorAll('.home-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeCategory = tab.dataset.category;
        activeSubcategory = null;
        activeSubSubcategory = null;
        activeDecalsSearchBy = 'position';
        activeDecalsType = null;
        renderTabs();
        renderProducts(activeCategory);
        scrollToRenderedCards();
      });
    });
  }

  grid.addEventListener('click', (event) => {
    const searchByButton = event.target.closest('[data-home-search-by]');
    if (searchByButton && activeCategory === 'Decals') {
      const selectedMode = searchByButton.dataset.homeSearchBy;
      if (!(selectedMode === 'position' || selectedMode === 'type')) return;
      activeDecalsSearchBy = selectedMode;
      activeSubcategory = null;
      activeSubSubcategory = null;
      activeDecalsType = null;
      renderProducts(activeCategory);
      return;
    }

    const backButton = event.target.closest('[data-home-action="back"]');
    if (backButton) {
      if (activeCategory === 'Decals' && activeDecalsSearchBy === 'type' && activeDecalsType) {
        activeDecalsType = null;
        renderProducts(activeCategory);
        return;
      }
      if (activeSubSubcategory) {
        activeSubSubcategory = null;
      } else if (activeSubcategory) {
        activeSubcategory = null;
      }
      renderProducts(activeCategory);
      return;
    }

    const typeCard = event.target.closest('[data-home-type-card="true"]');
    if (typeCard && activeCategory === 'Decals' && activeDecalsSearchBy === 'type') {
      const selectedType = typeCard.dataset.type;
      if (!selectedType) return;
      activeDecalsType = selectedType;
      renderProducts(activeCategory);
      return;
    }

    const browseCard = event.target.closest('[data-home-browse-card="true"]');
    if (!browseCard) return;

    const level = browseCard.dataset.level;
    const selectedName = browseCard.dataset.name;
    if (!selectedName) return;

    if (level === 'subcategory') {
      activeSubcategory = selectedName;
      activeSubSubcategory = null;
      renderProducts(activeCategory);
      return;
    }

    if (level === 'subsubcategory') {
      activeSubSubcategory = selectedName;
      renderProducts(activeCategory);
    }
  });

  renderTabs();
  renderProducts(activeCategory);
}

document.addEventListener('DOMContentLoaded', initHomePage);
