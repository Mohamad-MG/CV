/**
 * 🚀 CAPTAIN JIMMY: CORE PRODUCT ENGINE (v4.0)
 * Architecture: Event-Driven State Machine
 * UX: Focus Trap, Zero-Friction, Immersive
 */

const J_CORE = {
    endpoints: {
        worker: 'https://mg-ai-proxy.emarketbank.workers.dev/chat'
    },
    config: {
        maxHistory: 20,
        timeout: 12000,
        videoSrc: 'assistance.gif', // Updated to new GIF
        version: '4.4.0'
    },
    // Fallback UI texts
    i18n: {
        en: { status: "Captain Jimmy", placeholder: "Ask me anything...", error: "Connection interrupted." },
        ar: { status: "كابتن جيمي", placeholder: "اكتب سؤالك هنا...", error: "انقطع الاتصال." }
    }
};

class JimmyEngine {
    constructor() {
        this.isMobileLite =
            window.matchMedia('(max-width: 768px)').matches ||
            window.matchMedia('(pointer: coarse)').matches;
        this.ctx = {
            isOpen: false,
            isThinking: false,
            messages: [],       // Runtime display messages
            thread: [],         // API context history
            meta: {},           // Worker metadata (lang, dialect, tools)
            lang: document.documentElement.lang === 'ar' ? 'ar' : 'en'
        };

        // Cache DOM elements strictly
        this.dom = {};

        this.init();
    }

    init() {
        this.injectStructure();
        this.cacheDOM();
        this.bindInteractions();

        // Initial "Summon" state check
        // (Optional: Auto-open if query param exists?)
    }

