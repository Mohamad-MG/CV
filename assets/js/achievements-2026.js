/**
 * ULTRA 2026 - ARCHIVE SYSTEM CORE
 * Refined for the Strategic Archive / Achievements Page.
 */

// --- 1. KINETIC TEXT ENGINE ---
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
                word.split('').forEach((char, charIdx) => {
                    const charSpan = document.createElement('span');
                    charSpan.className = 'char';
                    charSpan.innerText = char;
                    charSpan.style.transitionDelay = `${(wordIdx * 0.05) + (charIdx * 0.02)}s`;
                    wordSpan.appendChild(charSpan);
                });
                el.appendChild(wordSpan);
                if (wordIdx < words.length - 1) el.appendChild(document.createTextNode(' '));
            });
        });
    }
}

// --- 2. DATA DECRYPT (For Hero Eyebrow) ---
class DataDecrypt {
    constructor() {
        this.scrambleChars = '/>_-\|[]{}*&^%$#@!~';
        this.eyebrow = document.querySelector('.hero-eyebrow');
        if (this.eyebrow) this.initElement(this.eyebrow, 400, 30);
    }

    initElement(el, startDelay, speed) {
        const originalText = el.innerText;
        el.innerText = '';
        el.style.opacity = '1';
        el.style.visibility = 'visible';

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

        setTimeout(() => {
            charSpans.forEach((span, index) => {
                setTimeout(() => this.animateChar(span), index * speed);
            });
        }, startDelay);
    }

    animateChar(span) {
        const targetChar = span.dataset.char;
        let frame = 0;
        const maxFrames = 10;
        span.style.opacity = '1';
        span.style.color = '#3B82F6';
        const scrambleInterval = setInterval(() => {
            frame++;
            if (frame < maxFrames) {
                span.innerText = this.scrambleChars[Math.floor(Math.random() * this.scrambleChars.length)];
            } else {
                clearInterval(scrambleInterval);
                span.innerText = targetChar;
                span.style.color = '';
            }
        }, 40);
    }
}

// --- 3. SPATIAL DEPTH (Mouse Parallax) ---
const initSpatialDepth = () => {
    const glassPanels = document.querySelectorAll('.quantum-card, .gwr-monolith, .flow-content');
    const bgVoid = document.querySelector('.bg-void-layer');
    const bgAmbient = document.querySelector('.bg-ambient-glow');

    window.addEventListener('mousemove', (e) => {
        const { clientX, clientY } = e;
        const xPct = (clientX / window.innerWidth - 0.5) * 2;
        const yPct = (clientY / window.innerHeight - 0.5) * 2;

        if (bgVoid) bgVoid.style.transform = `translate3d(${xPct * -10}px, ${yPct * -10}px, 0)`;
        if (bgAmbient) bgAmbient.style.transform = `translate3d(${xPct * 20}px, ${yPct * 20}px, 0)`;

        glassPanels.forEach(panel => {
            const rect = panel.getBoundingClientRect();
            const px = clientX - rect.left;
            const py = clientY - rect.top;
            
            // Reflections
            panel.style.setProperty('--reflect-x', `${(px / rect.width) * 100}%`);
            panel.style.setProperty('--reflect-y', `${(py / rect.height) * 100}%`);
            
            // 3D Tilt for Quantum Cards
            if (panel.classList.contains('quantum-card')) {
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = (py - centerY) / 30;
                const rotateY = (centerX - px) / 30;
                panel.style.transform = `translateY(-5px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
            }
        });
    });
};

// --- 4. GWR MONOLITH SPECIAL EFFECT ---
const initMonolith = () => {
    const monolith = document.querySelector('.gwr-monolith');
    if (!monolith) return;

    monolith.addEventListener('mousemove', (e) => {
        const rect = monolith.getBoundingClientRect();
        const x = e.clientX - rect.left;
        monolith.style.setProperty('--scan-pos', `${x}px`);
    });
};

// --- 5. SCROLL REVEAL ENGINE ---
const initScrollReveal = () => {
    const elements = document.querySelectorAll('.reveal, .stagger-item, .flow-node');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                // observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    elements.forEach(el => observer.observe(el));
};

// --- BOOT SYSTEM ---
document.addEventListener('DOMContentLoaded', () => {
    new KineticText();
    new DataDecrypt();
    initSpatialDepth();
    initMonolith();
    initScrollReveal();
    
    // Initial Hero Entrance
    setTimeout(() => {
        const hero = document.querySelector('.archive-hero');
        if (hero) hero.classList.add('visible');
    }, 100);
});