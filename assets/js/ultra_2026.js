/**
 * ULTRA 2026 - SYSTEM CORE
 * Combined Logic for: Motion, Data Decrypt, Metrics, Marquee, and Interaction.
 */

// --- 1. DATA DECRYPT (Matrix Style Reveal) ---
class DataDecrypt {
    constructor() {
        this.scrambleChars = '/>_-\|[]{}*&^%$#@!~';
        this.tagline = document.querySelector('.tagline');
        this.eyebrow = document.querySelector('.hero-eyebrow');
        
        if (this.eyebrow) this.initElement(this.eyebrow, 200, 30);
        if (this.tagline) this.initElement(this.tagline, 600, 15);
    }

    initElement(el, startDelay, speed) {
        if (!el) return;
        const originalText = el.innerText;
        el.innerText = '';
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        
        // Break text into spans
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
        const maxFrames = 12;

        span.style.opacity = '1';
        span.style.color = '#3B82F6';
        span.style.fontFamily = 'monospace';

        const scrambleInterval = setInterval(() => {
            frame++;
            if (frame < maxFrames) {
                span.innerText = this.scrambleChars[Math.floor(Math.random() * this.scrambleChars.length)];
            } else {
                clearInterval(scrambleInterval);
                span.innerText = targetChar;
                span.style.color = '';
                span.style.fontFamily = '';
                span.style.webkitTextFillColor = '';
            }
        }, 40);
    }
}

// --- 2. ENGINE IGNITION (Impact Metrics) ---
class IgnitionMetrics {
    constructor() {
        this.metrics = document.querySelectorAll('.metric-block');
        if (this.metrics.length > 0) {
            this.init(2500); // Wait for decrypt to finish
        }
    }

    init(startDelay) {
        this.metrics.forEach((el, index) => {
            // Initial State
            el.style.opacity = '0';
            el.style.transform = 'scale(2)';
            el.style.filter = 'blur(10px)';
            el.style.transition = 'none'; // Prevent transition on setup
            
            setTimeout(() => {
                this.ignite(el);
            }, startDelay + (index * 200));
        });
    }

    ignite(el) {
        // Slam Down
        el.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        el.style.opacity = '1';
        el.style.transform = 'scale(1)';
        el.style.filter = 'blur(0px) brightness(2)'; // Flash

        // Cool Down
        setTimeout(() => {
            el.style.transition = 'filter 0.6s ease-out';
            el.style.filter = 'blur(0px) brightness(1)';
        }, 400);
    }
}

// --- 3. DRAGGABLE MARQUEE (Physics Based) ---
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
        // Duplicate content until it fills screen + buffer
        if (trackWidth < containerWidth * 3) {
            this.track.innerHTML += this.track.innerHTML;
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
        this.track.style.animation = 'none'; // Disable CSS animation
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
            // Return to base speed
            this.velocity *= 0.95; 
            if (Math.abs(this.velocity) < Math.abs(this.baseSpeed)) {
               this.velocity = this.velocity * 0.95 + this.baseSpeed * 0.05;
            }
            this.pos += this.velocity;
        }
        
        // Infinite Loop Logic
        const trackWidth = this.track.scrollWidth / 3; // Assuming tripled content
        if (this.pos <= -trackWidth) this.pos += trackWidth;
        else if (this.pos > 0) this.pos -= trackWidth;

        this.track.style.transform = `translateX(${this.pos}px)`;
        requestAnimationFrame(() => this.animate());
    }
}

// --- 4. 3D TILT EFFECT (Identity Card) ---
const initTilt = () => {
    const card = document.querySelector('.tilt-3d');
    if (!card) return;

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        // Calculate rotation (Max 15deg)
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
};

// --- 5. SCROLL REVEAL (Staggered) ---
const initScrollReveal = () => {
    const elements = document.querySelectorAll('.reveal, .stagger-item');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    elements.forEach(el => observer.observe(el));
};

// --- 6. VIDEO PLAYER ---
const initVideo = () => {
    const videoScreen = document.querySelector('.ipad-screen'); // Using class for safety
    const video = document.getElementById('showreelVideo');
    if (!videoScreen || !video) return;

    videoScreen.addEventListener('click', () => {
        if (video.paused) video.play();
        else video.pause();
    });
};

// --- MASTER BOOT ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("System 3.2: Online");
    
    // Core Motion
    new DataDecrypt();
    new IgnitionMetrics();
    
    // Marquees
    document.querySelectorAll('.marquee-container').forEach(m => new DraggableMarquee(m));
    
    // Interaction
    initTilt();
    initScrollReveal();
    initVideo();
});