    injectStructure() {
        const t = J_CORE.i18n[this.ctx.lang];
        // Determine base path for assets based on current location
        const isPortfolio = window.location.pathname.includes('/portfolio/') || window.location.pathname.includes('/achievements/');
        const assetPrefix = isPortfolio ? '../' : './';
        const avatarSrc = `${assetPrefix}assistance.gif`;

        // Unified Avatar (GIF for consistent branding)
        const avatarMedia = `<img src="${avatarSrc}" alt="Captain Jimmy" loading="eager" decoding="async">`;

        // Launcher uses the same GIF
        const launcherMedia = `<img src="${avatarSrc}" alt="Open Jimmy" loading="lazy" decoding="async">`;

        const html = `
            <div id="jimmy-root" aria-hidden="true">
                <!-- 1. BACKDROP (Click to close) -->
                <div id="j-backdrop" class="j-console-backdrop"></div>

                <!-- 2. CONSOLE (Center Stage) -->
                <div id="j-console" class="j-console" role="dialog" aria-modal="true" aria-hidden="true">
                    
                    <!-- Header -->
                    <div class="j-header">
                        <div class="j-identity">
                            <div class="j-avatar-sm">
                                ${avatarMedia}
                            </div>
                            <div class="j-hud-data">
                                <span class="j-title">${t.status}</span>
                                <div class="j-hud-meta">
                                    <span id="j-ping">PING: --ms</span>
                                    <span>V.${J_CORE.config.version}</span>
                                </div>
                            </div>
                            <div class="j-status-pulse"></div>
                        </div>
                        <div class="j-actions">
                            <button id="j-close" class="j-btn-icon" aria-label="Close Console">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
                            </button>
                        </div>
                    </div>

                    <!-- Stream -->
                    <div id="j-stream" class="j-stream"></div>

                    <!-- Input / Trap -->
                    <div class="j-footer">
                        <div id="j-chips" class="j-chips-rail"></div>
                        <div class="j-input-scaffold">
                            <textarea id="j-input" class="j-textarea" rows="1" placeholder="${t.placeholder}"></textarea>
                            <button id="j-send" class="j-send-btn" aria-label="Send">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 3. LAUNCHER (The Summoner) -->
                <div id="j-launcher" class="j-launcher" role="button" tabindex="0" aria-label="Summon Jimmy" aria-controls="j-console" aria-expanded="false">
                    ${launcherMedia}
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    cacheDOM() {
        const get = (id) => document.getElementById(id);
        this.dom = {
            root: get('jimmy-root'),
            launcher: get('j-launcher'),
            console: get('j-console'),
            backdrop: get('j-backdrop'),
            stream: get('j-stream'),
            input: get('j-input'),
            send: get('j-send'),
            close: get('j-close'),
            chips: get('j-chips'),
            ping: get('j-ping')
        };
    }

    bindInteractions() {
        // Core Toggle
        const toggle = () => this.setOpen(!this.ctx.isOpen);
        this.dom.launcher.onclick = toggle;
        this.dom.launcher.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggle();
            }
        });
        this.dom.close.onclick = toggle;
        this.dom.backdrop.onclick = toggle;

        // Input Handling (Auto-grow + Smart RTL + Enter)
        this.dom.input.addEventListener('input', (e) => {
            const val = e.target.value;
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';

            // Smart RTL Detection
            const isArabic = /[\u0600-\u06FF]/.test(val);
            e.target.dir = isArabic ? 'rtl' : 'ltr';
            e.target.classList.toggle('is-rtl', isArabic);
        });

        this.dom.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleSend();
            }
        });

        // Send Button
        this.dom.send.onclick = () => this.handleSend();

        // Focus Trap (Desktop specific)
        this.dom.root.addEventListener('keydown', (e) => {
            if (!this.ctx.isOpen) return;
            if (e.key === 'Escape') this.setOpen(false);
        });

        // Mobile Pull/Swipe Logic (Simple Dismiss)
        // Note: For product robustness, we rely on the close button/backdrop mostly,
        // but swipe-down on header is a nice-to-have.
        let touchStart = 0;
        const header = this.dom.console.querySelector('.j-header');
        header.addEventListener('touchstart', e => touchStart = e.touches[0].clientY, { passive: true });
        header.addEventListener('touchmove', e => {
            if (e.touches[0].clientY - touchStart > 80) this.setOpen(false);
        }, { passive: true });

        // HUD: Ping Loop
        setInterval(() => {
            if (this.ctx.isOpen) {
                const ms = Math.floor(Math.random() * 40) + 20;
                if (this.dom.ping) this.dom.ping.textContent = `PING: ${ms}ms`;
            }
        }, 3000);

        // Subtile Parallax (5% Intensity)
        if (!this.isMobileLite) {
            window.addEventListener('mousemove', (e) => this.handleParallax(e));
        }
    }

    handleParallax(e) {
        if (!this.ctx.isOpen || window.innerWidth < 1000) return;
        const x = (window.innerWidth / 2 - e.pageX) / 350;
        const y = (window.innerHeight / 2 - e.pageY) / 350;
        this.dom.console.style.transform = `translate(-50%, -50%) rotateY(${x}deg) rotateX(${-y}deg)`;
    }

    setOpen(shouldOpen) {
        this.ctx.isOpen = shouldOpen;
        this.dom.launcher.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        this.dom.console.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');

        // Notify System
        document.body.classList.toggle('ai-open', shouldOpen);
        window.dispatchEvent(new CustomEvent('jimmy:toggle', { detail: { isOpen: shouldOpen } }));

        if (shouldOpen) {
            this.dom.root.classList.add('is-open');
            this.dom.launcher.classList.add('active');
            this.dom.root.setAttribute('aria-hidden', 'false');

            // Force clean transform to kill any ghost movement
            this.dom.console.style.transform = '';

            // Focus Trap: Aggressively grab focus
            requestAnimationFrame(() => this.dom.input.focus());

            // Greeting if empty
            if (this.ctx.messages.length === 0) {
                this.addMessage('ai', this.ctx.lang === 'ar' ? 'أهلاً يا صديقي.. معاك كابتن جيمي، جاهز لأي سؤال.' : 'Systems Online. Captain Jimmy at your service.');
                this.renderChips(this.ctx.lang === 'ar' ? ['من أنت؟', 'تحليل الموقع', 'تحميل السيرة الذاتية'] : ['Who are you?', 'Audit Site', 'Download CV']);
            }
        } else {
            this.dom.root.classList.remove('is-open');
            this.dom.launcher.classList.remove('active');
            this.dom.root.setAttribute('aria-hidden', 'true');
            this.dom.launcher.focus();
        }
    }

    /* --- MESSAGING & NETWORK --- */

    renderSafeText(target, text) {
        const value = typeof text === 'string' ? text : String(text ?? '');
        const lines = value.split('\n');
        target.textContent = '';

        lines.forEach((line, index) => {
            if (index > 0) {
                target.appendChild(document.createElement('br'));
            }
            target.appendChild(document.createTextNode(line));
        });
    }

    async handleSend(textOverride = null) {
        const text = textOverride || this.dom.input.value.trim();
        // Allow sending even if thinking (queueing) could be complex, 
        // but for now, just ensure the check doesn't lag. 
        if (!text || this.ctx.isThinking) return;

        // 1. INSTANT UI UPDATE (Zero Latency)
        this.dom.input.value = '';
        this.dom.input.style.height = 'auto'; // Reset grow
        this.dom.input.focus(); // Keep focus
        this.renderChips([]); // Clear chips instantly

        // Render User Message IMMEDIATELY
        this.addMessage('user', text);

        // 2. Set State & Trigger Network
        this.setThinking(true);

        try {
            // Build Payload
            const payload = {
                messages: this.ctx.thread.map(m => ({
                    role: m.role === 'ai' ? 'assistant' : 'user',
                    content: m.text
                })),
                meta: this.ctx.meta
            };

            const controller = new AbortController();
            const toId = setTimeout(() => controller.abort(), J_CORE.config.timeout);

            const res = await fetch(J_CORE.endpoints.worker, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(toId);

            if (!res.ok) {
                let detail = '';
                try {
                    const errJson = await res.json();
                    detail = errJson?.details || errJson?.error || '';
                } catch {
                    try { detail = (await res.text() || '').trim(); } catch { }
                }
                const err = new Error(`HTTP ${res.status}${detail ? ` - ${detail}` : ''}`);
                err.status = res.status;
                err.detail = detail;
                throw err;
            }
            const data = await res.json();

            if (data.meta) this.ctx.meta = data.meta;

            this.setThinking(false);
            this.addMessage('ai', data.response);

            if (data.meta?.quickReplies) {
                this.renderChips(data.meta.quickReplies);
            }

        } catch (err) {
            console.error('Jimmy Error:', err);
            this.setThinking(false);
            this.addMessage('ai', this.mapErrorToUserMessage(err), true);
        }
    }

    mapErrorToUserMessage(err) {
        const lang = this.ctx.lang;
        const status = Number(err?.status || 0);
        const detail = String(err?.detail || err?.message || '').toLowerCase();

        if (status === 429 || detail.includes('quota')) {
            return lang === 'ar'
                ? 'الخدمة وصلت حد الاستخدام الحالي. جرّب تاني بعد شوية.'
                : 'Usage quota is currently exhausted. Please retry shortly.';
        }
        if (status === 401 || status === 403) {
            return lang === 'ar'
                ? 'الاتصال مرفوض من السيرفر. محتاج مراجعة إعدادات الحماية.'
                : 'Request blocked by server security settings.';
        }
        if (detail.includes('not found') && detail.includes('model')) {
            return lang === 'ar'
                ? 'في مشكلة إعدادات بالموديل على السيرفر (Model not found).'
                : 'Server model configuration error (model not found).';
        }
        if (status === 502 || status === 503) {
            return lang === 'ar'
                ? 'الخدمة مش متاحة حالياً من مزود الذكاء. حاول بعد دقائق.'
                : 'AI upstream is temporarily unavailable. Try again in a few minutes.';
        }
        return J_CORE.i18n[lang].error;
    }

    setThinking(isThinking) {
        this.ctx.isThinking = isThinking;
        this.dom.root.classList.toggle('is-thinking', isThinking);

        // Remove existing typing indicator
        const existing = this.dom.stream.querySelector('.j-typing');
        if (existing) existing.remove();

        if (isThinking) {
            const html = `
                <div class="j-msg-row ai j-typing">
                    <div class="j-dot"></div><div class="j-dot"></div><div class="j-dot"></div>
                </div>
            `;
            this.dom.stream.insertAdjacentHTML('beforeend', html);
            this.scrollToBottom();
        }
    }

    addMessage(role, text, isError = false) {
        const row = document.createElement('div');
        row.className = `j-msg-row ${role}`;

        // Dynamic Alignment for User based on Alphabet
        if (role === 'user') {
            const isArabic = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(text);
            row.classList.add(isArabic ? 'is-rtl' : 'is-ltr');
        }

        const idRow = document.createElement('div');
        idRow.className = 'j-row-identity';

        const iconBox = document.createElement('div');
        iconBox.className = 'j-row-icon';

        // User-Provided Identity Icons (v3)
        if (role === 'ai') {
            // Jimmy: New Simplified SVG provided by user
            iconBox.innerHTML = `
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11 1v1H7a3 3 0 0 0-3 3v3a5 5 0 0 0 5 5h6a5 5 0 0 0 5-5V5a3 3 0 0 0-3-3h-4V1zM6 5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3zm3.5 4a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3m5 0a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3M6 22a6 6 0 0 1 12 0h2a8 8 0 1 0-16 0z"/>
                </svg>`;
            iconBox.classList.add('is-bot');
        } else {
            // User: Provided SVG
            iconBox.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <g>
                        <circle cx="10" cy="6" r="4"/>
                        <path d="M18 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S5.582 13 10 13s8 2.015 8 4.5Z"/>
                        <path stroke-linecap="round" d="M19 2s2 1.2 2 4s-2 4-2 4m-2-6s1 .6 1 2s-1 2-1 2"/>
                    </g>
                </svg>`;
        }

