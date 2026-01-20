document.addEventListener('DOMContentLoaded', () => {
    const progressLine = document.getElementById('progressLine');
    let scrollTicking = false;

    const updateProgress = () => {
        if (!progressLine) {
            scrollTicking = false;
            return;
        }

        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = maxScroll > 0 ? (window.scrollY / maxScroll) * 100 : 0;
        progressLine.style.width = `${scrolled}%`;
        scrollTicking = false;
    };

    const handleScroll = () => {
        if (!scrollTicking) {
            scrollTicking = true;
            window.requestAnimationFrame(updateProgress);
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    updateProgress();

    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    const delay = Math.min(index * 40, 200);
                    setTimeout(() => {
                        entry.target.classList.add('visible');
                        observer.unobserve(entry.target);
                    }, delay);
                }
            });
        }, { root: null, rootMargin: '0px', threshold: 0.1 });

        galleryItems.forEach(el => revealObserver.observe(el));
    } else {
        galleryItems.forEach(el => el.classList.add('visible'));
    }

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = document.querySelector('.lightbox-close');
    const lightboxPrev = document.querySelector('.lightbox-prev');
    const lightboxNext = document.querySelector('.lightbox-next');
    const images = galleryItems
        .map(item => item.querySelector('img'))
        .filter(Boolean);
    let currentImageIndex = 0;

    const openLightbox = (index) => {
        if (!lightbox || !lightboxImg || !images.length) {
            return;
        }

        currentImageIndex = index;
        lightboxImg.src = images[currentImageIndex].src;
        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const closeLightbox = () => {
        if (!lightbox) {
            return;
        }

        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    const navLightbox = (direction) => {
        if (!images.length || !lightboxImg) {
            return;
        }

        currentImageIndex += direction;
        if (currentImageIndex < 0) {
            currentImageIndex = images.length - 1;
        }
        if (currentImageIndex >= images.length) {
            currentImageIndex = 0;
        }
        lightboxImg.src = images[currentImageIndex].src;
    };

    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => openLightbox(index));
    });

    lightboxClose?.addEventListener('click', closeLightbox);
    lightboxPrev?.addEventListener('click', () => navLightbox(-1));
    lightboxNext?.addEventListener('click', () => navLightbox(1));

    lightbox?.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeLightbox();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (!lightbox?.classList.contains('active')) {
            return;
        }

        if (e.key === 'Escape') {
            closeLightbox();
        }
        if (e.key === 'ArrowRight') {
            navLightbox(1);
        }
        if (e.key === 'ArrowLeft') {
            navLightbox(-1);
        }
    });

    const contactModal = document.getElementById('contactModal');
    const contactFab = document.querySelector('.contact-fab');
    const modalClose = document.querySelector('.modal-close');

    const showContactModal = () => {
        if (!contactModal) {
            return;
        }

        contactModal.classList.add('show');
        contactModal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const hideContactModal = () => {
        if (!contactModal) {
            return;
        }

        contactModal.classList.remove('show');
        contactModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    contactFab?.addEventListener('click', showContactModal);
    modalClose?.addEventListener('click', hideContactModal);

    contactModal?.addEventListener('click', (e) => {
        if (e.target === contactModal) {
            hideContactModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && contactModal?.classList.contains('show')) {
            hideContactModal();
        }
    });
});
