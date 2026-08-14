document.addEventListener('DOMContentLoaded', () => {

  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');

  let currentIndex = 0;
  let filteredItems = [...galleryItems];

  // ---------- Filtros ----------
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Estado activo del botón
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      galleryItems.forEach(item => {
        if (filter === 'all' || item.dataset.category === filter) {
          item.classList.remove('hidden');
        } else {
          item.classList.add('hidden');
        }
      });

      // Actualizar lista de items visibles para el lightbox
      filteredItems = [...galleryItems].filter(item => !item.classList.contains('hidden'));
    });
  });

  // ---------- Abrir Lightbox ----------
  galleryItems.forEach((item, index) => {
    item.addEventListener('click', () => {
      // Solo abrir si el item está visible
      if (item.classList.contains('hidden')) return;

      filteredItems = [...galleryItems].filter(i => !i.classList.contains('hidden'));
      currentIndex = filteredItems.indexOf(item);

      updateLightbox();
      lightbox.classList.add('active');
      lightbox.hidden = false;
      document.body.classList.add('no-scroll');
    });
  });

  function updateLightbox() {
    const item = filteredItems[currentIndex];
    const img = item.querySelector('img');
    const title = item.querySelector('.gallery-item__title');

    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightboxCaption.textContent = title ? title.textContent : '';
  }

  // ---------- Cerrar Lightbox ----------
  function closeLightbox() {
    lightbox.classList.remove('active');
    setTimeout(() => {
      lightbox.hidden = true;
    }, 300);
    document.body.classList.remove('no-scroll');
  }

  lightboxClose.addEventListener('click', closeLightbox);

  // Cerrar con tecla Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && lightbox.classList.contains('active')) {
      closeLightbox();
    }
  });

  // Cerrar haciendo clic fuera de la imagen
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) {
      closeLightbox();
    }
  });

  // ---------- Navegación prev / next ----------
  lightboxPrev.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    updateLightbox();
  });

  lightboxNext.addEventListener('click', (e) => {
    e.stopPropagation();
    currentIndex = (currentIndex + 1) % filteredItems.length;
    updateLightbox();
  });

  // Navegación con flechas del teclado
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;

    if (e.key === 'ArrowLeft') {
      currentIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
      updateLightbox();
    }
    if (e.key === 'ArrowRight') {
      currentIndex = (currentIndex + 1) % filteredItems.length;
      updateLightbox();
    }
  });

});