document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // --- 1. Intersection Reveal Logic ---
    const revealElements = Array.from(document.querySelectorAll('.reveal, .stagger-item'));
    if (revealElements.length) {
        if (prefersReducedMotion || !('IntersectionObserver' in window)) {
            revealElements.forEach((el) => el.classList.add('visible'));
        } else {
            const observer = new IntersectionObserver((entries, obs) => {
                entries.forEach((entry, index) => {
                    if (!entry.isIntersecting) return;
                    const delay = Math.min(index * 45, 220);
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                        obs.unobserve(entry.target);
                    }, delay);
                });
            }, { threshold: 0.1 });
            revealElements.forEach((el) => observer.observe(el));
        }
    }

    // --- 2. Neural Mouse Tracking (Ultra-Modern 2026) ---
    const impactItems = document.querySelectorAll('.impact-item, .artifact-glass-card');
    if (impactItems.length && !prefersReducedMotion) {
        impactItems.forEach(item => {
            item.addEventListener('mousemove', (e) => {
                const rect = item.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                item.style.setProperty('--mouse-x', `${x}px`);
                item.style.setProperty('--mouse-y', `${y}px`);
            });
        });
    }

    // --- 3. Kinetic Tilt Effect for Artifacts ---
    const artifacts = document.querySelectorAll('.artifact-glass-card');
    artifacts.forEach(art => {
        art.addEventListener('mousemove', (e) => {
            const rect = art.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            art.style.transform = `rotateY(${x * 15}deg) rotateX(${-y * 15}deg) translateY(-10px)`;
        });
        art.addEventListener('mouseleave', () => {
            art.style.transform = '';
        });
    });
});
