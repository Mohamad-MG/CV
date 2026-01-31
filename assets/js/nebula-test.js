/**
 * Nebula Physics Engine (Clean Production)
 * Smooth, minimal, and stable floating icons for the home background.
 */
(() => {
    class NebulaPhysics {
        constructor() {
            this.container = document.querySelector('.social-nebula');
            if (!this.container) return;

            this.signals = Array.from(this.container.querySelectorAll('.signal'));
            if (!this.signals.length) return;

            this.particles = [];
            this.width = window.innerWidth;
            this.height = window.innerHeight;
            this.isPaused = document.hidden;
            this.isLowPower =
                window.matchMedia('(max-width: 768px)').matches ||
                (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
                (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

            // System Config (tuned for smoothness)
            this.config = {
                baseSpeed: this.isLowPower ? 0.22 : 0.3,
                fallSpeed: this.isLowPower ? 0.38 : 0.5,
                collisionPadding: this.isLowPower ? 8 : 12,
                drag: 0.96,
                recovery: 0.02,
                downFlowChance: 0.2,
                spawnInterval: 220,
                sideBias: 0.35
            };

            this.init();
            this.animate = this.animate.bind(this);
            requestAnimationFrame(this.animate);

            window.addEventListener('resize', () => this.handleResize());
            document.addEventListener('visibilitychange', () => {
                this.isPaused = document.hidden;
            });
        }

        getRadius(el) {
            if (el.classList.contains('sig-lg')) return 26;
            if (el.classList.contains('sig-md')) return 18;
            if (el.classList.contains('sig-sm')) return 12;
            return 16;
        }

        getBiasedX() {
            const { sideBias } = this.config;
            const rand = Math.random();
            if (rand < 0.45) {
                return Math.random() * (this.width * sideBias);
            }
            if (rand < 0.9) {
                const rightStart = this.width * (1 - sideBias);
                return rightStart + Math.random() * (this.width * sideBias);
            }
            const centerWidth = this.width * (1 - 2 * sideBias);
            const centerStart = this.width * sideBias;
            return centerStart + Math.random() * centerWidth;
        }

        init() {
            const placed = [];

            this.signals.forEach((el, index) => {
                Object.assign(el.style, {
                    position: 'absolute',
                    left: '0',
                    top: '0',
                    margin: '0',
                    willChange: 'transform',
                    opacity: '0',
                    transition: 'opacity 1.4s ease'
                });

                const radius = this.getRadius(el);
                let x = 0;
                let y = 0;
                let safe = false;
                let attempts = 0;

                while (attempts < 150) {
                    safe = true;
                    x = this.getBiasedX();
                    y = Math.random() * this.height;

                    for (const p of placed) {
                        const dx = x - p.x;
                        const dy = y - p.y;
                        const minDist = radius + p.radius + 18;
                        if ((dx * dx + dy * dy) < (minDist * minDist)) {
                            safe = false;
                            break;
                        }
                    }

                    if (safe) break;
                    attempts++;
                }

                const isFalling = Math.random() < this.config.downFlowChance;
                const speed = isFalling ? this.config.fallSpeed : this.config.baseSpeed;
                const baseVy = isFalling ? speed : -speed;

                this.particles.push({
                    el,
                    x,
                    y,
                    radius,
                    vx: 0,
                    vy: baseVy,
                    baseVy,
                    mass: radius,
                    active: false,
                    isFalling
                });

                placed.push({ x, y, radius });

                setTimeout(() => {
                    const p = this.particles[index];
                    if (!p) return;
                    p.active = true;
                    p.el.style.opacity = '0.6';
                }, index * this.config.spawnInterval);
            });
        }

        handleResize() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
        }

        animate() {
            if (this.isPaused || document.body.classList.contains('ai-open')) {
                requestAnimationFrame(this.animate);
                return;
            }

            this.particles.forEach(p => {
                if (!p.active) return;

                p.x += p.vx;
                p.y += p.vy;

                p.vx *= this.config.drag;
                p.vy = p.vy * (1 - this.config.recovery) + p.baseVy * this.config.recovery;

                this.handleWrap(p);
            });

            const passes = this.isLowPower ? 1 : 2;
            for (let k = 0; k < passes; k++) {
                for (let i = 0; i < this.particles.length; i++) {
                    for (let j = i + 1; j < this.particles.length; j++) {
                        this.resolveCollision(this.particles[i], this.particles[j]);
                    }
                }
            }

            this.particles.forEach(p => {
                p.el.style.transform = `translate3d(${p.x - p.radius}px, ${p.y - p.radius}px, 0)`;
            });

            requestAnimationFrame(this.animate);
        }

        handleWrap(p) {
            if (p.x < -p.radius) p.x = this.width + p.radius;
            if (p.x > this.width + p.radius) p.x = -p.radius;

            if (p.isFalling) {
                if (p.y > this.height + 50) {
                    p.y = -50;
                    p.x = this.getBiasedX();
                }
            } else if (p.y < -50) {
                p.y = this.height + 50;
                p.x = this.getBiasedX();
            }
        }

        resolveCollision(p1, p2) {
            if (!p1.active || !p2.active) return;

            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const distSq = dx * dx + dy * dy;
            const minDist = p1.radius + p2.radius + this.config.collisionPadding;

            if (distSq < minDist * minDist) {
                const dist = Math.sqrt(distSq) || 0.001;
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                const force = overlap * 0.5;
                p1.x -= nx * force;
                p1.y -= ny * force;
                p2.x += nx * force;
                p2.y += ny * force;

                const v1n = p1.vx * nx + p1.vy * ny;
                const v2n = p2.vx * nx + p2.vy * ny;
                if (v1n < v2n) return;

                const m1 = p1.mass;
                const m2 = p2.mass;
                const v1nFinal = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2);
                const v2nFinal = (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2);

                const dv1 = v1nFinal - v1n;
                const dv2 = v2nFinal - v2n;

                p1.vx += nx * dv1;
                p1.vy += ny * dv1;
                p2.vx += nx * dv2;
                p2.vy += ny * dv2;
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        new NebulaPhysics();
    });
})();
