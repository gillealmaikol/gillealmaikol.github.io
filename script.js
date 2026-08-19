// ===== TABS + SINCRONIZACIÓN CON ASIDE =====
const tabButtons = document.querySelectorAll('.tab-btn');
const previewFrame = document.getElementById('preview-frame');
const projectItems = document.querySelectorAll('.project-item');

// Función para mostrar solo el artículo activo
function showProject(id) {
    projectItems.forEach(item => {
        if (item.dataset.id === id) {
            item.style.display = 'block';   // mostrar
            item.classList.add('active');
        } else {
            item.style.display = 'none';    // ocultar
            item.classList.remove('active');
        }
    });
}

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        // Activar tab
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Cambiar iframe
        previewFrame.src = btn.dataset.src;
        previewFrame.title = `Vista previa de ${btn.dataset.title}`;

        // Mostrar solo el artículo correspondiente en el aside
        showProject(btn.dataset.id);
    });
});

// También permitir hacer clic en el aside (por si acaso)
projectItems.forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const id = item.dataset.id;
        const matchingTab = document.querySelector(`.tab-btn[data-id="${id}"]`);
        if (matchingTab) matchingTab.click();
    });
});

// ===== MENÚ MÓVIL =====
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('.nav');

menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    nav.classList.toggle('active');
});

document.querySelectorAll('.nav a').forEach(link => {
    link.addEventListener('click', () => {
        menuToggle.classList.remove('active');
        nav.classList.remove('active');
    });
});

// ===== AL CARGAR LA PÁGINA =====
// Mostrar solo el proyecto que viene activo por defecto
document.addEventListener('DOMContentLoaded', () => {
    const activeTab = document.querySelector('.tab-btn.active');
    if (activeTab) {
        showProject(activeTab.dataset.id);
    }
});