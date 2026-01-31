/**
 * 🚀 CAPTAIN JIMMY - SYSTEM CORE v2.9.8
 * Neural Interior Edition - Worker Sync
 */

const J5_CONFIG = {
    isLite: window.matchMedia("(max-width: 1024px)").matches,
    agentVideo: 'assets/images/jimmy-icon.m4v',
    workerUrl: 'https://mg-ai-proxy.emarketbank.workers.dev/chat',
    maxHistory: 12,
    requestTimeoutMs: 15000, // Increased for Expert mode
    maxInputChars: 2000, // DoS guard
    texts: {
        en: {
            name: "CAPTAIN JIMMY",
            welcome: "Systems stabilized. Neural link active. How may I assist your navigation?",
            placeholder: "Command interface...",
            typing: "Jimmy is processing...",
            typingExpert: "Deep analysis in progress...",
            errorTimeout: "Signal timeout. Please try again.",
            errorNetwork: "Signal disruption. Retrying neural link...",
            errorForbidden: "Access denied. Origin not authorized.",
            errorBusy: "Systems busy. Please wait a moment.",
            tryAgain: "Try Again"
        },
        ar: {
            name: "كابتن جيمي",
            welcome: "الأنظمة مستقرة. الرابط العصبي نشط. كيف يمكنني توجيهك؟",
            placeholder: "واجهة الأوامر...",
            typing: "جيمي بيفكر...",
            typingExpert: "تحليل عميق جاري...",
            errorTimeout: "انتهت مهلة الاتصال. حاول مرة أخرى.",
            errorNetwork: "عذراً، حدث انقطاع في الاتصال.",
            errorForbidden: "الوصول مرفوض. المصدر غير مصرح.",
            errorBusy: "الأنظمة مشغولة. انتظر لحظة.",
            tryAgain: "حاول مجدداً"
        }
    }
};

class Jimmy5System {
    constructor() {
        this.init();
    }
    init() {
        this.setMode();
        window.addEventListener('resize', () => requestAnimationFrame(() => this.setMode()));
    }
    setMode() {
        J5_CONFIG.isLite = window.matchMedia("(max-width: 1024px)").matches;
        document.body.classList.toggle('lite-mode', J5_CONFIG.isLite);
    }
}

class Jimmy5Agent {
    constructor() {
        this.isOpen = false;
        this.messages = [];
        this.isTyping = false;
        this.lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
        this.lastError = null; // Track errors for retry logic

        // Worker state (SYNC CONTRACT: Pass back exactly what Worker returns)
        this.workerMeta = {};

        this.suggestions = {
            en: ["Who is Mohamed?", "What are his core skills?", "Recent achievements?", "Download CV"],
            ar: ["من هو محمد؟", "ما هي مهاراته الأساسية؟", "أبرز الإنجازات؟", "تحميل السيرة الذاتية"]
        };

        this.render();
        this.cacheDOM();
        this.bindEvents();
        this.renderSuggestions();
    }

    render() {
        const txt = J5_CONFIG.texts[this.lang];
        const container = document.createElement('div');
        container.id = 'jimmy5-root';
        container.innerHTML = `
            <button id="jimmy-launcher" aria-label="Open Chat">
                <video src="${J5_CONFIG.agentVideo}" autoplay loop muted playsinline loading="lazy"></video>
            </button>
            <div id="jimmy-chat-panel" role="dialog" aria-modal="true">
                <div class="sheet-handle"></div>
                <div class="chat-header">
                    <div class="brand-group">
                        <div class="header-jimmy-icon">
                            <video src="${J5_CONFIG.agentVideo}" autoplay loop muted playsinline></video>
                        </div>
                        <span class="header-name">${txt.name}</span>
                        <span id="mode-badge" class="mode-badge hidden"></span>
                    </div>
                    <button id="chat-close-btn" class="close-btn"><i class="ri-close-line"></i></button>
                </div>
                <div id="chat-body" class="chat-body"></div>
                <div class="chat-footer">
                    <div class="input-capsule">
                        <input type="text" id="chat-input" class="input-field" placeholder="${txt.placeholder}" autocomplete="off" maxlength="${J5_CONFIG.maxInputChars}">
                        <button id="chat-send-btn" class="send-btn"><i class="ri-arrow-up-line"></i></button>
                    </div>
                    <div id="suggestion-track" class="suggestion-track"></div>
                </div>
            </div>
        `;
        document.body.appendChild(container);
    }

