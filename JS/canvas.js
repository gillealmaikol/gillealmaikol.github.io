import * as THREE from 'three';

/* ==========================================================================
   NOISE 3D
   ========================================================================== */
function fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a, b, t) { return a + t * (b - a); }
function grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

const perm = new Uint8Array(512);
const p = new Uint8Array(256);
for (let i = 0; i < 256; i++) p[i] = i;
for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
}
for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

function noise3D(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = fade(x), v = fade(y), w = fade(z);
    const A = perm[X] + Y, AA = perm[A] + Z, AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y, BA = perm[B] + Z, BB = perm[B + 1] + Z;

    return lerp(
        lerp(
            lerp(grad(perm[AA], x, y, z), grad(perm[BA], x - 1, y, z), u),
            lerp(grad(perm[AB], x, y - 1, z), grad(perm[BB], x - 1, y - 1, z), u),
            v
        ),
        lerp(
            lerp(grad(perm[AA + 1], x, y, z - 1), grad(perm[BA + 1], x - 1, y, z - 1), u),
            lerp(grad(perm[AB + 1], x, y - 1, z - 1), grad(perm[BB + 1], x - 1, y - 1, z - 1), u),
            v
        ),
        w
    );
}

/* ==========================================================================
   THREE.JS + INTERACTION
   ========================================================================== */
let canvas, scene, camera, renderer, geometry, points;
let animationId = null;
let time = 0;

const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const COUNT = isTouchDevice ? 4200 : 14000;

function getRadius() {
    if (window.innerWidth < 768) return 1.15;
    if (window.innerWidth < 1200) return 1.45;
    return 1.70;
}
let RADIUS = getRadius();

const positions = new Float32Array(COUNT * 3);
const colors    = new Float32Array(COUNT * 3);
const original  = new Float32Array(COUNT * 3);
const current   = new Float32Array(COUNT * 3);

const mouseWorld = new THREE.Vector3(0, 0, 0);
let interactionState = 'idle';
let stateTimer = 0;

const collapseDuration = 0.45;
const explodeDuration  = 1.4;
const recoverDuration  = 3.8;

function initThree() {
    canvas = document.getElementById('blob-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.z = 6.2;

    renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        antialias: true,
        alpha: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouchDevice ? 1.25 : 2));
    renderer.setClearColor(0x000000, 0);

    const cyanBright = new THREE.Color(0x00e5ff);
    const cyanDim    = new THREE.Color(0x00a8b3);
    const magenta    = new THREE.Color(0xff2a6d);
    const magentaDim = new THREE.Color(0xb31e4d);

    for (let i = 0; i < COUNT; i++) {
        const phi   = Math.acos(1 - 2 * (i + 0.5) / COUNT);
        const theta = Math.PI * (1 + Math.sqrt(5)) * i;

        const x = Math.sin(phi) * Math.cos(theta);
        const y = Math.sin(phi) * Math.sin(theta);
        const z = Math.cos(phi);

        positions[i * 3]     = x * RADIUS;
        positions[i * 3 + 1] = y * RADIUS;
        positions[i * 3 + 2] = z * RADIUS;

        original[i * 3]     = x;
        original[i * 3 + 1] = y;
        original[i * 3 + 2] = z;

        current[i * 3]     = x * RADIUS;
        current[i * 3 + 1] = y * RADIUS;
        current[i * 3 + 2] = z * RADIUS;

        const t = (y + 1) * 0.5;
        let c;
        if (t < 0.33) {
            c = cyanBright.clone().lerp(cyanDim, t / 0.33);
        } else if (t < 0.66) {
            c = cyanDim.clone().lerp(magentaDim, (t - 0.33) / 0.33);
        } else {
            c = magentaDim.clone().lerp(magenta, (t - 0.66) / 0.34);
        }

        colors[i * 3]     = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }

    geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
        size: 0.026,
        vertexColors: true,
        transparent: true,
        opacity: 0.72,
        sizeAttenuation: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending
    });

    points = new THREE.Points(geometry, material);
    scene.add(points);

    window.addEventListener('pointermove', (e) => {
        const pointerX = (e.clientX / window.innerWidth) * 2 - 1;
        const pointerY = -(e.clientY / window.innerHeight) * 2 + 1;
        mouseWorld.set(pointerX * 3.2, pointerY * 2.4, 0);
    }, { passive: true });

    window.addEventListener('pointerdown', () => {
        if (interactionState === 'idle') {
            interactionState = 'collapsing';
            stateTimer = 0;
        }
    });
}

