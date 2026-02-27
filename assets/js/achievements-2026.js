/**
 * ULTRA 2026 - ARCHIVE SYSTEM CORE v3.2
 * Pure Kinetic Motion & Scroll Intelligence.
 * NOW OPTIMIZED FOR 60FPS & GPU LAYERING.
 */

class AchievementsEngine {
    constructor() {
        this.initScrollReveal();
        this.initMetricCounters();
        this.initMouseInteractions();
        this.initVideo();
    }

    // --- 1. SCROLL REVEAL (Standardized Intersection Observer) ---
    initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Stop observing once revealed for performance
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });

        document.querySelectorAll('.reveal, .reveal-stagger, .ledger-card, .path-item').forEach(el => observer.observe(el));
    }

    // --- 2. METRIC COUNTERS (Data-Attribute Driven) ---
    initMetricCounters() {
        const animateValue = (el, start, end, duration) => {
            let startTimestamp = null;
            const suffix = el.dataset.suffix || '';
            const prefix = el.dataset.prefix || '';

            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);

                // Ease Out Expo: 1 - pow(2, -10 * x)
                const ease = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

                const value = Math.floor(ease * (end - start) + start);

                el.textContent = `${prefix}${value}${suffix}`;

                if (progress < 1) {
                    window.requestAnimationFrame(step);
                } else {
                    // Final ensure matches exact target
                    el.textContent = `${prefix}${end}${suffix}`;
                }
            };
            window.requestAnimationFrame(step);
        };

        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.animated) {
                    const target = entry.target;
                    const endVal = parseInt(target.dataset.target || 0);
                    if (endVal > 0) {
                        animateValue(target, 0, endVal, 2000);
                        target.dataset.animated = "true";
                    }

                    // Trigger graph bars if sibling exists
                    const card = target.closest('.metric-card');
                    if (card) {
                        card.querySelectorAll('.graph-bar').forEach((bar, idx) => {
                            setTimeout(() => bar.classList.add('animate'), idx * 100);
                        });
                    }
                }
            });
        }, { threshold: 0.5 });

        document.querySelectorAll('.metric-val, .h-val').forEach(el => obs.observe(el));
    }

    // --- 3. MOUSE MICRO-INTERACTIONS (Throttled & CSS Vars) ---
    initMouseInteractions() {
        const cards = document.querySelectorAll('.metric-card');
        const heroStage = document.querySelector('.achievements-hero-2026');

        if (!heroStage && cards.length === 0) return;

        let mouseX = 0;
        let mouseY = 0;
        let isTicking = false;

        window.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            if (!isTicking) {
                window.requestAnimationFrame(() => {
                    this.updateTilt(mouseX, mouseY, cards);
                    isTicking = false;
                });
                isTicking = true;
            }
        });
    }

    updateTilt(x, y, cards) {
        // Global Hero Parallax (Subtle)
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        // Update Grid Parallax via CSS Var on Body or Root if needed, 
        // For now, let's keep it scoped to cards for 'Premium Feel'

        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardX = rect.left + rect.width / 2;
            const cardY = rect.top + rect.height / 2;

            // Mouse relative to card center
            const deltaX = x - cardX;
            const deltaY = y - cardY;

            // Normalize (-1 to 1) roughly
            const percentX = deltaX / (window.innerWidth / 2);
            const percentY = deltaY / (window.innerHeight / 2);

            // Apply slight rotation via CSS transform (handled here or in CSS)
            // Ideally we just pass the vars to CSS
            card.style.transform = `perspective(1000px) rotateY(${percentX * 5}deg) rotateX(${-percentY * 5}deg) translateY(0)`;
        });
    }

    // --- 4. VIDEO PLAYER (Footer) ---
    initVideo() {
        const video = document.getElementById('showreelVideo');
        if (!video) return;

        // Force Autoplay Logic
        video.autoplay = true;
        video.setAttribute('autoplay', '');
        video.preload = 'auto';
        video.muted = true;
        video.loop = true;
        video.playsInline = true;

        const playPromise = video.play();
        if (playPromise !== undefined) {
            playPromise.catch(() => {
                // Autoplay blocked, wait for interaction
                document.body.addEventListener('click', () => video.play(), { once: true });
            });
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AchievementsEngine();
});
