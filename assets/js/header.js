/**
 * PREMIUM HEADER - JavaScript
 * Interactive header with navigation and mobile menu
 */

document.addEventListener('DOMContentLoaded', () => {
    const ensureScrollLock = () => {
        if (window.MGScrollLock) return window.MGScrollLock;
        const getCount = () => parseInt(document.body.dataset.scrollLockCount || '0', 10) || 0;
        const setCount = (val) => {
            document.body.dataset.scrollLockCount = String(val);
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

    // ============================================
    // 3. ANIMATED INDICATOR
    // ============================================
    const indicator = document.querySelector('.nav-indicator');

    function updateIndicator(activeLink) {
        if (!indicator || !activeLink) return;

        const linkRect = activeLink.getBoundingClientRect();
        const navRect = activeLink.closest('.header-nav')?.getBoundingClientRect() || { left: 0 };

        const left = linkRect.left - navRect.left;
        const width = linkRect.width;

        indicator.style.left = `${left}px`;
        indicator.style.width = `${width}px`;
    }

    // ============================================
    // 1. STICKY HEADER ON SCROLL
    // ============================================

    const header = document.querySelector('.site-header');
    let ticking = false;

    // The user's instruction implies adding passive: true, but it's already present.
    // The provided code snippet suggests a different implementation for the sticky header.
    // I will replace the existing sticky header logic with the one provided in the instruction,
    // ensuring 'passive: true' is set for the scroll listener.
    // Note: 'siteHeader' and 'lastScroll' are not defined in the original code.
    // I will assume 'siteHeader' should refer to 'header' and 'lastScroll' is not needed
    // for this specific implementation, or should be defined if intended for other uses.
    // I will use 'header' instead of 'siteHeader' to match existing variable names.

    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

        if (scrollTop > 60) {
            header?.classList.add('scrolled');
        } else {
            header?.classList.remove('scrolled');
        }
    }, { passive: true });

    // ============================================
    // 2. ACTIVE LINK DETECTION
    // ============================================
    const navLinks = document.querySelectorAll('.nav-link');

    const normalizePath = (path) => {
        if (!path) return '';
        let normalized = path;

        try {
            normalized = new URL(path, window.location.href).pathname;
        } catch (err) {
            normalized = path;
        }

        normalized = normalized.replace(/\/index\.html$/, '');
        if (normalized.length > 1 && normalized.endsWith('/')) {
            normalized = normalized.slice(0, -1);
        }

        return normalized;
    };

    const currentPath = normalizePath(window.location.pathname);

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href || href.startsWith('#')) {
            return;
        }

        const linkPath = normalizePath(href);

        // Check if current page matches link
        if (linkPath && currentPath === linkPath) {
            link.classList.add('active');
        }

        // Update indicator position
        if (link.classList.contains('active')) {
            updateIndicator(link);
        }
    });

    // Update indicator on hover
    navLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            updateIndicator(link);
        });
    });

    // Reset to active link on mouse leave
    const headerNav = document.querySelector('.header-nav');
    headerNav?.addEventListener('mouseleave', () => {
        const activeLink = document.querySelector('.nav-link.active');
        updateIndicator(activeLink);
    });

    // ============================================
    // 4. MOBILE MENU TOGGLE
    // ============================================

    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNav = document.querySelector('.header-nav');
    const headerContainer = document.querySelector('.header-container');
    let mobileOverlay = document.querySelector('.mobile-overlay');

    // Create overlay if it doesn't exist
    if (!mobileOverlay && mobileToggle) {
        mobileOverlay = document.createElement('div');
        mobileOverlay.className = 'mobile-overlay';
        document.body.appendChild(mobileOverlay);
    }

    const toggleMobileMenu = () => {
        mobileToggle?.classList.toggle('active');
        mobileNav?.classList.toggle('mobile-open');
        headerContainer?.classList.toggle('nav-open');
        mobileOverlay?.classList.toggle('active');

        const isOpen = mobileNav?.classList.contains('mobile-open') || headerContainer?.classList.contains('nav-open');
        if (mobileToggle) {
            mobileToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }

        document.body.classList.toggle('nav-open', Boolean(isOpen));
        if (isOpen) {
            scrollLock.lock();
        } else {
            scrollLock.unlock();
        }
    };

    mobileToggle?.addEventListener('click', toggleMobileMenu);
    mobileOverlay?.addEventListener('click', toggleMobileMenu);

    // Close mobile menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                toggleMobileMenu();
            }
        });
    });

    // Close mobile menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileNav?.classList.contains('mobile-open')) {
            toggleMobileMenu();
        }
    });

    // ============================================
    // 5. SMOOTH SCROLL TO SECTIONS
    // ============================================

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            // Only smooth scroll for same-page anchors
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const target = document.querySelector(href);

                if (target) {
                    const headerHeight = header?.offsetHeight || 80;
                    const targetPosition = target.offsetTop - headerHeight - 20;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // ============================================
    // 6. RESIZE HANDLER
    // ============================================

    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            // Close mobile menu if window is resized to desktop
            if (window.innerWidth > 768 && mobileNav?.classList.contains('mobile-open')) {
                toggleMobileMenu();
            }

            // Update indicator position
            const activeLink = document.querySelector('.nav-link.active');
            updateIndicator(activeLink);
        }, 250);
    });

    // ============================================
    // 7. MAGNETIC HOVER EFFECT (Optional)
    // ============================================

    if (window.innerWidth > 768) {
        navLinks.forEach(link => {
            link.addEventListener('mousemove', (e) => {
                const rect = link.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                const centerX = rect.width / 2;
                const centerY = rect.height / 2;

                const deltaX = (x - centerX) / centerX;
                const deltaY = (y - centerY) / centerY;

                // Subtle magnetic pull (max 3px)
                const moveX = deltaX * 3;
                const moveY = deltaY * 3;

                link.style.transform = `translate(${moveX}px, ${moveY}px)`;
            });

            link.addEventListener('mouseleave', () => {
                link.style.transform = 'translate(0, 0)';
            });
        });
    }

});
