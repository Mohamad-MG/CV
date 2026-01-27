/**
 * 🌌 ULTRA MODERN AGENT 2026 - Two-Stage Neural Interface
 * Stage 1: Invitation (The Hook)
 * Stage 2: Focus (The Immersion)
 */

const AGENT_CONFIG = {
    workerUrl: 'https://mg-ai-proxy.emarketbank.workers.dev/chat',
    typingSpeed: 30, // ms per char for streaming effect
    texts: {
        en: {
            inviteTitle: "System Online",
            inviteBody: "I've analyzed the portfolio. Ready to debrief?",
            btnInit: "Initialize Interface",
            hudTitle: "Neural Link // Captain Jimmy",
            placeholder: "Accessing database... Ask me anything.",
            welcome: "Neural link established. I have full access to Mohamed's career data. What is your directive?"
        },
        ar: {
            inviteTitle: "النظام متصل",
            inviteBody: "جمعت كل البيانات عن الخبرات. جاهز للعرض؟",
            btnInit: "بدء الاتصال",
            hudTitle: "غرفة القيادة // كابتن جيمي",
            placeholder: "جاري الاتصال بقاعدة البيانات... اسألني.",
            welcome: "تم تأمين الاتصال. عندي صلاحية كاملة لملفات محمد جمال. تحب نبدأ بإيه؟"
        }
    }
};

class NeuralAgent {
    constructor() {
        this.state = 'idle'; // idle | invite | focus
        this.lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
        this.messages = [];
        this.elements = {};
        
        this.init();
    }

    init() {
        this.injectHTML();
        this.cacheDOM();
        this.bindEvents();
        this.loadHistory();
    }

    injectHTML() {
        const txt = AGENT_CONFIG.texts[this.lang];
        const html = `
            <!-- Background Blocker -->
            <div id="aiBackdrop" class="ai-backdrop"></div>

            <!-- The Interface Container (Morphs between Invite/Focus) -->
            <div id="aiInterface" class="ai-interface-container">
                
                <!-- LAYER 1: INVITATION -->
                <div id="viewInvite" class="view-layer view-invite">
                    <div class="invite-header">
                        <div class="invite-status-dot"></div>
                        <span class="invite-title">${txt.inviteTitle}</span>
                    </div>
                    <p class="invite-text">${txt.inviteBody}</p>
                    <div class="invite-actions">
                        <button id="btnInit" class="btn-initialize">${txt.btnInit}</button>
                        <button id="btnDismiss" class="btn-dismiss"><i class="ri-close-line"></i></button>
                    </div>
                </div>

                <!-- LAYER 2: FOCUS HUD -->
                <div id="viewFocus" class="view-layer view-focus">
                    <div class="focus-header">
                        <div class="focus-title">
                            <i class="ri-cpu-line"></i>
                            <span>${txt.hudTitle}</span>
                        </div>
                        <button id="btnCloseFocus" class="focus-close">
                            <i class="ri-close-line"></i>
                        </button>
                    </div>
                    
                    <div id="chatMessages" class="focus-messages">
                        <!-- Messages go here -->
                    </div>

                    <div class="focus-input-area">
                        <div class="focus-input-wrapper">
                            <input type="text" id="chatInput" class="focus-input" placeholder="${txt.placeholder}" autocomplete="off">
                            <button id="btnSend" class="focus-send-btn">
                                <i class="ri-arrow-up-line"></i>
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Trigger Orb -->
            <div id="aiTrigger" class="ai-trigger-orb">
                <div class="orb-core">
                    <img src="assets/images/Cjimmy.png" alt="AI">
                    <div class="orb-ring"></div>
                </div>
            </div>
        `;

        const wrapper = document.createElement('div');
        wrapper.id = 'mg-neural-root';
        wrapper.innerHTML = html;
        document.body.appendChild(wrapper);
    }

    cacheDOM() {
        this.elements = {
            backdrop: document.getElementById('aiBackdrop'),
            interface: document.getElementById('aiInterface'),
            trigger: document.getElementById('aiTrigger'),
            viewInvite: document.getElementById('viewInvite'),
            viewFocus: document.getElementById('viewFocus'),
            btnInit: document.getElementById('btnInit'),
            btnDismiss: document.getElementById('btnDismiss'),
            btnCloseFocus: document.getElementById('btnCloseFocus'),
            chatInput: document.getElementById('chatInput'),
            btnSend: document.getElementById('btnSend'),
            messages: document.getElementById('chatMessages')
        };
    }

