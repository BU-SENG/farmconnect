// chat.js - REFACTORED (uses ChatAPI from api.js)
// NOTE: The chat module needs a real-time backend (WebSocket or polling).
// For now it stays in mock mode — the ChatAPI stub below shows exactly
// what the FastAPI backend needs to implement.

lucide.createIcons();

// --- THEME ---
function toggleTheme() {
    const html = document.documentElement;
    html.classList.toggle('dark');
    localStorage.setItem('fc_theme', html.classList.contains('dark') ? 'dark' : 'light');
}
if (localStorage.getItem('fc_theme') === 'light') {
    document.documentElement.classList.remove('dark');
} else {
    document.documentElement.classList.add('dark');
}

// --- AUTH & ROLES ---
const currentUser = getSession() || { name: 'Guest', role: 'Buyer' };
const isFarmer    = currentUser.role.toLowerCase() === 'farmer';

// Show farmer-only offer button
if (isFarmer) {
    document.getElementById('farmerOfferAction').classList.remove('hidden');
}

// --- UI ELEMENTS ---
const contactListPanel = document.getElementById('contactListPanel');
const chatWindowPanel  = document.getElementById('chatWindowPanel');
const contactsContainer = document.getElementById('contactsContainer');
const chatHistory      = document.getElementById('chatHistory');
const messageInput     = document.getElementById('messageInput');
const sendBtn          = document.getElementById('sendBtn');
const chatForm         = document.getElementById('chatForm');

// --- STATE ---
let activeChatId = null;
let currentNegotiationProduct = null;

