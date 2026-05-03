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
          <th>Position</th>
          <th>Price</th>
          <th>Customizable</th>
          <th>Featured</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${products.map((product) => `
          <tr>
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.subSubcategory || product.decalType || product.subcategory || ""}</td>
            <td>${product.position || product.placement || ""}</td>
            <td>${formatCurrency(product.price)}</td>
            <td>${(product.customizable ?? product.custom) ? "Yes" : "No"}</td>
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
  form.elements.category.value = product.category_key || String(product.category || "").toLowerCase();
  form.elements.subcategory.value = product.subSubcategory || product.decalType || product.subcategory || "";
  form.elements.position.value = product.position || product.placement || "";
  form.elements.price.value = product.price;
  form.elements.featured.value = String(Boolean(product.featured));
  form.elements.customizable.value = String(Boolean(product.customizable ?? product.custom));
  form.elements.tags.value = Array.isArray(product.tags) ? product.tags.join(", ") : "";
  form.elements.preview_image_path.value = product.preview_image_path || product.imagePath || "";
  form.elements.svg_file_path.value = product.svg_file_path || product.svgFilePath || "";
  form.elements.cut_file_path.value = product.cut_file_path || product.cutFilePath || "";
  form.elements.imageLabel.value = product.imageLabel || "";
  form.elements.description.value = product.description || "";
}

function resetProductForm() {
  const form = document.getElementById("cmsProductForm");
  if (!form) return;

  form.reset();
  form.elements.id.value = "";
  form.elements.featured.value = "false";
  form.elements.customizable.value = "false";
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

function isOrderWaitingFulfillment(order = {}) {
  const status = String(order.status || "").trim().toLowerCase();
  const paymentStatus = String(order.paymentStatus || "").trim().toLowerCase();

  const pendingByStatus = status.includes("pending fulfillment") || status.includes("pending fulfilment");
  const notFulfilled = !status.includes("fulfilled") && !status.includes("complete") && !status.includes("completed");
  const paid = paymentStatus === "paid" || status.includes("paid");

  return pendingByStatus || (paid && notFulfilled);
}

function renderPendingOrders(orders) {
  const target = document.getElementById("cmsPendingOrdersList");
  if (!target) return;

  const pendingOrders = (orders || []).filter((order) => isOrderWaitingFulfillment(order));

  if (!pendingOrders.length) {
    target.innerHTML = '<div class="empty-state">No orders currently waiting for fulfillment.</div>';
    return;
  }

  target.innerHTML = pendingOrders.slice(0, 25).map((order) => `
    <div class="order-card">
      <div class="order-summary-line"><span>Order #</span><strong>${order.id.slice(0, 8).toUpperCase()}</strong></div>
      <div class="order-summary-line"><span>Customer</span><strong>${order.customer?.firstName || "Guest"} ${order.customer?.lastName || ""}</strong></div>
      <div class="order-summary-line"><span>Total</span><strong>${formatCurrency(order.total || 0)}</strong></div>
      <div class="order-summary-line"><span>Status</span><strong>${order.status || "Pending Fulfillment"}</strong></div>
      <div class="order-summary-line"><span>Email</span><strong>${order.customer?.email || "N/A"}</strong></div>
      <div class="order-summary-line"><span>Date</span><strong>${new Date(order.createdAt).toLocaleString()}</strong></div>
      <div class="cms-actions-row">
        <button class="btn btn-outline" data-action="mark-fulfilled" data-id="${order.id}">Mark Fulfilled</button>
      </div>
    </div>
  `).join("");

  target.querySelectorAll("button[data-action='mark-fulfilled']").forEach((button) => {
    button.addEventListener("click", async () => {
      if (!confirm("Mark this order as fulfilled?")) return;

      const originalText = button.textContent;
      button.disabled = true;
      button.textContent = "Updating...";

      try {
        await cmsRequest(`/api/cms/orders/${button.dataset.id}/fulfill`, {
          method: "PATCH"
        });
        showMessage("Order marked as fulfilled.");
        await loadCmsData();
      } catch (error) {
        showMessage(error.message || "Failed to mark order as fulfilled.", "error");
      } finally {
        button.disabled = false;
        button.textContent = originalText;
      }
    });
  });
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
  renderPendingOrders(orders);
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
      position: data.position,
      price: Number(data.price),
      featured: data.featured === "true",
      customizable: data.customizable === "true",
      tags: String(data.tags || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      preview_image_path: data.preview_image_path,
      svg_file_path: data.svg_file_path,
      cut_file_path: data.cut_file_path,
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

function initCmsOrderAlertTools() {
  const testButton = document.getElementById("sendOrderAlertTestBtn");
  if (!testButton) return;

  testButton.addEventListener("click", async () => {
    const originalText = testButton.textContent;
    testButton.disabled = true;
    testButton.textContent = "Sending test alert...";

    try {
      const result = await cmsRequest("/api/cms/order-alerts/test", {
        method: "POST"
      });
      showMessage(result.message || "Test order alert sent.");
    } catch (error) {
      showMessage(error.message || "Failed to send test order alert.", "error");
    } finally {
      testButton.disabled = false;
      testButton.textContent = originalText;
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  initCmsLogin();
  initCmsProductForm();
  initCmsSettingsForm();
  initCmsOrderAlertTools();

  if (getCmsToken()) {
    try {
      await loadCmsData();
    } catch {
      showMessage("CMS session expired. Please log in again.", "error");
    }
  }
});
