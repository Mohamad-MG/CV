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
            this.lastFrameTs = 0;
            this.minFrameInterval = this.isLowPower ? (1000 / 30) : 0;
            this.scrollPauseUntil = 0;

            // System Config (The 2026 Universe Protocol)
            this.config = {
                baseSpeed: this.isLowPower ? 0.08 : 0.15, 
                fallSpeed: this.isLowPower ? 0.2 : 0.35, 
                collisionPadding: 3, 
                drag: 0.98,
                recovery: 0.015,
                downFlowChance: 0.3, 
                laneWidth: 90,
                // Adaptive Pass: 1 pass for mobile/low-power, 2 for desktop
                physicsPasses: this.isLowPower ? 0 : 2
            };

            this.init();
            this.animate = this.animate.bind(this);
            // Throttle: Skip frames if needed or use RAF
            requestAnimationFrame(this.animate);

            window.addEventListener('resize', () => this.handleResize());
            window.addEventListener('scroll', () => {
                if (this.isLowPower) {
                    this.scrollPauseUntil = performance.now() + 120;
                }
            }, { passive: true });
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

        getAvailableX(isFalling, particleToExempt = null) {
            const laneWidth = this.config.laneWidth;
            const totalLanes = Math.floor(this.width / laneWidth);
            const occupiedLanes = new Set();

            // Identify lanes occupied by icons moving in the SAME direction
            for (const p of this.particles) {
                if (!p.active || p === particleToExempt) continue;
                if (p.isFalling === isFalling) {
                    occupiedLanes.add(Math.floor(p.x / laneWidth));
                }
            }

            // Create a pool of free lanes for this specific direction
            const freeLanes = [];
            for (let i = 0; i < totalLanes; i++) {
                if (!occupiedLanes.has(i)) freeLanes.push(i);
            }

            // If a free lane exists, pick one randomly
            if (freeLanes.length > 0) {
                const lane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
                // Randomize position within the chosen lane for a natural look
                return (lane * laneWidth) + (Math.random() * (laneWidth * 0.6) + laneWidth * 0.2);
            }

            // Fallback: strictly avoid the nearest neighbors if all lanes are full
            return Math.random() * this.width;
        }

        init() {
            const shuffledSignals = [...this.signals].sort(() => Math.random() - 0.5);
            const animatedCount = this.isLowPower
                ? Math.max(8, Math.floor(shuffledSignals.length * 0.6))
                : shuffledSignals.length;

            shuffledSignals.forEach((el, index) => {
                const isFalling = Math.random() < this.config.downFlowChance;
                const radius = this.getRadius(el);
                const isAnimated = index < animatedCount;
                
                Object.assign(el.style, {
                    position: 'absolute',
                    left: '0',
                    top: '0',
                    margin: '0',
                    opacity: '0',
                    transition: 'opacity 5s ease' 
                });

                const x = this.getAvailableX(isFalling);
                const y = Math.random() * this.height;

                const speedMult = isFalling ? 1 : 1.2; 
                const speed = (isFalling ? this.config.fallSpeed : this.config.baseSpeed) * speedMult;
                const baseVy = isFalling ? speed : -speed;

                const particle = {
                    el, x, y, radius, vx: 0, vy: baseVy, baseVy, mass: radius, active: false, isFalling, isAnimated
                };

                this.particles.push(particle);

                const activationDelay = 500 + (index * 1400); 
                
                setTimeout(() => {
                    particle.active = particle.isAnimated;
                    requestAnimationFrame(() => {
                        if (particle.isAnimated) {
                            particle.el.style.willChange = 'transform';
                        } else {
                            particle.el.style.willChange = 'auto';
                        }
                        particle.el.style.opacity = particle.isAnimated ? '0.2' : '0.08';
                        particle.el.style.transform = `translate3d(${particle.x - particle.radius}px, ${particle.y - particle.radius}px, 0)`;
                    });
                }, activationDelay);
            });
        }

        handleResize() {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
        }

        animate(ts) {
            const now = typeof ts === 'number' ? ts : performance.now();
            if (this.isPaused || document.body.classList.contains('ai-open')) {
                requestAnimationFrame(this.animate);
                return;
            }

            if (this.isLowPower && now < this.scrollPauseUntil) {
                requestAnimationFrame(this.animate);
                return;
            }

            if (this.minFrameInterval && (now - this.lastFrameTs) < this.minFrameInterval) {
                requestAnimationFrame(this.animate);
                return;
            }
            this.lastFrameTs = now;

            this.particles.forEach(p => {
                if (!p.active) return;

                p.x += p.vx;
                p.y += p.vy;

                p.vx *= this.config.drag;
                p.vy = p.vy * (1 - this.config.recovery) + p.baseVy * this.config.recovery;

                this.handleWrap(p);
            });

            // Adaptive Physics Throttling
            if (this.config.physicsPasses > 0) {
                for (let k = 0; k < this.config.physicsPasses; k++) {
                    for (let i = 0; i < this.particles.length; i++) {
                        for (let j = i + 1; j < this.particles.length; j++) {
                            this.resolveCollision(this.particles[i], this.particles[j]);
                        }
                    }
                }
            }

            this.particles.forEach(p => {
                p.el.style.transform = `translate3d(${p.x - p.radius}px, ${p.y - p.radius}px, 0)`;
            });

            requestAnimationFrame(this.animate);
        }

        handleWrap(p) {
            const buffer = p.radius + 50;

            if (p.isFalling) {
                if (p.y > this.height + buffer) {
                    p.y = -buffer;
                    p.x = this.getAvailableX(p.isFalling, p);
                }
            } else if (p.y < -buffer) {
                p.y = this.height + buffer;
                p.x = this.getAvailableX(p.isFalling, p);
            }

            if (p.x < -p.radius) p.x = this.width + p.radius;
            if (p.x > this.width + p.radius) p.x = -p.radius;
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
