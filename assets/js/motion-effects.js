/**
 * ULTRA MODERN MOTION EFFECTS - JavaScript
 * Interactive animations and effects
 */

document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // REVEAL ON SCROLL (BIO-FLOW)
    // ============================================
    const revealElements = document.querySelectorAll('.reveal, .reveal-modern, .stagger-item');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                
                // Bio-Flow: Add slight float-up based on scroll speed
                const rect = entry.target.getBoundingClientRect();
                const intensity = Math.min(Math.abs(window.scrollY - entry.target.offsetTop) / 1000, 1);
                entry.target.style.setProperty('--bio-intensity', intensity);
                
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -100px 0px'
    });

    revealElements.forEach(el => {
        el.style.animationPlayState = 'paused';
        revealObserver.observe(el);
    });

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        // Disable heavy animations
        document.body.classList.add('reduced-motion');
    }

});
