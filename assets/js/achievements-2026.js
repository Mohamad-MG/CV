/**
 * ULTRA 2026 - ARCHIVE SYSTEM CORE v3.0
 * Pure Kinetic Motion & Scroll Intelligence.
 */

class AchievementsEngine {
    constructor() {
        this.initKineticText();
        this.initScrollReveal();
        this.initMetricCounters();
        this.initMouseInteractions();
    }

    // --- 1. KINETIC TYPOGRAPHY ---
    initKineticText() {
        const elements = document.querySelectorAll('.kinetic-text');
        elements.forEach(el => {
            const text = el.innerText.trim();
            el.innerHTML = '';
            el.style.opacity = '1';
            el.style.visibility = 'visible';

            text.split(/\s+/).forEach((word, wordIdx) => {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'word';
                word.split('').forEach((char, charIdx) => {
                    const charSpan = document.createElement('span');
                    charSpan.className = 'char';
                    charSpan.innerText = char;
                    charSpan.style.transitionDelay = `${(wordIdx * 0.08) + (charIdx * 0.02)}s`;
                    wordSpan.appendChild(charSpan);
                });
                el.appendChild(wordSpan);
                el.appendChild(document.createTextNode(' '));
            });
        });
    }

    // --- 2. SCROLL REVEAL ---
    initScrollReveal() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.15 });

        document.querySelectorAll('.reveal, .ledger-card, .path-item').forEach(el => observer.observe(el));
    }

    // --- 3. METRIC COUNTERS ---
    initMetricCounters() {
        const animateValue = (el, start, end, duration) => {
            let startTimestamp = null;
            const step = (timestamp) => {
                if (!startTimestamp) startTimestamp = timestamp;
                const progress = Math.min((timestamp - startTimestamp) / duration, 1);
                const value = Math.floor(progress * (end - start) + start);
                
                // Add formatting based on context
                if (el.innerText.includes('$')) {
                    el.innerHTML = `$${value}M`;
                } else if (el.innerText.includes('%')) {
                    el.innerHTML = `${value}%`;
                } else if (el.innerText.includes('Y')) {
                    el.innerHTML = `${value}Y+`;
                } else {
                    el.innerHTML = value;
                }

                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };
            window.requestAnimationFrame(step);
        };

        const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !entry.target.dataset.animated) {
                    const target = entry.target;
                    const endVal = parseInt(target.innerText.replace(/[^0-9]/g, ''));
                    animateValue(target, 0, endVal, 2000);
                    target.dataset.animated = "true";
                }
            });
        }, { threshold: 1 });

        document.querySelectorAll('.h-val').forEach(el => obs.observe(el));
    }

    // --- 4. MOUSE MICRO-INTERACTIONS (No 3D) ---
    initMouseInteractions() {
        window.addEventListener('mousemove', (e) => {
            const { clientX, clientY } = e;
            
            // Subtle glow movement for cards
            document.querySelectorAll('.ledger-card').forEach(card => {
                const rect = card.getBoundingClientRect();
                const x = clientX - rect.left;
                const y = clientY - rect.top;
                card.style.setProperty('--mouse-x', `${x}px`);
                card.style.setProperty('--mouse-y', `${y}px`);
                
                // Update reflection/glow
                const glow = card.querySelector('.card-glow');
                if (glow) {
                    glow.style.transform = `translate(${(clientX - window.innerWidth/2) * 0.02}px, ${(clientY - window.innerHeight/2) * 0.02}px)`;
                }
            });
        });

        // --- GRID MAP INTERACTION ---
        const nodes = document.querySelectorAll('.grid-node');
        const hudMarket = document.getElementById('hudMarket');
        
        nodes.forEach(node => {
            node.addEventListener('mouseenter', () => {
                // Reset active class
                nodes.forEach(n => n.classList.remove('active'));
                node.classList.add('active');
                
                // Update HUD
                const marketName = node.getAttribute('data-market');
                if (hudMarket) {
                    hudMarket.style.opacity = 0;
                    setTimeout(() => {
                        hudMarket.innerText = marketName;
                        hudMarket.style.opacity = 1;
                    }, 150);
                }
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AchievementsEngine();
});
