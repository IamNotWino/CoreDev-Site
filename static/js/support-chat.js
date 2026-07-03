(() => {
    const SESSION_KEY = 'coredevSession';
    const POLL_MS = 15000;
    const ADMIN_POLL_MS = 30000;

    const root = document.getElementById('supportChatRoot');
    const toggle = document.getElementById('supportChatToggle');
    const panel = document.getElementById('supportChatPanel');
    const closeBtn = document.getElementById('supportChatClose');
    const guestBlock = document.getElementById('supportChatGuest');
    const bodyBlock = document.getElementById('supportChatBody');
    const messagesEl = document.getElementById('supportChatMessages');
    const form = document.getElementById('supportChatForm');
    const input = document.getElementById('supportChatInput');
    const statusEl = document.getElementById('supportChatStatus');
    const badge = document.getElementById('supportChatBadge');
    const loginBtn = document.getElementById('supportChatLoginBtn');

    if (!root || !toggle || !panel) return;

    let isOpen = false;
    let pollTimer = null;
    let adminPollTimer = null;
    let sending = false;
    let renderedMessagesKey = '';
    let cachedMessages = [];

    function formatSiteTime(ts) {
        return window.CoreDevDateTime?.format(ts) || '—';
    }

    function buildMessagesKey(messages) {
        if (!messages?.length) return '__empty__';
        return messages.map((item) => `${item.id}|${item.sender}|${item.at}|${item.text}`).join('\n');
    }

    function isNearBottom(element, tolerance = 72) {
        if (!element) return true;
        return element.scrollHeight - element.scrollTop - element.clientHeight <= tolerance;
    }

    function getSession() {
        try {
            const raw = localStorage.getItem(SESSION_KEY);
            if (!raw) return null;
            const session = JSON.parse(raw);
            if (!session.expiresAt || Date.now() > session.expiresAt) {
                localStorage.removeItem(SESSION_KEY);
                return null;
            }
            return session;
        } catch {
            return null;
        }
    }

    function isAdminUser() {
        return getSession()?.isAdmin === true;
    }

    function authHeaders(includeJson = false) {
        const headers = {};
        if (includeJson) headers['Content-Type'] = 'application/json';
        const session = getSession();
        if (session?.sessionToken) headers.Authorization = `Bearer ${session.sessionToken}`;
        return headers;
    }

    function authPayload(extra = {}) {
        const session = getSession();
        const payload = { ...extra };
        if (session?.email) payload.email = session.email;
        if (session?.sessionToken) payload.session_token = session.sessionToken;
        return payload;
    }

    function trApi(message) {
        return window.CoreDevI18n?.translateApiError?.(message) ?? message;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function setStatus(html) {
        if (statusEl) statusEl.innerHTML = html || '';
    }

    function setBadgeCount(count) {
        if (!badge) return;
        const unread = Number(count) || 0;
        if (!unread) {
            badge.hidden = true;
            badge.textContent = '';
            return;
        }
        badge.hidden = false;
        badge.textContent = unread > 9 ? '9+' : String(unread);
    }

    function countUnread(messages) {
        return (messages || []).filter((item) => item.sender === 'admin' && !item.read_by_user).length;
    }

    function updateUserBadge(messages) {
        setBadgeCount(countUnread(messages));
    }

    function applyRoleMode() {
        const admin = isAdminUser();
        root.classList.toggle('support-chat-root--admin', admin);

        const icon = toggle.querySelector('i');
        if (icon) {
            icon.className = admin ? 'fas fa-inbox' : 'fas fa-comment-dots';
        }

        const label = admin ? 'Обращения в поддержку' : 'Чат поддержки';
        toggle.setAttribute('aria-label', label);
        toggle.title = label;

        if (admin && isOpen) {
            closePanel();
        }
    }

    function renderMessages(messages, options = {}) {
        if (!messagesEl) return false;

        const { force = false } = options;
        const nextKey = buildMessagesKey(messages);
        const hasRenderedList = Boolean(messagesEl.querySelector('.support-chat-message, .support-chat-empty'));

        if (!force && nextKey === renderedMessagesKey && hasRenderedList) {
            return false;
        }

        const stickToBottom = force || !messagesEl.querySelector('.support-chat-message') || isNearBottom(messagesEl);

        if (!messages?.length) {
            cachedMessages = [];
            messagesEl.innerHTML = `
                <div class="support-chat-empty">
                    <div class="support-chat-empty-icon" aria-hidden="true"><i class="fas fa-comments"></i></div>
                    <strong>Начните диалог</strong>
                    <p>Опишите вопрос — команда поддержки ответит здесь.</p>
                </div>
            `;
            renderedMessagesKey = nextKey;
            return true;
        }

        cachedMessages = messages || [];
        messagesEl.innerHTML = cachedMessages.map((item) => {
            const mine = item.sender === 'user';
            const label = mine ? 'Вы' : 'Поддержка';
            return `
                <div class="support-chat-message ${mine ? 'mine' : 'support'}">
                    <span class="support-chat-sender">${escapeHtml(label)}</span>
                    <div class="support-chat-bubble">${escapeHtml(item.text)}</div>
                    <time class="support-chat-time">${escapeHtml(formatSiteTime(item.at))}</time>
                </div>
            `;
        }).join('');

        renderedMessagesKey = nextKey;

        if (stickToBottom) {
            messagesEl.scrollTop = messagesEl.scrollHeight;
        }

        return true;
    }

    async function fetchMessages(markRead = true) {
        const session = getSession();
        if (!session?.sessionToken || isAdminUser()) return [];

        const response = await fetch('/api/support/messages', {
            method: 'POST',
            headers: authHeaders(true),
            body: JSON.stringify(authPayload()),
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error || 'Не удалось загрузить сообщения');
        }

        const messages = result.messages || [];
        renderMessages(messages);
        if (markRead || !isOpen) updateUserBadge(messages);
        return messages;
    }

    async function fetchAdminUnread() {
        if (!isAdminUser() || !getSession()?.sessionToken) {
            setBadgeCount(0);
            return 0;
        }

        const response = await fetch('/api/admin/support/threads', {
            method: 'POST',
            headers: authHeaders(true),
            body: JSON.stringify(authPayload()),
        });
        const result = await response.json();
        if (!response.ok) return 0;

        const unread = Number(result.unread_total) || 0;
        setBadgeCount(unread);
        return unread;
    }

    async function loadMessages(options = {}) {
        const { silent = false } = options;
        if (isAdminUser()) return;

        try {
            await fetchMessages(!isOpen);
            if (!silent) setStatus('');
        } catch (error) {
            if (!silent) setStatus(`<span class="support-chat-error">${escapeHtml(trApi(error.message))}</span>`);
        }
    }

    async function sendMessage(text) {
        if (sending || isAdminUser()) return;
        sending = true;
        const sendBtn = document.getElementById('supportChatSend');
        if (sendBtn) sendBtn.disabled = true;
        setStatus('<span class="support-chat-loading">Отправка...</span>');

        try {
            const response = await fetch('/api/support/messages', {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify(authPayload({ text })),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Не удалось отправить сообщение');
            }
            renderMessages(result.messages || [], { force: true });
            updateUserBadge(result.messages || []);
            if (input) {
                input.value = '';
                input.style.height = 'auto';
            }
            setStatus('');
        } catch (error) {
            setStatus(`<span class="support-chat-error">${escapeHtml(trApi(error.message))}</span>`);
        } finally {
            sending = false;
            const sendBtn = document.getElementById('supportChatSend');
            if (sendBtn) sendBtn.disabled = false;
        }
    }

    function refreshView() {
        if (isAdminUser()) return;

        const session = getSession();
        const loggedIn = Boolean(session?.sessionToken);

        if (guestBlock) guestBlock.hidden = loggedIn;
        if (bodyBlock) bodyBlock.hidden = !loggedIn;

        if (loggedIn) {
            loadMessages({ silent: true });
        } else {
            setBadgeCount(0);
        }
    }

    function startPolling() {
        stopPolling();
        if (isAdminUser()) return;

        pollTimer = window.setInterval(() => {
            if (!isOpen || !getSession()?.sessionToken) return;
            loadMessages({ silent: true });
        }, POLL_MS);
    }

    function stopPolling() {
        if (pollTimer) {
            window.clearInterval(pollTimer);
            pollTimer = null;
        }
    }

    function startAdminPolling() {
        stopAdminPolling();
        if (!isAdminUser()) return;

        adminPollTimer = window.setInterval(() => {
            fetchAdminUnread().catch(() => {});
        }, ADMIN_POLL_MS);
    }

    function stopAdminPolling() {
        if (adminPollTimer) {
            window.clearInterval(adminPollTimer);
            adminPollTimer = null;
        }
    }

    function openAdminSupport() {
        if (typeof window.CoreDevAdmin?.openSupport === 'function') {
            window.CoreDevAdmin.openSupport();
            return;
        }
        window.CoreDevAdmin?.open?.();
    }

    function openPanel() {
        if (isAdminUser()) {
            openAdminSupport();
            return;
        }

        isOpen = true;
        root.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        toggle.setAttribute('aria-expanded', 'true');
        refreshView();
        startPolling();
        if (getSession()?.sessionToken) {
            window.setTimeout(() => input?.focus(), 180);
        }
    }

    function closePanel() {
        isOpen = false;
        root.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        toggle.setAttribute('aria-expanded', 'false');
        stopPolling();
        if (getSession()?.sessionToken && !isAdminUser()) {
            fetchMessages(true).catch(() => {});
        }
    }

    function clearChatUi() {
        setStatus('');
        renderedMessagesKey = '';
        if (input) {
            input.value = '';
            input.style.height = 'auto';
        }
        if (messagesEl) messagesEl.innerHTML = '';
    }

    function showLoggedOutPanel() {
        if (guestBlock) guestBlock.hidden = false;
        if (bodyBlock) bodyBlock.hidden = true;
    }

    function handleLoggedOut() {
        closePanel();
        stopPolling();
        stopAdminPolling();
        setBadgeCount(0);
        clearChatUi();
        showLoggedOutPanel();
        applyRoleMode();
    }

    function handleLoggedIn() {
        applyRoleMode();
        const session = getSession();
        if (!session?.sessionToken) return;

        if (isAdminUser()) {
            if (isOpen) closePanel();
            clearChatUi();
            showLoggedOutPanel();
            fetchAdminUnread().catch(() => {});
            startAdminPolling();
            return;
        }

        stopAdminPolling();
        if (guestBlock) guestBlock.hidden = true;
        if (bodyBlock) bodyBlock.hidden = false;

        fetchMessages(!isOpen).catch(() => {});

        if (isOpen) {
            startPolling();
        }
    }

    function initWidget() {
        if (!getSession()?.sessionToken) {
            handleLoggedOut();
            return;
        }
        handleLoggedIn();
    }

    toggle.addEventListener('click', () => {
        if (isAdminUser()) {
            openAdminSupport();
            return;
        }
        if (!isOpen) openPanel();
    });

    closeBtn?.addEventListener('click', closePanel);

    loginBtn?.addEventListener('click', () => {
        closePanel();
        document.getElementById('openLoginBtn')?.click();
    });

    form?.addEventListener('submit', (event) => {
        event.preventDefault();
        if (isAdminUser()) return;
        const text = String(input?.value || '').trim();
        if (!text) return;
        sendMessage(text);
    });

    input?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            form?.requestSubmit();
        }
    });

    input?.addEventListener('input', (event) => {
        const field = event.target;
        field.style.height = 'auto';
        field.style.height = `${Math.min(field.scrollHeight, 120)}px`;
    });

    window.addEventListener('storage', (event) => {
        if (event.key !== SESSION_KEY) return;
        if (!getSession()?.sessionToken) {
            handleLoggedOut();
            return;
        }
        handleLoggedIn();
    });

    document.addEventListener('coredev-session-changed', () => {
        if (!getSession()?.sessionToken) {
            handleLoggedOut();
            return;
        }
        handleLoggedIn();
    });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        if (isAdminUser()) {
            fetchAdminUnread().catch(() => {});
            return;
        }
        if (getSession()?.sessionToken) {
            loadMessages({ silent: true });
        }
    });

    document.addEventListener('coredev-timezone-changed', () => {
        if (cachedMessages.length) renderMessages(cachedMessages, { force: true });
    });

    document.addEventListener('coredev-language-changed', () => {
        if (cachedMessages.length) renderMessages(cachedMessages, { force: true });
    });

    initWidget();

    window.CoreDevSupportChat = {
        open: openPanel,
        close: closePanel,
        refresh: initWidget,
        handleLoggedOut,
        refreshAdminUnread: () => fetchAdminUnread(),
    };
})();
