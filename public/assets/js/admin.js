const CMS_TOKEN_KEY = "rmg_cms_token";

function getCmsToken() {
  return localStorage.getItem(CMS_TOKEN_KEY) || "";
}

function setCmsToken(token) {
  localStorage.setItem(CMS_TOKEN_KEY, token);
}

async function cmsRequest(url, options = {}) {
  const token = getCmsToken();
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new Error(payload?.error || `Request failed (${response.status})`);
  }

  return payload;
}

function renderProductsTable(products) {
  const target = document.getElementById("cmsProductsTable");
  if (!target) return;

  if (!products.length) {
    target.innerHTML = '<div class="empty-state">No products yet.</div>';
    return;
  }

  target.innerHTML = `
    <table class="cms-table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Category</th>
          <th>Subcategory</th>
          <th>Price</th>
          <th>Custom</th>
          <th>Featured</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${products.map((product) => `
          <tr>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.subcategory || ""}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${product.custom ? "Yes" : "No"}</td>
            <td>${product.featured ? "Yes" : "No"}</td>
            <td class="cms-actions-row">
              <button class="btn btn-outline" data-action="edit" data-id="${product.id}">Edit</button>
              <button class="btn btn-outline" data-action="delete" data-id="${product.id}">Delete</button>
            </td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;

  target.querySelectorAll("button[data-action='edit']").forEach((button) => {
    button.addEventListener("click", () => {
      const product = products.find((item) => item.id === button.dataset.id);
      if (!product) return;
      fillProductForm(product);
    });
  });

  target.querySelectorAll("button[data-action='delete']").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Delete this product?")) return;
      try {
        await cmsRequest(`/api/cms/products/${button.dataset.id}`, { method: "DELETE" });
        showMessage("Product deleted.");
        await loadCmsData();
      } catch (error) {
        showMessage(error.message, "error");
      }
    });
  });
}

function fillProductForm(product) {
  const form = document.getElementById("cmsProductForm");
  if (!form) return;

  form.elements.id.value = product.id;
  form.elements.name.value = product.name;
  form.elements.slug.value = product.slug || "";
  form.elements.category.value = product.category;
  form.elements.subcategory.value = product.subcategory || "";
  form.elements.subSubcategory.value = product.subSubcategory || "";
  form.elements.price.value = product.price;
  form.elements.featured.value = String(Boolean(product.featured));
  form.elements.custom.value = String(Boolean(product.custom));
  form.elements.tags.value = Array.isArray(product.tags) ? product.tags.join(", ") : "";
  form.elements.imagePath.value = product.imagePath || "";
  form.elements.imageLabel.value = product.imageLabel || "";
  form.elements.description.value = product.description || "";
}

function resetProductForm() {
  const form = document.getElementById("cmsProductForm");
  if (!form) return;

  form.reset();
  form.elements.id.value = "";
  form.elements.featured.value = "false";
  form.elements.custom.value = "false";
}

function renderOrders(orders) {
  const target = document.getElementById("cmsOrdersList");
  if (!target) return;

  if (!orders.length) {
    target.innerHTML = '<div class="empty-state">No orders yet.</div>';
    return;
  }

  target.innerHTML = orders.slice(0, 10).map((order) => `
    <div class="order-card">
      <div class="order-summary-line"><span>Order #</span><strong>${order.id.slice(0, 8).toUpperCase()}</strong></div>
      <div class="order-summary-line"><span>Customer</span><strong>${order.customer?.firstName || "Guest"} ${order.customer?.lastName || ""}</strong></div>
      <div class="order-summary-line"><span>Total</span><strong>${formatCurrency(order.total || 0)}</strong></div>
      <div class="order-summary-line"><span>Date</span><strong>${new Date(order.createdAt).toLocaleString()}</strong></div>
    </div>
  `).join("");
}

function renderMessages(messages) {
  const target = document.getElementById("cmsMessagesList");
  if (!target) return;

  if (!messages.length) {
    target.innerHTML = '<div class="empty-state">No messages yet.</div>';
    return;
  }

  target.innerHTML = messages.slice(0, 10).map((message) => `
    <div class="order-card">
      <div class="order-summary-line"><span>From</span><strong>${message.name}</strong></div>
      <div class="order-summary-line"><span>Email</span><strong>${message.email}</strong></div>
      <div class="order-summary-line"><span>Subject</span><strong>${message.subject}</strong></div>
      <p>${message.message}</p>
    </div>
  `).join("");
}

function fillSettingsForm(settings) {
  const form = document.getElementById("cmsSettingsForm");
  if (!form) return;

  form.elements.homeEyebrow.value = settings.homeEyebrow || "";
  form.elements.homeTitle.value = settings.homeTitle || "";
  form.elements.homePhrase.value = settings.homePhrase || "";
}

function renderAnalyticsMetric(id, value) {
  const target = document.getElementById(id);
  if (target) {
    target.textContent = value;
  }
}

