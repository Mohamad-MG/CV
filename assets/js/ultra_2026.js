/**
 * ULTRA 2026 - SYSTEM CORE
 * Combined Logic for: Motion, Data Decrypt, Metrics, Marquee, and Interaction.
 */

// --- 0. NEBULA PHYSICS (Kinetic Repulsion) ---
class NebulaPhysics {
    constructor() {
        this.container = document.querySelector('.social-nebula');
        if (!this.container) return;

        this.signals = Array.from(document.querySelectorAll('.social-nebula .signal'));
        if (!this.signals.length) return;

        this.particles = [];
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.initParticles();
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);

        window.addEventListener('resize', () => {
            this.width = window.innerWidth;
            this.height = window.innerHeight;
        });
    }

    initParticles() {
        this.signals.forEach((el, index) => {
            // Disable CSS animation override
            el.style.animation = 'none';
            el.style.opacity = '0.7';
            el.style.left = '0'; // Reset CSS positioning
            el.style.top = '0';

            // Random start pos
            const radius = 30; // Approx radius for collision
            const x = Math.random() * (this.width - radius * 2) + radius;
            const y = Math.random() * (this.height - radius * 2) + radius;

            // Random velocity (slow float)
            const vx = (Math.random() - 0.5) * 0.8;
            const vy = (Math.random() - 0.5) * 0.8;

            this.particles.push({
                el, x, y, vx, vy, radius, mass: 1
            });
        });
    }

    animate() {
        this.particles.forEach(p => {
            // Update Position
            p.x += p.vx;
            p.y += p.vy;

            // Wall Collision (Bounce)
            if (p.x - p.radius < 0) { p.x = p.radius; p.vx *= -1; }
            if (p.x + p.radius > this.width) { p.x = this.width - p.radius; p.vx *= -1; }
            if (p.y - p.radius < 0) { p.y = p.radius; p.vy *= -1; }
            if (p.y + p.radius > this.height) { p.y = this.height - p.radius; p.vy *= -1; }

            // Apply Transform
            p.el.style.transform = `translate(${p.x}px, ${p.y}px)`;
        });

        // Particle-Particle Collision (Kinetic Repulsion)
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                this.resolveCollision(this.particles[i], this.particles[j]);
            }
        }

        requestAnimationFrame(this.animate);
    }

    resolveCollision(p1, p2) {
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = p1.radius + p2.radius + 20; // +20 padding for "electrical field" feel

        if (distance < minDist) {
            // Elastic Collision Logic
            const angle = Math.atan2(dy, dx);
            const sin = Math.sin(angle);
            const cos = Math.cos(angle);

            // Rotate velocity
            const v1 = { x: p1.vx * cos + p1.vy * sin, y: p1.vy * cos - p1.vx * sin };
            const v2 = { x: p2.vx * cos + p2.vy * sin, y: p2.vy * cos - p2.vx * sin };

            // Momentum exchange (assuming equal mass)
            const v1Final = { x: v2.x, y: v1.y };
            const v2Final = { x: v1.x, y: v2.y };

            // Rotate back
            const v1Real = { x: v1Final.x * cos - v1Final.y * sin, y: v1Final.y * cos + v1Final.x * sin };
            const v2Real = { x: v2Final.x * cos - v2Final.y * sin, y: v2Final.y * cos + v2Final.x * sin };

            p1.vx = v1Real.x;
            p1.vy = v1Real.y;
            p2.vx = v2Real.x;
            p2.vy = v2Real.y;

            // Separate particles to prevent sticking
            const overlap = minDist - distance;
            const separateX = (overlap / 2) * Math.cos(angle);
            const separateY = (overlap / 2) * Math.sin(angle);

            p1.x -= separateX; p1.y -= separateY;
            p2.x += separateX; p2.y += separateY;
        }
    }
}

// --- 1. DATA DECRYPT (Matrix Style Reveal) ---
class DataDecrypt {
    constructor() {
        this.scrambleChars = '/>_-\|[]{}*&^%$#@!~';
        this.tagline = document.querySelector('.tagline');
        this.eyebrow = document.querySelector('.hero-eyebrow');

        if (this.eyebrow) this.initElement(this.eyebrow, 200, 30);
        if (this.tagline) this.initElement(this.tagline, 600, 15);
    }

