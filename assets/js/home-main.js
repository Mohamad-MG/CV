/**
 * ULTRA 2026 - SYSTEM CORE
 * Combined Logic for: Motion, Data Decrypt, Metrics, Marquee, and Interaction.
 */

// Nebula background handled by assets/js/nebula-background.js

// --- 1. KINETIC TEXT (Word Reveal Engine) ---
class KineticText {
    constructor() {
        this.elements = document.querySelectorAll('.kinetic-text');
        this.init();
    }

    init() {
        this.elements.forEach(el => {
            const text = el.innerText.trim();
            if (!text) return;
            
            el.innerHTML = '';
            el.style.opacity = '1';
            el.style.visibility = 'visible';

            const words = text.split(/\s+/);
            words.forEach((word, wordIdx) => {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'word';
                wordSpan.style.display = 'inline-block';
                wordSpan.style.whiteSpace = 'nowrap';
                
                // Grouping characters into words for a cleaner "reveal"
                word.split('').forEach((char, charIdx) => {
                    const charSpan = document.createElement('span');
                    charSpan.className = 'char';
                    charSpan.innerText = char;
                    // Calmer delay: 0.02s per char instead of 0.04s, and 0.05s per word
                    const delay = (wordIdx * 0.05) + (charIdx * 0.02);
                    charSpan.style.transitionDelay = `${delay}s`;
                    wordSpan.appendChild(charSpan);
                });

                el.appendChild(wordSpan);
                if (wordIdx < words.length - 1) {
                    const space = document.createTextNode(' ');
                    el.appendChild(space);
                }
            });
        });
    }
}

