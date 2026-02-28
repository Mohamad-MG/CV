/**
 * 🚀 CAPTAIN JIMMY: CORE PRODUCT ENGINE (v4.8.0)
 * Architecture: Event-Driven State Machine (2026 Edition)
 * UX: Focus Trap, Immersive, Draggable Flexibility, Instant Feedback
 */

const DEFAULT_WORKER_ENDPOINT = 'https://mg-ai-proxy.emarketbank.workers.dev/chat';

function normalizeEndpoint(rawUrl) {
    const value = typeof rawUrl === 'string' ? rawUrl.trim() : '';
    if (!value) return '';
    try {
        return new URL(value, window.location.origin).toString();
    } catch {
        return '';
    }
}

function resolveWorkerEndpoint() {
    const globalOverride = normalizeEndpoint(window.__JIMMY_WORKER_URL__);
    if (globalOverride) return globalOverride;

    const metaEndpoint = normalizeEndpoint(
        document.querySelector('meta[name="mg-worker-endpoint"]')?.getAttribute('content')
    );
    if (metaEndpoint) return metaEndpoint;

    return DEFAULT_WORKER_ENDPOINT;
}

const J_CORE = {
    endpoints: {
        worker: resolveWorkerEndpoint()
    },
    config: {
        maxHistory: 20,
        maxDomRows: 80,
        timeout: 12000,
        maxInputChars: 900,
        version: '4.8.0'
    },
    links: {
        whatsapp: 'https://wa.me/201555141282',
        call: 'tel:+201555141282',
        cv: 'https://mo-gamal.com/Mohamed-Gamal-CV.pdf'
    },
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
        this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        this.isLowPerfDevice = this.detectLowPerfDevice();
        this.enableParallax = !this.isMobileLite && !this.prefersReducedMotion && !this.isLowPerfDevice;
        this.parallaxRaf = 0;
        this.parallaxPoint = null;
        this.viewportRaf = 0;
        this.focusTimer = 0;
        this.syncViewportBound = null;
        this.touchGesture = { startX: 0, startY: 0, deltaX: 0, deltaY: 0 };

        this.ctx = {
            isOpen: false,
            isThinking: false,
            messages: [],
            thread: [],
            meta: {},
            lang: this.resolveInitialLang(),
            mobileSheetMode: this.resolveInitialSheetMode(),
            drag: { isDragging: false, startX: 0, startY: 0, currentX: 0, currentY: 0 }
        };

        const isSubdir = window.location.pathname.includes('/portfolio/') || window.location.pathname.includes('/achievements/');
        this.assetPrefix = isSubdir ? '../assets/' : 'assets/';
        this.chatRowBotIcon = `${this.assetPrefix}assistance-static.png`;

        this.dom = {};
        this.init();
    }

    detectLowPerfDevice() {
        const cores = Number(navigator.hardwareConcurrency || 0);
        const mem = Number(navigator.deviceMemory || 0);
        if (cores && cores <= 4) return true;
        if (mem && mem <= 4) return true;
        return false;
    }

    resolveInitialLang() {
        try {
            const persisted = localStorage.getItem('jimmy_lang');
            if (persisted === 'ar' || persisted === 'en') return persisted;
        } catch {
            // noop
        }
        return 'ar';
    }

    resolveInitialSheetMode() {
        if (!this.isMobileLite) return 'full';
        try {
            const persisted = localStorage.getItem('jimmy_sheet_mode');
            if (persisted === 'compact' || persisted === 'full') return persisted;
        } catch {
            // noop
        }
        return 'full';
    }

    detectInputLang(text, fallback = 'ar') {
        const value = String(text || '');
        const ar = (value.match(/[\u0600-\u06FF]/g) || []).length;
        const en = (value.match(/[a-zA-Z]/g) || []).length;
        if (!ar && !en) return fallback;
        return ar >= en ? 'ar' : 'en';
    }

    applyLangUI(lang) {
        const next = lang === 'en' ? 'en' : 'ar';
        this.ctx.lang = next;
        try { localStorage.setItem('jimmy_lang', next); } catch { /* noop */ }
        const t = J_CORE.i18n[next];
        if (this.dom.title) this.dom.title.textContent = t.status;
        if (this.dom.input) {
            this.dom.input.placeholder = t.placeholder;
            const isArabic = next === 'ar';
            this.dom.input.dir = isArabic ? 'rtl' : 'ltr';
            this.dom.input.classList.toggle('is-rtl', isArabic);
            this.dom.input.classList.toggle('is-ltr', !isArabic);
        }
        if (this.dom.chips) this.dom.chips.dir = next === 'ar' ? 'rtl' : 'ltr';
        if (this.dom.actions) this.dom.actions.dir = next === 'ar' ? 'rtl' : 'ltr';
        this.updateComposerCounter();
        this.syncComposerState();
    }

    init() {
        this.injectStructure();
        this.cacheDOM();
        this.applyLangUI(this.ctx.lang);
        this.applyPerformanceProfile();
        this.hydrateDraft({ onlyIfEmpty: true });
        this.syncComposerState();
        this.updateComposerCounter();
        this.bindInteractions();
        this.setMobileSheetMode(this.ctx.mobileSheetMode, false);
        this.setupMobileViewportSync();
    }

    applyPerformanceProfile() {
        if (!this.dom.root) return;
        if (this.prefersReducedMotion || this.isLowPerfDevice) {
            this.dom.root.classList.add('is-low-perf');
        }
    }

    injectStructure() {
        const t = J_CORE.i18n[this.ctx.lang];
        const jimmyIcon = `${this.assetPrefix}images/jimmy-icon-home.gif`;

        // Use animated GIF for identity across the entire chat UI
        const avatarMedia = `<img src="${jimmyIcon}" alt="Captain Jimmy" loading="eager" decoding="async">`;
        const launcherMedia = `<img src="${jimmyIcon}" alt="Open Jimmy" loading="lazy" decoding="async">`;

        const html = `
            <div id="jimmy-root">
                <div id="j-backdrop" class="j-console-backdrop"></div>
                <div id="j-console" class="j-console" role="dialog" aria-modal="true" aria-hidden="true">
                    <div class="j-header" id="j-header">
                        <div class="j-mobile-grip" aria-hidden="true"><span></span></div>
                        <div class="j-identity">
                            <div class="j-avatar-sm">${avatarMedia}</div>
                            <div class="j-hud-data">
                                <span id="j-title" class="j-title">${t.status}</span>
                                <div class="j-meta-row">
                                    <span id="j-ping" class="j-ping-tag">SIGNAL: STABLE</span>
                                    <span class="j-ver-tag">v${J_CORE.config.version}</span>
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
                    <div id="j-stream" class="j-stream"></div>
                    <div class="j-footer">
                        <div id="j-actions-badges" class="j-actions-rail"></div>
                        <div class="j-input-scaffold">
                            <textarea id="j-input" class="j-textarea" rows="1" maxlength="${J_CORE.config.maxInputChars}" enterkeyhint="send" placeholder="${t.placeholder}" autocapitalize="sentences" autocomplete="off" autocorrect="on" spellcheck="false"></textarea>
                            <button id="j-send" class="j-send-btn" aria-label="Send">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h14"/><path d="M12 7l6 5-6 5"/></svg>
                            </button>
                        </div>
                        <div id="j-counter" class="j-input-counter" aria-live="polite"></div>
                        <div id="j-chips" class="j-chips-rail"></div>
                    </div>
                </div>
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
            header: get('j-header'),
            backdrop: get('j-backdrop'),
            stream: get('j-stream'),
            input: get('j-input'),
            send: get('j-send'),
            close: get('j-close'),
            title: get('j-title'),
            actions: get('j-actions-badges'),
            chips: get('j-chips'),
            ping: get('j-ping'),
            counter: get('j-counter')
        };
    }

    bindInteractions() {
        const toggle = () => this.setOpen(!this.ctx.isOpen);
        this.dom.launcher.onclick = toggle;
        this.dom.launcher.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
        });
        this.dom.close.onclick = toggle;
        this.dom.backdrop.onclick = toggle;

        this.dom.input.addEventListener('input', (e) => {
            let val = e.target.value;
            if (val.length > J_CORE.config.maxInputChars) {
                val = val.slice(0, J_CORE.config.maxInputChars);
                e.target.value = val;
            }
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            const isArabic = /[\u0600-\u06FF]/.test(val);
            e.target.dir = isArabic ? 'rtl' : 'ltr';
            e.target.classList.toggle('is-rtl', isArabic);
            e.target.classList.toggle('is-ltr', !isArabic);
            this.saveDraft(val);
            this.updateComposerCounter();
            this.syncComposerState();
        });

        this.dom.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.handleSend(); }
        });
        this.dom.input.addEventListener('focus', () => {
            this.dom.root.classList.add('is-input-focused');
            this.scheduleViewportSync(true);
        }, { passive: true });
        this.dom.input.addEventListener('blur', () => {
            this.dom.root.classList.remove('is-input-focused');
            this.scheduleViewportSync(true);
            this.saveDraft(this.dom.input.value);
        }, { passive: true });

        this.dom.send.onclick = () => this.handleSend();

        this.dom.root.addEventListener('keydown', (e) => {
            if (this.ctx.isOpen && e.key === 'Escape') this.setOpen(false);
        });

        if (!this.isMobileLite) {
            this.initDraggable();
            if (this.enableParallax) {
                window.addEventListener('mousemove', (e) => this.scheduleParallax(e), { passive: true });
            }
        }

        if (this.isMobileLite) {
            this.dom.header.addEventListener('touchstart', (e) => {
                const t = e.touches[0];
                this.touchGesture.startY = t.clientY;
                this.touchGesture.startX = t.clientX;
                this.touchGesture.deltaY = 0;
                this.touchGesture.deltaX = 0;
            }, { passive: true });

            this.dom.header.addEventListener('touchmove', (e) => {
                const t = e.touches[0];
                this.touchGesture.deltaY = t.clientY - this.touchGesture.startY;
                this.touchGesture.deltaX = t.clientX - this.touchGesture.startX;
            }, { passive: true });

            this.dom.header.addEventListener('touchend', () => this.handleMobileHeaderGesture(), { passive: true });
        }

        setInterval(() => {
            if (this.ctx.isOpen && !(this.isMobileLite && this.dom.root.classList.contains('is-keyboard-open'))) {
                const ms = Math.floor(Math.random() * 30) + 10;
                if (this.dom.ping) this.dom.ping.textContent = `PING: ${ms}ms`;
            }
        }, 4000);
    }

    buzz(pattern = 8) {
        try {
            if (!this.isMobileLite) return;
            if (typeof navigator.vibrate === 'function') navigator.vibrate(pattern);
        } catch {
            // noop
        }
    }

    draftKey(lang = this.ctx.lang) {
        const safeLang = lang === 'en' ? 'en' : 'ar';
        return `jimmy_draft:${window.location.pathname}:${safeLang}`;
    }

    saveDraft(value) {
        const text = String(value || '');
        try {
            if (!text.trim()) {
                localStorage.removeItem(this.draftKey());
                return;
            }
            localStorage.setItem(this.draftKey(), text.slice(0, J_CORE.config.maxInputChars));
        } catch {
            // noop
        }
    }

    clearDraft() {
        try {
            localStorage.removeItem(this.draftKey());
        } catch {
            // noop
        }
    }

    hydrateDraft({ onlyIfEmpty = false } = {}) {
        if (!this.dom.input) return;
        if (onlyIfEmpty && this.dom.input.value.trim()) return;

        let draft = '';
        try {
            draft = localStorage.getItem(this.draftKey()) || '';
        } catch {
            // noop
        }

        const value = draft.slice(0, J_CORE.config.maxInputChars);
        this.dom.input.value = value;
        this.dom.input.style.height = 'auto';
        this.dom.input.style.height = Math.min(this.dom.input.scrollHeight, 120) + 'px';
        const isArabic = /[\u0600-\u06FF]/.test(value);
        this.dom.input.dir = isArabic ? 'rtl' : 'ltr';
        this.dom.input.classList.toggle('is-rtl', isArabic);
        this.dom.input.classList.toggle('is-ltr', !isArabic);
        this.updateComposerCounter();
        this.syncComposerState();
    }

    updateComposerCounter() {
        if (!this.dom.counter || !this.dom.input) return;
        const len = this.dom.input.value.length;
        const max = J_CORE.config.maxInputChars;
        this.dom.counter.textContent = `${len}/${max}`;
        this.dom.counter.classList.toggle('is-visible', len > Math.floor(max * 0.55));
        this.dom.counter.classList.toggle('is-warn', len > Math.floor(max * 0.85));
    }

    syncComposerState() {
        if (!this.dom.send || !this.dom.input || !this.dom.root) return;
        const hasValue = this.dom.input.value.trim().length > 0;
        const canSend = hasValue && !this.ctx.isThinking;
        this.dom.send.disabled = !canSend;
        this.dom.send.setAttribute('aria-disabled', canSend ? 'false' : 'true');
        this.dom.send.classList.toggle('is-ready', canSend);
        this.dom.root.classList.toggle('is-composer-ready', canSend);
    }

    setMobileSheetMode(mode, persist = true) {
        if (!this.isMobileLite || !this.dom.root) return;
        const next = mode === 'compact' ? 'compact' : 'full';
        const prev = this.ctx.mobileSheetMode;
        this.ctx.mobileSheetMode = next;
        this.dom.root.classList.toggle('is-mobile-sheet-full', next === 'full');
        this.dom.root.classList.toggle('is-mobile-sheet-compact', next === 'compact');

        if (persist) {
            try {
                localStorage.setItem('jimmy_sheet_mode', next);
            } catch {
                // noop
            }
        }

        if (prev !== next) this.buzz(7);
        this.scheduleViewportSync(true);
    }

    handleMobileHeaderGesture() {
        if (!this.isMobileLite || !this.ctx.isOpen) return;
        const { deltaX, deltaY } = this.touchGesture;
        if (Math.abs(deltaY) < 56) return;
        if (Math.abs(deltaX) > Math.abs(deltaY)) return;

        if (deltaY < 0) {
            this.setMobileSheetMode('full');
            return;
        }

        if (this.ctx.mobileSheetMode === 'full') {
            this.setMobileSheetMode('compact');
        } else {
            this.setOpen(false);
        }
    }

    setupMobileViewportSync() {
        if (!this.isMobileLite) return;
        this.syncViewportBound = () => this.scheduleViewportSync();

        window.addEventListener('resize', this.syncViewportBound, { passive: true });
        window.addEventListener('orientationchange', this.syncViewportBound, { passive: true });

        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', this.syncViewportBound, { passive: true });
            window.visualViewport.addEventListener('scroll', this.syncViewportBound, { passive: true });
        }

        this.scheduleViewportSync(true);
    }

    scheduleViewportSync(force = false) {
        if (!this.isMobileLite) return;
        if (force && this.viewportRaf) {
            cancelAnimationFrame(this.viewportRaf);
            this.viewportRaf = 0;
        }
        if (this.viewportRaf) return;

        this.viewportRaf = requestAnimationFrame(() => {
            this.viewportRaf = 0;
            this.applyViewportMetrics();
        });
    }

    applyViewportMetrics() {
        if (!this.isMobileLite || !this.dom.root) return;

        const vv = window.visualViewport;
        const visibleHeight = Math.round(vv ? vv.height : window.innerHeight);
        const offsetTop = Math.max(0, Math.round(vv ? vv.offsetTop : 0));
        const layoutHeight = Math.max(
            window.innerHeight || 0,
            document.documentElement?.clientHeight || 0
        );
        const keyboardHeight = vv
            ? Math.max(0, Math.round(layoutHeight - (vv.height + vv.offsetTop)))
            : 0;
        const isKeyboardOpen = keyboardHeight > 120;

        this.dom.root.style.setProperty('--j-mobile-vh', `${visibleHeight}px`);
        this.dom.root.style.setProperty('--j-vv-top', `${offsetTop}px`);
        this.dom.root.classList.toggle('is-keyboard-open', isKeyboardOpen);

        if (isKeyboardOpen && this.ctx.mobileSheetMode === 'compact') {
            this.setMobileSheetMode('full', false);
        }

        const keepBottom = this.ctx.isOpen && document.activeElement === this.dom.input;
        if (keepBottom) this.scrollToBottom('auto');
    }

    initDraggable() {
        const d = this.ctx.drag;
        const c = this.dom.console;
        const h = this.dom.header;

        const onMouseDown = (e) => {
            if (e.target.closest('.j-actions')) return;
            d.isDragging = true;
            d.startX = e.clientX - d.currentX;
            d.startY = e.clientY - d.currentY;
            c.style.transition = 'none';
            h.style.cursor = 'grabbing';
        };

        const onMouseMove = (e) => {
            if (!d.isDragging) return;
            d.currentX = e.clientX - d.startX;
            d.currentY = e.clientY - d.startY;
            this.updatePosition();
        };

        const onMouseUp = () => {
            if (!d.isDragging) return;
            d.isDragging = false;
            c.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
            h.style.cursor = 'grab';
        };

        h.onmousedown = onMouseDown;
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    updatePosition() {
        if (this.isMobileLite) return;
        const d = this.ctx.drag;
        this.dom.console.style.transform = `translate(calc(-50% + ${d.currentX}px), calc(-50% + ${d.currentY}px)) scale(1)`;
    }

    handleParallax(e) {
        if (!this.enableParallax || !e || !this.ctx.isOpen || this.ctx.drag.isDragging || window.innerWidth < 1000) return;
        const x = (window.innerWidth / 2 - e.pageX) / 400;
        const y = (window.innerHeight / 2 - e.pageY) / 400;
        const d = this.ctx.drag;
        this.dom.console.style.transform = `translate(calc(-50% + ${d.currentX}px), calc(-50% + ${d.currentY}px)) rotateY(${x}deg) rotateX(${-y}deg)`;
    }

    scheduleParallax(e) {
        if (!this.enableParallax || !this.ctx.isOpen || this.ctx.drag.isDragging || window.innerWidth < 1000) return;
        this.parallaxPoint = { pageX: e.pageX, pageY: e.pageY };
        if (this.parallaxRaf) return;
        this.parallaxRaf = requestAnimationFrame(() => {
            this.parallaxRaf = 0;
            this.handleParallax(this.parallaxPoint);
        });
    }

    setOpen(shouldOpen) {
        this.ctx.isOpen = shouldOpen;
        this.dom.launcher.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
        this.dom.console.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
        document.body.classList.toggle('ai-open', shouldOpen);

        if (shouldOpen) {
            this.dom.root.classList.add('is-open');
            this.dom.launcher.classList.add('active');
            this.setMobileSheetMode(this.ctx.mobileSheetMode, false);
            this.updatePosition();
            this.scheduleViewportSync(true);
            if (this.focusTimer) {
                clearTimeout(this.focusTimer);
                this.focusTimer = 0;
            }
            if (this.isMobileLite) {
                this.focusTimer = window.setTimeout(() => {
                    this.hydrateDraft({ onlyIfEmpty: true });
                    this.dom.input.focus();
                    this.scheduleViewportSync(true);
                    this.focusTimer = 0;
                }, 140);
            } else {
                requestAnimationFrame(() => this.dom.input.focus());
            }
            this.buzz(8);
            this.syncComposerState();
            this.updateComposerCounter();

            if (this.ctx.messages.length === 0) {
                this.renderChips(this.ctx.lang === 'ar' ? ['تحليل سريع', 'فكرة للنمو'] : ['Quick Audit', 'Growth Idea']);
                this.renderActionBadges([]);
            }
        } else {
            if (this.focusTimer) {
                clearTimeout(this.focusTimer);
                this.focusTimer = 0;
            }
            if (this.parallaxRaf) {
                cancelAnimationFrame(this.parallaxRaf);
                this.parallaxRaf = 0;
            }
            this.updatePosition();
            this.dom.root.classList.remove('is-open');
            this.dom.root.classList.remove('is-keyboard-open');
            this.dom.root.classList.remove('is-input-focused');
            this.dom.launcher.classList.remove('active');
            this.saveDraft(this.dom.input.value);
            this.dom.input.blur();
            this.dom.launcher.focus();
            this.scheduleViewportSync(true);
            this.syncComposerState();
        }
    }

    renderSafeText(target, text) {
        const value = typeof text === 'string' ? text : String(text ?? '');
        const lines = value.split('\n');
        target.textContent = '';
        lines.forEach((line, index) => {
            if (index > 0) target.appendChild(document.createElement('br'));
            target.appendChild(document.createTextNode(line));
        });
    }

    async handleSend(textOverride = null) {
        const text = (textOverride || this.dom.input.value).trim();
        if (!text || this.ctx.isThinking) return;

        this.applyLangUI(this.detectInputLang(text, this.ctx.lang));

        this.dom.input.value = '';
        this.dom.input.style.height = 'auto';
        this.clearDraft();
        this.updateComposerCounter();
        this.syncComposerState();
        this.renderChips([]);
        this.renderActionBadges([]);
        this.addMessage('user', text);
        this.buzz(10);
        this.setThinking(true);

        try {
            const payload = {
                messages: this.ctx.thread.map(m => ({
                    role: m.role === 'ai' ? 'assistant' : 'user',
                    content: m.text
                })),
                meta: this.ctx.meta
            };

            const controller = new AbortController();
            const toId = setTimeout(() => controller.abort(), J_CORE.config.timeout);

            let res;
            try {
                res = await fetch(J_CORE.endpoints.worker, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: controller.signal
                });
            } finally {
                clearTimeout(toId);
            }

            if (!res.ok) {
                let apiError = '';
                let apiDetails = '';
                try {
                    const errData = await res.json();
                    apiError = typeof errData?.error === 'string' ? errData.error : '';
                    apiDetails = typeof errData?.details === 'string' ? errData.details : '';
                } catch {
                    // Ignore invalid/non-JSON error body.
                }

                const httpErr = new Error(apiError || `HTTP ${res.status}`);
                httpErr.status = res.status;
                httpErr.retryAfter = res.headers.get('Retry-After') || '';
                httpErr.apiError = apiError;
                httpErr.apiDetails = apiDetails;
                throw httpErr;
            }

            const data = await res.json();
            if (data.meta) this.ctx.meta = data.meta;

            this.setThinking(false);
            this.addMessage('ai', data.response);
            const actionBadges = data.meta?.action_badges || this.inferActionBadges(data.response, data.meta?.quickReplies);
            this.renderActionBadges(actionBadges);
            if (data.meta?.quickReplies) this.renderChips(data.meta.quickReplies);

        } catch (err) {
            console.error('Jimmy Error:', {
                message: err?.message || String(err),
                status: err?.status,
                apiError: err?.apiError,
                apiDetails: err?.apiDetails
            });
            this.setThinking(false);

            let errMsg = this.ctx.lang === 'ar' ? 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.' : J_CORE.i18n[this.ctx.lang].error;

            const compact = (value, max = 140) => {
                const txt = typeof value === 'string' ? value.trim() : '';
                if (!txt) return '';
                return txt.length > max ? `${txt.slice(0, max - 3)}...` : txt;
            };

            if (err?.status === 429) {
                const sec = Number.parseInt(err?.retryAfter || '60', 10);
                const waitSec = Number.isFinite(sec) && sec > 0 ? sec : 60;
                if (err?.apiError === 'Upstream quota exceeded') {
                    errMsg = this.ctx.lang === 'ar'
                        ? 'مزود الذكاء الاصطناعي وصل لحد الاستخدام حالياً. جرّب بعد دقائق.'
                        : 'AI provider quota is currently exceeded. Please try again in a few minutes.';
                } else if (err?.apiError === 'Daily Limit Exceeded') {
                    errMsg = err?.apiDetails || (this.ctx.lang === 'ar' ? 'وصلت للحد الأقصى للرسائل اليوم. أراك غداً!' : 'Daily limit exceeded. See you tomorrow!');
                } else {
                    errMsg = this.ctx.lang === 'ar'
                        ? `النظام مشغول حالياً. يرجى المحاولة بعد ${waitSec} ثانية.`
                        : `Too many requests. Please try again in ${waitSec}s.`;
                }
            } else if (err?.apiError) {
                const reason = compact(err.apiError);
                const detail = compact(err.apiDetails);
                if (this.ctx.lang === 'ar') {
                    errMsg = detail ? `تعذر تنفيذ الطلب: ${reason} (${detail})` : `تعذر تنفيذ الطلب: ${reason}`;
                } else {
                    errMsg = detail ? `Request failed: ${reason} (${detail})` : `Request failed: ${reason}`;
                }
            }

            this.addMessage('ai', errMsg, true);
        }
    }

    setThinking(isThinking) {
        this.ctx.isThinking = isThinking;
        this.dom.root.classList.toggle('is-thinking', isThinking);
        const existing = this.dom.stream.querySelector('.j-typing');
        if (existing) existing.remove();

        if (isThinking) {
            const html = `
                <div class="j-msg-row ai j-typing">
                    <div class="j-dot"></div><div class="j-dot"></div><div class="j-dot"></div>
                </div>
            `;
            this.dom.stream.insertAdjacentHTML('beforeend', html);
            this.scrollToBottom('auto');
        }

        this.syncComposerState();
    }

    trimStreamRows() {
        const rows = this.dom.stream.querySelectorAll('.j-msg-row:not(.j-typing)');
        const overflow = rows.length - J_CORE.config.maxDomRows;
        if (overflow <= 0) return;
        for (let i = 0; i < overflow; i += 1) {
            rows[i].remove();
        }
    }

    addMessage(role, text, isError = false) {
        const row = document.createElement('div');
        row.className = `j-msg-row ${role}`;
        const isArabic = /[\u0600-\u06FF]/.test(text);
        row.classList.add(isArabic ? 'is-rtl' : 'is-ltr');

        const idRow = document.createElement('div');
        idRow.className = 'j-row-identity';
        const iconBox = document.createElement('div');
        iconBox.className = 'j-row-icon';

        if (role === 'ai') {
            iconBox.innerHTML = `<img src="${this.chatRowBotIcon}" alt="Assistant" style="width:100%; height:100%; object-fit:contain;">`;
            iconBox.classList.add('is-bot');
        } else {
            // Precise SVG match for usericon.svg
            iconBox.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:100%; height:100%;">
                    <g>
                        <circle cx="10" cy="6" r="4"/>
                        <path d="M18 17.5c0 2.485 0 4.5-8 4.5s-8-2.015-8-4.5S5.582 13 10 13s8 2.015 8 4.5Z"/>
                        <path stroke-linecap="round" d="M19 2s2 1.2 2 4s-2 4-2 4m-2-6s1 .6 1 2s-1 2-1 2"/>
                    </g>
                </svg>
            `;
        }

        idRow.appendChild(iconBox);
        row.appendChild(idRow);

        const bubble = document.createElement('div');
        bubble.className = 'j-bubble';
        if (isError) {
            bubble.style.color = '#ef4444';
            bubble.textContent = text;
        } else {
            this.renderSafeText(bubble, text);
        }

        row.appendChild(bubble);
        this.dom.stream.appendChild(row);

        this.ctx.messages.push({ role, text });
        if (this.ctx.messages.length > (J_CORE.config.maxDomRows * 2)) {
            this.ctx.messages.shift();
        }
        this.ctx.thread.push({ role, text });
        if (this.ctx.thread.length > J_CORE.config.maxHistory) this.ctx.thread.shift();

        this.trimStreamRows();
        this.scrollToBottom('auto');
    }

    renderChips(chips) {
        this.dom.chips.innerHTML = '';
        if (!chips || !chips.length) return;
        chips.forEach((txt, index) => {
            const btn = document.createElement('button');
            btn.className = 'j-chip is-enter';
            btn.textContent = txt;
            btn.style.setProperty('--j-stagger', `${index * 45}ms`);
            btn.onclick = () => this.handleSend(txt);
            this.dom.chips.appendChild(btn);
        });
    }

    normalizeActionBadge(badge) {
        if (!badge || typeof badge !== 'object') return null;
        const type = String(badge.type || '').toLowerCase();
        const label = String(badge.label || '').trim();
        const url = String(badge.url || '').trim();
        if (!type || !label || !url) return null;
        return { type, label, url };
    }

    inferActionBadges(responseText, quickReplies = []) {
        const text = String(responseText || '');
        const qr = Array.isArray(quickReplies) ? quickReplies.join(' ') : '';
        const out = [];
        const seen = new Set();
        const add = (badge) => {
            const n = this.normalizeActionBadge(badge);
            if (!n) return;
            const key = `${n.type}|${n.url}`;
            if (seen.has(key) || out.length >= 3) return;
            seen.add(key);
            out.push(n);
        };

        const waMatch = text.match(/https?:\/\/wa\.me\/[^\s)]+/i);
        if (waMatch || /واتس(?:اب)?|whatsapp|wa\.me/i.test(`${text} ${qr}`)) {
            add({ type: 'whatsapp', label: this.ctx.lang === 'ar' ? 'واتساب' : 'WhatsApp', url: waMatch?.[0] || J_CORE.links.whatsapp });
        }

        const cvMatch = text.match(/https?:\/\/[^\s)]+\.pdf(?:\?[^\s)]*)?/i);
        if (cvMatch || /(?:\bcv\b|السيرة|السيفي|resume|pdf)/i.test(`${text} ${qr}`)) {
            add({ type: 'cv', label: this.ctx.lang === 'ar' ? 'تحميل CV' : 'Download CV', url: cvMatch?.[0] || J_CORE.links.cv });
        }

        const telMatch = text.match(/tel:\+?\d[\d\-() ]{6,}/i);
        if (telMatch || /مكالمة|اتصال|phone|call|كلمني|رقم/i.test(`${text} ${qr}`)) {
            const raw = telMatch ? telMatch[0] : J_CORE.links.call;
            const normalized = raw.replace(/[^\d+]/g, '');
            const telUrl = normalized ? `tel:${normalized}` : J_CORE.links.call;
            add({ type: 'call', label: this.ctx.lang === 'ar' ? 'مكالمة' : 'Call', url: telUrl });
        }

        return out;
    }

    getActionBadgeIcon(type) {
        if (type === 'whatsapp') return '◉';
        if (type === 'call') return '◈';
        if (type === 'cv') return '⬒';
        return '◆';
    }

    renderActionBadges(badges) {
        this.dom.actions.innerHTML = '';
        if (!Array.isArray(badges) || !badges.length) return;

        badges.slice(0, 3).forEach((badge, index) => {
            const normalized = this.normalizeActionBadge(badge);
            if (!normalized) return;

            const a = document.createElement('a');
            a.className = `j-action-badge is-${normalized.type} is-enter`;
            a.href = normalized.url;
            a.target = normalized.url.startsWith('tel:') ? '_self' : '_blank';
            a.rel = normalized.url.startsWith('tel:') ? '' : 'noopener noreferrer';
            a.style.setProperty('--j-stagger', `${index * 50}ms`);
            a.innerHTML = `<span class="j-action-icon">${this.getActionBadgeIcon(normalized.type)}</span><span>${normalized.label}</span>`;
            this.dom.actions.appendChild(a);
        });
    }

    scrollToBottom(behavior = 'auto') {
        this.dom.stream.scrollTo({ top: this.dom.stream.scrollHeight, behavior });
    }
}

document.addEventListener('DOMContentLoaded', () => { window.jimmy = new JimmyEngine(); });