    cacheDOM() {
        this.ui = {
            launcher: document.getElementById('jimmy-launcher'),
            panel: document.getElementById('jimmy-chat-panel'),
            body: document.getElementById('chat-body'),
            track: document.getElementById('suggestion-track'),
            input: document.getElementById('chat-input'),
            send: document.getElementById('chat-send-btn'),
            close: document.getElementById('chat-close-btn'),
            handle: document.querySelector('.sheet-handle'),
            video: document.querySelector('#jimmy-launcher video'),
            modeBadge: document.getElementById('mode-badge')
        };
        this.ui.launcher.setAttribute('aria-expanded', 'false');
        this.ui.panel.setAttribute('aria-hidden', 'true');
    }

    bindEvents() {
        this.ui.launcher.addEventListener('click', () => this.toggle(true));
        this.ui.close.addEventListener('click', () => this.toggle(false));
        this.ui.send.addEventListener('click', () => this.sendMessage());
        this.ui.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.sendMessage(); });
        document.addEventListener('keydown', (e) => this.handleGlobalKeys(e));

        // Mobile Swipe Down to Close
        let touchStartY = 0;
        this.ui.handle.addEventListener('touchstart', (e) => touchStartY = e.touches[0].clientY, { passive: true });
        this.ui.handle.addEventListener('touchmove', (e) => {
            if (e.touches[0].clientY - touchStartY > 80) this.toggle(false);
        }, { passive: true });
    }

    renderSuggestions() {
        this.renderQuickReplies(this.suggestions[this.lang]);
    }

    renderQuickReplies(options) {
        this.ui.track.innerHTML = '';
        if (!options || !Array.isArray(options) || options.length === 0) return;

        // Strict Validation (Unique, Non-empty, Trimmed, Max 3)
        const uniqueSet = new Set();
        const validOptions = [];

        options.forEach(opt => {
            if (typeof opt === 'string' && opt.trim().length > 0 && validOptions.length < 3) {
                const clean = opt.trim();
                if (!uniqueSet.has(clean)) {
                    uniqueSet.add(clean);
                    validOptions.push(clean);
                }
            }
        });

        if (validOptions.length === 0) return;

        validOptions.forEach(text => {
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.innerText = text;
            chip.onclick = () => {
                if (this.isTyping) return; // Race condition guard
                this.ui.input.value = text;
                this.sendMessage();
            };
            this.ui.track.appendChild(chip);
        });

        // UX: Keep focus on input (Desktop only)
        if (!J5_CONFIG.isLite) {
            this.ui.input.focus();
        }
    }

    updateModeBadge(mode) {
        if (!this.ui.modeBadge) return;
        if (mode === 'expert') {
            this.ui.modeBadge.textContent = this.lang === 'ar' ? 'تحليل عميق' : 'Deep Analysis';
            this.ui.modeBadge.classList.remove('hidden');
            this.ui.modeBadge.classList.add('expert');
        } else {
            this.ui.modeBadge.classList.add('hidden');
            this.ui.modeBadge.classList.remove('expert');
        }
    }

    toggle(open) {
        if (this.isOpen === open) return;
        this.isOpen = open;
        this.ui.panel.classList.toggle('active', open);
        this.ui.launcher.classList.toggle('hidden', open);
        document.body.classList.toggle('ai-open', open);
        this.ui.launcher.setAttribute('aria-expanded', String(open));
        this.ui.panel.setAttribute('aria-hidden', String(!open));
        window.dispatchEvent(new CustomEvent('jimmy:toggle', { detail: { open } }));

        if (open) {
            this.ui.video.pause();
            if (this.messages.length === 0) {
                setTimeout(() => {
                    this.addMessage('ai', J5_CONFIG.texts[this.lang].welcome);
                }, 600);
            }
            setTimeout(() => this.ui.input.focus(), 400);
        } else {
            this.ui.video.play();
        }
    }

    addMessage(role, text, options = {}) {
        const row = document.createElement('div');
        row.className = `msg-row ${role}`;
        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        bubble.innerText = text;

        // Error state with retry button
        if (options.isError && options.retryable) {
            const retryBtn = document.createElement('button');
            retryBtn.className = 'retry-btn';
            retryBtn.innerText = J5_CONFIG.texts[this.lang].tryAgain;
            retryBtn.onclick = () => {
                if (this.lastError && this.lastError.message) {
                    this.ui.input.value = this.lastError.message;
                    this.sendMessage();
                }
            };
            bubble.appendChild(retryBtn);
        }

        row.appendChild(bubble);
        this.ui.body.appendChild(row);

        // Only track non-error messages in history
        if (!options.isError) {
            this.messages.push({ role, text });
            if (this.messages.length > J5_CONFIG.maxHistory) {
                this.messages = this.messages.slice(-J5_CONFIG.maxHistory);
            }
        }

        this.scrollToBottom();
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.ui.body.scrollTo({ top: this.ui.body.scrollHeight, behavior: 'smooth' });
        });
    }

    // Input sanitization (plain text, no HTML, length capped)
    sanitizeInput(text) {
        return String(text || '')
            .replace(/<[^>]*>/g, '') // Strip HTML
            .replace(/[\x00-\x1F\x7F]/g, '') // Strip control chars
            .substring(0, J5_CONFIG.maxInputChars)
            .trim();
    }

    async sendMessage() {
        const rawText = this.ui.input.value;
        const text = this.sanitizeInput(rawText);
        if (!text || this.isTyping) return;

        // Clear UI
        this.ui.input.value = '';
        this.ui.track.innerHTML = '';
        this.lastError = null;

        this.addMessage('user', text);
        this.showTyping(true);

        const controller = new AbortController();
        let timeoutId;

        try {
            timeoutId = setTimeout(() => controller.abort(), J5_CONFIG.requestTimeoutMs);

            // CONTRACT: Send messages + meta exactly as Worker expects
            const payload = {
                messages: this.messages.map(m => ({
                    role: m.role === 'ai' ? 'assistant' : 'user',
                    content: m.text
                })),
                meta: this.workerMeta // Pass back Worker's meta unchanged
            };

            const res = await fetch(J5_CONFIG.workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            // Handle HTTP errors
            if (!res.ok) {
                if (res.status === 403) {
                    throw { type: 'forbidden', status: 403 };
                } else if (res.status === 503) {
                    throw { type: 'busy', status: 503 };
                } else {
                    throw { type: 'network', status: res.status };
                }
            }

            // Parse response
            let data;
            try {
                data = await res.json();
            } catch {
                throw { type: 'parse' };
            }

            if (!data || typeof data.response !== 'string' || !data.response.trim()) {
                throw { type: 'empty' };
            }

            // CONTRACT: Store Worker meta for next request (unchanged)
            if (data.meta) {
                this.workerMeta = data.meta;
                this.updateModeBadge(data.meta.mode);

                // Debug: Log worker version
                if (data.meta.worker_version) {
                    console.log(`[Jimmy] Worker v${data.meta.worker_version}`);
                }
            }

            this.showTyping(false);
            this.addMessage('ai', data.response);

            // Render Quick Replies
            if (data.meta?.quickReplies?.length > 0) {
                this.renderQuickReplies(data.meta.quickReplies);
            }

        } catch (err) {
            this.showTyping(false);
            const txt = J5_CONFIG.texts[this.lang];
            let errorMsg = txt.errorNetwork;
            let retryable = true;

            if (err?.name === 'AbortError') {
                errorMsg = txt.errorTimeout;
            } else if (err?.type === 'forbidden') {
                errorMsg = txt.errorForbidden;
                retryable = false; // No point retrying 403
            } else if (err?.type === 'busy') {
                errorMsg = txt.errorBusy;
            }

            this.lastError = { message: text }; // Store for retry
            this.addMessage('ai', errorMsg, { isError: true, retryable });
        } finally {
            if (timeoutId) clearTimeout(timeoutId);
        }
    }

    handleGlobalKeys(e) {
        if (!this.isOpen) return;
        if (e.key === 'Escape') {
            this.toggle(false);
            return;
        }
        if (e.key !== 'Tab') return;
        const focusable = this.getFocusableElements();
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }

    getFocusableElements() {
        const selectors = ['button', 'input', 'select', 'textarea', '[tabindex]:not([tabindex="-1"])'];
        return Array.from(this.ui.panel.querySelectorAll(selectors.join(',')))
            .filter(el => !el.hasAttribute('disabled'));
    }

    showTyping(show) {
        this.isTyping = show;
        const existing = document.getElementById('j5-typing');
        if (existing) existing.remove();

        if (show) {
            const row = document.createElement('div');
            row.id = 'j5-typing';
            row.className = 'msg-row ai';

            // Show different text for Expert mode
            const isExpert = this.workerMeta?.mode === 'expert';
            const typingText = isExpert
                ? J5_CONFIG.texts[this.lang].typingExpert
                : J5_CONFIG.texts[this.lang].typing;

            row.innerHTML = `
                <div class="typing-indicator ${isExpert ? 'expert' : ''}">
                    <div class="neural-wave">
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                        <div class="wave-bar"></div>
                    </div>
                    <span style="font-size: 0.8rem; opacity: 0.6;">${typingText}</span>
                </div>`;
            this.ui.body.appendChild(row);
            this.scrollToBottom();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.j5System = new Jimmy5System();
    window.j5Agent = new Jimmy5Agent();
});

