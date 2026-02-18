// ─── State ───
let currentChatId = null;
let messages = [];
let isGenerating = false;
let statusPollTimer = null;

// ─── DOM Elements ───
const messagesEl = document.getElementById('messages');
const inputEl = document.getElementById('input');
const sendBtn = document.getElementById('send-btn');
const modelBtn = document.getElementById('model-btn');
const statusDot = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const vramInfo = document.getElementById('vram-info');
const chatList = document.getElementById('chat-list');
const chatTitle = document.getElementById('chat-title');
const deleteBtn = document.getElementById('delete-btn');

// ─── Initialize ───
document.addEventListener('DOMContentLoaded', () => {
    checkModelStatus();
    loadChatList();
    inputEl.focus();
    // Poll model status every 3 seconds
    statusPollTimer = setInterval(checkModelStatus, 3000);
});


// ═══════════════════════════════════════════════════════
//  MODEL CONTROLS
// ═══════════════════════════════════════════════════════

async function checkModelStatus() {
    try {
        const res = await fetch('/api/model/status');
        const data = await res.json();
        updateModelUI(data);
    } catch {
        updateModelUI({ status: 'stopped' });
    }
}

function updateModelUI(data) {
    const status = data.status || 'stopped';
    statusDot.className = 'status-dot ' + status;

    const labels = {
        stopped: 'Stopped',
        loading: 'Loading model...',
        ready: 'Ready'
    };
    statusText.textContent = data.error
        ? 'Error: ' + data.error.substring(0, 60)
        : (labels[status] || status);

    // VRAM info
    if (data.vram_free_mb && data.vram_total_mb) {
        const used = data.vram_total_mb - data.vram_free_mb;
        vramInfo.textContent = `VRAM: ${used} / ${data.vram_total_mb} MB`;
    } else {
        vramInfo.textContent = '';
    }

    // Button state
    if (status === 'stopped') {
        modelBtn.textContent = 'Start Model';
        modelBtn.className = 'model-btn';
        modelBtn.disabled = false;
    } else if (status === 'loading') {
        modelBtn.textContent = 'Loading...';
        modelBtn.className = 'model-btn';
        modelBtn.disabled = true;
    } else if (status === 'ready') {
        modelBtn.textContent = 'Stop Model';
        modelBtn.className = 'model-btn stop';
        modelBtn.disabled = false;
    }
}

async function toggleModel() {
    try {
        const res = await fetch('/api/model/status');
        const data = await res.json();

        if (data.status === 'stopped') {
            await fetch('/api/model/start', { method: 'POST' });
            // Poll faster during loading
            const fastPoll = setInterval(async () => {
                try {
                    const r = await fetch('/api/model/status');
                    const d = await r.json();
                    updateModelUI(d);
                    if (d.status !== 'loading') clearInterval(fastPoll);
                } catch {
                    clearInterval(fastPoll);
                }
            }, 2000);
        } else if (data.status === 'ready') {
            await fetch('/api/model/stop', { method: 'POST' });
        }

        checkModelStatus();
    } catch (err) {
        showToast('Failed to toggle model: ' + err.message);
    }
}


// ═══════════════════════════════════════════════════════
//  CHAT
// ═══════════════════════════════════════════════════════

async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isGenerating) return;

    // Hide welcome screen
    const welcomeEl = document.getElementById('welcome');
    if (welcomeEl) welcomeEl.style.display = 'none';

    // Create new chat if needed
    if (!currentChatId) {
        currentChatId = generateId();
        messages = [];
    }

    // Add user message
    messages.push({ role: 'user', content: text });
    renderMessage('user', text);
    inputEl.value = '';
    inputEl.style.height = 'auto';

    // Show typing
    isGenerating = true;
    sendBtn.disabled = true;
    showTyping();

    try {
        const res = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });

        hideTyping();
        const data = await res.json();

        if (data.error) {
            renderMessage('bot', data.error, 'none');
            messages.push({ role: 'bot', content: data.error, source: 'none' });
        } else {
            renderMessage('bot', data.response, data.source);
            messages.push({ role: 'bot', content: data.response, source: data.source });
        }

        // Update title from first user message
        const firstMsg = messages.find(m => m.role === 'user');
        if (firstMsg) {
            const title = firstMsg.content.substring(0, 60) + (firstMsg.content.length > 60 ? '...' : '');
            chatTitle.textContent = title;
        }

        // Auto-save
        await saveChat();
        loadChatList();

    } catch (err) {
        hideTyping();
        renderMessage('bot', 'Connection error: ' + err.message, 'none');
        messages.push({ role: 'bot', content: 'Connection error: ' + err.message, source: 'none' });
    }

    isGenerating = false;
    sendBtn.disabled = false;
    inputEl.focus();
}

