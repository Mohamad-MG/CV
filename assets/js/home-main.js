/**
 * ULTRA 2026 - SYSTEM CORE
 * Combined Logic for: Motion, Data Decrypt, Metrics, Marquee, and Interaction.
 */

// Nebula background handled by assets/js/nebula-background.js

const prefersReducedMotion = () =>
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const rafThrottle = (fn) => {
    let ticking = false;
    let lastArgs = [];

    return (...args) => {
        lastArgs = args;
        if (ticking) return;

        ticking = true;
        requestAnimationFrame(() => {
            ticking = false;
            fn(...lastArgs);
        });
    };
};

const isMotionProfilingEnabled = () => {
    try {
        const qs = new URLSearchParams(window.location.search);
        if (qs.get('mg_profile_motion') === '1') return true;
    } catch {
        // no-op
    }

    try {
        return window.localStorage?.getItem('mg_profile_motion') === '1';
    } catch {
        return false;
    }
};

const createMotionProfiler = () => {
    const enabled = isMotionProfilingEnabled();
    const durations = [];
    const counters = new Map();

    const now = () => performance.now();

    const bump = (name, value = 1) => {
        if (!enabled || !name) return;
        counters.set(name, (counters.get(name) || 0) + value);
    };

    const time = (name, fn) => {
        if (typeof fn !== 'function') return undefined;
        if (!enabled) return fn();

        const t0 = now();
        const result = fn();
        const pushDone = () => {
            durations.push({
                step: name,
                ms: Number((now() - t0).toFixed(2))
            });
        };

        if (result && typeof result.then === 'function') {
            return result.finally(pushDone);
        }
        pushDone();
        return result;
    };

    const report = (title = 'Motion Profile') => {
        if (!enabled) return;
        const total = durations.reduce((sum, item) => sum + item.ms, 0);
        const summary = durations.map(item => ({ ...item }));
        summary.push({ step: 'TOTAL', ms: Number(total.toFixed(2)) });
        console.groupCollapsed(`[MG] ${title}`);
        console.table(summary);
        if (counters.size) {
            console.table(
                Array.from(counters.entries()).map(([name, count]) => ({ counter: name, count }))
            );
        }
        console.groupEnd();
    };

    return { enabled, bump, time, report };
};

const getMotionProfiler = () => {
    return window.__MG_MOTION_PROFILER__ || null;
};

// --- 1. KINETIC TEXT (Word Reveal Engine) ---
class KineticText {
    constructor() {
        this.elements = document.querySelectorAll('.kinetic-text');
        this.init();
    }

    init() {
        this.elements.forEach(el => {
            const originalHTML = el.innerHTML.trim();
            if (!originalHTML) return;

            el.innerHTML = '';
            el.style.opacity = '1';
            el.style.visibility = 'visible';

            // Split by <br> tags
            const lines = originalHTML.split(/<br\s*\/?>/i);

            lines.forEach((lineHTML, lineIdx) => {
                const lineContainer = document.createElement('span');
                lineContainer.className = 'tagline-line';
                lineContainer.style.display = 'block';

                // Temporary div to parse inner HTML of the line (handles <small>, etc.)
                const temp = document.createElement('div');
                temp.innerHTML = lineHTML;

                // Process nodes (text or nested tags)
                this.processNodes(temp, lineContainer, lineIdx);

                el.appendChild(lineContainer);
            });
        });
    }

    processNodes(parentNode, targetContainer, lineIdx) {
        let globalWordIdx = 0;

        Array.from(parentNode.childNodes).forEach(node => {
            if (node.nodeType === Node.TEXT_NODE) {
                const words = node.textContent.trim().split(/\s+/);
                words.forEach((word, wordIdx) => {
                    if (word) {
                        const wordSpan = this.createWordSpan(word, lineIdx, globalWordIdx);
                        targetContainer.appendChild(wordSpan);
                        targetContainer.appendChild(document.createTextNode(' '));
                        globalWordIdx++;
                    }
                });
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                const wrapper = document.createElement('span');
                wrapper.className = node.className; // Preserve classes like tagline-sub
                if (node.tagName.toLowerCase() === 'small') wrapper.style.fontSize = '0.6em';

                const words = node.textContent.trim().split(/\s+/);
                words.forEach((word, wordIdx) => {
                    if (word) {
                        const wordSpan = this.createWordSpan(word, lineIdx, globalWordIdx);
                        wrapper.appendChild(wordSpan);
                        wrapper.appendChild(document.createTextNode(' '));
                        globalWordIdx++;
                    }
                });
                targetContainer.appendChild(wrapper);
            }
        });
    }