    initElement(el, startDelay, speed) {
        if (!el) return;
        const originalText = el.innerText;
        el.innerText = '';
        el.style.opacity = '1';
        el.style.visibility = 'visible';

        // Break text into spans
        const charSpans = originalText.split('').map(char => {
            const span = document.createElement('span');
            span.style.display = 'inline-block';
            span.style.minWidth = char === ' ' ? '0.25em' : 'auto';
            span.innerText = char;
            span.style.opacity = '0';
            span.dataset.char = char;
            el.appendChild(span);
            return span;
        });

        // Start animation loop
        setTimeout(() => {
            charSpans.forEach((span, index) => {
                const charDelay = index * speed;
                setTimeout(() => this.animateChar(span), charDelay);
            });
        }, startDelay);
    }

    animateChar(span) {
        const targetChar = span.dataset.char;
        let frame = 0;
        const maxFrames = 12;

        span.style.opacity = '1';
        span.style.color = '#3B82F6';
        span.style.fontFamily = 'monospace';

        const scrambleInterval = setInterval(() => {
            frame++;
            if (frame < maxFrames) {
                span.innerText = this.scrambleChars[Math.floor(Math.random() * this.scrambleChars.length)];
            } else {
                clearInterval(scrambleInterval);
                span.innerText = targetChar;
                span.style.color = '';
                span.style.fontFamily = '';
                span.style.webkitTextFillColor = '';
            }
        }, 40);
    }
}

// --- 2. ENGINE IGNITION (Impact Metrics) ---
class IgnitionMetrics {
    constructor() {
        this.metrics = document.querySelectorAll('.metric-block');
        if (this.metrics.length > 0) {
            this.init(2500); // Wait for decrypt to finish
        }
    }

    init(startDelay) {
        this.metrics.forEach((el, index) => {
            // Initial State
            el.style.opacity = '0';
            el.style.transform = 'scale(2)';
            el.style.filter = 'blur(10px)';
            el.style.transition = 'none'; // Prevent transition on setup

            setTimeout(() => {
                this.ignite(el);
            }, startDelay + (index * 200));
        });
    }

    ignite(el) {
        // Slam Down
        el.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
        el.style.filter = 'blur(0px) brightness(2)'; // Flash

        // Cool Down
        setTimeout(() => {
            el.style.transition = 'filter 0.6s ease-out';
            el.style.filter = 'blur(0px) brightness(1)';
        }, 400);
    }
}

// --- 3. DRAGGABLE MARQUEE (Physics Based) ---
class DraggableMarquee {
    constructor(element) {
        this.container = element;
        this.track = element.querySelector('.marquee-track');
        if (!this.track) return;

        this.baseSpeed = parseFloat(element.dataset.speed) || -0.5;
        this.speed = this.baseSpeed;
        this.pos = 0;
        this.isDragging = false;
        this.startX = 0;
        this.lastX = 0;
        this.velocity = 0;
        this.paused = false;
        this.offScreen = false;
        this.rafId = null;

        this.ensureContentWidth();
        this.initEvents();
        this.initObserver();
        this.animate = this.animate.bind(this);
        this.animate();
    }

    ensureContentWidth() {
        const trackWidth = this.track.scrollWidth;
        const containerWidth = this.container.offsetWidth;
        // Duplicate content until it fills screen + buffer
        if (trackWidth < containerWidth * 3) {
            this.track.innerHTML += this.track.innerHTML;
            this.track.innerHTML += this.track.innerHTML;
        }
    }

    initEvents() {
        this.container.addEventListener('mousedown', (e) => this.startDrag(e.clientX));
        window.addEventListener('mousemove', (e) => this.onDrag(e.clientX));
        window.addEventListener('mouseup', () => this.endDrag());
        this.container.addEventListener('touchstart', (e) => this.startDrag(e.touches[0].clientX));
        window.addEventListener('touchmove', (e) => this.onDrag(e.touches[0].clientX));
        window.addEventListener('touchend', () => this.endDrag());
        this.track.style.animation = 'none'; // Disable CSS animation
    }