function renderMessage(role, content, source) {
    const div = document.createElement('div');
    div.className = 'message ' + role;

    let html = '<div class="message-label">' + (role === 'user' ? 'You' : 'Bot') + '</div>';
    html += '<div class="message-bubble">';

    // Source badges for bot messages
    if (role === 'bot' && source && source !== 'none') {
        const parts = source.split(' + ');
        html += '<div>';
        parts.forEach(s => {
            const cls = s.trim().toLowerCase();
            html += '<span class="source-badge ' + cls + '">' + escapeHtml(s.trim()) + '</span>';
        });
        html += '</div>';
    }

    html += '<div>' + escapeHtml(content) + '</div>';
    html += '</div>';

    div.innerHTML = html;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
    const div = document.createElement('div');
    div.className = 'message bot';
    div.id = 'typing-msg';
    div.innerHTML = `
        <div class="message-label">Bot</div>
        <div class="message-bubble">
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        </div>
    `;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
}

function hideTyping() {
    const el = document.getElementById('typing-msg');
    if (el) el.remove();
}


// ═══════════════════════════════════════════════════════
//  CHAT HISTORY
// ═══════════════════════════════════════════════════════

async function saveChat() {
    if (!currentChatId || messages.length === 0) return;

    const firstMsg = messages.find(m => m.role === 'user');
    const title = firstMsg
        ? firstMsg.content.substring(0, 60) + (firstMsg.content.length > 60 ? '...' : '')
        : 'New Conversation';

    try {
        await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: currentChatId,
                title: title,
                messages: messages
            })
        });
    } catch { }
}

async function loadChatList() {
    try {
        const res = await fetch('/api/history');
        const chats = await res.json();

        chatList.innerHTML = '';
        chats.forEach(chat => {
            const div = document.createElement('div');
            div.className = 'chat-item' + (chat.id === currentChatId ? ' active' : '');
            div.setAttribute('data-id', chat.id);
            div.onclick = () => loadChat(chat.id);

            const date = chat.created ? new Date(chat.created) : null;
            const dateStr = date ? date.toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : '';

            div.innerHTML =
                '<div class="chat-item-title">' + escapeHtml(chat.title) + '</div>' +
                '<div class="chat-item-date">' + dateStr + '</div>';

            chatList.appendChild(div);
        });
    } catch { }
}

async function loadChat(chatId) {
    try {
        const res = await fetch('/api/history/' + chatId);
        const data = await res.json();

        currentChatId = data.id;
        messages = data.messages || [];

        // Clear and re-render
        messagesEl.innerHTML = '';
        chatTitle.textContent = data.title || 'Conversation';

        messages.forEach(msg => {
            renderMessage(msg.role, msg.content, msg.source);
        });

        loadChatList();
    } catch (err) {
        showToast('Failed to load chat');
    }
}

function newChat() {
    currentChatId = null;
    messages = [];
    messagesEl.innerHTML = `
        <div class="welcome-message" id="welcome">
            <div class="welcome-icon">🦙</div>
            <h3>Llama-2 13B Educational Chatbot</h3>
            <p>Start the model and ask me anything. I search a local knowledge base and can query HuggingFace live for the best answers.</p>
            <div class="welcome-features">
                <div class="feature-pill"><span class="feature-dot local"></span>Local FAISS Index</div>
                <div class="feature-pill"><span class="feature-dot live"></span>Live HuggingFace Search</div>
                <div class="feature-pill"><span class="feature-dot model"></span>13B Parameters</div>
            </div>
        </div>
    `;
    chatTitle.textContent = 'New Conversation';
    loadChatList();
    inputEl.focus();
}

async function deleteCurrentChat() {
    if (!currentChatId) return;
    if (!confirm('Delete this conversation?')) return;

    try {
        await fetch('/api/history/' + currentChatId, { method: 'DELETE' });
        newChat();
        loadChatList();
    } catch {
        showToast('Failed to delete chat');
    }
}


// ═══════════════════════════════════════════════════════
//  UTILITIES
// ═══════════════════════════════════════════════════════

function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
}

function autoResize(el) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('hidden');
}

function showToast(message) {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}
