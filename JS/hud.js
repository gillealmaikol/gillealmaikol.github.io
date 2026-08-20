import { checkPanel } from './canvas.js';

document.addEventListener('DOMContentLoaded', () => {
    const panels = document.querySelectorAll('.panel');
    const prevBtn = document.querySelector('.nav-prev');
    const nextBtn = document.querySelector('.nav-next');
    const navLinks = document.querySelectorAll('[data-go]');
    const systemStatusLabel = document.querySelector('.system-status');

    const labels = {
        1: '// 01 — ACTIVE',
        2: '// 02 — ACTIVE',
        3: '// 03 — ACTIVE'
    };

    let currentPanel = 1;
    let isAnimating = false;

    // Sonido generado localmente: se activa únicamente tras una interacción del usuario.
    let audioContext;
    function playUISound(type = 'click') {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audioContext ||= new AudioContext();
        if (audioContext.state === 'suspended') audioContext.resume();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const now = audioContext.currentTime;
        const tones = { key: [470, 720, 0.045], weight: [180, 300, 0.08], click: [220, 330, 0.055] };
        const [start, end, duration] = tones[type] || tones.click;
        oscillator.type = type === 'key' ? 'square' : 'sine';
        oscillator.frequency.setValueAtTime(start, now);
        oscillator.frequency.exponentialRampToValueAtTime(end, now + duration);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.045, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        oscillator.connect(gain).connect(audioContext.destination);
        oscillator.start(now);
        oscillator.stop(now + duration);
    }

    document.querySelectorAll('.abc2.keyboard button').forEach(button => {
        button.addEventListener('click', () => {
            button.classList.add('is-pressed');
            setTimeout(() => button.classList.remove('is-pressed'), 120);
            playUISound('key');
        });
    });

    const weightSample = document.getElementById('weight-sample');
    const currentWeight = document.getElementById('current-weight');
    document.querySelectorAll('.weights-list button').forEach(button => {
        button.addEventListener('click', () => {
            const { weight, name } = button.dataset;
            document.querySelectorAll('.weights-list button').forEach(item => item.classList.toggle('active', item === button));
            if (weightSample) weightSample.style.fontWeight = weight === 'variable' ? '600' : weight;
            if (currentWeight) currentWeight.textContent = name;
            playUISound('weight');
        });
    });

    function updateHUD(panelIndex) {
        if (isAnimating || panelIndex < 1 || panelIndex > panels.length) return;
        
        isAnimating = true;
        currentPanel = panelIndex;

        panels.forEach(p => {
            const index = parseInt(p.dataset.panel);

            if (index === currentPanel) {
                p.classList.add('active');

                // Reiniciar animaciones
                p.classList.remove('animate-in');
                void p.offsetWidth;
                p.classList.add('animate-in');
            } else {
                p.classList.remove('active');
                p.classList.remove('animate-in');
            }
        });

        // Botones
        if (prevBtn) prevBtn.disabled = (currentPanel === 1);
        if (nextBtn) nextBtn.disabled = (currentPanel === panels.length);

        // Links laterales
        navLinks.forEach(link => {
            const target = parseInt(link.getAttribute('data-go'));
            if (target === currentPanel) {
                link.classList.add('active-link');
            } else {
                link.classList.remove('active-link');
            }
        });

        // Status
        if (systemStatusLabel && labels[currentPanel]) {
            systemStatusLabel.innerHTML = `<span class="dot"></span> ${labels[currentPanel]}`;
        }

        checkPanel();

        // Pequeño delay para evitar spam de clicks
        setTimeout(() => {
            isAnimating = false;
        }, 600);
    }

    // ——— Botones ———
    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (currentPanel > 1) updateHUD(currentPanel - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (currentPanel < panels.length) updateHUD(currentPanel + 1);
        });
    }

    // ——— Links laterales ———
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = parseInt(link.getAttribute('data-go'));
            if (target) updateHUD(target);
        });
    });

    // ——— Teclado (solo izquierda / derecha) ———
    window.addEventListener('keydown', (e) => {
        if (['ArrowLeft'].includes(e.key)) {
            e.preventDefault();
            if (currentPanel > 1) updateHUD(currentPanel - 1);
        }
        if (['ArrowRight'].includes(e.key)) {
            e.preventDefault();
            if (currentPanel < panels.length) updateHUD(currentPanel + 1);
        }
    });

    // Iniciar en panel 1
    updateHUD(1);
});

// Mini pantalla - Trailer Edgerunners
const seriesLink = document.querySelector('.series-link');
const miniScreen = document.querySelector('.mini-screen');
const trailerVideo = document.querySelector('.mini-screen video');

if (seriesLink && miniScreen && trailerVideo) {
    seriesLink.addEventListener('mouseenter', () => {
        miniScreen.classList.add('visible');
        trailerVideo.currentTime = 0; // empieza desde el inicio
        trailerVideo.play().catch(err => console.log('Error al reproducir:', err));
    });

    seriesLink.addEventListener('mouseleave', () => {
        miniScreen.classList.remove('visible');
        trailerVideo.pause();
    });
}