        idRow.appendChild(iconBox);
        row.appendChild(idRow);

        const bubble = document.createElement('div');
        bubble.className = 'j-bubble';

        if (isError) {
            bubble.style.color = '#ef4444';
            bubble.style.border = '1px solid rgba(239, 68, 68, 0.3)';
            bubble.textContent = text;
            const retry = document.createElement('button');
            retry.textContent = "Retry";
            retry.style.cssText = "display:block; margin-top:8px; background:rgba(255,255,255,0.1); border:none; color:#fff; padding:4px 12px; border-radius:4px; cursor:pointer;";
            retry.onclick = () => this.handleSend(this.ctx.thread[this.ctx.thread.length - 1]?.text);
            bubble.appendChild(retry);
        } else {
            this.renderSafeText(bubble, text);
        }

        row.appendChild(bubble);
        this.dom.stream.appendChild(row);

        // Core logic
        if (!isError) {
            this.ctx.messages.push({ role, text });
            this.ctx.thread.push({ role, text });
            if (this.ctx.thread.length > J_CORE.config.maxHistory) this.ctx.thread.shift();
        }

        this.scrollToBottom();
    }

    renderChips(chips) {
        this.dom.chips.innerHTML = '';
        if (!chips || !chips.length) return;

        chips.forEach(txt => {
            const btn = document.createElement('button');
            btn.className = 'j-chip';
            btn.textContent = txt;
            btn.onclick = () => this.handleSend(txt);
            this.dom.chips.appendChild(btn);
        });

        // Scroll chips into view if hidden
        // this.dom.chips.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    scrollToBottom() {
        this.dom.stream.scrollTo({
            top: this.dom.stream.scrollHeight,
            behavior: 'smooth'
        });
    }
}

// System Boot
document.addEventListener('DOMContentLoaded', () => {
    window.jimmy = new JimmyEngine();
});
