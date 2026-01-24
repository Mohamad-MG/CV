/**
 * ULTRA 2026 - ARCHITECTURAL MOTION 2.0
 * Kinetic Character Morphing + Cybernetic Flash
 */

class ArchitectMotion {
    constructor() {
        this.scrambleChars = '!<>-_\/[]{}—=+*^?#________';
        this.eyebrow = document.querySelector('.hero-eyebrow');
        this.tagline = document.querySelector('.tagline');
        
        if (this.eyebrow) this.initElement(this.eyebrow, 500);
        if (this.tagline) this.initElement(this.tagline, 1200);
    }

    initElement(el, startDelay) {
        const originalText = el.innerText;
        el.innerText = '';
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        
        // Break text into spans
        const charSpans = originalText.split('').map(char => {
            const span = document.createElement('span');
            span.style.display = 'inline-block';
            span.style.minWidth = char === ' ' ? '0.3em' : 'auto';
            span.innerText = char;
            span.style.opacity = '0';
            el.appendChild(span);
            return {
                span: span,
                char: char,
                revealed: false
            };
        });

        setTimeout(() => {
            charSpans.forEach((obj, index) => {
                const delay = Math.random() * 800 + (index * 30); // Random stagger
                this.animateChar(obj, delay);
            });
        }, startDelay);
    }

    animateChar(obj, delay) {
        const duration = 600; // Scramble duration
        let start = null;

        const step = (timestamp) => {
            if (!start) start = timestamp;
            const elapsed = timestamp - start;

            if (elapsed < delay) {
                requestAnimationFrame(step);
                return;
            }

            const progress = (elapsed - delay) / duration;

            if (progress < 1) {
                obj.span.style.opacity = '1';
                obj.span.innerText = this.scrambleChars[Math.floor(Math.random() * this.scrambleChars.length)];
                obj.span.className = 'scrambling-char';
                requestAnimationFrame(step);
            } else {
                obj.span.innerText = obj.char;
                obj.span.className = 'char-flash';
                obj.revealed = true;
            }
        };

        requestAnimationFrame(step);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    new ArchitectMotion();
});