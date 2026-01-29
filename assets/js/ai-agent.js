/**
 * 🌌 THE DARK PRISM AGENT - 2026 QUANTUM EDITION
 * Premium Specialized Product Interface
 */

const PRISM_CONFIG = {
    workerUrl: 'https://mg-ai-proxy.emarketbank.workers.dev/chat',
    requestTimeoutMs: 15000,
    maxHistory: 12,
    maxInputChars: 2500,
    limits: {
        maxRequests: 30,
        warnAt: 28,
        maxSessions: 2
    },
    texts: {
        en: {
            status: "NEURAL LINK ACTIVE",
            placeholder: "Initialize command...",
            welcome: "Quantum Link Established. Accessing Mohamed's neural database...",
            error: "ERR_SIGNAL_LOST",
            timeout: "ERR_TIMEOUT",
            limitWarn: "PROTOCOL ALERT: 2 pulses remaining.",
            limitReached: "LOCKED: Re-sync required.",
            chips: ["Growth Path?", "Tech Stack?", "Automation?", "KSA Market?"]
        },
        ar: {
            status: "الرابط العصبي نشط",
            placeholder: "أدخل الأوامر...",
            welcome: "تم تأسيس الارتباط الكمي. جاري استدعاء بيانات محمد...",
            error: "فشل في الإشارة",
            timeout: "انتهت المهلة",
            limitWarn: "تنبيه البروتوكول: تبقى سؤالان فقط.",
            limitReached: "تم القفل: استبدل الجلسة.",
            chips: ["مسار النمو؟", "أدوات التقنية؟", "الأتمتة؟", "سوق السعودية؟"]
        }
    }
};

class ChatSessionManager {
    constructor() {
        this.storageKey = 'mg_prism_sessions_v2';
        this.sessions = this.loadSessions();
        this.activeSessionId = localStorage.getItem('mg_prism_active_id');

        if (!this.activeSessionId || !this.getSession(this.activeSessionId)) {
            this.createNewSession();
        }
    }

    loadSessions() {
        try { return JSON.parse(localStorage.getItem(this.storageKey) || '[]'); } catch { return []; }
    }

    saveSessions() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.sessions));
        localStorage.setItem('mg_prism_active_id', this.activeSessionId);
    }

    getSession(id) { return this.sessions.find(s => s.id === id); }
    getActiveSession() { return this.getSession(this.activeSessionId); }

    createNewSession() {
        if (this.sessions.length >= PRISM_CONFIG.limits.maxSessions) {
            this.sessions.sort((a, b) => a.created - b.created);
            while (this.sessions.length >= PRISM_CONFIG.limits.maxSessions) {
                this.sessions.shift();
            }
        }
        const newSess = {
            id: 'sess_' + Date.now(),
            created: Date.now(),
            messages: [],
            requestCount: 0,
            isLocked: false
        };
        this.sessions.push(newSess);
        this.activeSessionId = newSess.id;
        this.saveSessions();
        return newSess;
    }

    addMessage(role, content) {
        const session = this.getActiveSession();
        if (!session) return;
        if (role === 'user') {
            session.requestCount++;
            if (session.requestCount >= PRISM_CONFIG.limits.maxRequests) session.isLocked = true;
        }
        session.messages.push({ role, content, time: Date.now() });
        this.saveSessions();
    }
}

class PrismAgent {
    constructor() {
        this.isOpen = false;
        this.lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
        this.sessionManager = new ChatSessionManager();
        this.isSending = false;
        this.typingTimer = null;
        this.motionMode = localStorage.getItem('mg_motion_mode') || 'cinematic';
        this.init();
    }

    init() {
        this.render();
        this.cacheDOM();
        this.bindEvents();
        this.loadHistory();
        if (localStorage.getItem('mg_prism_open') === 'true') setTimeout(() => this.toggle(true), 500);
    }

    render() {
        const txt = PRISM_CONFIG.texts[this.lang];
        const chipsHtml = txt.chips.map(chip => `<button class="chip" onclick="window.prismAgent.useChip('${chip}')">${chip}</button>`).join('');

        const html = `
            <div id="mg-neural-backdrop"></div>
            <div id="aiTrigger" class="console-trigger-quantum"><img src="assets/images/jimmy-icon222222.png" alt="AI"></div>
            <div id="aiConsole" class="ai-console-quantum">
                <div class="header-quantum">
                    <div class="brand-quantum">
                        <div class="quantum-orb"><div class="orb-core"></div><div class="orb-ring"></div></div>
                        <div class="brand-info">
                            <span class="brand-name">JIMMY CORE</span>
                            <span class="brand-status" id="aiStatusText">${txt.status}</span>
                        </div>
                    </div>
                    <div class="controls-quantum">
                        <div class="quota-container" id="quotaContainer" style="display: none;">
                            <div class="quota-gauge"><div id="usageBar" class="gauge-fill"></div></div>
                            <span id="usageBadge" class="quota-text">0/30</span>
                        </div>
                        <button id="btnNewChat" class="btn-icon-quantum" title="Reset Session"><i class="ri-refresh-line"></i></button>
                        <button id="btnClose" class="btn-icon-quantum"><i class="ri-close-line"></i></button>
                    </div>
                </div>
                <div id="consoleMsgs" class="messages-quantum"></div>
                <div class="input-area-quantum" id="inputArea">
                    <div class="input-container-quantum">
                        <input type="text" id="consoleInput" placeholder="${txt.placeholder}" autocomplete="off">
                        <button id="btnSend"><i class="ri-send-plane-2-fill"></i></button>
                    </div>
                    <div class="suggestion-row">${chipsHtml}</div>
                    <div id="limitWarning" class="warning-quantum" style="display:none;"></div>
                </div>
            </div>`;
        const root = document.createElement('div'); root.id = 'mg-prism-root'; root.innerHTML = html; document.body.appendChild(root);
    }