    initObserver() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                this.offScreen = !entry.isIntersecting;
                if (!this.offScreen && !this.paused) {
                    if (!this.rafId) this.animate();
                } else {
                    if (this.rafId) {
                        cancelAnimationFrame(this.rafId);
                        this.rafId = null;
                    }
                }
            });
        }, { threshold: 0.05 });
        observer.observe(this.container);
    }

    startDrag(x) {
        this.isDragging = true;
        this.startX = x;
        this.lastX = x;
        this.container.style.cursor = 'grabbing';
        this.velocity = 0;
    }

    onDrag(x) {
        if (!this.isDragging) return;
        const delta = x - this.lastX;
        this.lastX = x;
        this.pos += delta;
        this.velocity = delta;
    }

    endDrag() {
        this.isDragging = false;
        this.container.style.cursor = 'grab';
    }

    setPaused(paused) {
        if (this.paused === paused) return;
        this.paused = paused;
        if (this.paused || this.offScreen) {
            if (this.rafId) {
                cancelAnimationFrame(this.rafId);
                this.rafId = null;
            }
            return;
        }
        this.animate();
    }

    animate() {
        if (this.paused || this.offScreen) {
            this.rafId = null;
            return;
        }
        if (!this.isDragging) {
            // Return to base speed
            this.velocity *= 0.95;
            if (Math.abs(this.velocity) < Math.abs(this.baseSpeed)) {
                this.velocity = this.velocity * 0.95 + this.baseSpeed * 0.05;
            }
            this.pos += this.velocity;
        }

        // Infinite Loop Logic
        const trackWidth = this.track.scrollWidth / 3; // Assuming tripled content
        if (this.pos <= -trackWidth) this.pos += trackWidth;
        else if (this.pos > 0) this.pos -= trackWidth;

        this.track.style.transform = `translate3d(${this.pos}px, 0, 0)`;
        this.rafId = requestAnimationFrame(this.animate);
    }
}

// --- 4. 3D TILT & SPOTLIGHT EFFECT ---
const initInteractions = () => {
    // Spotlight for Stat Cards
    const statCards = document.querySelectorAll('.stat-card');
    statCards.forEach(card => {
        let rafId = null;
        card.addEventListener('mousemove', (e) => {
            if (rafId) return;
            rafId = requestAnimationFrame(() => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
                rafId = null;
            });
        });
    });
};

// --- 5. SCROLL REVEAL (Staggered) ---
const initScrollReveal = () => {
    const elements = document.querySelectorAll('.reveal, .stagger-item');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Auto-play pulse paths when in view
                const path = entry.target.querySelector('.pulse-path');
                if (path) path.style.animationPlayState = 'running';
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
};

// --- 6. VIDEO PLAYER ---
const initVideo = () => {
    const videoScreen = document.querySelector('.ipad-screen');
    const video = document.getElementById('showreelVideo');
    if (!videoScreen || !video) return;

    videoScreen.addEventListener('click', () => {
        if (video.paused) video.play();
        else video.pause();
    });
};

// --- 7. CAROUSEL INTERACTION (Universal) ---
const initCarousel = () => {
    const setupCarousel = (containerId, prevClass, nextClass, indicatorId = null) => {
        const container = document.getElementById(containerId);
        const prevBtn = document.querySelector(`.${prevClass}`);
        const nextBtn = document.querySelector(`.${nextClass}`);
        const indicator = indicatorId ? document.getElementById(indicatorId) : null;

        if (!container) return;

        const scrollAmount = 340;

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                container.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
            });
        }

        // Optional Scrubber Sync
        if (indicator) {
            container.addEventListener('scroll', () => {
                requestAnimationFrame(() => {
                    const scrollL = container.scrollLeft;
                    const maxScroll = container.scrollWidth - container.clientWidth;
                    const progress = maxScroll > 0 ? scrollL / maxScroll : 0;
                    const trackWidth = indicator.parentElement.offsetWidth;
                    const indicatorPos = progress * (trackWidth - 8);
                    indicator.style.transform = `translate3d(${indicatorPos}px, 0, 0)`;
                });
            }, { passive: true });

            // Clickable Years Logic
            const years = indicator.parentElement.querySelectorAll('.scrub-year');
            years.forEach(year => {
                year.addEventListener('click', () => {
                    const targetYear = year.getAttribute('data-target');
                    const targetCard = container.querySelector(`.exp-card[data-year="${targetYear}"]`);
                    if (targetCard) {
                        const scrollPos = targetCard.offsetLeft - (container.clientWidth / 2) + (targetCard.clientWidth / 2);
                        container.scrollTo({ left: scrollPos, behavior: 'smooth' });
                    }
                });
            });
        }
    };

    // Initialize Experience Carousel
    setupCarousel('expCarousel', 'prev-btn', 'next-btn', 'scrubIndicator');

    // Initialize Education Carousel
    setupCarousel('eduCarousel', 'edu-prev', 'edu-next');
};

