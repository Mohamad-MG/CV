/**
 * Nebula Physics Engine 2026 — Performance Edition
 * GPU-composited vertical drift. Frame-capped, device-aware, repulsion-throttled.
 */
(() => {
    'use strict';

    class NebulaPhysics {
        #config = {
            baseSpeed: 0.45,
            fallSpeed: 0.65,
            collisionPadding: 8,
            repulsionForce: 0.05,
            drag: 0.96,
            recovery: 0.1,
            downFlowChance: 0.15,
            laneWidth: 100,
            boundaryBuffer: 100
        };

        #particles = [];
        #signals = [];
        #container = null;
        #isPaused = false;
        #lastFrameTs = 0;
        #dims = { width: 0, height: 0 };
        #isLowPower = false;
        #isTouchDevice = false;
        #repulsionFrame = 0; // throttle counter

        constructor() {
            try {
                this.#initEnvironment();
                if (this.#setupContainer()) {
                    this.#bootstrap();
                }
            } catch (err) {
                console.error('[NebulaPhysics] Init Aborted:', err);
            }
        }

        #initEnvironment() {
            this.#dims.width = window.innerWidth;
            this.#dims.height = window.innerHeight;

            // Real device detection — no longer hard-coded
            const cores = Number(navigator.hardwareConcurrency || 0);
            const mem = Number(navigator.deviceMemory || 0);
            this.#isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
            this.#isLowPower =
                this.#isTouchDevice ||
                (cores > 0 && cores <= 4) ||
                (mem > 0 && mem <= 4);

            if (this.#isLowPower) {
                // Low-power profile: slower + lighter
                this.#config.baseSpeed *= 0.55;
                this.#config.fallSpeed *= 0.55;
                this.#config.repulsionForce *= 0.5;
            }
        }

        #setupContainer() {
            this.#container = document.querySelector('.social-nebula');
            if (!this.#container) return false;
            const signals = this.#container.querySelectorAll('.signal');
            if (!signals.length) return false;
            this.#signals = Array.from(signals);
            return true;
        }

        #bootstrap() {
            this.#spawnParticles();
            this.#bindEvents();
            this.#lastFrameTs = performance.now();
            requestAnimationFrame((ts) => this.#animate(ts));
        }

        #bindEvents() {
            let resizeDebounce;
            window.addEventListener('resize', () => {
                cancelAnimationFrame(resizeDebounce);
                resizeDebounce = requestAnimationFrame(() => {
                    this.#dims.width = window.innerWidth;
                    this.#dims.height = window.innerHeight;
                });
            }, { passive: true });

            document.addEventListener('visibilitychange', () => {
                this.#isPaused = document.hidden;
                if (!document.hidden) {
                    // Reset timestamp on resume to prevent position jump
                    this.#lastFrameTs = performance.now();
                }
            });
        }

        #getSignalRadius(el) {
            const classes = el.classList;
            if (classes.contains('sig-lg')) return 28;
            if (classes.contains('sig-md')) return 20;
            if (classes.contains('sig-sm')) return 14;
            return 18;
        }

        #getAvailableX(isFalling, exempt = null) {
            const lWidth = this.#config.laneWidth;
            const totalLanes = Math.floor(this.#dims.width / lWidth) || 1;
            const occupied = new Set();

            this.#particles.forEach(p => {
                if (p.active && p !== exempt && p.isFalling === isFalling) {
                    occupied.add(Math.floor(p.x / lWidth));
                }
            });

            const free = Array.from({ length: totalLanes }, (_, i) => i).filter(i => !occupied.has(i));
            const lane = free.length > 0 ? free[Math.floor(Math.random() * free.length)] : Math.floor(Math.random() * totalLanes);
            return (lane * lWidth) + (Math.random() * (lWidth * 0.4) + lWidth * 0.3);
        }

        #spawnParticles() {
            // On very low-power touch devices, reduce to every other signal
            const signalsToUse = this.#isTouchDevice
                ? this.#signals.filter((_, i) => i % 2 === 0)
                : this.#signals;

            signalsToUse.forEach((el, index) => {
                // Hide unused signals cleanly
                if (this.#isTouchDevice && !signalsToUse.includes(el)) {
                    el.style.opacity = '0';
                    return;
                }

                const zLayer = 0.4 + Math.random() * 0.6;
                const isFalling = Math.random() < this.#config.downFlowChance;
                const bRadius = this.#getSignalRadius(el);
                const speed = (isFalling ? this.#config.fallSpeed : this.#config.baseSpeed) * zLayer;
                const vy = isFalling ? speed : -speed;

                const p = {
                    el,
                    x: this.#getAvailableX(isFalling),
                    y: Math.random() * this.#dims.height,
                    vx: 0,
                    vy: vy,
                    baseVy: vy,
                    radius: bRadius * zLayer,
                    mass: bRadius * zLayer,
                    z: zLayer,
                    active: false,
                    isFalling
                };

                Object.assign(el.style, {
                    position: 'absolute',
                    left: '0', top: '0',
                    margin: '0',
                    opacity: '0',
                    transform: `translate3d(${p.x.toFixed(1)}px, ${p.y.toFixed(1)}px, 0) scale(${zLayer.toFixed(2)})`,
                    transition: 'opacity 3.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    willChange: 'transform'
                });

                this.#particles.push(p);

                const stagger = this.#isLowPower ? 220 : 280;
                setTimeout(() => {
                    p.active = true;
                    el.style.opacity = (p.z * 0.22).toFixed(2);
                }, 400 + (index * stagger));
            });
        }

        #animate(ts) {
            if (this.#isPaused) {
                requestAnimationFrame((t) => this.#animate(t));
                return;
            }

            // Frame-time governor: cap deltaTime to prevent position jumps after tab switch
            const rawDelta = ts - this.#lastFrameTs;
            const deltaTime = Math.min(rawDelta, 50) / 16.67; // normalized to 60fps=1.0
            this.#lastFrameTs = ts;

            this.#processKineticPass(deltaTime);

            // Repulsion throttle: run every 3rd frame on desktop, skip on touch
            if (!this.#isTouchDevice) {
                this.#repulsionFrame++;
                if (this.#repulsionFrame >= 3) {
                    this.#repulsionFrame = 0;
                    this.#resolveRepulsions();
                }
            }

            this.#updateDOM();

            requestAnimationFrame((t) => this.#animate(t));
        }

        #processKineticPass(deltaTime = 1) {
            const drag = this.#config.drag;
            const recovery = this.#config.recovery;

            this.#particles.forEach(p => {
                if (!p.active) return;

                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;

                p.vx *= drag;
                p.vy = p.vy * (1 - recovery) + p.baseVy * recovery;

                this.#handleBoundaries(p);
            });
        }

        #resolveRepulsions() {
            const pad = this.#config.collisionPadding;
            const rForce = this.#config.repulsionForce;

            for (let i = 0, len = this.#particles.length; i < len; i++) {
                const p1 = this.#particles[i];
                if (!p1.active) continue;

                for (let j = i + 1; j < len; j++) {
                    const p2 = this.#particles[j];
                    if (!p2.active) continue;

                    const dx = p2.x - p1.x;
                    const dy = p2.y - p1.y;
                    const minDist = p1.radius + p2.radius + pad;
                    const distSq = dx * dx + dy * dy;

                    if (distSq < minDist * minDist) {
                        const distance = Math.sqrt(distSq) || 0.1;
                        const angle = Math.atan2(dy, dx);
                        const push = (minDist - distance) * rForce;
                        const fx = Math.cos(angle) * push;
                        const fy = Math.sin(angle) * push;

                        p1.vx -= fx / p1.mass;
                        p1.vy -= fy / p1.mass;
                        p2.vx += fx / p2.mass;
                        p2.vy += fy / p2.mass;
                    }
                }
            }
        }

        #updateDOM() {
            this.#particles.forEach(p => {
                if (p.active) {
                    p.el.style.transform = `translate3d(${(p.x - p.radius).toFixed(1)}px, ${(p.y - p.radius).toFixed(1)}px, 0) scale(${p.z.toFixed(2)})`;
                }
            });
        }

        #handleBoundaries(p) {
            const buffer = this.#config.boundaryBuffer;
            const h = this.#dims.height;
            const w = this.#dims.width;

            if (p.isFalling) {
                if (p.y > h + buffer) {
                    p.y = -buffer;
                    p.x = this.#getAvailableX(true, p);
                }
            } else {
                if (p.y < -buffer) {
                    p.y = h + buffer;
                    p.x = this.#getAvailableX(false, p);
                }
            }

            if (p.x < -buffer) p.x = w + buffer;
            if (p.x > w + buffer) p.x = -buffer;
        }
    }

    window.addEventListener('load', () => {
        setTimeout(() => {
            try { new NebulaPhysics(); } catch (e) { }
        }, 150);
    });
})();
