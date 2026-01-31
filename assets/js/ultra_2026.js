/**
 * ULTRA 2026 - SYSTEM CORE
 * Combined Logic for: Motion, Data Decrypt, Metrics, Marquee, and Interaction.
 */

// Nebula background handled by assets/js/nebula-test.js

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

// --- 4. SPATIAL DEPTH ENGINE (3D & Reflections) ---
const initSpatialDepth = () => {
    const glassPanels = document.querySelectorAll('.identity-card, .stat-card, .exp-card, .industry-card, .future-card');
    const bgVoid = document.querySelector('.bg-void-layer');
    const bgAmbient = document.querySelector('.bg-ambient-glow');

    window.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const xPct = (clientX / window.innerWidth - 0.5) * 2; // -1 to 1
        const yPct = (clientY / window.innerHeight - 0.5) * 2; // -1 to 1

        // A) Deep Parallax (Layers 4)
        if (bgVoid) {
            bgVoid.style.transform = `translate3d(${xPct * -15}px, ${yPct * -15}px, -100px) scale(1.1)`;
        }
        if (bgAmbient) {
            bgAmbient.style.transform = `translate3d(${xPct * 30}px, ${yPct * 30}px, -50px)`;
        }

        // B) Dynamic Glass Reflections (Layer 2)
        glassPanels.forEach(panel => {
            const rect = panel.getBoundingClientRect();
            const px = clientX - rect.left;
            const py = clientY - rect.top;
            
            // Check if mouse is near the panel for reflection effect
            const dist = Math.sqrt((px - rect.width/2)**2 + (py - rect.height/2)**2);
            if (dist < 600) {
                panel.style.setProperty('--reflect-x', `${(px / rect.width) * 100}%`);
                panel.style.setProperty('--reflect-y', `${(py / rect.height) * 100}%`);
            }
        });
    });
};

// --- 4b. LIVE HUD DATA SYSTEM ---
const initLiveHUD = () => {
    const ksaEl = document.querySelector('.d1');
    const egyEl = document.querySelector('.d2');
    const futureEl = document.querySelector('.d3');

    const updateHUD = () => {
        // Network Latency Simulation (Actual network API if available)
        const latency = Math.floor(Math.random() * 20 + 15); // 15-35ms
        if (ksaEl) ksaEl.innerHTML = `KSA <span style="opacity:0.5; font-size:0.5rem;">${latency}MS</span>`;
        
        // Growth Index Simulation
        const growthIndex = (Math.random() * 0.5 + 9.5).toFixed(2); // 9.5 to 10.0
        if (egyEl) egyEl.innerHTML = `EGY <span style="opacity:0.5; font-size:0.5rem;">IX_${growthIndex}</span>`;
        
        // System Uptime / Status
        if (futureEl) futureEl.innerHTML = `2026 <span style="opacity:0.5; font-size:0.5rem;">VER_2.8</span>`;
    };

    setInterval(updateHUD, 3000);
    updateHUD();
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
    const video = document.getElementById('showreelVideo');
    if (!video) return;

    const videoContainer = video.closest('.ipad-mockup');
    const togglePlayback = () => {
        if (video.paused) video.play();
        else video.pause();
    };

    if (videoContainer) {
        videoContainer.addEventListener('click', togglePlayback);
    } else {
        video.addEventListener('click', togglePlayback);
    }
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

// --- 8. STORY INTERACTIVES (Counter + Decrypt) ---
const initStoryInteractives = () => {
    // A) $478M Counter Logic
    const counterElements = document.querySelectorAll('.counter-val');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = parseInt(entry.target.dataset.target);
                animateCounter(entry.target, target);
                counterObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const animateCounter = (el, target) => {
        let current = 0;
        const duration = 1500;
        const startTime = performance.now();

        const update = (now) => {
            const progress = Math.min((now - startTime) / duration, 1);
            current = Math.floor(progress * target);
            el.innerText = `$${current}`;
            if (progress < 1) requestAnimationFrame(update);
            else el.innerText = `$${target}`;
        };
        requestAnimationFrame(update);
    };

    counterElements.forEach(el => counterObserver.observe(el));

    // B) Calm Text Reveal (Blur Fade)
    const storyElements = document.querySelectorAll('.story-text p, .text-divider');
    const storyObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Staggered delay based on visual order
                const delay = Array.from(storyElements).indexOf(entry.target) * 100;
                setTimeout(() => {
                    entry.target.classList.add('visible');
                }, delay);
                storyObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    storyElements.forEach(el => storyObserver.observe(el));
};

// --- MASTER BOOT ---
document.addEventListener('DOMContentLoaded', () => {
    const isLowPowerDevice =
        window.matchMedia("(max-width: 768px)").matches ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
    if (isLowPowerDevice) {
        document.body.classList.add('perf-lite');
    }

    // Core Motion
    new DataDecrypt();
    new IgnitionMetrics();

    // Marquees
    const marqueeInstances = [];
    document.querySelectorAll('.marquee-container').forEach(m => marqueeInstances.push(new DraggableMarquee(m)));
    const applyPauseState = () => {
        const isPaused = document.body.classList.contains('ai-open') || document.hidden;
        marqueeInstances.forEach(instance => instance && instance.setPaused(isPaused));
    };
    applyPauseState();
    const bodyObserver = new MutationObserver(applyPauseState);
    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    window.addEventListener('jimmy:toggle', applyPauseState);
    document.addEventListener('visibilitychange', applyPauseState);

    // Interaction
    initSpatialDepth();
    initLiveHUD();
    initScrollReveal();
    initVideo();
    initCarousel();
    initStoryInteractives();
});
