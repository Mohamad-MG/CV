/**
 * 🚀 CAPTAIN JIMMY - SYSTEM CORE (2026)
 * Neural Interior Edition - Extreme Fluidity
 */

const J5_CONFIG = {
    isLite: window.matchMedia("(max-width: 1024px)").matches,
    agentVideo: 'assets/images/jimmy-icon.m4v',
    workerUrl: 'https://mg-ai-proxy.emarketbank.workers.dev/chat',
    maxHistory: 12,
    requestTimeoutMs: 12000,
    texts: {
        en: {
            name: "CAPTAIN JIMMY",
            welcome: "Systems stabilized. Neural link active. How may I assist your navigation?",
            placeholder: "Command interface..."
        },
        ar: {
            name: "كابتن جيمي",
            welcome: "الأنظمة مستقرة. الرابط العصبي نشط. كيف يمكنني توجيهك؟",
            placeholder: "واجهة الأوامر..."
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

        // Worker state tracking (fixes Meta bug - enables Expert Mode logic)
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
                    </div>
                    <button id="chat-close-btn" class="close-btn"><i class="ri-close-line"></i></button>
                </div>
                <div id="chat-body" class="chat-body"></div>
                <div class="chat-footer">
                    <div class="input-capsule">
                        <input type="text" id="chat-input" class="input-field" placeholder="${txt.placeholder}" autocomplete="off">
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
            video: document.querySelector('#jimmy-launcher video')
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
        this.ui.track.innerHTML = '';
        const list = this.suggestions[this.lang];
        list.forEach(text => {
            const chip = document.createElement('div');
            chip.className = 'chip';
            chip.innerText = text;
            chip.onclick = () => {
                this.ui.input.value = text;
                this.sendMessage();
            };
            this.ui.track.appendChild(chip);
        });
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

    addMessage(role, text) {
        const row = document.createElement('div');
        row.className = `msg-row ${role}`;
        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';

        // Snappy fade effect is handled by CSS (msgIn animation)
        bubble.innerText = text;

        row.appendChild(bubble);
        this.ui.body.appendChild(row);
        this.messages.push({ role, text });
        if (this.messages.length > J5_CONFIG.maxHistory) {
            this.messages = this.messages.slice(-J5_CONFIG.maxHistory);
        }
        this.scrollToBottom();
    }

    scrollToBottom() {
        requestAnimationFrame(() => {
            this.ui.body.scrollTo({ top: this.ui.body.scrollHeight, behavior: 'smooth' });
        });
    }

    async sendMessage() {
        const text = this.ui.input.value.trim();
        if (!text || this.isTyping) return;
        this.ui.input.value = '';
        this.addMessage('user', text);
        this.showTyping(true);

        const controller = new AbortController();
        let timeoutId;
        try {
            timeoutId = setTimeout(() => controller.abort(), J5_CONFIG.requestTimeoutMs);
            const res = await fetch(J5_CONFIG.workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: this.messages.map(m => ({
                        role: m.role === 'ai' ? 'assistant' : 'user',
                        content: m.text
                    })),
                    meta: this.workerMeta
                }),
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            if (!res.ok) throw new Error(`bad-status-${res.status}`);
            let data;
            try {
                data = await res.json();
            } catch {
                throw new Error('bad-json');
            }
            if (!data || typeof data.response !== 'string' || !data.response.trim()) {
                throw new Error('empty-response');
            }
            // Store Worker meta state for next request (Expert Mode, cooldown, probe)
            if (data.meta) this.workerMeta = data.meta;

            this.showTyping(false);
            this.addMessage('ai', data.response);
        } catch (err) {
            this.showTyping(false);
            const isTimeout = err && err.name === 'AbortError';
            const fallback = this.lang === 'ar'
                ? (isTimeout ? "انتهت مهلة الاتصال. حاول مرة أخرى." : "عذراً، حدث انقطاع في الاتصال.")
                : (isTimeout ? "Signal timeout. Please try again." : "Signal disruption. Retrying neural link...");
            this.addMessage('ai', fallback);
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
        const selectors = [
            'button',
            'input',
            'select',
            'textarea',
            '[tabindex]:not([tabindex="-1"])'
        ];
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
            const typingText = this.lang === 'ar' ? 'جيمي بيفكر...' : 'Jimmy is processing...';
            row.innerHTML = `
                <div class="typing-indicator">
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
