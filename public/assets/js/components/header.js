class SiteHeader extends HTMLElement {
  connectedCallback() {
    const activePage = this.getAttribute('active-page') || '';
    const cartCount = this.getAttribute('cart-count') || '0';

    this.innerHTML = `
      <header class="site-header">
        <div class="container nav-wrap">
          <a class="brand" href="index.html">
            <img class="brand-mark" src="assets/imgs/rmg_logo.png" alt="RMG logo" />
          </a>

          <button class="nav-toggle" aria-label="Toggle navigation">☰</button>

          <nav class="site-nav">
            <a href="index.html" class="${activePage === 'home' ? 'active' : ''}">Home</a>
            <a href="shop.html" class="${activePage === 'shop' ? 'active' : ''}">Shop</a>
            <a href="contact.html" class="${activePage === 'contact' ? 'active' : ''}">Contact</a>
            <a href="faq.html" class="${activePage === 'faq' ? 'active' : ''}">FAQ</a>
            <a href="login.html" class="${activePage === 'login' ? 'active' : ''}">Login</a>
            <a href="signup.html" class="btn btn-sm ${activePage === 'signup' ? 'active' : ''}">Sign Up</a>
            <a href="cart.html" class="cart-link ${activePage === 'cart' ? 'active' : ''}">
              Cart <span class="cart-count">${cartCount}</span>
            </a>
          </nav>
        </div>
      </header>
    `;

    const navToggle = this.querySelector('.nav-toggle');
    const siteNav = this.querySelector('.site-nav');

    if (navToggle && siteNav) {
      navToggle.addEventListener('click', () => {
        siteNav.classList.toggle('open');
      });
    }
  }
}
