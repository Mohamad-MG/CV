/**
 * 🚀 CAPTAIN JIMMY - SYSTEM CORE (2026)
 * "Super Ultra Edition"
 */

const J5_CONFIG = {
    isLite: window.matchMedia("(max-width: 1024px)").matches,
    agentVideo: 'assets/images/Jimmy-icon-v.m4v', 
    workerUrl: 'https://mg-ai-proxy.emarketbank.workers.dev/chat',
    texts: {
        en: {
            name: "Captain Jimmy",
            status: "Online",
            welcome: "Captain Jimmy on deck! Ready to navigate?",
            placeholder: "Type a command..."
        },
        ar: {
            name: "كابتن جيمي",
            status: "متصل",
            welcome: "كابتن جيمي معك! جاهز للإبحار؟",
            placeholder: "أدخل أمرك..."
        }
    }
};

class Jimmy5System {
    constructor() {
        this.body = document.body;
        this.init();
    }

    init() {
        this.setMode();
        window.addEventListener('resize', () => this.handleResize());
        this.initMobileInteractions();
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
        this.setMode();
    }

    initMobileInteractions() {
        document.querySelectorAll('.mobile-accordion-trigger').forEach(trigger => {
            trigger.addEventListener('click', () => {
                const targetId = trigger.dataset.target;
                const content = document.getElementById(targetId);
                trigger.classList.toggle('active');
                if (content) content.classList.toggle('expanded');
            });
        });
    }
}

class Jimmy5Agent {
    constructor() {
        this.isOpen = false;
        this.isDragging = false;
        this.startPos = { x: 0, y: 0 };
        this.messages = [];
        this.isTyping = false;
        this.lang = document.documentElement.lang === 'ar' ? 'ar' : 'en';
        
        this.render();
        this.cacheDOM();
        this.bindEvents();
        this.initDraggable();
    }

