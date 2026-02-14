/**
 * Portfolio 2026 — Ultra-Modern Lightbox Engine
 * ─────────────────────────────────────────────
 * Shared utilities (KineticText, DataDecrypt, initScrollReveal)
 * are loaded via home-main.js — do NOT redeclare them here.
 * ─────────────────────────────────────────────
 */

document.addEventListener('DOMContentLoaded', () => {

    /* ═══════════════════════════════════
       1. STATE & CONSTANTS
       ═══════════════════════════════════ */
    const TRANSITION = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
    const ANIM_DURATION = 460;       // ms — matches CSS transition

    const $ = (id) => document.getElementById(id);

    const state = {
        currentIndex: 0,
        items: [],
        slideData: [],               // { title }
        slides: [],                   // DOM references for morphing
        track: null,
        isAnimating: false,
        isOpen: false
    };

    const els = {
        horizon: $('carouselHorizon'),
        lightbox: $('lightbox'),
        title: $('viewerTitle'),
        counter: $('deckCounter'),
        progress: $('viewerProgressFill'),
        next: $('carouselNext'),
        prev: $('carouselPrev'),
        close: $('carouselClose')
    };

    const scrollLock = {
        lock() { document.body.style.overflow = 'hidden'; },
        unlock() { document.body.style.overflow = ''; }
    };

    /* ═══════════════════════════════════
       2. BUILD SLIDES
       ═══════════════════════════════════ */
    const initCarousel = () => {
        state.items = Array.from(document.querySelectorAll('.gallery-item'));
        state.slideData = [];
        state.slides = [];

        if (!els.horizon) return;
        els.horizon.innerHTML = '';

        // Create inner track (this receives translateX)
        const track = document.createElement('div');
        track.className = 'tablet-track';
        els.horizon.appendChild(track);
        state.track = track;

        state.items.forEach((item) => {
            const img = item.querySelector('img');
            const overlay = item.querySelector('.gallery-overlay');
            const title = overlay?.querySelector('h4')?.textContent || '';

            if (img) {
                const slide = document.createElement('div');
                slide.className = 'tablet-slide';

                const newImg = document.createElement('img');
                newImg.alt = img.alt || 'Project Image';

                // Feature 1: Preload with skeleton → reveal on load
                newImg.addEventListener('load', () => {
                    slide.classList.add('is-loaded');
                });
                newImg.src = img.src;

                // If already cached, fire immediately
                if (newImg.complete) {
                    slide.classList.add('is-loaded');
                }

                slide.appendChild(newImg);
                track.appendChild(slide);

                state.slides.push(slide);
                state.slideData.push({ title });

            }
        });
    };

    /* ═══════════════════════════════════
       3. POSITION, INFO & MORPHING
       ═══════════════════════════════════ */
    const updatePosition = (animate = true) => {
        if (!state.track) return;

        // Track transition
        state.track.style.transition = animate ? TRANSITION : 'none';
        const offset = -state.currentIndex * 100;
        state.track.style.transform = `translateX(${offset}%)`;

        // Feature 2: Slide morphing — active gets full scale/opacity
        state.slides.forEach((slide, i) => {
            slide.classList.toggle('is-active', i === state.currentIndex);
        });

        // Info strip
        const data = state.slideData[state.currentIndex];
        if (data && els.title) {
            els.title.textContent = data.title;
        }

        // Counter
        if (els.counter) {
            els.counter.textContent = `${state.currentIndex + 1} / ${state.slideData.length}`;
        }

        // Feature 5: Progress bar
        if (els.progress && state.slideData.length > 0) {
            const pct = ((state.currentIndex + 1) / state.slideData.length) * 100;
            els.progress.style.width = `${pct}%`;
        }

        // Re-enable transition after instant jump
        if (!animate) {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    if (state.track) state.track.style.transition = TRANSITION;
                });
            });
        }
    };

    const navigate = (dir) => {
        if (state.isAnimating || state.items.length === 0) return;
        state.currentIndex = (state.currentIndex + dir + state.items.length) % state.items.length;
        updatePosition(true);

        state.isAnimating = true;
        setTimeout(() => { state.isAnimating = false; }, ANIM_DURATION);
    };

    /* ═══════════════════════════════════
       4. OPEN / CLOSE
       ═══════════════════════════════════ */
    const openLightbox = (idx) => {
        state.currentIndex = idx;
        state.isOpen = true;
        if (els.lightbox) {
            updatePosition(false);
            els.lightbox.classList.add('active');
            els.lightbox.setAttribute('aria-hidden', 'false');
            scrollLock.lock();
        }
    };

    const closeLightbox = () => {
        state.isOpen = false;
        if (els.lightbox) {
            els.lightbox.classList.remove('active');
            els.lightbox.setAttribute('aria-hidden', 'true');
            scrollLock.unlock();
        }
    };

    /* ═══════════════════════════════════
       5. EVENT BINDING
       ═══════════════════════════════════ */
    initCarousel();

    // Fallback: re-init on window load only if images weren't ready
    window.addEventListener('load', () => {
        if (state.slides.length === 0) initCarousel();
    });

    // Gallery item clicks → open lightbox
    document.querySelectorAll('.gallery-item').forEach((item, idx) => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            openLightbox(idx);
        });
    });

    // Navigation buttons
    if (els.next) els.next.addEventListener('click', (e) => { e.stopPropagation(); navigate(1); });
    if (els.prev) els.prev.addEventListener('click', (e) => { e.stopPropagation(); navigate(-1); });
    if (els.close) els.close.addEventListener('click', (e) => { e.stopPropagation(); closeLightbox(); });

    // Backdrop click → close
    if (els.lightbox) {
        els.lightbox.addEventListener('click', (e) => {
            if (e.target === els.lightbox) closeLightbox();
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!state.isOpen) return;
        if (e.key === 'ArrowRight') navigate(1);
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'Escape') closeLightbox();
    });

    /* ═══════════════════════════════════
       6. DRAG-TO-BROWSE (Feature 3)
       Touch: light threshold, velocity-aware
       Mouse: higher threshold, dead zone
       ═══════════════════════════════════ */
    const drag = { active: false, locked: false, startX: 0, lastX: 0, velocity: 0, time: 0, rafId: 0 };
    const TOUCH_THRESHOLD = 30;
    const MOUSE_THRESHOLD = 60;
    const VELOCITY_SNAP = 0.3;
    const RUBBER = 0.3;

    const trackWidth = () => els.horizon ? els.horizon.offsetWidth : 1;

    /* PERF: rAF-gated drag — batches transform updates to display refresh */
    let pendingDragDx = 0;
    const scheduleDrag = (dx) => {
        pendingDragDx = dx;
        if (!drag.rafId) {
            drag.rafId = requestAnimationFrame(() => {
                applyDrag(pendingDragDx);
                drag.rafId = 0;
            });
        }
    };

    const applyDrag = (dx) => {
        if (!state.track) return;
        const base = -state.currentIndex * trackWidth();
        let offset = base + dx;

        // Rubber-band at first/last slide
        const min = -(state.slides.length - 1) * trackWidth();
        if (offset > 0) offset *= RUBBER;
        if (offset < min) offset = min + (offset - min) * RUBBER;

        state.track.style.transform = `translateX(${offset}px)`;
    };

    const snapBack = (dir) => {
        if (dir !== 0) {
            const next = state.currentIndex + dir;
            if (next >= 0 && next < state.slides.length) {
                state.currentIndex = next;
            }
        }
        updatePosition(true);
        state.isAnimating = true;
        setTimeout(() => { state.isAnimating = false; }, ANIM_DURATION);
    };

    const commitDrag = (threshold) => {
        drag.active = false;
        drag.locked = false;
        if (state.track) state.track.classList.remove('is-dragging');

        const dx = drag.lastX - drag.startX;
        const fast = Math.abs(drag.velocity) > VELOCITY_SNAP;

        if (fast || Math.abs(dx) > threshold) {
            snapBack(dx < 0 ? 1 : -1);
        } else {
            snapBack(0);  // rubber snap-back
        }
    };

    // ── Touch (phone) ──
    if (els.lightbox) {
        let touchDir = null; // null = undecided, 'h' = horizontal, 'v' = vertical
        let startY = 0;

        els.lightbox.addEventListener('touchstart', (e) => {
            if (!state.isOpen || state.isAnimating) return;
            const t = e.touches[0];
            drag.active = true;
            drag.startX = drag.lastX = t.clientX;
            startY = t.clientY;
            drag.velocity = 0;
            drag.time = Date.now();
            touchDir = null;
            if (state.track) {
                state.track.style.transition = 'none';
                state.track.classList.add('is-dragging');
            }
        }, { passive: true });

        els.lightbox.addEventListener('touchmove', (e) => {
            if (!drag.active) return;
            const t = e.touches[0];
            const dx = Math.abs(t.clientX - drag.startX);
            const dy = Math.abs(t.clientY - startY);

            // Lock direction on first significant move
            if (!touchDir && (dx > 8 || dy > 8)) {
                touchDir = dx >= dy ? 'h' : 'v';
            }
            if (touchDir === 'v') { drag.active = false; return; }

            const now = Date.now();
            const dt = now - drag.time || 1;
            drag.velocity = (t.clientX - drag.lastX) / dt;
            drag.lastX = t.clientX;
            drag.time = now;

            scheduleDrag(t.clientX - drag.startX);
        }, { passive: true });

        els.lightbox.addEventListener('touchend', () => {
            if (drag.active) commitDrag(TOUCH_THRESHOLD);
        }, { passive: true });
        els.lightbox.addEventListener('touchcancel', () => {
            if (drag.active) commitDrag(TOUCH_THRESHOLD);
        }, { passive: true });

        // ── Mouse (desktop) ──
        els.lightbox.addEventListener('mousedown', (e) => {
            if (!state.isOpen || state.isAnimating) return;
            if (e.target.closest('.tablet-nav, .tablet-close')) return;
            e.preventDefault();
            drag.active = true;
            drag.locked = false;
            drag.startX = drag.lastX = e.clientX;
            drag.velocity = 0;
            drag.time = Date.now();
        });

        window.addEventListener('mousemove', (e) => {
            if (!drag.active) return;

            // Dead zone: start dragging only after 8px (prevents click jitter)
            if (!drag.locked) {
                if (Math.abs(e.clientX - drag.startX) < 8) return;
                drag.locked = true;
                if (state.track) {
                    state.track.style.transition = 'none';
                    state.track.classList.add('is-dragging');
                }
            }

            const now = Date.now();
            const dt = now - drag.time || 1;
            drag.velocity = (e.clientX - drag.lastX) / dt;
            drag.lastX = e.clientX;
            drag.time = now;

            scheduleDrag(e.clientX - drag.startX);
        });

        window.addEventListener('mouseup', () => {
            if (drag.active) commitDrag(MOUSE_THRESHOLD);
        });
    }

    /* ═══════════════════════════════════
       7. TAB SYSTEM (Minimal)
       ═══════════════════════════════════ */
    const tabButtons = document.querySelectorAll('.tab-btn');
    const imagesSection = document.getElementById('imagesSection');
    const videosSection = document.getElementById('videosSection');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.toggle('active', b === btn));
            const tab = btn.dataset.tab;
            if (imagesSection) imagesSection.style.display = tab === 'images' ? 'block' : 'none';
            if (videosSection) videosSection.style.display = tab === 'videos' ? 'block' : 'none';
            if (tab === 'images') setTimeout(initCarousel, 50);
        });
    });


    /* ═══════════════════════════════════
       8. VIDEO LIGHTBOX ENGINE
       ═══════════════════════════════════ */
    const videoLightbox = document.getElementById('videoLightbox');
    const lightboxVideo = document.getElementById('lightboxVideo');
    const videoTitle = document.getElementById('videoLightboxTitle');
    const videoDesc = document.getElementById('videoLightboxDesc');
    const videoItems = Array.from(document.querySelectorAll('.video-item'));
    let currentVideoIdx = -1;

    const openVideoLB = (idx) => {
        if (idx < 0 || idx >= videoItems.length) return;
        currentVideoIdx = idx;
        const item = videoItems[idx];
        const src = item.querySelector('video')?.getAttribute('src') || '';
        const title = item.dataset.title || '';
        const desc = item.dataset.desc || '';

        if (lightboxVideo) {
            lightboxVideo.src = src;
            lightboxVideo.load();
            lightboxVideo.play().catch(() => { });
        }
        if (videoTitle) videoTitle.textContent = title;
        if (videoDesc) videoDesc.textContent = desc;
        if (videoLightbox) {
            videoLightbox.classList.add('active');
            videoLightbox.setAttribute('aria-hidden', 'false');
            scrollLock.lock();
        }
    };

    const closeVideoLB = () => {
        if (lightboxVideo) {
            lightboxVideo.pause();
            lightboxVideo.removeAttribute('src');
            lightboxVideo.load();
        }
        if (videoLightbox) {
            videoLightbox.classList.remove('active');
            videoLightbox.setAttribute('aria-hidden', 'true');
            scrollLock.unlock();
        }
        currentVideoIdx = -1;
    };

    const navVideo = (dir) => {
        const next = currentVideoIdx + dir;
        if (next >= 0 && next < videoItems.length) {
            if (lightboxVideo) { lightboxVideo.pause(); }
            openVideoLB(next);
        }
    };

    // Bind video items
    videoItems.forEach((item, idx) => {
        item.addEventListener('click', () => openVideoLB(idx));
    });

    // Bind video lightbox controls
    if (videoLightbox) {
        const vClose = videoLightbox.querySelector('.lightbox-close');
        const vPrev = videoLightbox.querySelector('.video-nav-prev');
        const vNext = videoLightbox.querySelector('.video-nav-next');

        if (vClose) vClose.addEventListener('click', closeVideoLB);
        if (vPrev) vPrev.addEventListener('click', () => navVideo(-1));
        if (vNext) vNext.addEventListener('click', () => navVideo(1));

        // Backdrop click
        videoLightbox.addEventListener('click', (e) => {
            if (e.target === videoLightbox) closeVideoLB();
        });
    }

    // Extend keyboard handler for video lightbox
    document.addEventListener('keydown', (e) => {
        if (currentVideoIdx < 0) return;
        if (e.key === 'Escape') closeVideoLB();
        if (e.key === 'ArrowRight') navVideo(1);
        if (e.key === 'ArrowLeft') navVideo(-1);
    });

});
