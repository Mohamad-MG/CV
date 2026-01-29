/**
 * 🚀 JIMMY 5 - SYSTEM CORE (2026)
 * "The Intelligence that Moves with You"
 */

const J5_CONFIG = {
    isLite: window.matchMedia("(max-width: 1024px)").matches,
    agentVideo: 'assets/images/Jimmy-icon-v.m4v',
    workerUrl: 'https://mg-ai-proxy.emarketbank.workers.dev/chat',
    welcomeMsg: {
        en: "Quantum Link Established. I am Jimmy5. How can I accelerate your growth today?",
        ar: "تم تأسيس الارتباط الكمي. أنا جيمي 5. كيف يمكنني تسريع نموك اليوم؟"
    }
};

class Jimmy5System {
    constructor() {
        this.body = document.body;
        this.lang = document.documentElement.lang || 'en';
        this.init();
    }

    init() {
        this.setMode();
        window.addEventListener('resize', () => this.handleResize());
        console.log(`Jimmy5 System: ${J5_CONFIG.isLite ? 'Lite' : 'Ultra'} Mode Active`);
    }

    setMode() {
        J5_CONFIG.isLite = window.matchMedia("(max-width: 1024px)").matches;
        if (J5_CONFIG.isLite) {
            this.body.classList.add('lite-mode');
            this.body.classList.remove('ultra-mode');
        } else {
            this.body.classList.add('ultra-mode');
            this.body.classList.remove('lite-mode');
        }
    }

    handleResize() {
        const wasLite = J5_CONFIG.isLite;
        this.setMode();
        if (wasLite !== J5_CONFIG.isLite) {
            // Hot reload specific components if needed
            location.reload(); // Simplest way to ensure all physics/layouts reset
        }
    }
}

class Jimmy5Agent {
    constructor() {
        this.isOpen = false;
        this.isDragging = false;
        this.dragPos = { x: 0, y: 0 };
        this.startPos = { x: 0, y: 0 };
        this.messages = [];
        this.isTyping = false;
        
        this.render();
        this.cacheDOM();
        this.bindEvents();
        this.initDraggable();
    }

    render() {
        const html = `
            <div id="jimmy-launcher">
                <video src="${J5_CONFIG.agentVideo}" autoplay loop muted playsinline></video>
            </div>
            
            <div id="jimmy-chat-panel">
                <div class="chat-handle"></div>
                <div class="chat-header">
                    <div class="chat-user-info">
                        <div class="chat-avatar">J</div>
                        <div class="chat-status-info">
                            <span class="chat-name">Jimmy5 AI</span>
                            <span class="chat-status">Active Now</span>
                        </div>
                    </div>
                    <button id="chat-close-btn" class="btn-icon-quantum"><i class="ri-close-line"></i></button>
                </div>
                
                <div id="chat-messages" class="chat-messages">
                    <!-- Messages will appear here -->
                </div>
                
                <div class="chat-input-area">
                    <div class="chat-input-wrapper">
                        <input type="text" id="chat-input" placeholder="Ask me anything..." autocomplete="off">
                        <button id="chat-send-btn" class="chat-send-btn"><i class="ri-send-plane-2-fill"></i></button>
                    </div>
                </div>
            </div>
        `;
        const container = document.createElement('div');
        container.id = 'jimmy5-root';
        container.innerHTML = html;
        document.body.appendChild(container);
    }

    cacheDOM() {
        this.ui = {
            launcher: document.getElementById('jimmy-launcher'),
            panel: document.getElementById('jimmy-chat-panel'),
            msgs: document.getElementById('chat-messages'),
            input: document.getElementById('chat-input'),
            send: document.getElementById('chat-send-btn'),
            close: document.getElementById('chat-close-btn'),
            handle: document.querySelector('.chat-handle')
        };
    }

