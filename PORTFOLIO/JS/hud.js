import { checkPanel } from "./canvas.js";

const PANEL_STATUS = {
    1: "// 01 — ACTIVE",
    2: "// 02 — ACTIVE",
    3: "// 03 — ACTIVE",
};

class UiSound {
    constructor() {
        this.context = null;
        this.enabled = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }

    play(type = "click") {
        if (!this.enabled) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.context ||= new AudioContext();
        if (this.context.state === "suspended") this.context.resume();

        const tones = {
            key: [480, 720, 0.045, "square"],
            weight: [180, 300, 0.08, "sine"],
            navigation: [210, 360, 0.065, "triangle"],
            hover: [640, 690, 0.025, "sine"],
            click: [260, 380, 0.05, "sine"],
        };
        const [start, end, duration, waveform] = tones[type] || tones.click;
        const now = this.context.currentTime;
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(start, now);
        oscillator.frequency.exponentialRampToValueAtTime(end, now + duration);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.04, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        oscillator.connect(gain).connect(this.context.destination);
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const panels = [...document.querySelectorAll(".panel")];
    const previousButton = document.querySelector(".nav-prev");
    const nextButton = document.querySelector(".nav-next");
    const navigationLinks = [...document.querySelectorAll("[data-go]")];
    const statusLabel = document.querySelector(".system-status");
    const sound = new UiSound();
    let currentPanel = 1;
    let isTransitioning = false;

    const updatePanel = (panelIndex) => {
        if (isTransitioning || panelIndex < 1 || panelIndex > panels.length) return;
        isTransitioning = true;
        currentPanel = panelIndex;

        panels.forEach((panel) => {
            const isCurrent = Number(panel.dataset.panel) === currentPanel;
            panel.classList.toggle("active", isCurrent);
            panel.classList.remove("animate-in");
            if (isCurrent) {
                void panel.offsetWidth;
                panel.classList.add("animate-in");
                panel.scrollTop = 0;
            }
        });

        previousButton.disabled = currentPanel === 1;
        nextButton.disabled = currentPanel === panels.length;
        navigationLinks.forEach((link) =>
            link.classList.toggle("active-link", Number(link.dataset.go) === currentPanel)
        );
        if (statusLabel) {
            statusLabel.innerHTML = `<span class="dot"></span> ${PANEL_STATUS[currentPanel]}`;
        }
        checkPanel();
        window.setTimeout(() => {
            isTransitioning = false;
        }, 520);
    };

    previousButton?.addEventListener("click", () => {
        sound.play("navigation");
        updatePanel(currentPanel - 1);
    });
    nextButton?.addEventListener("click", () => {
        sound.play("navigation");
        updatePanel(currentPanel + 1);
    });
    navigationLinks.forEach((link) =>
        link.addEventListener("click", (event) => {
            event.preventDefault();
            sound.play("navigation");
            updatePanel(Number(link.dataset.go));
        })
    );

    /* Glyph keyboard */
    document.querySelectorAll(".abc2.keyboard button").forEach((button) => {
        button.addEventListener("click", () => {
            button.classList.add("is-pressed");
            window.setTimeout(() => button.classList.remove("is-pressed"), 140);
            sound.play("key");
        });
    });

    /* Weight switcher + label */
    const weightSample = document.getElementById("weight-sample");
    const weightName = document.getElementById("weight-name");
    const initialWeight = document.querySelector(".weights-list button.active");
    if (weightSample && initialWeight) {
        weightSample.style.fontWeight = initialWeight.dataset.weight;
        if (weightName) weightName.textContent = initialWeight.dataset.name.toUpperCase();
    }
    document.querySelectorAll(".weights-list button").forEach((button) => {
        button.addEventListener("click", () => {
            document.querySelectorAll(".weights-list button").forEach((item) =>
                item.classList.toggle("active", item === button)
            );
            if (weightSample) {
                weightSample.style.fontWeight = button.dataset.weight;
                weightSample.style.letterSpacing =
                    button.dataset.weight === "900" ? "0.08em" : "0.05em";
            }
            if (weightName) weightName.textContent = button.dataset.name.toUpperCase();
            sound.play("weight");
        });
    });

    /* Keyboard nav */
    window.addEventListener("keydown", (event) => {
        if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
        event.preventDefault();
        sound.play("navigation");
        updatePanel(currentPanel + (event.key === "ArrowRight" ? 1 : -1));
    });

    /* Hover sounds */
    let hoveredElement = null;
    document.addEventListener("pointerover", (event) => {
        const interactiveElement = event.target.closest(
            "button, a, .series-link, .timeline-item, .use-list li, .caracteristicas-list"
        );
        if (!interactiveElement || interactiveElement === hoveredElement || event.pointerType === "touch")
            return;
        hoveredElement = interactiveElement;
        sound.play("hover");
    });
    document.addEventListener("pointerout", (event) => {
        if (
            !event.relatedTarget?.closest?.(
                "button, a, .series-link, .timeline-item, .use-list li, .caracteristicas-list"
            )
        ) {
            hoveredElement = null;
        }
    });

    /* Series link → mini video */
    const video = document.querySelector(".mini-screen video");
    const hasVideoSource = Boolean(video?.querySelector("source")?.getAttribute("src"));
    const seriesLink = document.querySelector(".series-link");
    const miniScreen = document.querySelector(".mini-screen");
    if (seriesLink && miniScreen && video && hasVideoSource) {
        const show = () => {
            miniScreen.classList.add("visible");
            video.currentTime = 0;
            video.play().catch(() => {});
        };
        const hide = () => {
            miniScreen.classList.remove("visible");
            video.pause();
        };
        seriesLink.addEventListener("pointerenter", show);
        seriesLink.addEventListener("pointerleave", hide);
        seriesLink.addEventListener("focus", show);
        seriesLink.addEventListener("blur", hide);
    } else {
        miniScreen?.setAttribute("hidden", "");
    }

    /* Scroll reveal */
    const revealTargets = document.querySelectorAll(
        ".timeline-item, .caracteristicas-list, .use-list li, .article-content, .weights-preview"
    );
    const revealObserver = new IntersectionObserver(
        (entries) =>
            entries.forEach((entry) =>
                entry.target.classList.toggle("is-visible", entry.isIntersecting)
            ),
        { threshold: 0.14 }
    );
    revealTargets.forEach((target) => {
        target.classList.add("scroll-reveal");
        revealObserver.observe(target);
    });

    /* Cursor glow (desktop) */
    const glow = document.getElementById("cursor-glow");
    if (glow && window.matchMedia("(pointer: fine)").matches) {
        let raf = null;
        let mx = 0;
        let my = 0;
        window.addEventListener(
            "pointermove",
            (e) => {
                mx = e.clientX;
                my = e.clientY;
                if (raf) return;
                raf = requestAnimationFrame(() => {
                    glow.style.left = `${mx}px`;
                    glow.style.top = `${my}px`;
                    raf = null;
                });
            },
            { passive: true }
        );
    }

    updatePanel(1);
});