function renderAnalyticsList(id, items, emptyLabel, formatter) {
  const target = document.getElementById(id);
  if (!target) return;

  if (!items.length) {
    target.innerHTML = `<div class="empty-state">${emptyLabel}</div>`;
    return;
  }

  target.innerHTML = items.map((item) => formatter(item)).join("");
}

function renderAnalyticsSummary(summary) {
  if (!summary || !summary.totals) return;

  renderAnalyticsMetric("analyticsTotalVisitors", String(summary.totals.uniqueVisitors || 0));
  renderAnalyticsMetric("analyticsTotalPageViews", String(summary.totals.pageViews || 0));
  renderAnalyticsMetric("analyticsTotalProductViews", String(summary.totals.productViews || 0));
  renderAnalyticsMetric("analyticsTotalToolEvents", String(summary.totals.toolEvents || 0));

  renderAnalyticsList(
    "analyticsTopPages",
    summary.topPages || [],
    "No page views yet.",
    (item) => `<div class="order-summary-line"><span>${item.label}</span><strong>${item.count}</strong></div>`
  );

  renderAnalyticsList(
    "analyticsTopProducts",
    summary.topProducts || [],
    "No product views yet.",
    (item) => `<div class="order-summary-line"><span>${item.label}</span><strong>${item.count}</strong></div>`
  );

  renderAnalyticsList(
    "analyticsTopTools",
    summary.topTools || [],
    "No tool usage yet.",
    (item) => `<div class="order-summary-line"><span>${item.label}</span><strong>${item.count}</strong></div>`
  );

  renderAnalyticsList(
    "analyticsTopCountries",
    summary.topCountries || [],
    "No country data yet.",
    (item) => `<div class="order-summary-line"><span>${item.label}</span><strong>${item.count}</strong></div>`
  );

  renderAnalyticsList(
    "analyticsRecentEvents",
    summary.recentEvents || [],
    "No recent activity yet.",
    (event) => {
      const title = event.productName || event.pathname || event.tool || event.type;
      const detailParts = [event.type, event.tool, event.action, event.location?.country].filter(Boolean);
      return `
        <div class="order-card">
          <div class="order-summary-line"><span>${title}</span><strong>${new Date(event.timestamp).toLocaleString()}</strong></div>
          <p>${detailParts.join(" • ")}</p>
        </div>
      `;
    }
  );
}

async function loadCmsData() {
  const [products, orders, messages, settings, analytics] = await Promise.all([
    cmsRequest("/api/cms/products"),
    cmsRequest("/api/cms/orders"),
    cmsRequest("/api/cms/messages"),
    cmsRequest("/api/cms/settings"),
    cmsRequest("/api/cms/analytics")
  ]);

  renderProductsTable(products);
  renderOrders(orders);
  renderMessages(messages);
  fillSettingsForm(settings);
  renderAnalyticsSummary(analytics);
}

function initCmsLogin() {
  const form = document.getElementById("cmsLoginForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const password = form.elements.password.value;

    try {
      const result = await fetch("/api/cms/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });

      const payload = await result.json();
      if (!result.ok) {
        throw new Error(payload.error || "Login failed");
      }

      setCmsToken(payload.token);
      showMessage("CMS login successful.");
      form.reset();
      await loadCmsData();
    } catch (error) {
      showMessage(error.message, "error");
    }
  });
}

function initCmsProductForm() {
  const form = document.getElementById("cmsProductForm");
  const resetButton = document.getElementById("cmsProductReset");
  if (!form) return;

  resetButton?.addEventListener("click", resetProductForm);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    const payload = {
      name: data.name,
      slug: data.slug,
      category: data.category,
      subcategory: data.subcategory,
      subSubcategory: data.subSubcategory || null,
      price: Number(data.price),
      featured: data.featured === "true",
      custom: data.custom === "true",
      tags: String(data.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      imagePath: data.imagePath,
      imageLabel: data.imageLabel,
      description: data.description
    };

    try {
      if (data.id) {
        await cmsRequest(`/api/cms/products/${data.id}`, {
          method: "PUT",
          body: JSON.stringify(payload)
        });
        showMessage("Product updated.");
      } else {
        await cmsRequest("/api/cms/products", {
          method: "POST",
          body: JSON.stringify(payload)
        });
        showMessage("Product created.");
      }

      resetProductForm();
      await loadCmsData();
    } catch (error) {
      showMessage(error.message, "error");
    }
  });
}

function initCmsSettingsForm() {
  const form = document.getElementById("cmsSettingsForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());

    try {
      await cmsRequest("/api/cms/settings", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      showMessage("Homepage settings updated.");
    } catch (error) {
      showMessage(error.message, "error");
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initCmsLogin();
  initCmsProductForm();
  initCmsSettingsForm();

  if (getCmsToken()) {
    try {
      await loadCmsData();
    } catch {
      showMessage("CMS session expired. Please log in again.", "error");
    }
  }
});