// ============================================================
// CHAT API STUB
// When backend is ready, replace these with real fetch calls:
//   GET  /api/chat/conversations       → Conversation[]
//   GET  /api/chat/conversations/:id/messages → Message[]
//   POST /api/chat/conversations/:id/messages → Message
//   POST /api/chat/conversations       → Conversation (new)
// For real-time: connect to WebSocket ws://your-api/ws/chat/:conversationId
// ============================================================
const ChatAPI = {
    async getConversations() {
        // MOCK: Load from localStorage, seeded with one default convo
        const stored = localStorage.getItem('fc_conversations');
        if (stored) return JSON.parse(stored);

        const defaults = [{
            id: 'chat_1',
            name: isFarmer ? 'Buyer Sarah' : 'Verified Farmer',
            lastMessage: 'Is this still available?',
            time: '10:42 AM',
            unread: 2,
            messages: [
                { sender: 'them', text: 'Hello! I saw your listing.', time: '10:40 AM' },
                { sender: 'them', text: 'Is this still available?', time: '10:42 AM' },
            ],
        }];
        localStorage.setItem('fc_conversations', JSON.stringify(defaults));
        return defaults;
    },

    async saveConversations(conversations) {
        // MOCK: Persist to localStorage
        // REAL: Handled automatically by backend — remove this method entirely
        localStorage.setItem('fc_conversations', JSON.stringify(conversations));
    },

    async sendMessage(conversationId, message) {
        // MOCK: Returns same message — no server round-trip
        // REAL: POST /api/chat/conversations/:id/messages → returns server-stamped message
        return { ...message, id: Date.now(), time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    },
};

// --- CONVERSATION STATE ---
let conversations = [];

async function initChat() {
    conversations = await ChatAPI.getConversations();

    // Handle URL params: auto-open chat from product page
    const params            = new URLSearchParams(window.location.search);
    const incomingProductId = params.get('id');
    const incomingSeller    = params.get('seller');

    if (incomingProductId) {
        try {
            const prod = await ProductsAPI.getById(incomingProductId);
            if (prod) {
                currentNegotiationProduct = prod;
                setupProductContext(prod);

                // Find or create conversation for this seller
                let existingChat = conversations.find(c => c.name === incomingSeller);
                if (!existingChat) {
                    existingChat = {
                        id: 'chat_' + Date.now(),
                        name: incomingSeller || 'FarmConnect Seller',
                        lastMessage: `Interested in ${prod.name}`,
                        time: 'Just now',
                        unread: 0,
                        messages: [],
                    };
                    conversations.unshift(existingChat);
                    await ChatAPI.saveConversations(conversations);
                }
                openChat(existingChat.id);
            }
        } catch (err) {
            console.warn('Could not load product context:', err);
        }
    }

    renderContacts();
}

// --- RENDERERS ---

function renderContacts() {
    contactsContainer.innerHTML = '';
    conversations.forEach(chat => {
        const isActive   = chat.id === activeChatId ? 'bg-gray-100 dark:bg-dark-800' : '';
        const unreadBadge = chat.unread > 0
            ? `<div class="w-5 h-5 rounded-full bg-danger text-white text-[10px] flex items-center justify-center font-bold">${chat.unread}</div>`
            : '';

        contactsContainer.innerHTML += `
            <div onclick="openChat('${chat.id}')"
                class="p-4 border-b border-gray-100 dark:border-dark-500 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-800 transition-colors flex items-center gap-3 ${isActive}">
                <div class="w-12 h-12 rounded-full bg-gray-200 dark:bg-dark-600 flex items-center justify-center font-bold text-gray-500 shrink-0">
                    ${chat.name.substring(0, 2).toUpperCase()}
                </div>
                <div class="flex-1 min-w-0">
                    <div class="flex justify-between items-center mb-1">
                        <h4 class="font-bold text-sm text-gray-900 dark:text-white truncate">${chat.name}</h4>
                        <span class="text-xs text-gray-400">${chat.time}</span>
                    </div>
                    <p class="text-sm text-gray-500 truncate">${chat.lastMessage}</p>
                </div>
                ${unreadBadge}
            </div>
        `;
    });
}

function setupProductContext(prod) {
    const ctxCard = document.getElementById('productContextCard');
    ctxCard.classList.remove('hidden');
    document.getElementById('contextIcon').innerText  = prod.icon;
    document.getElementById('contextName').innerText  = prod.name;
    document.getElementById('contextPrice').innerText = `₦${prod.price.toLocaleString()} / ${prod.unit}`;
}

function openChat(id) {
    activeChatId = id;
    const chat = conversations.find(c => c.id === id);
    if (!chat) return;

    chat.unread = 0; // Mark as read
    ChatAPI.saveConversations(conversations);

    // Mobile: hide list, show chat
    if (window.innerWidth < 1024) {
        chatWindowPanel.classList.add('slide-active');
        contactListPanel.classList.add('hidden');
    }

    document.getElementById('activeChatName').innerText   = chat.name;
    document.getElementById('activeChatAvatar').innerText = chat.name.substring(0, 2).toUpperCase();
    messageInput.disabled = false;
    sendBtn.disabled      = false;

    renderMessages();
    renderContacts();
}

function closeChatMobile() {
    chatWindowPanel.classList.remove('slide-active');
    contactListPanel.classList.remove('hidden');
}

function renderMessages() {
    const chat = conversations.find(c => c.id === activeChatId);
    if (!chat) return;
    chatHistory.innerHTML = '';

    chat.messages.forEach(msg => {
        chatHistory.innerHTML += msg.type === 'offer'
            ? renderOfferBubble(msg)
            : renderTextBubble(msg);
    });

    chatHistory.scrollTop = chatHistory.scrollHeight;
    lucide.createIcons();
}

function renderTextBubble(msg) {
    const align = msg.sender === 'me' ? 'justify-end msg-sent' : 'justify-start msg-received';
    return `
        <div class="flex ${align} w-full">
            <div class="chat-bubble shadow-sm">${msg.text}</div>
        </div>
    `;
}

function renderOfferBubble(msg) {
    const align = msg.sender === 'me' ? 'justify-end msg-sent' : 'justify-start msg-received';

    // Buyer sees Accept button on offers received from farmer
    // Farmer sees "Offer Sent" on their own offers
    const actionBtn = (!isFarmer && msg.sender === 'them')
        ? `<button onclick="acceptOffer('${msg.productId}', ${msg.price})"
                class="w-full py-2 mt-2 bg-agri-600 text-white text-xs font-bold rounded-lg hover:bg-agri-700 dark:bg-gold-500 dark:text-dark-900">
                Accept & Checkout
           </button>`
        : `<div class="w-full py-2 mt-2 bg-gray-100 dark:bg-dark-800 text-gray-500 text-xs font-bold rounded-lg text-center">
                Offer Sent
           </div>`;

    return `
        <div class="flex ${align} w-full">
            <div class="offer-bubble shadow-md p-3">
                <div class="flex items-center gap-2 text-agri-600 dark:text-gold-400 mb-2">
                    <i data-lucide="tag" class="w-4 h-4"></i>
                    <span class="text-xs font-bold uppercase">Custom Offer</span>
                </div>
                <p class="font-bold text-sm text-gray-900 dark:text-white">${msg.productName}</p>
                <p class="text-2xl font-bold mt-1 text-gray-900 dark:text-white">₦${msg.price.toLocaleString()}</p>
                ${actionBtn}
            </div>
        </div>
    `;
}

// --- SEND MESSAGE ---
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = messageInput.value.trim();
    if (!text || !activeChatId) return;

    const chat = conversations.find(c => c.id === activeChatId);
    const sentMsg = await ChatAPI.sendMessage(activeChatId, {
        sender: 'me',
        text,
        time: 'Just now',
    });

    chat.messages.push(sentMsg);
    chat.lastMessage = text;
    chat.time = sentMsg.time;
    messageInput.value = '';

    await ChatAPI.saveConversations(conversations);
    renderMessages();
    renderContacts();

    // MOCK auto-reply — remove entirely when real WebSocket backend is connected
    // Real backend will push messages via WebSocket: ws.onmessage = (e) => { renderMessages(); }
    if (USE_MOCK) {
        setTimeout(async () => {
            const replyMsg = await ChatAPI.sendMessage(activeChatId, {
                sender: 'them',
                text: 'Okay, I understand. Let me check.',
                time: 'Just now',
            });
            chat.messages.push(replyMsg);
            chat.lastMessage = replyMsg.text;
            await ChatAPI.saveConversations(conversations);
            renderMessages();
            renderContacts();
        }, 1500);
    }
});

// --- FARMER OFFER ---
function triggerOfferModal() {
    if (!currentNegotiationProduct) {
        alert('Open a chat from a product page to send an offer.');
        return;
    }

    const offerPrice = prompt(
        `Custom price for ${currentNegotiationProduct.name} (Current: ₦${currentNegotiationProduct.price}):`,
        currentNegotiationProduct.price,
    );

    if (offerPrice && !isNaN(offerPrice)) {
        const chat = conversations.find(c => c.id === activeChatId);
        chat.messages.push({
            sender:      'me',
            type:        'offer',
            productId:   currentNegotiationProduct.id,
            productName: currentNegotiationProduct.name,
            price:       parseInt(offerPrice),
        });
        ChatAPI.saveConversations(conversations);
        renderMessages();
    }
}

// --- ACCEPT OFFER (Buyer) ---
window.acceptOffer = function (productId, price) {
    // Pass negotiated price to checkout — backend will replace this with an offer token
    localStorage.setItem('fc_negotiated_price', price);
    window.location.href = `checkout.html?id=${productId}`;
};

// Start
initChat();