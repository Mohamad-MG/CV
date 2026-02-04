document.addEventListener('DOMContentLoaded', () => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const revealElements = Array.from(document.querySelectorAll('.reveal, .stagger-item'));

    if (!revealElements.length) {
        return;
    }

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
        revealElements.forEach((el) => el.classList.add('visible'));
        return;
    }

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
});
