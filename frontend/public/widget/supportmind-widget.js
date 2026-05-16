(function() {
  'use strict';

  // SupportMind AI Widget - Standalone Script
  // Scoped to avoid global namespace pollution
  const SMK_VERSION = '1.0.0';
  const STORAGE_KEY = 'smk_session_id';
  
  // Configuration read from script tag
  const scriptTag = document.currentScript || Array.from(document.querySelectorAll('script')).find(s => s.src.includes('supportmind-widget.js'));
  const apiKey = scriptTag ? scriptTag.getAttribute('data-api-key') : window.SupportMindApiKey;
  const backendUrl = scriptTag ? scriptTag.getAttribute('data-backend-url') : (window.SupportMindBackendUrl || 'http://localhost:3001');

  if (!apiKey) {
    console.error('[SupportMind] API key not found. Please add data-api-key to the script tag.');
    return;
  }

  // --- State ---
  let isOpen = false;
  let config = null;
  let sessionId = localStorage.getItem(STORAGE_KEY) || crypto.randomUUID();
  let messages = [];
  let isLoaded = false;

  // Save session ID
  localStorage.setItem(STORAGE_KEY, sessionId);

  // --- UI Elements ---
  let shadowRoot = null;
  let container = null;
  let launcher = null;
  let chatWindow = null;
  let messageList = null;
  let inputField = null;

  // --- Styles ---
  const styles = `
    :host {
      --smk-primary: #7c3aed;
      --smk-bg: #0f0a1a;
      --smk-surface: #1a1429;
      --smk-text: #f0eee9;
      --smk-text-muted: #94a3b8;
      --smk-border: rgba(255, 255, 255, 0.1);
      --smk-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      z-index: 999999;
      position: fixed;
      bottom: 24px;
      right: 24px;
      display: block;
    }

    .smk-launcher {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: var(--smk-primary);
      box-shadow: var(--smk-shadow);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: none;
      outline: none;
    }

    .smk-launcher:hover {
      transform: scale(1.05);
      box-shadow: 0 0 20px rgba(124, 58, 237, 0.5);
    }

    .smk-launcher:active {
      transform: scale(0.95);
    }

    .smk-launcher svg {
      width: 30px;
      height: 30px;
      color: white;
      transition: transform 0.3s ease;
    }

    .smk-launcher.open svg {
      transform: rotate(90deg);
    }

    .smk-chat-window {
      position: absolute;
      bottom: 80px;
      right: 0;
      width: 400px;
      height: 600px;
      max-height: calc(100vh - 120px);
      background: var(--smk-bg);
      border-radius: 16px;
      box-shadow: var(--smk-shadow);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid var(--smk-border);
    }

    .smk-chat-window.open {
      opacity: 1;
      transform: translateY(0) scale(1);
      pointer-events: all;
    }

    .smk-header {
      padding: 16px 20px;
      background: var(--smk-surface);
      border-bottom: 1px solid var(--smk-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .smk-header-info h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--smk-text);
    }

    .smk-header-info p {
      margin: 0;
      font-size: 12px;
      color: var(--smk-text-muted);
    }

    .smk-message-list {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      scrollbar-width: thin;
      scrollbar-color: var(--smk-border) transparent;
    }

    .smk-message-list::-webkit-scrollbar {
      width: 6px;
    }

    .smk-message-list::-webkit-scrollbar-thumb {
      background: var(--smk-border);
      border-radius: 10px;
    }

    .smk-message {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 14px;
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .smk-message-user {
      align-self: flex-end;
      background: var(--smk-primary);
      color: white;
      border-bottom-right-radius: 4px;
    }

    .smk-message-bot {
      align-self: flex-start;
      background: var(--smk-surface);
      color: var(--smk-text);
      border-bottom-left-radius: 4px;
      border: 1px solid var(--smk-border);
    }

    .smk-input-area {
      padding: 16px;
      background: var(--smk-surface);
      border-top: 1px solid var(--smk-border);
      display: flex;
      gap: 8px;
    }

    .smk-input {
      flex: 1;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--smk-border);
      border-radius: 8px;
      padding: 10px 14px;
      color: var(--smk-text);
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
    }

    .smk-input:focus {
      border-color: var(--smk-primary);
    }

    .smk-send-btn {
      background: var(--smk-primary);
      color: white;
      border: none;
      border-radius: 8px;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s ease;
    }

    .smk-send-btn:hover {
      transform: scale(1.05);
    }

    .smk-footer {
      padding: 8px;
      text-align: center;
      font-size: 10px;
      color: var(--smk-text-muted);
      background: var(--smk-bg);
      border-top: 1px solid var(--smk-border);
    }

    .smk-footer a {
      color: var(--smk-primary);
      text-decoration: none;
      font-weight: 600;
    }

    @media (max-width: 480px) {
      :host {
        bottom: 12px;
        right: 12px;
      }
      .smk-chat-window {
        width: calc(100vw - 24px);
        height: calc(100vh - 100px);
        bottom: 70px;
      }
    }

    /* Typing indicator */
    .smk-typing {
      display: flex;
      gap: 4px;
      padding: 4px 8px;
    }

    .smk-typing span {
      width: 6px;
      height: 6px;
      background: var(--smk-text-muted);
      border-radius: 50%;
      animation: smk-blink 1.4s infinite both;
    }

    .smk-typing span:nth-child(2) { animation-delay: 0.2s; }
    .smk-typing span:nth-child(3) { animation-delay: 0.4s; }

    @keyframes smk-blink {
      0%, 80%, 100% { opacity: 0; }
      40% { opacity: 1; }
    }
  `;

  // Sanitize inputs to avoid non-ISO-8859-1 characters in headers
  const sanitizeHeader = (str) => {
    if (!str) return '';
    // Strip everything except printable ASCII characters (32-126)
    return str.replace(/[^\x20-\x7E]/g, '').trim();
  };

  const cleanApiKey = sanitizeHeader(apiKey);
  const cleanBackendUrl = sanitizeHeader(backendUrl).replace(/\/$/, ''); // Remove trailing slash

  // --- Logic ---

  async function init() {
    const host = document.createElement('div');
    host.id = 'supportmind-widget-host';
    document.body.appendChild(host);
    shadowRoot = host.attachShadow({ mode: 'open' });

    // Inject styles
    const styleTag = document.createElement('style');
    styleTag.textContent = styles;
    shadowRoot.appendChild(styleTag);

    // Create container
    container = document.createElement('div');
    shadowRoot.appendChild(container);

    // Fetch config
    try {
      const response = await fetch(`${cleanBackendUrl}/widget/config`, {
        headers: { 'x-api-key': cleanApiKey }
      });
      if (response.ok) {
        config = await response.json();
      }
    } catch (e) {
      console.error('[SupportMind] Failed to load config:', e);
    }

    if (config && !config.isEnabled) return;

    renderLauncher();
    renderChatWindow();
    
    // Initial history fetch
    loadHistory();
  }

  function renderLauncher() {
    launcher = document.createElement('button');
    launcher.className = 'smk-launcher';
    launcher.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
      </svg>
    `;
    
    launcher.onclick = toggleChat;
    container.appendChild(launcher);
    
    if (config && config.primaryColor) {
      launcher.style.backgroundColor = config.primaryColor;
      shadowRoot.host.style.setProperty('--smk-primary', config.primaryColor);
    }
  }

  function renderChatWindow() {
    chatWindow = document.createElement('div');
    chatWindow.className = 'smk-chat-window';
    
    chatWindow.innerHTML = `
      <div class="smk-header">
        <div class="smk-header-info">
          <h3>${config?.title || 'Support'}</h3>
          <p>Online • AI Assistant</p>
        </div>
        <button class="smk-close-btn" style="background:none;border:none;color:var(--smk-text-muted);cursor:pointer;padding:4px;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
      <div class="smk-message-list" id="smk-messages">
        <!-- Messages here -->
      </div>
      <div class="smk-input-area">
        <input type="text" class="smk-input" placeholder="${config?.placeholder || 'Type a message...'}" id="smk-input">
        <button class="smk-send-btn" id="smk-send">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </div>
      <div class="smk-footer">
        Powered by <a href="https://supportmind.ai" target="_blank">SupportMind AI</a>
      </div>
    `;

    container.appendChild(chatWindow);
    messageList = chatWindow.querySelector('#smk-messages');
    inputField = chatWindow.querySelector('#smk-input');
    
    const sendBtn = chatWindow.querySelector('#smk-send');
    const closeBtn = chatWindow.querySelector('.smk-close-btn');

    sendBtn.onclick = sendMessage;
    closeBtn.onclick = toggleChat;
    inputField.onkeydown = (e) => {
      if (e.key === 'Enter') sendMessage();
    };

    // Add welcome message if empty
    if (config?.welcomeMessage && messages.length === 0) {
      addMessage('assistant', config.welcomeMessage);
    }
  }

  function toggleChat() {
    isOpen = !isOpen;
    launcher.classList.toggle('open', isOpen);
    chatWindow.classList.toggle('open', isOpen);
    if (isOpen) {
      inputField.focus();
      scrollToBottom();
    }
  }

  async function loadHistory() {
    try {
      const response = await fetch(`${cleanBackendUrl}/widget/history/${sessionId}`, {
        headers: { 'x-api-key': cleanApiKey }
      });
      if (response.ok) {
        const history = await response.json();
        if (history.length > 0) {
          messageList.innerHTML = '';
          history.forEach(m => addMessage(m.role, m.content, false));
        }
      }
    } catch (e) {
      console.warn('[SupportMind] Could not load history');
    }
  }

  async function sendMessage() {
    const text = inputField.value.trim();
    if (!text) return;

    inputField.value = '';
    addMessage('user', text);
    
    // Show typing
    const typingId = 'typing-' + Date.now();
    const typingMsg = document.createElement('div');
    typingMsg.id = typingId;
    typingMsg.className = 'smk-message smk-message-bot';
    typingMsg.innerHTML = '<div class="smk-typing"><span></span><span></span><span></span></div>';
    messageList.appendChild(typingMsg);
    scrollToBottom();

    try {
      const response = await fetch(`${cleanBackendUrl}/widget/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': cleanApiKey
        },
        body: JSON.stringify({
          message: text,
          sessionId: sessionId,
          conversationHistory: messages.slice(-4)
        })
      });

      typingMsg.remove();

      if (response.ok) {
        const data = await response.json();
        addMessage('assistant', data.answer);
      } else {
        addMessage('assistant', 'Sorry, I encountered an error. Please try again later.');
      }
    } catch (e) {
      typingMsg.remove();
      addMessage('assistant', 'Connection error. Please check your internet.');
    }
  }

  function addMessage(role, content, save = true) {
    if (save) messages.push({ role, content });
    
    const div = document.createElement('div');
    div.className = `smk-message smk-message-${role === 'user' ? 'user' : 'bot'}`;
    div.textContent = content;
    messageList.appendChild(div);
    scrollToBottom();
  }

  function scrollToBottom() {
    messageList.scrollTop = messageList.scrollHeight;
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