    bindEvents() {
        // Trigger Click -> Open Invite (Stage 1)
        this.elements.trigger.addEventListener('click', () => this.setStage('invite'));

        // Init Click -> Open Focus (Stage 2)
        this.elements.btnInit.addEventListener('click', () => this.setStage('focus'));

        // Dismiss Click -> Back to Idle
        this.elements.btnDismiss.addEventListener('click', () => this.setStage('idle'));

        // Close Focus -> Back to Idle (Full Reset)
        this.elements.btnCloseFocus.addEventListener('click', () => this.setStage('idle'));
        this.elements.backdrop.addEventListener('click', () => this.setStage('idle'));

        // Input Logic
        this.elements.chatInput.addEventListener('input', (e) => {
            const hasText = e.target.value.trim().length > 0;
            this.elements.btnSend.classList.toggle('ready', hasText);
        });

        this.elements.chatInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        this.elements.btnSend.addEventListener('click', () => this.sendMessage());
    }

    setStage(stage) {
        const { interface: ui, trigger, backdrop, viewInvite, viewFocus } = this.elements;
        this.state = stage;

        // Reset classes
        ui.classList.remove('mode-invite', 'mode-focus');
        viewInvite.classList.remove('active');
        viewFocus.classList.remove('active');
        backdrop.classList.remove('active');
        trigger.classList.remove('hidden');

        // Unlock scroll by default
        document.body.style.overflow = '';

        if (stage === 'invite') {
            ui.classList.add('mode-invite');
            trigger.classList.add('hidden');
            
            // Delay content slightly for morph animation
            setTimeout(() => viewInvite.classList.add('active'), 200);

        } else if (stage === 'focus') {
            ui.classList.add('mode-focus');
            trigger.classList.add('hidden');
            backdrop.classList.add('active');
            
            // Lock Scroll
            document.body.style.overflow = 'hidden';

            setTimeout(() => viewFocus.classList.add('active'), 300);
            
            // Focus input
            setTimeout(() => this.elements.chatInput.focus(), 500);

            // Send welcome if empty
            if (this.messages.length === 0) {
                this.addMessage(AGENT_CONFIG.texts[this.lang].welcome, 'ai');
            }
        }
    }

    addMessage(text, sender) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `chat-bubble bubble-${sender}`;
        msgDiv.textContent = text;
        
        this.elements.messages.appendChild(msgDiv);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;

        this.messages.push({ role: sender, content: text });
        this.saveHistory();
    }

    async sendMessage() {
        const input = this.elements.chatInput;
        const text = input.value.trim();
        if (!text) return;

        // UI Updates
        this.addMessage(text, 'user');
        input.value = '';
        this.elements.btnSend.classList.remove('ready');

        // Show Typing Indicator
        const typingId = this.showTyping();

        try {
            // Simulated API Call (Replace with real worker)
            const response = await this.fetchResponse(text);
            this.removeTyping(typingId);
            this.addMessage(response, 'ai');
        } catch (err) {
            this.removeTyping(typingId);
            this.addMessage("Connection interference. Re-aligning satellites... Try again.", 'ai');
        }
    }

    showTyping() {
        const id = 'typing-' + Date.now();
        const div = document.createElement('div');
        div.id = id;
        div.className = 'chat-bubble bubble-ai';
        div.innerHTML = '<span class="typing-dots">...</span>'; // You can animate this in CSS
        this.elements.messages.appendChild(div);
        this.elements.messages.scrollTop = this.elements.messages.scrollHeight;
        return id;
    }

    removeTyping(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    async fetchResponse(userText) {
        // Construct payload
        const history = this.messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
        }));

        try {
            const res = await fetch(AGENT_CONFIG.workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: history,
                    language: this.lang
                })
            });
            const data = await res.json();
            return data.response || "No data received.";
        } catch (e) {
            console.error(e);
            throw e;
        }
    }

    saveHistory() {
        localStorage.setItem('mg_neural_history', JSON.stringify(this.messages));
    }

    loadHistory() {
        const saved = localStorage.getItem('mg_neural_history');
        if (saved) {
            this.messages = JSON.parse(saved);
            this.messages.forEach(m => {
                const div = document.createElement('div');
                div.className = `chat-bubble bubble-${m.role === 'user' ? 'user' : 'ai'}`;
                div.textContent = m.content;
                this.elements.messages.appendChild(div);
            });
        }
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    window.neuralAgent = new NeuralAgent();
});