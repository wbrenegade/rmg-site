async function initAccount() {
  const profileEl = document.getElementById('accountProfile');
  const ordersEl = document.getElementById('accountOrders');
  const savedDesignsEl = document.getElementById('accountSavedDesigns');
  const logoutBtn = document.getElementById('logoutBtn');
  if (!profileEl || !ordersEl) return;

  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = '/login';
    return;
  }

  profileEl.innerHTML = `
    <div class="account-profile-row"><span>Name</span><strong>${currentUser.name}</strong></div>
    <div class="account-profile-row"><span>Email</span><strong>${currentUser.email}</strong></div>
  `;

  let orders = [];
  try {
    orders = await window.RMGApi.getOrdersByUser(currentUser.id);
  } catch {
    orders = getStorage(STORAGE_KEYS.orders, []).filter(order => order.userId === currentUser.id);
  }

  if (!orders.length) {
    ordersEl.innerHTML = '<div class="empty-state">No orders yet.</div>';
  } else {
    ordersEl.innerHTML = orders.map(order => `
      <div class="order-card">
        <div class="order-summary-line"><span>Order #</span><strong>${order.id.slice(0, 8).toUpperCase()}</strong></div>
        <div class="order-summary-line"><span>Date</span><strong>${new Date(order.createdAt).toLocaleString()}</strong></div>
        <div class="order-summary-line"><span>Total</span><strong>${formatCurrency(order.total)}</strong></div>
        <div class="order-summary-line"><span>Status</span><strong>${order.status}</strong></div>
      </div>
    `).join('');
  }

  if (savedDesignsEl) {
    const designs = getStorage('rmg_saved_decal_designs', []).filter(design => design.userId === currentUser.id);

    if (!designs.length) {
      savedDesignsEl.innerHTML = '<div class="empty-state">No saved decal designs yet.</div>';
    } else {
      savedDesignsEl.innerHTML = designs.map(design => `
        <div class="order-card">
          <div class="order-summary-line"><span>Name</span><strong>${escapeAccountHtml(design.name || 'Saved decal')}</strong></div>
          <div class="order-summary-line"><span>Updated</span><strong>${new Date(design.updatedAt || design.createdAt).toLocaleString()}</strong></div>
          <a class="btn btn-outline" href="/tools/decal-editor?design=${encodeURIComponent(design.id)}">Open in Editor</a>
        </div>
      `).join('');
    }
  }

  logoutBtn?.addEventListener('click', () => {
    setCurrentUser(null);
    window.location.href = '/login';
  });
}

function escapeAccountHtml(value) {
  return String(value || '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

document.addEventListener('DOMContentLoaded', initAccount);