function animate() {
    animationId = requestAnimationFrame(animate);
    time += isTouchDevice ? 0.004 : 0.0055;
    const dt = 0.016;

    if (geometry && geometry.attributes.position) {
        const pos = geometry.attributes.position.array;

        if (interactionState !== 'idle') stateTimer += dt;

        if (interactionState === 'collapsing' && stateTimer >= collapseDuration) {
            interactionState = 'exploding';
            stateTimer = 0;
        } else if (interactionState === 'exploding' && stateTimer >= explodeDuration) {
            interactionState = 'recovering';
            stateTimer = 0;
        } else if (interactionState === 'recovering' && stateTimer >= recoverDuration) {
            interactionState = 'idle';
            stateTimer = 0;
        }

        for (let i = 0; i < COUNT; i++) {
            const ox = original[i * 3];
            const oy = original[i * 3 + 1];
            const oz = original[i * 3 + 2];

            const n1 = noise3D(ox * 1.35 + time, oy * 1.35, oz * 1.35) * 0.32;
            const n2 = noise3D(ox * 2.6 - time * 0.6, oy * 2.6, oz * 2.6) * 0.14;
            const n3 = noise3D(ox * 0.65 + time * 0.25, oy * 0.65, oz * 0.65) * 0.22;
            const displacement = 1 + n1 + n2 + n3;

            const targetX = ox * RADIUS * displacement;
            const targetY = oy * RADIUS * displacement;
            const targetZ = oz * RADIUS * displacement;

            let px = current[i * 3];
            let py = current[i * 3 + 1];
            let pz = current[i * 3 + 2];

            if (interactionState === 'idle') {
                px = targetX;
                py = targetY;
                pz = targetZ;

                const dx = mouseWorld.x - px;
                const dy = mouseWorld.y - py;
                const dz = mouseWorld.z - pz;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) + 0.001;
                const force = Math.max(0, 1.6 - dist) * 0.18;

                px += dx * force;
                py += dy * force;
                pz += dz * force * 0.55;
            }

            if (interactionState === 'collapsing') {
                const progress = Math.min(1, stateTimer / collapseDuration);
                const ease = progress * progress;
                const scale = 1 - ease * 0.92;
                px = targetX * scale;
                py = targetY * scale;
                pz = targetZ * scale;
            }

            if (interactionState === 'exploding') {
                const progress = Math.min(1, stateTimer / explodeDuration);
                const ease = 1 - Math.pow(1 - progress, 3);
                const explodeForce = ease * 4.5;

                px = ox * RADIUS * (1 + explodeForce) + (Math.random() - 0.5) * 0.9;
                py = oy * RADIUS * (1 + explodeForce) + (Math.random() - 0.5) * 0.9;
                pz = oz * RADIUS * (1 + explodeForce * 0.7) + (Math.random() - 0.5) * 0.55;
            }

            if (interactionState === 'recovering') {
                const progress = Math.min(1, stateTimer / recoverDuration);
                const ease = progress < 0.5
                    ? 2 * progress * progress
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                const lerpFactor = 0.025 + ease * 0.045;
                px += (targetX - px) * lerpFactor;
                py += (targetY - py) * lerpFactor;
                pz += (targetZ - pz) * lerpFactor;
            }

            current[i * 3]     = px;
            current[i * 3 + 1] = py;
            current[i * 3 + 2] = pz;

            pos[i * 3]     = px;
            pos[i * 3 + 1] = py;
            pos[i * 3 + 2] = pz;
        }

        geometry.attributes.position.needsUpdate = true;
    }

    if (points) {
        points.rotation.y = time * 0.12;
        points.rotation.x = Math.sin(time * 0.09) * 0.07;
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

export function checkPanel() {
    const panel01 = document.querySelector('.panel-01');
    const canvas = document.getElementById('blob-canvas');
    const isCover = panel01 && panel01.classList.contains('active');

    if (canvas) {
        canvas.style.opacity = isCover ? '1' : '0';
        canvas.style.transition = 'opacity 0.55s ease';
    }

    if (isCover) {
        if (prefersReducedMotion) {
            if (renderer && scene && camera) renderer.render(scene, camera);
            return;
        }
        if (!animationId && renderer) animate();
    } else {
        if (animationId) {
            cancelAnimationFrame(animationId);
            animationId = null;
        }
    }
}

let resizeFrame = null;
window.addEventListener('resize', () => {
    if (resizeFrame) cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
    if (!renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isTouchDevice ? 1.25 : 2));
    RADIUS = getRadius();
    });
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    } else {
        checkPanel();
    }
});

// Initialize
initThree();