    render() {
        const txt = J5_CONFIG.texts[this.lang];
        const html = `
            <button id="jimmy-launcher" aria-label="Open Chat">
                <video src="${J5_CONFIG.agentVideo}" autoplay loop muted playsinline></video>
            </button>
            
            <div id="jimmy-chat-panel" role="dialog" aria-modal="true">
                <div class="sheet-handle"></div>
                <div class="chat-header">
                    <div class="brand-group">
                        <span class="header-name">${txt.name}</span>
                        <span class="header-status">${txt.status}</span>
                    </div>
                    <button id="chat-close-btn" class="close-btn"><i class="ri-close-line" style="font-size:1.2rem"></i></button>
                </div>
                <div id="chat-body" class="chat-body"></div>
                <div class="chat-footer">
                    <div class="input-capsule">
                        <input type="text" id="chat-input" class="input-field" placeholder="${txt.placeholder}" autocomplete="off">
                        <button id="chat-send-btn" class="send-btn"><i class="ri-arrow-up-line"></i></button>
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
            body: document.getElementById('chat-body'),
            input: document.getElementById('chat-input'),
            send: document.getElementById('chat-send-btn'),
            close: document.getElementById('chat-close-btn'),
            handle: document.querySelector('.sheet-handle')
        };
    }

    bindEvents() {
        this.ui.launcher.addEventListener('click', () => { if (!this.isDragging) this.toggle(true); });
        this.ui.close.addEventListener('click', () => this.toggle(false));
        this.ui.send.addEventListener('click', () => this.sendMessage());
        this.ui.input.addEventListener('keydown', (e) => { if (e.key === 'Enter') this.sendMessage(); });
        
        // Mobile Swipe Down to Close
        if (this.ui.handle) {
            let startY = 0;
            this.ui.handle.addEventListener('touchstart', (e) => startY = e.touches[0].clientY, { passive: true });
            this.ui.handle.addEventListener('touchmove', (e) => {
                if (e.touches[0].clientY - startY > 80) this.toggle(false);
            }, { passive: true });
        }
    }

    initDraggable() {
        const el = this.ui.launcher;
        let xOffset = 0, yOffset = 0;

        const dragStart = (e) => {
            this.isDragging = false;
            this.startPos.x = (e.type === 'touchstart') ? e.touches[0].clientX : e.clientX;
            this.startPos.y = (e.type === 'touchstart') ? e.touches[0].clientY : e.clientY;
            xOffset = el.offsetLeft;
            yOffset = el.offsetTop;
            
            document.addEventListener('mousemove', dragMove);
            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('touchmove', dragMove, { passive: false });
            document.addEventListener('touchend', dragEnd);
        };

        const dragMove = (e) => {
            const cx = (e.type === 'touchmove') ? e.touches[0].clientX : e.clientX;
            const cy = (e.type === 'touchmove') ? e.touches[0].clientY : e.clientY;
            const dx = cx - this.startPos.x;
            const dy = cy - this.startPos.y;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                this.isDragging = true;
                e.preventDefault();
                el.style.transition = 'none';
                el.style.left = `${xOffset + dx}px`;
                el.style.top = `${yOffset + dy}px`;
                el.style.bottom = 'auto'; el.style.right = 'auto';
            }
        };

        const dragEnd = () => {
            document.removeEventListener('mousemove', dragMove);
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('touchmove', dragMove);
            document.removeEventListener('touchend', dragEnd);
            
            if (this.isDragging) {
                const rect = el.getBoundingClientRect();
                const snapLeft = (rect.left + rect.width/2) < (window.innerWidth/2);
                el.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.1)';
                el.style.left = snapLeft ? '24px' : `${window.innerWidth - rect.width - 24}px`;
                setTimeout(() => { this.isDragging = false; }, 100);
            }
        };

        el.addEventListener('mousedown', dragStart);
        el.addEventListener('touchstart', dragStart, { passive: true });
    }

    toggle(open) {
        this.isOpen = open;
        this.ui.panel.classList.toggle('active', open);
        if (J5_CONFIG.isLite && open) document.body.style.overflow = 'hidden';
        else document.body.style.overflow = '';
        
        if (open && this.messages.length === 0) this.addMessage('ai', J5_CONFIG.texts[this.lang].welcome);
        if (open) setTimeout(() => this.ui.input.focus(), 400);
    }

    addMessage(role, text) {
        const row = document.createElement('div');
        row.className = `msg-row ${role}`;
        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        bubble.innerHTML = text.replace(/\n/g, '<br>');
        row.appendChild(bubble);
        this.ui.body.appendChild(row);
        this.ui.body.scrollTop = this.ui.body.scrollHeight;
        this.messages.push({ role, text });
    }

    async sendMessage() {
        const text = this.ui.input.value.trim();
        if (!text || this.isTyping) return;
        this.ui.input.value = '';
        this.addMessage('user', text);
        this.showTyping(true);

        try {
            const res = await fetch(J5_CONFIG.workerUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: this.messages.map(m => ({ role: m.role==='ai'?'assistant':'user', content: m.text })) })
            });
            const data = await res.json();
            this.showTyping(false);
            if (data.response) this.addMessage('ai', data.response);
        } catch {
            this.showTyping(false);
            this.addMessage('ai', "Signal interference. Please retry.");
        }
    }

    showTyping(show) {
        this.isTyping = show;
        const existing = document.getElementById('j5-typing');
        if (existing) existing.remove();
        
        if (show) {
            const row = document.createElement('div');
            row.id = 'j5-typing';
            row.className = 'msg-row ai';
            row.innerHTML = `<div class="msg-bubble"><div class="typing-pulse"><div class="pulse-dot"></div><div class="pulse-dot"></div><div class="pulse-dot"></div></div></div>`;
            this.ui.body.appendChild(row);
            this.ui.body.scrollTop = this.ui.body.scrollHeight;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.j5System = new Jimmy5System();
    window.j5Agent = new Jimmy5Agent();
});
