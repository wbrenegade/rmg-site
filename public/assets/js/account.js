async function initAccount() {
  const profileEl = document.getElementById('accountProfile');
  const ordersEl = document.getElementById('accountOrders');
  const logoutBtn = document.getElementById('logoutBtn');
  if (!profileEl || !ordersEl) return;

  const currentUser = getCurrentUser();
  if (!currentUser) {
    window.location.href = 'login.html';
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

  logoutBtn?.addEventListener('click', () => {
    setCurrentUser(null);
    window.location.href = 'login.html';
  });
}

document.addEventListener('DOMContentLoaded', initAccount);