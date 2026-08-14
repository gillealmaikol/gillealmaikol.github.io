document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('contact-form');

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault(); // Evita que se recargue la página

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const message = document.getElementById('message').value.trim();

    // Validación básica
    if (!name || !email || !message) {
      alert('Por favor completa todos los campos.');
      return;
    }

    // Número de WhatsApp (código de país + número sin 0 ni 15)
    const phone = '5411988365420';

    // Armar el mensaje
    const text = `Hola, soy *${name}*.%0A%0AEmail: ${email}%0A%0AMensaje:%0A${message}`;

    // Crear el enlace de WhatsApp
    const url = `https://wa.me/${phone}?text=${text}`;

    // Abrir WhatsApp
    window.open(url, '_blank');
  });
});