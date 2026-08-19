/**
 * Brutalist — panel navigation
 */

(function () {
    'use strict';

    const panels = [...document.querySelectorAll('.panel')];
    const total = panels.length;
    let current = 0;

    const indicatorCurrent = document.querySelector('.panel-current');
    const btnPrev = document.querySelector('.nav-prev');
    const btnNext = document.querySelector('.nav-next');

    function goTo(index) {
        if (index < 0 || index >= total || index === current) return;

        panels[current].classList.remove('active');
        current = index;
        panels[current].classList.add('active');

        if (indicatorCurrent) {
            indicatorCurrent.textContent = String(current + 1).padStart(2, '0');
        }

        if (btnPrev) btnPrev.disabled = current === 0;
        if (btnNext) btnNext.disabled = current === total - 1;
    }

    btnPrev?.addEventListener('click', () => goTo(current - 1));
    btnNext?.addEventListener('click', () => goTo(current + 1));

    document.querySelectorAll('[data-go]').forEach(el => {
        el.addEventListener('click', () => {
            const target = parseInt(el.dataset.go, 10) - 1;
            if (!isNaN(target)) goTo(target);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            goTo(current + 1);
        }
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            goTo(current - 1);
        }
        if (e.key === 'Home') goTo(0);
        if (e.key === 'End') goTo(total - 1);
    });

    let wheelLock = false;
    document.addEventListener('wheel', (e) => {
        if (wheelLock) return;
        if (Math.abs(e.deltaY) < 30) return;

        wheelLock = true;
        setTimeout(() => { wheelLock = false; }, 700);

        if (e.deltaY > 0) goTo(current + 1);
        else goTo(current - 1);
    }, { passive: true });

    let touchStartX = 0;
    let touchStartY = 0;

    document.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        const dx = e.changedTouches[0].screenX - touchStartX;
        const dy = e.changedTouches[0].screenY - touchStartY;

        if (Math.abs(dx) < 50 && Math.abs(dy) < 50) return;

        if (Math.abs(dy) > Math.abs(dx)) {
            if (dy < 0) goTo(current + 1);
            else goTo(current - 1);
        } else {
            if (dx < 0) goTo(current + 1);
            else goTo(current - 1);
        }
    }, { passive: true });

    goTo(0);
})();
