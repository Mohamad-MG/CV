/**
 * Achievements 2026 - Kinetic Interaction System
 * Focused on performance, depth, and fluid motion.
 */

document.addEventListener('DOMContentLoaded', () => {
    initScrollReveal();
    initQuantumCards();
    initHeroParallax();
    initGWRArtifact();
    initQyadatEngine();
});

/**
 * Qyadat Engine HUD Interaction
 */
function initQyadatEngine() {
    const engine = document.querySelector('.qyadat-engine');
    const corners = document.querySelectorAll('.hud-corner');
    
    if (!engine) return;

    engine.addEventListener('mousemove', (e) => {
        const rect = engine.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Subtle movement for corners
        const moveX = (x - rect.width / 2) / 25;
        const moveY = (y - rect.height / 2) / 25;

        corners.forEach(corner => {
            corner.style.transform = `translate(${moveX}px, ${moveY}px)`;
        });
    });

    engine.addEventListener('mouseleave', () => {
        corners.forEach(corner => {
            corner.style.transform = `translate(0, 0)`;
        });
    });
}

/**
 * GWR Artifact Interaction
 */
function initGWRArtifact() {
    const monolith = document.querySelector('.gwr-monolith');
    if (!monolith) return;

    monolith.addEventListener('mousemove', (e) => {
        const rect = monolith.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        monolith.style.setProperty('--mx', `${x}px`);
        monolith.style.setProperty('--my', `${y}px`);
    });
}

/**
 * Scroll Reveal System
 * Uses Intersection Observer for high-performance entry animations.
 */
function initScrollReveal() {
    const revealElements = document.querySelectorAll('.reveal');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // Optional: Stop observing after reveal
                // observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    revealElements.forEach((el, index) => {
        // Stagger effect for elements in the same viewport
        el.style.transitionDelay = `${(index % 3) * 0.1}s`;
        observer.observe(el);
    });
}

/**
 * Quantum Cards Interaction
 * Mouse-tracking highlights and 3D tilt.
 */
function initQuantumCards() {
    const cards = document.querySelectorAll('.quantum-card');
    
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            card.style.setProperty('--px', `${x}px`);
            card.style.setProperty('--py', `${y}px`);
            
            // Subtle 3D Tilt
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) translateY(-10px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) translateY(0) rotateX(0) rotateY(0) scale(1)`;
        });
    });
}

/**
 * Hero Parallax & Core Animation
 */
function initHeroParallax() {
    const core = document.querySelector('.hero-chronos-core');
    const hero = document.querySelector('.archive-hero');
    
    if (!core || !hero) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.scrollY;
        if (scrolled < window.innerHeight) {
            const val = scrolled * 0.4;
            core.style.transform = `translateY(${val}px) scale(${1 + scrolled * 0.0005})`;
            core.style.opacity = `${0.6 - scrolled * 0.001}`;
        }
    }, { passive: true });
}

// Add CSS for reveal animations if not present
const style = document.createElement('style');
style.textContent = `
    .reveal {
        opacity: 0;
        transform: translateY(30px) scale(0.98);
        filter: blur(10px);
        transition: all 1.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .reveal.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
        filter: blur(0);
    }
`;
document.head.appendChild(style);
