/**
 * ULTRA 2026 - ARCHITECTURAL MOTION 3.0
 * Features: Data Decrypt Headline + Engine Ignition Metrics
 */

/* --- 1. DATA DECRYPT (Matrix Style Reveal) --- */
class DataDecrypt {
    constructor() {
        this.scrambleChars = '/>_-\|[]{}*&^%$#@!~';
        this.tagline = document.querySelector('.tagline');
        this.eyebrow = document.querySelector('.hero-eyebrow');
        
        if (this.eyebrow) this.initElement(this.eyebrow, 200, 30);
        if (this.tagline) this.initElement(this.tagline, 600, 10);
    }

    initElement(el, startDelay, speed) {
        // Keep original HTML structure if needed, but for text nodes:
        const originalText = el.innerText;
        el.innerText = '';
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        
        // Break text into spans
        const charSpans = originalText.split('').map(char => {
            const span = document.createElement('span');
            span.style.display = 'inline-block';
            span.style.minWidth = char === ' ' ? '0.3em' : 'auto';
            span.innerText = char; // Set initial char
            span.style.opacity = '0';
            span.dataset.char = char; // Store target char
            el.appendChild(span);
            return span;
        });

        // Start animation loop
        setTimeout(() => {
            charSpans.forEach((span, index) => {
                const charDelay = index * speed;
                setTimeout(() => this.animateChar(span), charDelay);
            });
        }, startDelay);
    }

    animateChar(span) {
        const targetChar = span.dataset.char;
        let frame = 0;
        const maxFrames = 12; // How long to scramble each char

        span.style.opacity = '1';
        span.style.color = '#3B82F6'; // Tech Blue during scramble
        span.style.fontFamily = 'monospace';

        const scrambleInterval = setInterval(() => {
            frame++;
            if (frame < maxFrames) {
                // Show random char
                span.innerText = this.scrambleChars[Math.floor(Math.random() * this.scrambleChars.length)];
            } else {
                // Final Resolve
                clearInterval(scrambleInterval);
                span.innerText = targetChar;
                span.style.color = ''; // Inherit parent gradient
                span.style.fontFamily = ''; // Inherit parent font
                span.style.webkitTextFillColor = ''; // Reset for gradients
            }
        }, 40); // Fast flicker speed
    }
}

/* --- 2. ENGINE IGNITION (Impact Metrics) --- */
class IgnitionMetrics {
    constructor() {
        this.metrics = document.querySelectorAll('.metric-block');
        if (this.metrics.length > 0) {
            this.init(2000); // Start after headline
        }
    }

    init(startDelay) {
        this.metrics.forEach((el, index) => {
            // Prepare State: Invisible & Huge
            el.style.opacity = '0';
            el.style.transform = 'scale(2)';
            el.style.filter = 'blur(10px)';
            
            // Staggered Impact
            setTimeout(() => {
                this.ignite(el);
            }, startDelay + (index * 300));
        });
    }

    ignite(el) {
        // Impact Frame
        el.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
        el.style.filter = 'blur(0px) brightness(2)'; // Flash Bright

        // Cool down frame
        setTimeout(() => {
            el.style.transition = 'filter 0.6s ease-out';
            el.style.filter = 'blur(0px) brightness(1)'; // Normal
        }, 400);
    }
}

/* --- 3. DRAGGABLE MARQUEE (Preserved) --- */
class DraggableMarquee {
    constructor(element) {
        this.container = element;
        this.track = element.querySelector('.marquee-track');
        if (!this.track) return;

        this.baseSpeed = parseFloat(element.dataset.speed) || -0.5;
        this.speed = this.baseSpeed;
        this.pos = 0;
        this.isDragging = false;
        this.startX = 0;
        this.lastX = 0;
        this.velocity = 0;
        
        this.ensureContentWidth();
        this.initEvents();
        this.animate();
    }

    ensureContentWidth() {
        const trackWidth = this.track.scrollWidth;
        const containerWidth = this.container.offsetWidth;
        if (trackWidth < containerWidth * 2) {
            this.track.innerHTML += this.track.innerHTML;
        }
    }

    initEvents() {
        this.container.addEventListener('mousedown', (e) => this.startDrag(e.clientX));
        window.addEventListener('mousemove', (e) => this.onDrag(e.clientX));
        window.addEventListener('mouseup', () => this.endDrag());
        this.container.addEventListener('touchstart', (e) => this.startDrag(e.touches[0].clientX));
        window.addEventListener('touchmove', (e) => this.onDrag(e.touches[0].clientX));
        window.addEventListener('touchend', () => this.endDrag());
        this.track.style.animation = 'none';
    }

    startDrag(x) {
        this.isDragging = true;
        this.startX = x;
        this.lastX = x;
        this.container.style.cursor = 'grabbing';
        this.velocity = 0;
    }

    onDrag(x) {
        if (!this.isDragging) return;
        const delta = x - this.lastX;
        this.lastX = x;
        this.pos += delta;
        this.velocity = delta;
    }

    endDrag() {
        this.isDragging = false;
        this.container.style.cursor = 'grab';
    }

    animate() {
        if (!this.isDragging) {
            this.velocity *= 0.95; 
            if (Math.abs(this.velocity) < Math.abs(this.baseSpeed)) {
               this.velocity = this.velocity * 0.95 + this.baseSpeed * 0.05;
            }
            this.pos += this.velocity;
        }
        const trackWidth = this.track.scrollWidth / 2;
        if (this.pos <= -trackWidth) this.pos += trackWidth;
        else if (this.pos > 0) this.pos -= trackWidth;

        this.track.style.transform = `translateX(${this.pos}px)`;
        requestAnimationFrame(() => this.animate());
    }
}

// System Boot
document.addEventListener('DOMContentLoaded', () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    
    console.log("System 3.0: Online");
    new DataDecrypt();
    new IgnitionMetrics();

    const marquees = document.querySelectorAll('.marquee-container');
    marquees.forEach(m => new DraggableMarquee(m));
});