// --- 8. TERMINAL EDUCATION LOGIC (Ultra Modern) ---
const initTerminal = () => {
    const trigger = document.getElementById('eduTrigger');
    const windowEl = document.getElementById('eduWindow');
    const logs = document.querySelectorAll('.log-entry');

    if (!trigger || !windowEl) return;

    trigger.addEventListener('click', () => {
        windowEl.classList.toggle('open');
        const isOpen = windowEl.classList.contains('open');

        // Update Status Text
        trigger.querySelector('.status').innerText = isOpen ? 'Close' : 'View';

        if (isOpen) {
            logs.forEach((log, index) => {
                log.style.transitionDelay = `${index * 80}ms`;
            });
        } else {
            logs.forEach(log => log.style.transitionDelay = '0ms');
        }
    });
};

// --- 9. MOBILE NAV TOGGLE ---
const initMobileNav = () => {
    const header = document.querySelector('.header-container');
    const toggle = document.querySelector('.mobile-menu-toggle');
    const nav = document.getElementById('primaryNav');
    if (!header || !toggle) return;

    const isMobile = () => window.innerWidth <= 600;

    const setNavFocusability = (enabled) => {
        if (!nav) return;
        nav.setAttribute('aria-hidden', enabled ? 'false' : 'true');
        nav.querySelectorAll('a, button').forEach((el) => {
            if (enabled) el.removeAttribute('tabindex');
            else el.setAttribute('tabindex', '-1');
        });
    };

    const closeMenu = (restoreFocus = false) => {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', 'Open menu');
        document.body.classList.remove('nav-open');
        setNavFocusability(false);
        if (restoreFocus) toggle.focus();
    };

    toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        if (!isMobile()) return;
        const isOpen = header.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        toggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
        document.body.classList.toggle('nav-open', isOpen);
        setNavFocusability(isOpen);
    });

    document.addEventListener('click', (e) => {
        if (!isMobile()) return;
        if (!header.contains(e.target)) closeMenu(false);
    });

    document.addEventListener('keydown', (e) => {
        if (!isMobile()) return;
        if (e.key === 'Escape' && header.classList.contains('nav-open')) {
            closeMenu(true);
        }
    });

    window.addEventListener('resize', () => {
        if (!isMobile()) {
            closeMenu();
            setNavFocusability(true);
        } else {
            setNavFocusability(false);
        }
    });

    // Initialize default state based on viewport
    if (isMobile()) {
        closeMenu();
    } else {
        setNavFocusability(true);
    }
};

// --- MASTER BOOT ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("System 3.2: Online");

    // Core Motion
    new DataDecrypt();
    new IgnitionMetrics();

    // Marquees
    const marqueeInstances = [];
    document.querySelectorAll('.marquee-container').forEach(m => marqueeInstances.push(new DraggableMarquee(m)));
    const applyPauseState = () => {
        const isPaused = document.body.classList.contains('ai-open');
        marqueeInstances.forEach(instance => instance && instance.setPaused(isPaused));
    };
    applyPauseState();
    const bodyObserver = new MutationObserver(applyPauseState);
    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('jimmy:toggle', applyPauseState);

    // Interaction
    initInteractions();
    initScrollReveal();
    initVideo();
    initCarousel();
    initTerminal();
    initMobileNav();
});
