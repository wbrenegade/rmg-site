(function () {
  var CURRENT_USER_KEY = 'rmg_current_user';

  function getUser() {
    try {
      var raw = localStorage.getItem(CURRENT_USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function logout() {
    localStorage.removeItem(CURRENT_USER_KEY);
    window.location.href = '/';
  }

  function isAuthHref(href) {
    if (!href) return false;
    var h = href.replace(/^.*\//, '').split('?')[0]; // basename
    return h === 'login' || h === 'login.html' || h === 'signup' || h === 'signup.html';
  }

  function isLoginHref(href) {
    if (!href) return false;
    var h = href.replace(/^.*\//, '').split('?')[0];
    return h === 'login' || h === 'login.html';
  }

  function updateNav(nav) {
    var user = getUser();
    var links = nav.querySelectorAll('a');

    // Collect login + signup nodes to remove
    var toRemove = [];
    links.forEach(function (a) {
      if (isAuthHref(a.getAttribute('href'))) toRemove.push(a);
    });

    if (!toRemove.length) return; // nothing to update

    if (user) {
      // Logged in — replace login/signup with My Account + Log Out
      var loginLink = toRemove.find(function (a) { return isLoginHref(a.getAttribute('href')); }) || toRemove[0];

      // Build My Account link
      var acctLink = document.createElement('a');
      acctLink.href = '/account';
      acctLink.textContent = 'My Account';
      if (window.location.pathname === '/account' || window.location.pathname.endsWith('account.html')) {
        acctLink.className = 'active';
      }

      // Build Log Out link
      var outLink = document.createElement('a');
      outLink.href = '#';
      outLink.textContent = 'Log Out';
      outLink.style.cursor = 'pointer';
      outLink.addEventListener('click', function (e) {
        e.preventDefault();
        logout();
      });

      // Insert before the first auth link, then remove all auth links
      loginLink.parentNode.insertBefore(acctLink, loginLink);
      loginLink.parentNode.insertBefore(outLink, loginLink);
      toRemove.forEach(function (a) { a.parentNode.removeChild(a); });
    } else {
      // Not logged in — make sure Login goes to /login and Sign Up goes to /signup
      toRemove.forEach(function (a) {
        var href = a.getAttribute('href');
        if (isLoginHref(href)) {
          a.href = '/login';
        } else {
          a.href = '/signup';
        }
      });
    }
  }

  function init() {
    var navs = document.querySelectorAll('.site-nav');
    navs.forEach(updateNav);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