// --- 1b. DATA DECRYPT (Matrix Style Reveal) ---
class DataDecrypt {
    constructor() {
        this.scrambleChars = '/>_-\|[]{}*&^%$#@!~';
        this.eyebrow = document.querySelector('.hero-eyebrow');

        if (this.eyebrow) this.initElement(this.eyebrow, 200, 30);
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

// --- 1b. OPTICAL SWEEP (2026 Kinetic Sync) ---
class FluidSweep {
    constructor() {
        this.mission = document.querySelector('.hero-mission');
        if (this.mission) {
            this.init(200); 
        }
    }

    init(delay) {
        setTimeout(() => {
            this.mission.classList.add('visible');
            // Fail-safe: ensure characters are visible if mission is visible
            const chars = this.mission.querySelectorAll('.char');
            chars.forEach((char, i) => {
                setTimeout(() => {
                    char.style.opacity = '1';
                    char.style.transform = 'translateY(0) rotateX(0deg)';
                    char.style.textShadow = '0 0 transparent';
                }, i * 30 + 500); // Staggered fail-safe
            });
        }, delay);
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

// --- 3. DYNAMIC MARQUEE ENGINE (2026 Seamless Edition) ---
const initMarqueeSystem = () => {
    const tracks = document.querySelectorAll('.skills-track, .marquee-track');

    const parseDurationToSeconds = (durationValue) => {
        if (!durationValue) return 0;
        const firstValue = durationValue.split(',')[0].trim();
        if (firstValue.endsWith('ms')) {
            return parseFloat(firstValue) / 1000;
        }
        if (firstValue.endsWith('s')) {
            return parseFloat(firstValue);
        }
        return parseFloat(firstValue) || 0;
    };

    const isAlreadyDuplicated = (track) => {
        const children = Array.from(track.children);
        if (children.length < 2 || children.length % 2 !== 0) {
            return false;
        }

        const half = children.length / 2;
        for (let i = 0; i < half; i += 1) {
            if (children[i].outerHTML !== children[i + half].outerHTML) {
                return false;
            }
        }

        return true;
    };

    tracks.forEach(track => {
        if (track.getAttribute('data-duplicated')) return;

        // 1. Duplicate only when markup is not already manually mirrored
        if (!isAlreadyDuplicated(track)) {
            track.innerHTML += track.innerHTML;
        }

        track.setAttribute('data-duplicated', 'true');

        // 2. Calculate speed using CSS baseline to keep section ratios stable
        const container = track.closest('.marquee-container, .skills-marquee');
        const computedDuration = parseDurationToSeconds(window.getComputedStyle(track).animationDuration);
        const baseDuration = computedDuration || 40;
        const speedAttr = container ? parseFloat(container.dataset.speed) : 1;

        // 3. Add subtle randomization (±10%) to make multiple rows look organic
        const randomFactor = 0.9 + Math.random() * 0.2;
        const speed = (Math.abs(speedAttr) || 1) * randomFactor;

        // 4. Apply final duration and direction
        const finalDuration = baseDuration / speed;
        track.style.animationDuration = `${finalDuration}s`;
        track.style.display = 'flex';
        track.style.willChange = 'transform';

        if (speedAttr < 0) {
            track.style.animationDirection = 'reverse';
        }
    });
};

// --- 4. SPATIAL DEPTH ENGINE (3D & Reflections) ---
const initSpatialDepth = () => {
    const glassPanels = document.querySelectorAll('.identity-card, .stat-card, .exp-card, .industry-card, .future-card');
    const identityCard = document.querySelector('.identity-card');
    const bgVoid = document.querySelector('.bg-void-layer');
    const bgAmbient = document.querySelector('.bg-ambient-glow');

    window.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const xPct = (clientX / window.innerWidth - 0.5) * 2; // -1 to 1
        const yPct = (clientY / window.innerHeight - 0.5) * 2; // -1 to 1

        // A) Deep Parallax
        if (bgVoid) {
            bgVoid.style.transform = `translate3d(${xPct * -15}px, ${yPct * -15}px, -100px) scale(1.1)`;
        }
        if (bgAmbient) {
            bgAmbient.style.transform = `translate3d(${xPct * 30}px, ${yPct * 30}px, -50px)`;
        }

        // B) Dynamic Glass Reflections
        glassPanels.forEach(panel => {
            const rect = panel.getBoundingClientRect();
            const px = clientX - rect.left;
            const py = clientY - rect.top;

            const dist = Math.sqrt((px - rect.width / 2) ** 2 + (py - rect.height / 2) ** 2);
            if (dist < 600) {
                panel.style.setProperty('--reflect-x', `${(px / rect.width) * 100}%`);
                panel.style.setProperty('--reflect-y', `${(py / rect.height) * 100}%`);
            }
        });
    });

    // C) Scroll-Linked Tilt for Identity (Removed for 2026 Stability)
    /*
    window.addEventListener('scroll', () => {
        if (identityCard) {
            const scrollPct = window.scrollY / window.innerHeight;
            const rotation = scrollPct * 20; // Max 20deg tilt
            identityCard.style.transform = `rotateY(${-10 - rotation}deg) rotateX(${5 + rotation/2}deg)`;
        }
    }, { passive: true });
    */
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

// --- 4c. SMART PULSE ENGINE (Organic Async Rhythm) ---
class SmartPulseEngine {
    constructor() {
        this.paths = document.querySelectorAll('.pulse-path');
        if (this.paths.length > 0) this.init();
    }

    init() {
        this.paths.forEach((path, index) => {
            // Sequential start to avoid simultaneous burst
            const initialDelay = index * 1000 + Math.random() * 2000;
            setTimeout(() => this.runCycle(path), initialDelay);
        });
    }

    runCycle(path) {
        // 1. Clean up previous state
        path.classList.remove('is-pulsing');
        path.style.animationDuration = '0s';
        void path.offsetWidth; // Force hardware reflow

        // 2. Random Speed (6s to 10s for sophisticated but active look)
        const duration = (6 + Math.random() * 4).toFixed(2);
        
        // 3. Re-apply and trigger
        setTimeout(() => {
            path.style.animationDuration = `${duration}s`;
            path.classList.add('is-pulsing');
            
            // 4. Schedule next run: Duration + Near-Zero Silence (0.1s to 0.6s)
            const silence = 100 + Math.random() * 500;
            const nextRunTime = (parseFloat(duration) * 1000) + silence;
            
            setTimeout(() => this.runCycle(path), nextRunTime);
        }, 50); // Small buffer to ensure class removal is registered
    }
}

// --- 5. SCROLL REVEAL (Staggered) ---
const initScrollReveal = () => {
    const elements = document.querySelectorAll('.reveal, .stagger-item');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
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

    const isMobileLite =
        document.body.classList.contains('mobile-lite') ||
        window.matchMedia('(max-width: 768px)').matches ||
        window.matchMedia('(pointer: coarse)').matches;

    // Keep the section visual, but avoid continuous decoding/render on phones.
    if (isMobileLite) {
        video.autoplay = false;
        video.removeAttribute('autoplay');
        video.preload = 'none';
        video.pause();
    }

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
    const setupCarousel = (containerId, prevSelector, nextSelector, indicatorId = null) => {
        const container = document.getElementById(containerId);
        const prevBtn = document.querySelector(prevSelector);
        const nextBtn = document.querySelector(nextSelector);
        const indicator = indicatorId ? document.getElementById(indicatorId) : null;

        if (!container) return;

        // Dynamic scroll amount based on card width + gap
        const getScrollAmount = () => {
            const card = container.querySelector('.exp-card, .edu-card');
            return card ? card.offsetWidth + 30 : 350;
        };

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                container.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                container.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
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
        }
    };

    // Initialize both carousels
    setupCarousel('expCarousel', '.experience-section .prev-btn', '.experience-section .next-btn', 'scrubIndicator');
    setupCarousel('eduCarousel', '.education-section .prev-btn', '.education-section .next-btn');

    // Drag to Scroll Logic with Momentum (Inertia)
    const initDragToScroll = () => {
        const sliders = document.querySelectorAll('.horizontal-scroll');
        
        sliders.forEach(slider => {
            let isDown = false;
            let startX;
            let scrollLeft;
            let velX = 0;
            let momentumID;

            const beginMomentum = () => {
                momentumID = requestAnimationFrame(momentumLoop);
            };

            const cancelMomentum = () => {
                cancelAnimationFrame(momentumID);
            };

            const momentumLoop = () => {
                slider.scrollLeft += velX;
                velX *= 0.95; // Friction
                if (Math.abs(velX) > 0.5) {
                    momentumID = requestAnimationFrame(momentumLoop);
                }
            };

            slider.addEventListener('mousedown', (e) => {
                isDown = true;
                slider.classList.add('active');
                startX = e.pageX - slider.offsetLeft;
                scrollLeft = slider.scrollLeft;
                cancelMomentum();
                slider.style.scrollSnapType = 'none';
            });

            slider.addEventListener('mouseleave', () => {
                isDown = false;
                slider.classList.remove('active');
                slider.style.scrollSnapType = 'x mandatory';
            });

            slider.addEventListener('mouseup', () => {
                isDown = false;
                slider.classList.remove('active');
                beginMomentum();
                // Delay re-enabling snap to allow momentum to finish
                setTimeout(() => {
                    if (!isDown) slider.style.scrollSnapType = 'x proximity';
                }, 500);
            });

            slider.addEventListener('mousemove', (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - slider.offsetLeft;
                const walk = (x - startX) * 2;
                const prevScrollLeft = slider.scrollLeft;
                slider.scrollLeft = scrollLeft - walk;
                velX = slider.scrollLeft - prevScrollLeft;
            });

            // Touch Support
            slider.addEventListener('touchstart', (e) => {
                cancelMomentum();
                slider.style.scrollSnapType = 'none';
            }, { passive: true });

            slider.addEventListener('touchend', () => {
                slider.style.scrollSnapType = 'x proximity';
            }, { passive: true });
        });
    };

    // Initial Centering Logic (Focus on Arabian Oud for the perfect balance per reference)
    const centerInitial = () => {
        const expContainer = document.getElementById('expCarousel');
        if (expContainer) {
            const cards = expContainer.querySelectorAll('.exp-card');
            // Target index 4 (Arabian Oud) to match the image exactly
            const targetCard = cards.length > 4 ? cards[4] : cards[0];
            
            if (targetCard) {
                const scrollPos = targetCard.offsetLeft - (expContainer.clientWidth / 2) + (targetCard.clientWidth / 2);
                expContainer.scrollTo({ left: scrollPos, behavior: 'auto' });
            }
        }

        // Education Carousel Initial Centering (2nd card)
        const eduContainer = document.getElementById('eduCarousel');
        if (eduContainer) {
            const cards = eduContainer.querySelectorAll('.edu-card');
            const targetCard = cards.length > 1 ? cards[1] : cards[0];
            if (targetCard) {
                const scrollPos = targetCard.offsetLeft - (eduContainer.clientWidth / 2) + (targetCard.clientWidth / 2);
                eduContainer.scrollTo({ left: scrollPos, behavior: 'auto' });
            }
        }
        
        initDragToScroll();
    };

    // Run after a small delay to ensure rendering
    setTimeout(centerInitial, 100);
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
    const isMobileViewport =
        window.matchMedia("(max-width: 768px)").matches ||
        window.matchMedia("(pointer: coarse)").matches;
    const isLowPowerDevice =
        isMobileViewport ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

    if (isMobileViewport) {
        document.body.classList.add('mobile-lite');
    }
    if (isLowPowerDevice) {
        document.body.classList.add('perf-lite');
    }

    // Core Motion
    new KineticText();
    new DataDecrypt();
    new FluidSweep();
    new IgnitionMetrics();

    // Interaction
    if (!isMobileViewport) {
        initSpatialDepth();
        initLiveHUD();
    }
    initScrollReveal();
    initMarqueeSystem();
    initVideo();
    initCarousel();
    initStoryInteractives();
    if (!isMobileViewport) {
        new SmartPulseEngine();
    }
});
