import { Header } from './components/header.js';

document.getElementById('header').innerHTML = Header({
  activePage: 'shop',
  cartCount: 3
});

const navToggle = document.getElementById('navToggle');
const siteNav = document.getElementById('siteNav');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    siteNav.classList.toggle('open');
  });
}