    cacheDOM() {
        this.ui = {
            backdrop: document.getElementById('mg-neural-backdrop'),
            trigger: document.getElementById('aiTrigger'),
            console: document.getElementById('aiConsole'),
            close: document.getElementById('btnClose'),
            newChatBtn: document.getElementById('btnNewChat'),
            input: document.getElementById('consoleInput'),
            sendBtn: document.getElementById('btnSend'),
            msgs: document.getElementById('consoleMsgs'),
            usageBadge: document.getElementById('usageBadge'),
            usageBar: document.getElementById('usageBar'),
            quotaContainer: document.getElementById('quotaContainer'),
            limitWarning: document.getElementById('limitWarning')
        };
    }

    bindEvents() {
        this.ui.trigger.addEventListener('click', () => this.toggle(true));
        this.ui.close.addEventListener('click', () => this.toggle(false));
        this.ui.backdrop.addEventListener('click', () => this.toggle(false));
        this.ui.sendBtn.addEventListener('click', () => this.handleSubmit());
        this.ui.newChatBtn.addEventListener('click', () => { this.sessionManager.createNewSession(); this.loadHistory(); this.updateUIState(); });
        this.ui.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.handleSubmit(); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.isOpen) this.toggle(false); });
    }

    toggle(open) {
        this.isOpen = open;
        localStorage.setItem('mg_prism_open', open);
        document.body.classList.toggle('ai-open', open);
        this.ui.console.classList.toggle('active', open);
        this.ui.backdrop.classList.toggle('active', open);
        if (open) {
            this.loadHistory();
            this.updateUIState();
            if (this.sessionManager.getActiveSession().messages.length === 0) this.addMessage('ai', PRISM_CONFIG.texts[this.lang].welcome);
            this.ui.input.focus();
        }
    }

    handleSubmit() {
        if (this.isSending || this.sessionManager.getActiveSession().isLocked) return;
        const text = this.ui.input.value.trim();
        if (!text) return;
        this.ui.input.value = '';
        this.addMessage('user', text);
        this.updateUIState();
        this.showTyping();
        this.fetchResponse(800);
    }

    addMessage(role, text) {
        const typing = document.getElementById('quantumTyping'); if (typing) typing.remove();
        const isUser = role === 'user';
        const html = `
            <div class="msg-quantum ${role}-msg">
                <div class="msg-avatar-quantum ${isUser ? 'user-avatar' : 'ai-avatar'}">
                    <i class="${isUser ? 'ri-user-smile-line' : 'ri-cpu-line'}"></i>
                </div>
                <div class="msg-bubble-quantum">${text.replace(/\n/g, '<br>')}</div>
            </div>`;
        this.ui.msgs.insertAdjacentHTML('beforeend', html);
        this.ui.msgs.scrollTop = this.ui.msgs.scrollHeight;
        this.sessionManager.addMessage(role, text);
    }

    showTyping() {
        const html = `<div id="quantumTyping" class="msg-quantum ai-msg"><div class="msg-avatar-quantum ai-avatar"><i class="ri-cpu-line"></i></div><div class="msg-bubble-quantum typing-quantum"><span></span><span></span><span></span></div></div>`;
        this.ui.msgs.insertAdjacentHTML('beforeend', html);
        this.ui.msgs.scrollTop = this.ui.msgs.scrollHeight;
    }

    async fetchResponse() {
        this.isSending = true;
        const payload = this.sessionManager.getActiveSession().messages.slice(-PRISM_CONFIG.maxHistory).map(m => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.content }));
        try {
            const res = await fetch(PRISM_CONFIG.workerUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: payload }) });
            const data = await res.json();
            this.addMessage('ai', data.response || PRISM_CONFIG.texts[this.lang].error);
        } catch { this.addMessage('ai', PRISM_CONFIG.texts[this.lang].error); }
        finally { this.isSending = false; this.updateUIState(); }
    }

    loadHistory() {
        this.ui.msgs.innerHTML = '';
        this.sessionManager.getActiveSession().messages.forEach(m => {
            const isUser = m.role === 'user';
            const html = `<div class="msg-quantum ${m.role}-msg"><div class="msg-avatar-quantum ${isUser ? 'user-avatar' : 'ai-avatar'}"><i class="${isUser ? 'ri-user-smile-line' : 'ri-cpu-line'}"></i></div><div class="msg-bubble-quantum">${m.content.replace(/\n/g, '<br>')}</div></div>`;
            this.ui.msgs.insertAdjacentHTML('beforeend', html);
        });
        this.ui.msgs.scrollTop = this.ui.msgs.scrollHeight;
    }

    updateUIState() {
        const sess = this.sessionManager.getActiveSession();
        const count = sess.requestCount;
        this.ui.usageBadge.textContent = `${count}/30`;
        this.ui.usageBar.style.width = `${(count / 30) * 100}%`;
        
        // Show quota container only after 25 requests
        if (this.ui.quotaContainer) {
            this.ui.quotaContainer.style.display = count >= 25 ? 'flex' : 'none';
        }

        if (count >= 28) {
            this.ui.limitWarning.style.display = 'block';
            this.ui.limitWarning.textContent = count >= 30 ? PRISM_CONFIG.texts[this.lang].limitReached : PRISM_CONFIG.texts[this.lang].limitWarn;
            this.ui.input.disabled = (count >= 30);
        } else { this.ui.limitWarning.style.display = 'none'; this.ui.input.disabled = false; }
    }

    useChip(text) { this.ui.input.value = text; this.handleSubmit(); }
}

document.addEventListener('DOMContentLoaded', () => { window.prismAgent = new PrismAgent(); });