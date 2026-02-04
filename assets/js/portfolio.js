document.addEventListener('DOMContentLoaded', () => {
    const ensureScrollLock = () => {
        if (window.MGScrollLock) return window.MGScrollLock;

        const getCount = () => parseInt(document.body.dataset.scrollLockCount || '0', 10) || 0;
        const setCount = (value) => {
            document.body.dataset.scrollLockCount = String(value);
        };

        const lock = () => {
            const next = getCount() + 1;
            setCount(next);
            if (next === 1) {
                document.body.style.overflow = 'hidden';
            }
        };

        const unlock = () => {
            const next = Math.max(0, getCount() - 1);
            setCount(next);
            if (next === 0) {
                document.body.style.overflow = '';
            }
        };

        window.MGScrollLock = { lock, unlock };
        return window.MGScrollLock;
    };

    const scrollLock = ensureScrollLock();
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const revealItems = Array.from(document.querySelectorAll('.gallery-item, .video-item'));
    if (!prefersReducedMotion && 'IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach((entry, index) => {
                if (!entry.isIntersecting) return;
                const delay = Math.min(index * 40, 220);
                setTimeout(() => {
                    entry.target.classList.add('visible');
                    obs.unobserve(entry.target);
                }, delay);
            });
        }, { threshold: 0.1 });

        revealItems.forEach((item) => observer.observe(item));
    } else {
        revealItems.forEach((item) => item.classList.add('visible'));
    }

    const tabButtons = Array.from(document.querySelectorAll('.tab-btn'));
    const tabsContainer = document.querySelector('.portfolio-tabs');
    const imagesSection = document.getElementById('imagesSection');
    const videosSection = document.getElementById('videosSection');

    tabsContainer?.setAttribute('role', 'tablist');
    tabButtons.forEach((button) => {
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-selected', button.classList.contains('active') ? 'true' : 'false');
    });

    const galleryItems = Array.from(document.querySelectorAll('.gallery-item'));
    const imageEntries = galleryItems
        .map((item) => ({ item, image: item.querySelector('img') }))
        .filter((entry) => entry.image);

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightboxImg');
    const lightboxClose = lightbox?.querySelector('.lightbox-close');
    const lightboxPrev = lightbox?.querySelector('.lightbox-prev');
    const lightboxNext = lightbox?.querySelector('.lightbox-next');

    let currentImageIndex = 0;

    const isImageLightboxOpen = () => Boolean(lightbox?.classList.contains('active'));

    const openImageLightbox = (index) => {
        if (!lightbox || !lightboxImg || !imageEntries[index]) return;

        currentImageIndex = index;
        const current = imageEntries[currentImageIndex].image;
        lightboxImg.src = current.src;
        lightboxImg.alt = current.alt || 'Portfolio image';

        if (!isImageLightboxOpen()) {
            scrollLock.lock();
        }

        lightbox.classList.add('active');
        lightbox.setAttribute('aria-hidden', 'false');
    };

    const closeImageLightbox = () => {
        if (!lightbox || !isImageLightboxOpen()) return;

        lightbox.classList.remove('active');
        lightbox.setAttribute('aria-hidden', 'true');
        scrollLock.unlock();
    };

    const moveImageLightbox = (direction) => {
        if (!imageEntries.length || !lightboxImg) return;

        currentImageIndex += direction;
        if (currentImageIndex < 0) currentImageIndex = imageEntries.length - 1;
        if (currentImageIndex >= imageEntries.length) currentImageIndex = 0;

        const current = imageEntries[currentImageIndex].image;
        lightboxImg.src = current.src;
        lightboxImg.alt = current.alt || 'Portfolio image';
    };

    imageEntries.forEach(({ item, image }, index) => {
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', `Open image: ${image.alt || `Item ${index + 1}`}`);

        item.addEventListener('click', () => openImageLightbox(index));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openImageLightbox(index);
            }
        });
    });

    lightboxClose?.addEventListener('click', closeImageLightbox);
    lightboxPrev?.addEventListener('click', () => moveImageLightbox(-1));
    lightboxNext?.addEventListener('click', () => moveImageLightbox(1));

    lightbox?.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            closeImageLightbox();
        }
    });

    const videoItems = Array.from(document.querySelectorAll('.video-item'));
    const videoLightbox = document.getElementById('videoLightbox');
    const lightboxVideo = document.getElementById('lightboxVideo');
    const videoLightboxTitle = document.getElementById('videoLightboxTitle');
    const videoLightboxDesc = document.getElementById('videoLightboxDesc');
    const videoClose = videoLightbox?.querySelector('.lightbox-close');
    const videoPrev = videoLightbox?.querySelector('.video-nav-prev');
    const videoNext = videoLightbox?.querySelector('.video-nav-next');

    let currentVideoIndex = 0;

    const isVideoLightboxOpen = () => Boolean(videoLightbox?.classList.contains('active'));

    const getVideoMeta = (item, index) => ({
        source: item.querySelector('video'),
        title: item.dataset.title || `Reel ${index + 1}`,
        desc: item.dataset.desc || 'Campaign reel'
    });

    const openVideoLightbox = (index) => {
        if (!videoLightbox || !lightboxVideo || !videoItems[index]) return;

        currentVideoIndex = index;
        const { source, title, desc } = getVideoMeta(videoItems[currentVideoIndex], currentVideoIndex);
        if (!source) return;

        lightboxVideo.src = source.src;
        if (source.poster) {
            lightboxVideo.setAttribute('poster', source.poster);
        } else {
            lightboxVideo.removeAttribute('poster');
        }

        if (videoLightboxTitle) videoLightboxTitle.textContent = title;
        if (videoLightboxDesc) videoLightboxDesc.textContent = desc;

        if (!isVideoLightboxOpen()) {
            scrollLock.lock();
        }

        videoLightbox.classList.add('active');
        videoLightbox.setAttribute('aria-hidden', 'false');
        lightboxVideo.play().catch(() => {});
    };

    const closeVideoLightbox = () => {
        if (!videoLightbox || !lightboxVideo || !isVideoLightboxOpen()) return;

        videoLightbox.classList.remove('active');
        videoLightbox.setAttribute('aria-hidden', 'true');
        lightboxVideo.pause();
        lightboxVideo.currentTime = 0;
        lightboxVideo.removeAttribute('src');
        lightboxVideo.load();

        scrollLock.unlock();
    };

    const moveVideoLightbox = (direction) => {
        if (!videoItems.length || !lightboxVideo) return;

        currentVideoIndex += direction;
        if (currentVideoIndex < 0) currentVideoIndex = videoItems.length - 1;
        if (currentVideoIndex >= videoItems.length) currentVideoIndex = 0;

        const { source, title, desc } = getVideoMeta(videoItems[currentVideoIndex], currentVideoIndex);
        if (!source) return;

        lightboxVideo.src = source.src;
        if (source.poster) {
            lightboxVideo.setAttribute('poster', source.poster);
        } else {
            lightboxVideo.removeAttribute('poster');
        }

        if (videoLightboxTitle) videoLightboxTitle.textContent = title;
        if (videoLightboxDesc) videoLightboxDesc.textContent = desc;
        lightboxVideo.play().catch(() => {});
    };

    videoItems.forEach((item, index) => {
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('aria-label', item.dataset.title || `Open reel ${index + 1}`);

        item.addEventListener('click', () => openVideoLightbox(index));
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                openVideoLightbox(index);
            }
        });
    });

    videoClose?.addEventListener('click', closeVideoLightbox);
    videoPrev?.addEventListener('click', () => moveVideoLightbox(-1));
    videoNext?.addEventListener('click', () => moveVideoLightbox(1));

    videoLightbox?.addEventListener('click', (e) => {
        if (e.target === videoLightbox) {
            closeVideoLightbox();
        }
    });

    const setTab = (tab) => {
        tabButtons.forEach((button) => {
            const isActive = button.dataset.tab === tab;
            button.classList.toggle('active', isActive);
            button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        if (imagesSection) {
            imagesSection.style.display = tab === 'images' ? 'block' : 'none';
        }
        if (videosSection) {
            videosSection.style.display = tab === 'videos' ? 'block' : 'none';
        }

        if (tab !== 'images') {
            closeImageLightbox();
        }
        if (tab !== 'videos') {
            closeVideoLightbox();
        }
    };

    tabButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const tab = button.dataset.tab;
            if (tab === 'images' || tab === 'videos') {
                setTab(tab);
            }
        });
    });

    setTab(tabButtons.find((button) => button.classList.contains('active'))?.dataset.tab || 'images');

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeImageLightbox();
            closeVideoLightbox();
            return;
        }

        if (isImageLightboxOpen()) {
            if (e.key === 'ArrowRight') moveImageLightbox(1);
            if (e.key === 'ArrowLeft') moveImageLightbox(-1);
            return;
        }

        if (isVideoLightboxOpen()) {
            if (e.key === 'ArrowRight') moveVideoLightbox(1);
            if (e.key === 'ArrowLeft') moveVideoLightbox(-1);
        }
    });
});