    bindEvents() {
        this.ui.launcher.addEventListener('click', () => {
            if (!this.isDragging) this.toggle(true);
        });
        
        this.ui.close.addEventListener('click', () => this.toggle(false));
        
        this.ui.send.addEventListener('click', () => this.sendMessage());
        this.ui.input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });

        // Mobile Gesture: Swipe down on handle to close
        let touchStartY = 0;
        this.ui.handle.addEventListener('touchstart', (e) => {
            touchStartY = e.touches[0].clientY;
        });
        this.ui.handle.addEventListener('touchmove', (e) => {
            const touchY = e.touches[0].clientY;
            const diff = touchY - touchStartY;
            if (diff > 50) this.toggle(false);
        });
    }

    initDraggable() {
        if (!J5_CONFIG.isLite) return;

        const el = this.ui.launcher;
        let xOffset = 0;
        let yOffset = 0;

        const dragStart = (e) => {
            this.isDragging = false;
            this.startPos.x = (e.type === "touchstart") ? e.touches[0].clientX : e.clientX;
            this.startPos.y = (e.type === "touchstart") ? e.touches[0].clientY : e.clientY;
            
            xOffset = el.offsetLeft;
            yOffset = el.offsetTop;
            
            document.addEventListener("mousemove", dragMove);
            document.addEventListener("mouseup", dragEnd);
            document.addEventListener("touchmove", dragMove, { passive: false });
            document.addEventListener("touchend", dragEnd);
        };

        const dragMove = (e) => {
            const currentX = (e.type === "touchmove") ? e.touches[0].clientX : e.clientX;
            const currentY = (e.type === "touchmove") ? e.touches[0].clientY : e.clientY;
            
            const dx = currentX - this.startPos.x;
            const dy = currentY - this.startPos.y;
            
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                this.isDragging = true;
                e.preventDefault();
                el.style.left = `${xOffset + dx}px`;
                el.style.top = `${yOffset + dy}px`;
                el.style.bottom = 'auto';
                el.style.right = 'auto';
            }
        };

        const dragEnd = () => {
            document.removeEventListener("mousemove", dragMove);
            document.removeEventListener("mouseup", dragEnd);
            document.removeEventListener("touchmove", dragMove);
            document.removeEventListener("touchend", dragEnd);
            
            // Snap to edge
            if (this.isDragging) {
                const rect = el.getBoundingClientRect();
                const screenWidth = window.innerWidth;
                if (rect.left + rect.width/2 < screenWidth/2) {
                    el.style.transition = 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
                    el.style.left = '10px';
                } else {
                    el.style.transition = 'left 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
                    el.style.left = `${screenWidth - rect.width - 10}px`;
                }
                setTimeout(() => el.style.transition = '', 300);
            }
        };

        el.addEventListener("mousedown", dragStart);
        el.addEventListener("touchstart", dragStart, { passive: true });
    }

    toggle(open) {
        this.isOpen = open;
        this.ui.panel.classList.toggle('active', open);
        document.body.classList.toggle('no-scroll', open);
        
        if (open && this.messages.length === 0) {
            const lang = document.documentElement.lang || 'en';
            this.addMessage('ai', J5_CONFIG.welcomeMsg[lang]);
        }

        if (open) {
            this.ui.input.focus();
        }
    }

    addMessage(role, text) {
        const bubble = document.createElement('div');
        bubble.className = `msg-bubble msg-${role}`;
        bubble.innerHTML = text.replace(/\n/g, '<br>');
        this.ui.msgs.appendChild(bubble);
        this.ui.msgs.scrollTop = this.ui.msgs.scrollHeight;
        this.messages.push({ role, text });
    }

    async sendMessage() {
        const text = this.ui.input.value.trim();
        if (!text || this.isTyping) return;

        this.ui.input.value = '';
        this.addMessage('user', text);
        this.showTyping(true);

        try {
            const response = await fetch(J5_CONFIG.workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    messages: this.messages.map(m => ({
                        role: m.role === 'ai' ? 'assistant' : 'user',
                        content: m.text
                    }))
                })
            });
            const data = await response.json();
            this.showTyping(false);
            this.addMessage('ai', data.response || "I encountered a glitch in the matrix.");
        } catch (err) {
            this.showTyping(false);
            this.addMessage('ai', "Signal lost. Please try again.");
        }
    }

    showTyping(show) {
        this.isTyping = show;
        if (show) {
            const typing = document.createElement('div');
            typing.id = 'jimmy-typing';
            typing.className = 'msg-bubble msg-ai typing';
            typing.innerHTML = '<span></span><span></span><span></span>';
            this.ui.msgs.appendChild(typing);
        } else {
            const typing = document.getElementById('jimmy-typing');
            if (typing) typing.remove();
        }
        this.ui.msgs.scrollTop = this.ui.msgs.scrollHeight;
    }
}

// Initialize on Load
document.addEventListener('DOMContentLoaded', () => {
    window.j5System = new Jimmy5System();
    window.j5Agent = new Jimmy5Agent();
});
