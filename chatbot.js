/* ========================================
   VedTrim AI Chatbot — Powered by Gemini 2.0 Flash
   Self-contained: auto-injects floating chat widget
   ======================================== */

const VedTrimChatbot = {

  // ━━━ CONFIG ━━━━━━━━━━━━━━━━━━━━━━━━━
  // Get your FREE API key from: https://aistudio.google.com/apikey
  API_KEY: 'AIzaSyD1JmPA-yia7dH44SEovl2DQHh20xvKdqY',
  MODEL: 'gemini-2.0-flash',
  ENDPOINT: 'https://generativelanguage.googleapis.com/v1beta/models/',

  SYSTEM_PROMPT: `You are "VedTrim AI", a friendly and knowledgeable Ayurvedic wellness assistant for the VedTrim platform — India's #1 Ayurvedic weight loss program.

Your role:
- Help users with questions about Ayurvedic weight loss, Prakriti, Agni, herbal remedies, diet, and lifestyle
- Guide users to take the Health Quiz, book a Vaidya consultation, or explore plans
- Be warm, professional, and use simple language (mix English with occasional Hindi/Sanskrit terms in parentheses)
- Keep responses concise (2-4 sentences max unless asked for detail)
- Never diagnose or prescribe — always recommend consulting our Vaidya for personalised advice
- Mention VedTrim services naturally when relevant

Key VedTrim info:
- Plans: Basic ₹1,499/month, Premium ₹2,999/month (first month FREE)
- Features: Personalised Vaidya consultation, custom herbal formulations, doorstep delivery
- 15,000+ happy members, 98% success rate, 50+ expert Vaidyas
- Herbs used: Triphala, Medohar Guggulu, Ashwagandha, Garcinia Cambogia (all GMP certified, AYUSH approved)
- Support: 24/7 chat, email support@vedtrim.com, phone +91 98790 65567

Always end with a helpful suggestion or question to keep the conversation going.`,

  messages: [],
  isOpen: false,
  isTyping: false,
  _requestTimes: [],  // rate limiter
  MAX_RPM: 12,        // max 12 requests per minute (safe under Gemini free limit of 15)

  // Fallback responses when API is unavailable
  FALLBACKS: {
    'vedtrim': 'VedTrim is India\'s #1 Ayurvedic weight loss program. We offer personalised Vaidya consultations, custom herbal formulations, and doorstep delivery. Plans start at ₹1,499/month with the first month FREE! 🌿',
    'pricing': 'We offer two plans: <strong>Basic</strong> at ₹1,499/month and <strong>Premium</strong> at ₹2,999/month. Both include expert Vaidya consultation and custom herbal treatment. Your first month is FREE! Visit our <a href="pricing.html">Pricing page</a> for details.',
    'ayurved': 'Ayurvedic weight loss (Medohar Chikitsa) addresses the root cause of weight gain through your unique body constitution (Prakriti). We use herbs like Triphala, Medohar Guggulu, and Ashwagandha — all 100% natural with zero side effects. 🌿',
    'consult': 'You can book a one-on-one Vaidya consultation for just ₹500. Visit our <a href="consult.html">Consult Vaidya</a> page to book your appointment. Our Vaidya will call you within 24 hours! 📞',
    'quiz': 'Our Health Quiz helps our Vaidyas understand your Prakriti (body type), Agni (digestive fire), and overall health. Take it at <a href="quiz.html">Health Quiz</a> — it takes about 10 minutes! 📋',
    'contact': 'You can reach us at: 📧 support@vedtrim.com | 📞 +91 98790 65567 | 📍 Kudasan, Gandhinagar, Gujarat. Or visit our <a href="contact.html">Contact page</a>.',
    'weight': 'Most members start noticing improvements within 2-3 weeks. Visible weight loss typically begins in 4-6 weeks. Our approach is sustainable — no crash diets, no chemicals! Would you like to take our Health Quiz to get started?',
    'default': 'I am happy to help! You can ask me about Ayurvedic weight loss, our plans & pricing, how to consult a Vaidya, or take the Health Quiz. What would you like to know? 🌿'
  },

  // ━━━ INIT ━━━━━━━━━━━━━━━━━━━━━━━━━━━
  init() {
    this.injectStyles();
    this.injectWidget();
    this.bindEvents();
  },

  // ━━━ INJECT CSS ━━━━━━━━━━━━━━━━━━━━━
  injectStyles() {
    const css = document.createElement('style');
    css.textContent = `
      /* Floating Chat Button */
      .vtbot-fab {
        position: fixed;
        bottom: 28px;
        right: 28px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2D5016, #4A7C28);
        color: white;
        border: none;
        cursor: pointer;
        font-size: 1.6rem;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 6px 25px rgba(45,80,22,0.4);
        z-index: 9990;
        transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
        animation: vtbot-bounce 2s ease infinite;
      }
      .vtbot-fab:hover {
        transform: scale(1.1);
        box-shadow: 0 8px 35px rgba(45,80,22,0.5);
      }
      .vtbot-fab.open { animation: none; transform: rotate(0); }
      .vtbot-fab .vtbot-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        background: #E74C3C;
        border-radius: 50%;
        border: 2px solid white;
        animation: vtbot-pulse 1.5s infinite;
      }
      @keyframes vtbot-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-6px); }
      }
      @keyframes vtbot-pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      /* Chat Window */
      .vtbot-window {
        position: fixed;
        bottom: 100px;
        right: 28px;
        width: 380px;
        max-height: 520px;
        background: white;
        border-radius: 20px;
        box-shadow: 0 12px 50px rgba(0,0,0,0.18);
        z-index: 9991;
        display: none;
        flex-direction: column;
        overflow: hidden;
        animation: vtbot-slideUp 0.35s cubic-bezier(0.4,0,0.2,1);
        border: 1px solid rgba(45,80,22,0.1);
      }
      .vtbot-window.open { display: flex; }
      @keyframes vtbot-slideUp {
        from { opacity: 0; transform: translateY(20px) scale(0.95); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      /* Header */
      .vtbot-header {
        background: linear-gradient(135deg, #2D5016, #3a6b1e);
        color: white;
        padding: 16px 20px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .vtbot-header-avatar {
        width: 40px;
        height: 40px;
        background: rgba(255,255,255,0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
        flex-shrink: 0;
      }
      .vtbot-header-info { flex: 1; }
      .vtbot-header-title { font-weight: 700; font-size: 0.95rem; }
      .vtbot-header-status { font-size: 0.75rem; opacity: 0.85; display: flex; align-items: center; gap: 5px; }
      .vtbot-header-status::before {
        content: '';
        width: 7px;
        height: 7px;
        background: #4ADE80;
        border-radius: 50%;
        display: inline-block;
      }
      .vtbot-close {
        background: rgba(255,255,255,0.15);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      .vtbot-close:hover { background: rgba(255,255,255,0.3); }

      /* Messages */
      .vtbot-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        max-height: 340px;
        min-height: 200px;
        background: #FDFAF3;
      }
      .vtbot-msg {
        margin-bottom: 12px;
        display: flex;
        gap: 8px;
        animation: vtbot-fadeIn 0.3s ease;
      }
      @keyframes vtbot-fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .vtbot-msg.bot { justify-content: flex-start; }
      .vtbot-msg.user { justify-content: flex-end; }
      .vtbot-msg-avatar {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        flex-shrink: 0;
        margin-top: 2px;
      }
      .vtbot-msg.bot .vtbot-msg-avatar { background: rgba(45,80,22,0.1); }
      .vtbot-msg-bubble {
        max-width: 78%;
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 0.88rem;
        line-height: 1.5;
        word-wrap: break-word;
      }
      .vtbot-msg.bot .vtbot-msg-bubble {
        background: white;
        color: #333;
        border: 1px solid #E8E0D4;
        border-bottom-left-radius: 4px;
      }
      .vtbot-msg.user .vtbot-msg-bubble {
        background: linear-gradient(135deg, #2D5016, #3a6b1e);
        color: white;
        border-bottom-right-radius: 4px;
      }

      /* Typing indicator */
      .vtbot-typing {
        display: flex;
        gap: 4px;
        padding: 12px 14px;
      }
      .vtbot-typing span {
        width: 7px;
        height: 7px;
        background: #aaa;
        border-radius: 50%;
        animation: vtbot-dot 1.2s infinite;
      }
      .vtbot-typing span:nth-child(2) { animation-delay: 0.2s; }
      .vtbot-typing span:nth-child(3) { animation-delay: 0.4s; }
      @keyframes vtbot-dot {
        0%, 100% { opacity: 0.3; transform: scale(0.8); }
        50% { opacity: 1; transform: scale(1.1); }
      }

      /* Input */
      .vtbot-input-area {
        padding: 12px 16px;
        border-top: 1px solid #E8E0D4;
        display: flex;
        gap: 8px;
        background: white;
      }
      .vtbot-input {
        flex: 1;
        border: 1px solid #E8E0D4;
        border-radius: 24px;
        padding: 10px 16px;
        font-size: 0.88rem;
        outline: none;
        transition: border-color 0.2s;
        font-family: inherit;
      }
      .vtbot-input:focus { border-color: #2D5016; box-shadow: 0 0 0 3px rgba(45,80,22,0.08); }
      .vtbot-input::placeholder { color: #aaa; }
      .vtbot-send {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: linear-gradient(135deg, #2D5016, #4A7C28);
        color: white;
        border: none;
        cursor: pointer;
        font-size: 1.1rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        flex-shrink: 0;
      }
      .vtbot-send:hover { transform: scale(1.08); }
      .vtbot-send:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

      /* Quick replies */
      .vtbot-quick {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 0 16px 12px;
        background: #FDFAF3;
      }
      .vtbot-quick-btn {
        padding: 6px 14px;
        border: 1px solid #d4c9b4;
        background: white;
        border-radius: 20px;
        font-size: 0.78rem;
        cursor: pointer;
        transition: all 0.2s;
        color: #2D5016;
        font-weight: 500;
      }
      .vtbot-quick-btn:hover { background: #2D5016; color: white; border-color: #2D5016; }

      /* Mobile */
      @media (max-width: 480px) {
        .vtbot-window {
          right: 10px;
          left: 10px;
          width: auto;
          bottom: 88px;
          max-height: 70vh;
        }
        .vtbot-fab { bottom: 18px; right: 18px; width: 54px; height: 54px; }
      }

      /* Navbar link style */
      .nav-chat-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        cursor: pointer;
      }
    `;
    document.head.appendChild(css);
  },

  // ━━━ INJECT WIDGET HTML ━━━━━━━━━━━━━
  injectWidget() {
    const widget = document.createElement('div');
    widget.id = 'vtbot';
    widget.innerHTML = `
      <!-- Floating Button -->
      <button class="vtbot-fab" id="vtbotFab" title="Chat with VedTrim AI">
        💬
        <div class="vtbot-badge"></div>
      </button>

      <!-- Chat Window -->
      <div class="vtbot-window" id="vtbotWindow">
        <div class="vtbot-header">
          <div class="vtbot-header-avatar">🌿</div>
          <div class="vtbot-header-info">
            <div class="vtbot-header-title">VedTrim AI</div>
            <div class="vtbot-header-status">Online · Powered by Gemini</div>
          </div>
          <button class="vtbot-close" id="vtbotClose" title="Close chat">✕</button>
        </div>
        <div class="vtbot-messages" id="vtbotMessages"></div>
        <div class="vtbot-quick" id="vtbotQuick">
          <button class="vtbot-quick-btn" onclick="VedTrimChatbot.sendQuick('What is VedTrim?')">What is VedTrim?</button>
          <button class="vtbot-quick-btn" onclick="VedTrimChatbot.sendQuick('How does Ayurvedic weight loss work?')">Ayurvedic weight loss</button>
          <button class="vtbot-quick-btn" onclick="VedTrimChatbot.sendQuick('What are your pricing plans?')">Plans & Pricing</button>
          <button class="vtbot-quick-btn" onclick="VedTrimChatbot.sendQuick('How to consult a Vaidya?')">Consult a Vaidya</button>
        </div>
        <div class="vtbot-input-area">
          <input type="text" class="vtbot-input" id="vtbotInput" placeholder="Ask about Ayurvedic wellness..." autocomplete="off">
          <button class="vtbot-send" id="vtbotSend" title="Send">➤</button>
        </div>
      </div>
    `;
    document.body.appendChild(widget);

    // Welcome message
    this.addMessage('bot', 'Namaste! 🙏 I\'m your VedTrim AI assistant. Ask me anything about Ayurvedic weight loss, our plans, or how to get started. How can I help you today?');
  },

  // ━━━ BIND EVENTS ━━━━━━━━━━━━━━━━━━━━
  bindEvents() {
    document.getElementById('vtbotFab').addEventListener('click', () => this.toggle());
    document.getElementById('vtbotClose').addEventListener('click', () => this.toggle());
    document.getElementById('vtbotSend').addEventListener('click', () => this.send());
    document.getElementById('vtbotInput').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send(); }
    });
  },

  // ━━━ TOGGLE CHAT ━━━━━━━━━━━━━━━━━━━━
  toggle() {
    this.isOpen = !this.isOpen;
    const win = document.getElementById('vtbotWindow');
    const fab = document.getElementById('vtbotFab');
    const badge = fab.querySelector('.vtbot-badge');
    if (this.isOpen) {
      win.classList.add('open');
      fab.classList.add('open');
      fab.innerHTML = '✕';
      if (badge) badge.remove();
      document.getElementById('vtbotInput').focus();
    } else {
      win.classList.remove('open');
      fab.classList.remove('open');
      fab.innerHTML = '💬';
    }
  },

  // ━━━ ADD MESSAGE TO UI ━━━━━━━━━━━━━━
  addMessage(role, text) {
    const container = document.getElementById('vtbotMessages');
    const div = document.createElement('div');
    div.className = `vtbot-msg ${role}`;
    if (role === 'bot') {
      div.innerHTML = `<div class="vtbot-msg-avatar">🌿</div><div class="vtbot-msg-bubble">${text}</div>`;
    } else {
      div.innerHTML = `<div class="vtbot-msg-bubble">${text}</div>`;
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  // ━━━ SHOW / HIDE TYPING ━━━━━━━━━━━━━
  showTyping() {
    const container = document.getElementById('vtbotMessages');
    const div = document.createElement('div');
    div.className = 'vtbot-msg bot';
    div.id = 'vtbotTyping';
    div.innerHTML = `<div class="vtbot-msg-avatar">🌿</div><div class="vtbot-msg-bubble"><div class="vtbot-typing"><span></span><span></span><span></span></div></div>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  hideTyping() {
    const el = document.getElementById('vtbotTyping');
    if (el) el.remove();
  },

  // ━━━ SEND QUICK REPLY ━━━━━━━━━━━━━━━
  sendQuick(text) {
    document.getElementById('vtbotInput').value = text;
    document.getElementById('vtbotQuick').style.display = 'none';
    this.send();
  },

  // ━━━ RATE LIMIT CHECK ━━━━━━━━━━━━━━━━
  _canMakeRequest() {
    const now = Date.now();
    this._requestTimes = this._requestTimes.filter(t => now - t < 60000);
    if (this._requestTimes.length >= this.MAX_RPM) return false;
    this._requestTimes.push(now);
    return true;
  },

  // ━━━ FALLBACK MATCH ━━━━━━━━━━━━━━━━━
  _getFallback(text) {
    const lower = text.toLowerCase();
    for (const [key, response] of Object.entries(this.FALLBACKS)) {
      if (key !== 'default' && lower.includes(key)) return response;
    }
    if (lower.includes('plan') || lower.includes('price') || lower.includes('cost')) return this.FALLBACKS.pricing;
    if (lower.includes('call') || lower.includes('book') || lower.includes('doctor') || lower.includes('vaidya')) return this.FALLBACKS.consult;
    if (lower.includes('lose') || lower.includes('fat') || lower.includes('slim')) return this.FALLBACKS.weight;
    if (lower.includes('herb') || lower.includes('natural') || lower.includes('triphala')) return this.FALLBACKS.ayurved;
    if (lower.includes('phone') || lower.includes('email') || lower.includes('support')) return this.FALLBACKS.contact;
    return this.FALLBACKS.default;
  },

  // ━━━ SEND MESSAGE ━━━━━━━━━━━━━━━━━━━
  async send() {
    const input = document.getElementById('vtbotInput');
    const text = input.value.trim();
    if (!text || this.isTyping) return;

    this.addMessage('user', text);
    input.value = '';
    this.isTyping = true;
    document.getElementById('vtbotSend').disabled = true;
    this.messages.push({ role: 'user', parts: [{ text }] });
    this.showTyping();

    // Rate limit check — use fallback if too many requests
    if (!this._canMakeRequest()) {
      await new Promise(r => setTimeout(r, 800));
      this.hideTyping();
      this.addMessage('bot', this._getFallback(text));
      this.isTyping = false;
      document.getElementById('vtbotSend').disabled = false;
      return;
    }

    try {
      const url = `${this.ENDPOINT}${this.MODEL}:generateContent?key=${this.API_KEY}`;
      const body = {
        system_instruction: { parts: [{ text: this.SYSTEM_PROMPT }] },
        contents: this.messages
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      let reply = this._getFallback(text);

      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        reply = data.candidates[0].content.parts[0].text;
        reply = reply.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        reply = reply.replace(/\*(.*?)\*/g, '<em>$1</em>');
        reply = reply.replace(/\n/g, '<br>');
        this.messages.push({ role: 'model', parts: [{ text: data.candidates[0].content.parts[0].text }] });
      } else if (data?.error?.message?.includes('429') || data?.error?.message?.includes('quota')) {
        // Quota exceeded — use fallback silently
        reply = this._getFallback(text);
      }

      this.hideTyping();
      this.addMessage('bot', reply);

    } catch (err) {
      this.hideTyping();
      this.addMessage('bot', this._getFallback(text));
      console.error('[VedTrim Chatbot]', err);
    }

    this.isTyping = false;
    document.getElementById('vtbotSend').disabled = false;
    document.getElementById('vtbotInput').focus();
  }
};

// Auto-init when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => VedTrimChatbot.init());
} else {
  VedTrimChatbot.init();
}
