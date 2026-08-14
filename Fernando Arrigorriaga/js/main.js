/* ========================================
   MAIN.JS - Fernando Arrigorriaga
======================================== */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Año automático en el footer ----------
  const yearSpan = document.getElementById('year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // ---------- Header con clase "scrolled" ----------
  const header = document.getElementById('header');

  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Ejecutar al cargar por si ya hay scroll

  // ---------- Menú móvil ----------
  const navToggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('nav');

  if (navToggle && nav) {
    navToggle.addEventListener('click', () => {
      nav.classList.toggle('active');
      navToggle.classList.toggle('active');

      // Opcional: bloquear scroll del body cuando el menú está abierto
      document.body.classList.toggle('no-scroll');
    });

    // Cerrar el menú al hacer clic en un enlace
    const navLinks = nav.querySelectorAll('.nav__link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
        navToggle.classList.remove('active');
        document.body.classList.remove('no-scroll');
      });
    });
  }

});