    createWordSpan(word, lineIdx, wordIdx) {
        const wordSpan = document.createElement('span');
        wordSpan.className = 'word';
        wordSpan.style.display = 'inline-block';
        wordSpan.style.whiteSpace = 'nowrap';

        word.split('').forEach((char, charIdx) => {
            const charSpan = document.createElement('span');
            charSpan.className = 'char';
            charSpan.innerText = char;
            // Sophisticated delay logic
            const delay = (lineIdx * 0.25) + (wordIdx * 0.08) + (charIdx * 0.02);
            charSpan.style.transitionDelay = `${delay}s`;
            wordSpan.appendChild(charSpan);
        });
        return wordSpan;
    }
}

// --- 1b. DATA DECRYPT (Matrix Style Reveal) ---
class DataDecrypt {
    constructor() {
        this.scrambleChars = '/>_-\|[]{}*&^%$#@!~';
        // Select all elements with .decrypt class + keep legacy support for hero-eyebrow
        this.elements = document.querySelectorAll('.decrypt, .hero-eyebrow');

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Start immediately upon reveal (stagger handled by CSS or slight delay if needed)
                    // We can add a slight index-based delay if we had the index here, but for simplicity
                    // and robustness, we let the scroll trigger it naturally. 
                    this.initElement(entry.target, 0, 30);
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });

        this.elements.forEach(el => {
            el.style.opacity = '0'; // Ensure hidden initially
            observer.observe(el);
        });
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
        span.style.fontFamily = 'monospace'; /* CRITICAL: Prevent Reflow during scramble */
        span.style.display = 'inline-block';
        // Removed fixed 1ch width to allow natural spacing

        const scrambleInterval = setInterval(() => {
            frame++;
            if (frame < maxFrames) {
                span.innerText = this.scrambleChars[Math.floor(Math.random() * this.scrambleChars.length)];
            } else {
                clearInterval(scrambleInterval);
                span.innerText = targetChar;
                span.style.display = 'inline';
                span.style.color = '';
                span.style.fontFamily = '';
                span.style.width = '';
                span.style.minWidth = '';
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
        // Mobile Perf: Skip blur filter
        if (window.innerWidth > 768) {
            el.style.filter = 'blur(0px) brightness(2)'; // Flash
        } else {
            el.style.filter = 'none';
        }

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
    const profiler = getMotionProfiler();
    const glassPanels = Array.from(document.querySelectorAll('.identity-card, .stat-card, .exp-card, .industry-card, .future-card'));
    const bgVoid = document.querySelector('.bg-void-layer');
    const bgAmbient = document.querySelector('.bg-ambient-glow');
    if (!glassPanels.length && !bgVoid && !bgAmbient) return;

    const panelRects = new Map();
    const updatePanelRects = () => {
        glassPanels.forEach((panel) => {
            panelRects.set(panel, panel.getBoundingClientRect());
        });
    };
    updatePanelRects();

    const scheduleRectRefresh = rafThrottle(updatePanelRects);
    window.addEventListener('resize', scheduleRectRefresh, { passive: true });
    window.addEventListener('scroll', scheduleRectRefresh, { passive: true });

    const handlePointerMove = rafThrottle((e) => {
        profiler?.bump('spatial.pointer.raf');
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
            const rect = panelRects.get(panel);
            if (!rect) return;

            const px = clientX - rect.left;
            const py = clientY - rect.top;

            const dist = Math.sqrt((px - rect.width / 2) ** 2 + (py - rect.height / 2) ** 2);
            if (dist < 600) {
                panel.style.setProperty('--reflect-x', `${(px / rect.width) * 100}%`);
                panel.style.setProperty('--reflect-y', `${(py / rect.height) * 100}%`);
            }
        });
    });
    // C) Mobile optimization: Remove mousemove listener entirely on touch/small devices
    // Always enable parallax
    window.addEventListener('mousemove', (e) => {
        profiler?.bump('spatial.pointer.raw');
        handlePointerMove(e);
    }, { passive: true });

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
    const profiler = getMotionProfiler();
    const ksaEl = document.querySelector('.d1');
    const egyEl = document.querySelector('.d2');
    const futureEl = document.querySelector('.d3');
    if (!ksaEl && !egyEl && !futureEl) return;

    const updateHUD = () => {
        profiler?.bump('hud.ticks');
        // Network Latency Simulation (Actual network API if available)
        const latency = Math.floor(Math.random() * 20 + 15); // 15-35ms
        if (ksaEl) ksaEl.innerHTML = `KSA <span style="opacity:0.5; font-size:0.5rem;">${latency}MS</span>`;

        // Growth Index Simulation
        const growthIndex = (Math.random() * 0.5 + 9.5).toFixed(2); // 9.5 to 10.0
        if (egyEl) egyEl.innerHTML = `EGY <span style="opacity:0.5; font-size:0.5rem;">IX_${growthIndex}</span>`;

        // System Uptime / Status
        if (futureEl) futureEl.innerHTML = `2026 <span style="opacity:0.5; font-size:0.5rem;">VER_2.8</span>`;
    };

    let hudInterval = null;
    const startHUD = () => {
        if (hudInterval) return;
        hudInterval = setInterval(updateHUD, 3000);
    };
    const stopHUD = () => {
        if (!hudInterval) return;
        clearInterval(hudInterval);
        hudInterval = null;
    };

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopHUD();
        } else {
            updateHUD();
            startHUD();
        }
    });

    startHUD();
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

    // Force Autoplay for everyone
    video.autoplay = true;
    video.setAttribute('autoplay', '');
    video.preload = 'auto';
    video.muted = true; // Required for auto
    video.loop = true;
    video.playsInline = true;

    // Attempt play immediately
    const playPromise = video.play();
    if (playPromise !== undefined) {
        playPromise.catch(error => {
            console.log("Auto-play prevented (user did not interact yet):", error);
            // Setup click-to-play fallback locally
        });
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
                velX *= 0.98; // Low Friction (Gliding on Ice)
                if (Math.abs(velX) > 0.1) {
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
                const walk = (x - startX) * 3; // High Sensitivity (Fast Response)
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

const detectRuntimeFlags = () => {
    const isMobileViewport =
        window.matchMedia("(max-width: 768px)").matches ||
        window.matchMedia("(pointer: coarse)").matches;
    const isReducedMotion = prefersReducedMotion();
    const isLowPowerDevice =
        isMobileViewport ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);

    return {
        isMobileViewport,
        isReducedMotion,
        isLowPowerDevice,
        allowAdvancedMotion: !isMobileViewport && !isReducedMotion
    };
};

const applyRuntimeClasses = (flags) => {
    if (flags.isMobileViewport) {
        document.body.classList.add('mobile-lite');
    }
    if (flags.isLowPowerDevice) {
        document.body.classList.add('perf-lite');
    }
    if (flags.isReducedMotion) {
        document.body.classList.add('reduce-motion');
    }
};

const bootMotionSystem = (flags, profiler) => {
    const steps = [
        { name: 'core.kineticText', run: () => new KineticText() },
        { name: 'core.dataDecrypt', run: () => new DataDecrypt() },
        { name: 'core.fluidSweep', run: () => new FluidSweep() },
        { name: 'core.ignitionMetrics', run: () => new IgnitionMetrics() },
        { name: 'interaction.scrollReveal', run: initScrollReveal },
        { name: 'interaction.marquee', run: initMarqueeSystem },
        { name: 'interaction.video', run: initVideo },
        { name: 'interaction.carousel', run: initCarousel },
        { name: 'interaction.story', run: initStoryInteractives },
    ];

    if (flags.allowAdvancedMotion) {
        steps.splice(4, 0, { name: 'interaction.spatialDepth', run: initSpatialDepth });
        steps.splice(5, 0, { name: 'interaction.liveHud', run: initLiveHUD });
        steps.push({ name: 'interaction.smartPulse', run: () => new SmartPulseEngine() });
    }

    steps.forEach((step) => {
        profiler.time(step.name, step.run);
    });
};

const scheduleMotionProfileReports = (profiler) => {
    if (!profiler.enabled) return;

    profiler.report('Motion Boot (immediate)');
    setTimeout(() => profiler.report('Motion Runtime (8s sample)'), 8000);
};

// --- MASTER BOOT ---
document.addEventListener('DOMContentLoaded', () => {
    const profiler = createMotionProfiler();
    window.__MG_MOTION_PROFILER__ = profiler;

    const flags = profiler.time('runtime.detectFlags', detectRuntimeFlags);
    profiler.time('runtime.applyClasses', () => applyRuntimeClasses(flags));
    bootMotionSystem(flags, profiler);
    scheduleMotionProfileReports(profiler);
});
