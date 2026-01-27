/**
 * 🌌 ULTRA MODERN AGENT 2026 - Direct & Compact
 * No fuss, just instant access.
 */

const AGENT_CONFIG = {
    workerUrl: 'https://mg-ai-proxy.emarketbank.workers.dev/chat',
    texts: {
        en: {
            title: "Captain Jimmy // AI",
            placeholder: "Ask about experience...",
            welcome: "Systems online. Accessing Mohamed's career database. How can I help?",
            error: "Connection lost. Please try again."
        },
        ar: {
            title: "كابتن جيمي // AI",
            placeholder: "اسأل عن الخبرات...",
            welcome: "النظام متصل. جاهز للإجابة عن أي تفاصيل تخص خبرات محمد.",
            error: "فقدنا الاتصال. حاول مرة تانية."
        }
    }
};

class DirectAgent {
    constructor() {
        this.isOpen = false;
        this.lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
        this.messages = [];
        this.init();
    }

    init() {
        this.render();
        this.cacheDOM();
        this.bindEvents();
        this.loadHistory();
    }

    render() {
        const txt = AGENT_CONFIG.texts[this.lang];
        
        const html = `
            <div id="aiTrigger" class="ai-trigger-orb">
                <div class="orb-core">
                    <img src="assets/images/Cjimmy.png" alt="AI">
                    <div class="orb-ring"></div>
                </div>
            </div>

            <div id="aiInterface" class="ai-interface-container">
                <div class="focus-header">
                    <div class="focus-title">
                        <i class="ri-robot-2-fill"></i>
                        <span>${txt.title}</span>
                    </div>
                    <button id="btnClose" class="focus-close">
                        <i class="ri-arrow-down-s-line"></i>
                    </button>
                </div>
                
                <div id="chatMessages" class="focus-messages"></div>

                <div class="focus-input-area">
                    <div class="focus-input-wrapper">
                        <input type="text" id="chatInput" class="focus-input" placeholder="${txt.placeholder}" autocomplete="off">
                        <button id="btnSend" class="focus-send-btn">
                            <i class="ri-send-plane-fill"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        const root = document.createElement('div');
        root.id = 'mg-neural-root';
        root.innerHTML = html;
        document.body.appendChild(root);
    }

    cacheDOM() {
        this.ui = {
            trigger: document.getElementById('aiTrigger'),
            window: document.getElementById('aiInterface'),
            close: document.getElementById('btnClose'),
            input: document.getElementById('chatInput'),
            send: document.getElementById('btnSend'),
            msgs: document.getElementById('chatMessages')
        };
    }

    bindEvents() {
        // Toggle Logic
        this.ui.trigger.addEventListener('click', () => this.toggle(true));
        this.ui.close.addEventListener('click', () => this.toggle(false));

        // Input Logic
        this.ui.input.addEventListener('input', (e) => {
            const valid = e.target.value.trim().length > 0;
            this.ui.send.classList.toggle('ready', valid);
        });

        this.ui.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        this.ui.send.addEventListener('click', () => this.sendMessage());
    }

    toggle(open) {
        this.isOpen = open;
        
        if (open) {
            this.ui.window.classList.add('active');
            this.ui.trigger.classList.add('hidden');
            
            // Focus input after animation
            setTimeout(() => this.ui.input.focus(), 300);

            // First time welcome
            if (this.messages.length === 0) {
                this.addMessage(AGENT_CONFIG.texts[this.lang].welcome, 'ai');
            }
        } else {
            this.ui.window.classList.remove('active');
            this.ui.trigger.classList.remove('hidden');
        }
    }

    sendMessage() {
        const text = this.ui.input.value.trim();
        if (!text) return;

        // UI Reset
        this.ui.input.value = '';
        this.ui.send.classList.remove('ready');
        
        // Add User Message
        this.addMessage(text, 'user');
        
        // AI Thinking
        const loadingId = this.showLoading();

        // Network Request
        this.fetchReply(text)
            .then(reply => {
                this.removeLoading(loadingId);
                this.addMessage(reply, 'ai');
            })
            .catch(() => {
                this.removeLoading(loadingId);
                this.addMessage(AGENT_CONFIG.texts[this.lang].error, 'ai');
            });
    }

    addMessage(text, role) {
        const div = document.createElement('div');
        div.className = `chat-bubble bubble-${role}`;
        div.textContent = text;
        this.ui.msgs.appendChild(div);
        this.scrollToBottom();

        this.messages.push({ role, content: text });
        this.saveHistory();
    }

    showLoading() {
        const id = 'load-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'chat-bubble bubble-ai typing-dots';
        div.textContent = '...';
        this.ui.msgs.appendChild(div);
        this.scrollToBottom();
        return id;
    }

    removeLoading(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    scrollToBottom() {
        this.ui.msgs.scrollTop = this.ui.msgs.scrollHeight;
    }

    async fetchReply(text) {
        // Format for API
        const history = this.messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
        }));

        const res = await fetch(AGENT_CONFIG.workerUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                messages: history,
                language: this.lang
            })
        });

        const data = await res.json();
        return data.response;
    }

    saveHistory() {
        try {
            localStorage.setItem('jimmy_direct_history', JSON.stringify(this.messages));
        } catch (e) {}
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('jimmy_direct_history');
            if (saved) {
                this.messages = JSON.parse(saved);
                this.messages.forEach(m => {
                    const div = document.createElement('div');
                    div.className = `chat-bubble bubble-${m.role}`;
                    div.textContent = m.content;
                    this.ui.msgs.appendChild(div);
                });
            }
        } catch (e) {}
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.directAgent = new DirectAgent();
});
