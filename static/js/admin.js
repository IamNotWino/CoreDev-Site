(() => {
    const SESSION_KEY = 'coredevSession';

    const adminModal = document.getElementById('adminModal');
    const profileMenuAdmin = document.getElementById('profileMenuAdmin');
    const userProfile = document.getElementById('userProfile');
    const adminUsersTableBody = document.getElementById('adminUsersTableBody');
    const adminUsersStatus = document.getElementById('adminUsersStatus');
    const adminUsersCount = document.getElementById('adminUsersCount');
    const adminUsersSearchInput = document.getElementById('adminUsersSearchInput');
    const adminUsersRoleFilter = document.getElementById('adminUsersRoleFilter');
    const adminUsersVerifiedFilter = document.getElementById('adminUsersVerifiedFilter');
    const adminLogsList = document.getElementById('adminLogsList');
    const adminLogsStatus = document.getElementById('adminLogsStatus');
    const adminLogsCount = document.getElementById('adminLogsCount');
    const adminLogsSearchInput = document.getElementById('adminLogsSearchInput');
    const adminLogsEventFilter = document.getElementById('adminLogsEventFilter');
    const adminSectionTitle = document.getElementById('adminSectionTitle');
    const adminSupportThreadsList = document.getElementById('adminSupportThreadsList');
    const adminSupportMessages = document.getElementById('adminSupportMessages');
    const adminSupportPlaceholder = document.getElementById('adminSupportPlaceholder');
    const adminSupportConversationHead = document.getElementById('adminSupportConversationHead');
    const adminSupportReplyForm = document.getElementById('adminSupportReplyForm');
    const adminSupportReplyInput = document.getElementById('adminSupportReplyInput');
    const adminSupportStatus = document.getElementById('adminSupportStatus');
    const adminSupportNavBadge = document.getElementById('adminSupportNavBadge');
    const adminUsersNavBadge = document.getElementById('adminUsersNavBadge');
    const adminLogsNavBadge = document.getElementById('adminLogsNavBadge');
    const adminUsersNavLabel = document.getElementById('adminUsersNavLabel');
    const adminSupportNavLabel = document.getElementById('adminSupportNavLabel');
    const adminLogsNavLabel = document.getElementById('adminLogsNavLabel');
    const profileMenuAdminBadge = document.getElementById('profileMenuAdminBadge');

    const adminUserManageModal = document.getElementById('adminUserManageModal');
    const adminUserManageTitle = document.getElementById('adminUserManageTitle');
    const adminUserManageEmail = document.getElementById('adminUserManageEmail');
    const adminUserManageAvatar = document.getElementById('adminUserManageAvatar');
    const adminUserManageRoleBadge = document.getElementById('adminUserManageRoleBadge');
    const adminUserManagePhoneBadge = document.getElementById('adminUserManagePhoneBadge');
    const adminUserManageStatus = document.getElementById('adminUserManageStatus');

    const adminUserEditModal = document.getElementById('adminUserEditModal');
    const adminUserEditIcon = document.getElementById('adminUserEditIcon');
    const adminUserEditTitle = document.getElementById('adminUserEditTitle');
    const adminUserEditSubtitle = document.getElementById('adminUserEditSubtitle');
    const adminUserEditLabel = document.getElementById('adminUserEditLabel');
    const adminUserEditHint = document.getElementById('adminUserEditHint');
    const adminUserEditInput = document.getElementById('adminUserEditInput');
    const adminUserEditSelect = document.getElementById('adminUserEditSelect');
    const adminUserEditForm = document.getElementById('adminUserEditForm');
    const adminUserEditError = document.getElementById('adminUserEditError');
    const adminUserEditStatus = document.getElementById('adminUserEditStatus');
    const adminUserEditSubmit = document.getElementById('adminUserEditSubmit');

    const adminUserDeleteModal = document.getElementById('adminUserDeleteModal');
    const adminUserDeleteText = document.getElementById('adminUserDeleteText');
    const adminUserDeleteStatus = document.getElementById('adminUserDeleteStatus');
    const adminUserDeleteCancel = document.getElementById('adminUserDeleteCancel');
    const adminUserDeleteConfirm = document.getElementById('adminUserDeleteConfirm');

    let usersLoaded = false;
    let logsLoaded = false;
    let supportLoaded = false;
    let supportThreadsCache = [];
    let selectedSupportUserId = '';
    let supportPollTimer = null;
    let renderedSupportMessagesKey = '';
    let renderedSupportThreadsKey = '';
    let currentAdminId = '';
    let adminUsersCache = [];
    let adminLogsCache = [];
    let cachedSupportMessages = [];
    let selectedManageUser = null;
    let activeEditField = '';
    let notificationSnapshot = null;
    let notificationPollTimer = null;
    let notificationsBaselineReady = false;

    const ADMIN_SEEN_KEYS = {
        logsAt: 'coredevAdminSeenLogsAt',
        usersTotal: 'coredevAdminSeenUsersTotal',
    };

    const previousRoleChangedHook = window.CoreDevAdmin?.onRoleChanged || null;

    const ADMIN_USERS_RU = {
        nav: 'Пользователи',
        section: 'Пользователи',
        cardTitle: 'База пользователей',
        sub: 'Все зарегистрированные аккаунты из базы данных.',
        loading: 'Загрузка...',
        empty: 'Пользователи не найдены',
        errUsers: 'Не удалось загрузить пользователей',
        roleAdmin: 'Админ',
        roleMember: 'Участник',
        verifiedYes: 'Да',
        verifiedNo: 'Нет',
        manageOpen: 'Управление пользователем',
        count: (total) => `В базе: ${total} пользователей`,
        countFiltered: (shown, total) => `Показано: ${shown} из ${total}`,
        filterNoResults: 'Ничего не найдено',
        filterSearchUsers: 'Поиск по email, ФИО или нику',
        filterRoleAll: 'Все роли',
        filterRoleAdmin: 'Админы',
        filterRoleMember: 'Участники',
        filterVerifiedAll: 'Все статусы',
        filterVerifiedYes: 'Подтверждённые',
        filterVerifiedNo: 'Не подтверждённые',
        headers: ['Email', 'ФИО', 'Ник', 'Роль', 'Подтверждён'],
        sectionLogs: 'Логи',
        logsEmpty: 'Событий пока нет',
        logsCount: (total) => `Событий: ${total}`,
        logsCountFiltered: (shown, total) => `Показано: ${shown} из ${total}`,
        filterSearchLogs: 'Поиск по тексту, email или IP',
        filterEventAll: 'Все события',
        errLogs: 'Не удалось загрузить логи',
        manageUser: 'Пользователь',
        roleAdmin: 'Админ',
        roleMember: 'Участник',
        saved: 'Изменения сохранены',
        errUpdate: 'Не удалось обновить пользователя',
        saving: 'Сохранение...',
        deleteConfirm: (email) => `Удалить аккаунт ${email}? Это действие необратимо.`,
        deleteSubmit: 'Удалить',
        deleteCancel: 'Отмена',
        deleteDone: 'Аккаунт удалён',
        errDelete: 'Не удалось удалить аккаунт',
    };

    const ADMIN_SUPPORT_RU = {
        nav: 'Поддержка',
        section: 'Поддержка',
        cardTitle: 'Техподдержка',
        sub: 'Сообщения пользователей. Отвечайте прямо из панели.',
        loading: 'Загрузка...',
        empty: 'Обращений пока нет',
        errThreads: 'Не удалось загрузить обращения',
        selectThread: 'Выберите обращение слева',
        replyPlaceholder: 'Напишите ответ...',
        replySend: 'Отправить',
        errReply: 'Не удалось отправить ответ',
        errThread: 'Не удалось загрузить переписку',
        userFallback: 'Пользователь',
        fromUser: 'От пользователя',
        fromAdmin: 'От поддержки',
        messages: (count) => `${count} сообщ.`,
    };

    const LOG_ICONS = {
        user_registered: 'fa-user-plus',
        user_login: 'fa-sign-in-alt',
        user_logout: 'fa-sign-out-alt',
        password_changed: 'fa-key',
        password_reset: 'fa-unlock-alt',
        account_deleted: 'fa-user-slash',
        user_account_deleted: 'fa-user-slash',
        role_granted_admin: 'fa-user-shield',
        role_revoked_admin: 'fa-user-minus',
        admin_user_updated: 'fa-user-edit',
        support_message_user: 'fa-headset',
        support_message_admin: 'fa-reply',
    };

    const LOG_EVENT_LABELS = {
        user_registered: 'Регистрация',
        user_login: 'Вход',
        user_logout: 'Выход',
        password_changed: 'Смена пароля',
        password_reset: 'Сброс пароля',
        account_deleted: 'Удаление админом',
        user_account_deleted: 'Удаление аккаунта',
        role_granted_admin: 'Права админа',
        role_revoked_admin: 'Снятие прав админа',
        admin_user_updated: 'Изменение пользователя',
        support_message_user: 'Сообщение в поддержку',
        support_message_admin: 'Ответ поддержки',
    };

    const EDIT_FIELD_META = {
        email: {
            title: 'Изменить почту',
            label: 'Новая почта',
            hint: 'Адрес для входа и уведомлений',
            placeholder: 'user@example.com',
            icon: 'fa-envelope',
            tone: 'tone-email',
            inputType: 'email',
        },
        full_name: {
            title: 'Изменить ФИО',
            label: 'ФИО',
            hint: 'Полное имя в профиле пользователя',
            placeholder: 'Иванов Иван Иванович',
            icon: 'fa-id-card',
            tone: 'tone-name',
            inputType: 'text',
        },
        username: {
            title: 'Изменить ник',
            label: 'Никнейм',
            hint: 'Отображаемое имя пользователя',
            placeholder: 'username',
            icon: 'fa-user',
            tone: 'tone-user',
            inputType: 'text',
        },
        role: {
            title: 'Изменить роль',
            label: 'Роль пользователя',
            hint: 'Участник или администратор сайта',
            icon: 'fa-user-shield',
            tone: 'tone-role',
            inputType: 'select',
        },
        phone: {
            title: 'Изменить номер телефона',
            label: 'Номер телефона',
            hint: 'Контактный номер аккаунта',
            placeholder: '79001234567',
            icon: 'fa-phone',
            tone: 'tone-phone',
            inputType: 'tel',
        },
    };

    const adminFilterDropdowns = new Map();

    function initAdminFilterSearchInputs() {
        [adminUsersSearchInput, adminLogsSearchInput].forEach((input) => {
            if (!input) return;
            input.type = 'text';
            input.setAttribute('autocomplete', 'off');
            input.setAttribute('autocorrect', 'off');
            input.setAttribute('autocapitalize', 'off');
            input.setAttribute('spellcheck', 'false');
            input.setAttribute('data-lpignore', 'true');
            input.setAttribute('data-1p-ignore', 'true');
            input.setAttribute('data-form-type', 'other');
            input.setAttribute('readonly', 'readonly');
            input.addEventListener('focus', () => {
                input.removeAttribute('readonly');
            });
        });
    }

    function closeAdminFilterDropdowns(exceptWrap = null) {
        adminFilterDropdowns.forEach((api) => {
            if (exceptWrap && api.wrap === exceptWrap) return;
            api.close();
        });
    }

    function refreshAdminFilterDropdown(select) {
        const api = adminFilterDropdowns.get(select);
        if (api) api.refresh();
    }

    function enhanceAdminFilterSelect(select) {
        if (!select) return;

        if (select.dataset.dropdownReady === '1') {
            refreshAdminFilterDropdown(select);
            return;
        }

        select.dataset.dropdownReady = '1';
        select.classList.add('admin-filter-select-native');

        const wrap = document.createElement('div');
        wrap.className = 'admin-filter-dropdown';
        select.parentNode.insertBefore(wrap, select);
        wrap.appendChild(select);

        const trigger = document.createElement('button');
        trigger.type = 'button';
        trigger.className = 'admin-filter-trigger';
        trigger.setAttribute('aria-haspopup', 'listbox');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.innerHTML = `
            <span class="admin-filter-trigger-label"></span>
            <span class="admin-filter-trigger-icon" aria-hidden="true"><i class="fas fa-chevron-down"></i></span>
        `;

        const menu = document.createElement('div');
        menu.className = 'admin-filter-menu';
        menu.setAttribute('role', 'listbox');
        menu.hidden = true;

        wrap.insertBefore(trigger, select);
        wrap.insertBefore(menu, select);

        const labelEl = trigger.querySelector('.admin-filter-trigger-label');

        function syncLabel() {
            const option = select.options[select.selectedIndex];
            if (labelEl) labelEl.textContent = option?.textContent || '';
        }

        function closeMenu() {
            wrap.classList.remove('open');
            menu.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
        }

        function buildMenu() {
            menu.innerHTML = '';
            [...select.options].forEach((option) => {
                const button = document.createElement('button');
                button.type = 'button';
                button.className = `admin-filter-option${option.selected ? ' active' : ''}`;
                button.dataset.value = option.value;
                button.textContent = option.textContent;
                button.setAttribute('role', 'option');
                button.setAttribute('aria-selected', option.selected ? 'true' : 'false');
                button.addEventListener('click', () => {
                    select.value = option.value;
                    closeMenu();
                    syncLabel();
                    buildMenu();
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                });
                menu.appendChild(button);
            });
        }

        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            if (!menu.hidden) {
                closeMenu();
                return;
            }
            closeAdminFilterDropdowns();
            wrap.classList.add('open');
            menu.hidden = false;
            trigger.setAttribute('aria-expanded', 'true');
        });

        select.addEventListener('change', () => {
            syncLabel();
            buildMenu();
        });

        const api = {
            wrap,
            refresh: () => {
                syncLabel();
                buildMenu();
            },
            close: closeMenu,
        };

        adminFilterDropdowns.set(select, api);
        syncLabel();
        buildMenu();
    }

    function initAdminFilterDropdowns() {
        document.querySelectorAll('.admin-filter-select').forEach((select) => {
            enhanceAdminFilterSelect(select);
        });
    }

    function trApi(message) {
        return window.CoreDevI18n?.translateApiError?.(message) ?? message;
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

    function setStatus(target, html) {
        if (target) target.innerHTML = html || '';
    }

    function statusError(msg) {
        return `<span class="admin-status-error">❌ ${msg}</span>`;
    }

    function statusOk(msg) {
        return `<span class="admin-status-ok">✅ ${msg}</span>`;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatSiteTime(ts) {
        return window.CoreDevDateTime?.format(ts) || '—';
    }

    function formatSiteTimezoneLabel() {
        return window.CoreDevDateTime?.getTimezoneLabel?.() || '';
    }

    function supportInitial(value) {
        const source = String(value || '?').trim();
        return source ? source.charAt(0).toUpperCase() : '?';
    }

    function supportPlaceholderHtml(text) {
        return `
            <div class="admin-support-placeholder" id="adminSupportPlaceholder">
                <div class="admin-support-placeholder-icon" aria-hidden="true"><i class="fas fa-inbox"></i></div>
                <strong>Выберите обращение</strong>
                <p>${escapeHtml(text || ADMIN_SUPPORT_RU.selectThread)}</p>
            </div>
        `;
    }

    const ADMIN_REPLY_INPUT_MAX_HEIGHT = 200;

    function resizeAdminReplyInput() {
        if (!adminSupportReplyInput) return;
        adminSupportReplyInput.style.height = 'auto';
        adminSupportReplyInput.style.height = `${Math.min(adminSupportReplyInput.scrollHeight, ADMIN_REPLY_INPUT_MAX_HEIGHT)}px`;
    }

    function resetAdminReplyInput() {
        if (!adminSupportReplyInput) return;
        adminSupportReplyInput.value = '';
        adminSupportReplyInput.style.height = 'auto';
    }

    function sortUsers(users) {
        return [...(users || [])].sort((a, b) => {
            if (Boolean(a.is_admin) !== Boolean(b.is_admin)) {
                return a.is_admin ? -1 : 1;
            }
            return String(a.email || '').localeCompare(String(b.email || ''), 'ru');
        });
    }

    function openChildModal(modal) {
        if (!modal) return;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
    }

    function closeChildModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    }

    function openModal() {
        if (!adminModal) return;
        applyUsersSectionRu();
        switchSection('users', { reload: false, markSeen: false });
        adminModal.classList.add('active');
        refreshAdminNotifications().then(() => markAdminSectionSeen('users'));
        loadActiveSection(true);
    }

    function closeModal() {
        closeChildModal(adminUserEditModal);
        closeChildModal(adminUserDeleteModal);
        closeChildModal(adminUserManageModal);
        stopSupportPolling();
        if (!adminModal) return;
        adminModal.classList.remove('active');
        refreshAdminNotifications();
    }

    function getActiveSection() {
        return adminModal?.querySelector('.admin-nav-btn.active')?.dataset.adminSection || 'users';
    }

    function sectionTitle(section) {
        if (section === 'logs') return ADMIN_USERS_RU.sectionLogs;
        if (section === 'support') return ADMIN_SUPPORT_RU.section;
        return ADMIN_USERS_RU.section;
    }

    function applyUsersSectionRu() {
        if (adminUsersNavLabel) {
            adminUsersNavLabel.textContent = ADMIN_USERS_RU.nav;
        }

        if (adminLogsNavLabel) {
            adminLogsNavLabel.textContent = ADMIN_USERS_RU.sectionLogs;
        }

        if (getActiveSection() === 'users' && adminSectionTitle) {
            adminSectionTitle.textContent = ADMIN_USERS_RU.section;
        }

        const cardTitle = document.getElementById('adminUsersCardTitle');
        if (cardTitle) {
            cardTitle.innerHTML = `<i class="fas fa-database"></i> ${ADMIN_USERS_RU.cardTitle}`;
        }

        const cardSub = document.getElementById('adminUsersCardSub');
        if (cardSub) cardSub.textContent = ADMIN_USERS_RU.sub;

        const table = adminModal?.querySelector('.admin-users-table');
        if (table) {
            const headers = table.querySelectorAll('thead th');
            ADMIN_USERS_RU.headers.forEach((label, index) => {
                if (headers[index]) headers[index].textContent = label;
            });
        }

        if (usersLoaded) {
            applyUsersFilters();
        }
        applyUsersFilterLabels();
    }

    function switchSection(section, options = {}) {
        if (!adminModal) return;

        adminModal.querySelectorAll('.admin-nav-btn').forEach((btn) => {
            const isActive = btn.dataset.adminSection === section;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-current', isActive ? 'page' : 'false');
        });

        adminModal.querySelectorAll('.admin-panel').forEach((panel) => {
            const isActive = panel.dataset.adminPanel === section;
            panel.classList.toggle('active', isActive);
            panel.hidden = !isActive;
            panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
        });

        if (adminSectionTitle) adminSectionTitle.textContent = sectionTitle(section);

        if (options.markSeen !== false && notificationSnapshot) {
            markAdminSectionSeen(section);
        }

        if (section === 'users') applyUsersSectionRu();
        else if (section === 'support') {
            applySupportSectionRu();
            if (!selectedSupportUserId) {
                setSupportReplyFormVisible(false);
            }
        }
        else if (section === 'logs' && adminSectionTitle) adminSectionTitle.textContent = ADMIN_USERS_RU.sectionLogs;

        if (options.reload !== false) {
            loadActiveSection(true);
        }
    }

    function applySupportSectionRu() {
        if (adminSupportNavLabel) {
            adminSupportNavLabel.textContent = ADMIN_SUPPORT_RU.nav;
        }
        const cardTitle = document.getElementById('adminSupportCardTitle');
        if (cardTitle) {
            cardTitle.innerHTML = `<i class="fas fa-headset"></i> ${ADMIN_SUPPORT_RU.cardTitle}`;
        }
        const cardSub = document.getElementById('adminSupportCardSub');
        if (cardSub) cardSub.textContent = ADMIN_SUPPORT_RU.sub;
        if (adminSupportReplyInput) {
            adminSupportReplyInput.placeholder = ADMIN_SUPPORT_RU.replyPlaceholder;
        }
    }

    async function loadActiveSection(force = false) {
        if (!adminModal?.classList.contains('active')) return;
        const section = getActiveSection();
        if (section === 'logs') {
            await loadLogs(force);
        } else if (section === 'support') {
            await loadSupportThreads(force);
        } else {
            await loadUsers(force);
        }
    }

    function roleBadge(user) {
        if (user.is_admin) {
            return `<span class="admin-role-badge admin">${ADMIN_USERS_RU.roleAdmin}</span>`;
        }
        return `<span class="admin-role-badge member">${ADMIN_USERS_RU.roleMember}</span>`;
    }

    function verifiedBadge(verified) {
        return verified
            ? `<span class="admin-verify-badge ok">${ADMIN_USERS_RU.verifiedYes}</span>`
            : `<span class="admin-verify-badge pending">${ADMIN_USERS_RU.verifiedNo}</span>`;
    }

    function renderUserActions(user) {
        return `<button type="button" class="admin-user-gear-btn" data-user-id="${escapeHtml(user.id)}" aria-label="${ADMIN_USERS_RU.manageOpen}" title="${ADMIN_USERS_RU.manageOpen}"><i class="fas fa-cog" aria-hidden="true"></i></button>`;
    }

    function getLogEventLabel(event) {
        return LOG_EVENT_LABELS[event] || event || 'Событие';
    }

    function usersFiltersActive() {
        return Boolean(
            String(adminUsersSearchInput?.value || '').trim()
            || (adminUsersRoleFilter?.value && adminUsersRoleFilter.value !== 'all')
            || (adminUsersVerifiedFilter?.value && adminUsersVerifiedFilter.value !== 'all')
        );
    }

    function logsFiltersActive() {
        return Boolean(
            String(adminLogsSearchInput?.value || '').trim()
            || adminLogsEventFilter?.value
        );
    }

    function filterUsersList(users) {
        const query = String(adminUsersSearchInput?.value || '').trim().toLowerCase();
        const role = adminUsersRoleFilter?.value || 'all';
        const verified = adminUsersVerifiedFilter?.value || 'all';

        return users.filter((user) => {
            if (role === 'admin' && !user.is_admin) return false;
            if (role === 'member' && user.is_admin) return false;
            if (verified === 'yes' && !user.email_verified) return false;
            if (verified === 'no' && user.email_verified) return false;
            if (query) {
                const haystack = [
                    user.email,
                    user.full_name,
                    user.username,
                ].join(' ').toLowerCase();
                if (!haystack.includes(query)) return false;
            }
            return true;
        });
    }

    function filterLogsList(logs) {
        const query = String(adminLogsSearchInput?.value || '').trim().toLowerCase();
        const event = adminLogsEventFilter?.value || '';

        return logs.filter((entry) => {
            if (event && entry.event !== event) return false;
            if (query) {
                const haystack = [
                    entry.message,
                    entry.actor_email,
                    entry.target_email,
                    entry.ip,
                    getLogEventLabel(entry.event),
                    entry.event,
                ].join(' ').toLowerCase();
                if (!haystack.includes(query)) return false;
            }
            return true;
        });
    }

    function populateLogsEventFilter() {
        if (!adminLogsEventFilter) return;

        const current = adminLogsEventFilter.value || '';
        const events = [...new Set(
            adminLogsCache.map((entry) => entry.event).filter(Boolean),
        )].sort((a, b) => getLogEventLabel(a).localeCompare(getLogEventLabel(b), 'ru'));

        adminLogsEventFilter.innerHTML = `
            <option value="">${escapeHtml(ADMIN_USERS_RU.filterEventAll)}</option>
            ${events.map((event) => `
                <option value="${escapeHtml(event)}">${escapeHtml(getLogEventLabel(event))}</option>
            `).join('')}
        `;

        if (events.includes(current)) {
            adminLogsEventFilter.value = current;
        }
        refreshAdminFilterDropdown(adminLogsEventFilter);
    }

    function updateUsersCountDisplay(shown, total) {
        if (!adminUsersCount) return;
        if (!total) {
            adminUsersCount.hidden = true;
            adminUsersCount.textContent = '';
            return;
        }
        adminUsersCount.hidden = false;
        adminUsersCount.textContent = shown === total && !usersFiltersActive()
            ? ADMIN_USERS_RU.count(total)
            : ADMIN_USERS_RU.countFiltered(shown, total);
    }

    function updateLogsCountDisplay(shown, total) {
        if (!adminLogsCount) return;
        if (!total) {
            adminLogsCount.hidden = true;
            adminLogsCount.textContent = '';
            return;
        }
        adminLogsCount.hidden = false;
        adminLogsCount.textContent = shown === total && !logsFiltersActive()
            ? ADMIN_USERS_RU.logsCount(total)
            : ADMIN_USERS_RU.logsCountFiltered(shown, total);
    }

    function applyUsersFilters() {
        const filtered = filterUsersList(adminUsersCache);
        renderUsersTable(filtered, adminUsersCache.length > 0);
        updateUsersCountDisplay(filtered.length, adminUsersCache.length);
    }

    function applyLogsFilters() {
        const filtered = filterLogsList(adminLogsCache);
        renderLogsList(filtered, adminLogsCache.length > 0);
        updateLogsCountDisplay(filtered.length, adminLogsCache.length);
    }

    function applyUsersFilterLabels() {
        if (adminUsersSearchInput) {
            adminUsersSearchInput.placeholder = ADMIN_USERS_RU.filterSearchUsers;
        }
        if (adminUsersRoleFilter) {
            adminUsersRoleFilter.options[0].textContent = ADMIN_USERS_RU.filterRoleAll;
            adminUsersRoleFilter.options[1].textContent = ADMIN_USERS_RU.filterRoleAdmin;
            adminUsersRoleFilter.options[2].textContent = ADMIN_USERS_RU.filterRoleMember;
        }
        if (adminUsersVerifiedFilter) {
            adminUsersVerifiedFilter.options[0].textContent = ADMIN_USERS_RU.filterVerifiedAll;
            adminUsersVerifiedFilter.options[1].textContent = ADMIN_USERS_RU.filterVerifiedYes;
            adminUsersVerifiedFilter.options[2].textContent = ADMIN_USERS_RU.filterVerifiedNo;
        }
        if (adminLogsSearchInput) {
            adminLogsSearchInput.placeholder = ADMIN_USERS_RU.filterSearchLogs;
        }
        if (adminLogsEventFilter && !adminLogsEventFilter.options.length) {
            adminLogsEventFilter.innerHTML = `<option value="">${ADMIN_USERS_RU.filterEventAll}</option>`;
        } else if (adminLogsEventFilter?.options[0]) {
            adminLogsEventFilter.options[0].textContent = ADMIN_USERS_RU.filterEventAll;
        }
        refreshAdminFilterDropdown(adminUsersRoleFilter);
        refreshAdminFilterDropdown(adminUsersVerifiedFilter);
        refreshAdminFilterDropdown(adminLogsEventFilter);
    }

    function renderUsersTable(users, hasSourceData = true) {
        if (!adminUsersTableBody) return;
        if (!users.length) {
            const emptyText = hasSourceData ? ADMIN_USERS_RU.filterNoResults : ADMIN_USERS_RU.empty;
            adminUsersTableBody.innerHTML = `<tr><td colspan="6" class="admin-empty">${emptyText}</td></tr>`;
            return;
        }

        adminUsersTableBody.innerHTML = users.map((user) => `
            <tr>
                <td>${escapeHtml(user.email)}</td>
                <td>${escapeHtml(user.full_name || '—')}</td>
                <td>${escapeHtml(user.username || '—')}</td>
                <td>${roleBadge(user)}</td>
                <td>${verifiedBadge(user.email_verified)}</td>
                <td class="admin-users-actions">${renderUserActions(user)}</td>
            </tr>
        `).join('');
    }

    function renderUsersCount(total) {
        updateUsersCountDisplay(total, total);
    }

    async function loadUsers(force = false) {
        if (!adminUsersTableBody || (!force && usersLoaded)) return;

        applyUsersSectionRu();
        setStatus(adminUsersStatus, '');
        renderUsersCount(0);
        adminUsersTableBody.innerHTML = `<tr><td colspan="6" class="admin-loading">${ADMIN_USERS_RU.loading}</td></tr>`;

        try {
            const response = await fetch('/api/admin/users', {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify(authPayload()),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || ADMIN_USERS_RU.errUsers);
            }

            if (!currentAdminId && result.users?.length) {
                const session = getSession();
                const self = result.users.find((item) => item.email === session?.email);
                currentAdminId = self?.id || '';
            }

            adminUsersCache = sortUsers(result.users || []);
            applyUsersFilters();
            const total = result.total ?? result.count ?? adminUsersCache.length;
            if (notificationSnapshot) {
                notificationSnapshot.users_total = total;
            }
            if (getActiveSection() === 'users') {
                markUsersSeen(total);
                updateNavBadgesFromSnapshot(notificationSnapshot || { users_total: total }, 'users');
            }
            usersLoaded = true;
        } catch (error) {
            adminUsersTableBody.innerHTML = '';
            renderUsersCount(0);
            setStatus(adminUsersStatus, statusError(trApi(error.message)));
        }
    }

    function renderLogsList(logs, hasSourceData = true) {
        if (!adminLogsList) return;
        if (!logs.length) {
            const emptyText = hasSourceData ? ADMIN_USERS_RU.filterNoResults : ADMIN_USERS_RU.logsEmpty;
            adminLogsList.innerHTML = `<div class="admin-empty">${emptyText}</div>`;
            return;
        }

        adminLogsList.innerHTML = logs.map((entry) => {
            const icon = LOG_ICONS[entry.event] || 'fa-info-circle';
            const actor = entry.actor_email && entry.actor_email !== 'system'
                ? `<span class="admin-log-meta">${escapeHtml(entry.actor_email)}</span>`
                : '';
            const ip = entry.ip ? `<span class="admin-log-meta">IP: ${escapeHtml(entry.ip)}</span>` : '';
            return `
                <article class="admin-log-item admin-log-${escapeHtml(entry.event)}">
                    <div class="admin-log-icon"><i class="fas ${icon}" aria-hidden="true"></i></div>
                    <div class="admin-log-body">
                        <div class="admin-log-top">
                            <time class="admin-log-time">${escapeHtml(formatSiteTime(entry.at))}</time>
                            <span class="admin-log-tz">${escapeHtml(formatSiteTimezoneLabel())}</span>
                        </div>
                        <p class="admin-log-message">${escapeHtml(entry.message || '')}</p>
                        <div class="admin-log-meta-row">${actor}${ip}</div>
                    </div>
                </article>
            `;
        }).join('');
    }

    async function loadLogs(force = false) {
        if (!adminLogsList || (!force && logsLoaded)) return;

        setStatus(adminLogsStatus, '');
        adminLogsList.innerHTML = `<div class="admin-loading">${ADMIN_USERS_RU.loading}</div>`;

        try {
            const response = await fetch('/api/admin/logs', {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify(authPayload({ limit: 200, offset: 0 })),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || ADMIN_USERS_RU.errLogs);
            }

            adminLogsCache = result.logs || [];
            populateLogsEventFilter();
            applyLogsFilters();
            if (result.logs?.[0]?.at) {
                const latestAt = Number(result.logs[0].at) || 0;
                if (notificationSnapshot) {
                    notificationSnapshot.latest_log_at = Math.max(Number(notificationSnapshot.latest_log_at) || 0, latestAt);
                }
                markLogsSeen(latestAt);
                updateNavBadgesFromSnapshot(notificationSnapshot || { latest_log_at: latestAt }, getActiveSection());
            }
            logsLoaded = true;
        } catch (error) {
            adminLogsList.innerHTML = '';
            setStatus(adminLogsStatus, statusError(trApi(error.message)));
        }
    }

    function isAdminSession() {
        return getSession()?.isAdmin === true;
    }

    function getSeenLogsAt() {
        return Number(localStorage.getItem(ADMIN_SEEN_KEYS.logsAt) || 0);
    }

    function getSeenUsersTotal() {
        return Number(localStorage.getItem(ADMIN_SEEN_KEYS.usersTotal) || 0);
    }

    function markLogsSeen(at) {
        const value = Number(at) || notificationSnapshot?.latest_log_at || 0;
        if (value > 0) {
            localStorage.setItem(ADMIN_SEEN_KEYS.logsAt, String(value));
        }
    }

    function markUsersSeen(total) {
        const value = Number(total ?? notificationSnapshot?.users_total ?? 0);
        localStorage.setItem(ADMIN_SEEN_KEYS.usersTotal, String(Math.max(0, value)));
    }

    function ensureNotificationBaseline(snapshot) {
        if (notificationsBaselineReady || !snapshot) return;
        if (!localStorage.getItem(ADMIN_SEEN_KEYS.logsAt)) {
            markLogsSeen(snapshot.latest_log_at);
        }
        if (!localStorage.getItem(ADMIN_SEEN_KEYS.usersTotal)) {
            markUsersSeen(snapshot.users_total);
        }
        notificationsBaselineReady = true;
    }

    function setNavBadge(badgeEl, visible) {
        if (!badgeEl) return;
        badgeEl.hidden = !visible;
        badgeEl.setAttribute('aria-hidden', visible ? 'false' : 'true');
    }

    function updateNavBadgesFromSnapshot(snapshot, activeSection = getActiveSection()) {
        if (!snapshot) return;

        const modalOpen = adminModal?.classList.contains('active');
        const supportUnread = Number(snapshot.support_unread) || 0;
        const latestLogAt = Number(snapshot.latest_log_at) || 0;
        const usersTotal = Number(snapshot.users_total) || 0;
        const logsPending = latestLogAt > getSeenLogsAt();
        const usersPending = usersTotal > getSeenUsersTotal();

        setNavBadge(adminSupportNavBadge, supportUnread > 0);
        setNavBadge(adminLogsNavBadge, logsPending && activeSection !== 'logs');
        setNavBadge(adminUsersNavBadge, usersPending && activeSection !== 'users');

        const profilePending = supportUnread > 0 || logsPending || usersPending;
        setNavBadge(profileMenuAdminBadge, profilePending && !modalOpen);
    }

    function markAdminSectionSeen(section, snapshot = notificationSnapshot) {
        if (!snapshot) return;
        if (section === 'logs') {
            markLogsSeen(snapshot.latest_log_at);
        } else if (section === 'users') {
            markUsersSeen(snapshot.users_total);
        }
        updateNavBadgesFromSnapshot(snapshot, section);
    }

    async function refreshAdminNotifications() {
        if (!isAdminSession()) {
            stopNotificationPolling();
            setNavBadge(adminSupportNavBadge, false);
            setNavBadge(adminLogsNavBadge, false);
            setNavBadge(adminUsersNavBadge, false);
            setNavBadge(profileMenuAdminBadge, false);
            return null;
        }

        try {
            const response = await fetch('/api/admin/notifications', {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify(authPayload()),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || 'Не удалось загрузить уведомления');
            }

            notificationSnapshot = result;
            ensureNotificationBaseline(result);
            updateNavBadgesFromSnapshot(result);
            return result;
        } catch {
            return notificationSnapshot;
        }
    }

    function startNotificationPolling() {
        stopNotificationPolling();
        if (!isAdminSession()) return;
        refreshAdminNotifications();
        notificationPollTimer = window.setInterval(() => {
            refreshAdminNotifications();
        }, 45000);
    }

    function stopNotificationPolling() {
        if (notificationPollTimer) {
            window.clearInterval(notificationPollTimer);
            notificationPollTimer = null;
        }
    }

    function updateSupportNavBadge(unreadTotal) {
        if (notificationSnapshot) {
            notificationSnapshot.support_unread = Number(unreadTotal) || 0;
            updateNavBadgesFromSnapshot(notificationSnapshot);
        } else {
            setNavBadge(adminSupportNavBadge, Number(unreadTotal) > 0);
        }
        window.CoreDevSupportChat?.refreshAdminUnread?.();
    }

    function buildSupportMessagesKey(messages) {
        if (!messages?.length) return '__empty__';
        return messages.map((item) => `${item.id}|${item.sender}|${item.at}|${item.text}`).join('\n');
    }

    function buildSupportThreadsKey(threads) {
        if (!threads?.length) return '__empty__';
        return `${selectedSupportUserId}::${threads.map((thread) => (
            `${thread.user_id}|${thread.unread_count}|${thread.updated_at}|${thread.last_message}|${thread.message_count}`
        )).join('\n')}`;
    }

    function isSupportNearBottom(element, tolerance = 72) {
        if (!element) return true;
        return element.scrollHeight - element.scrollTop - element.clientHeight <= tolerance;
    }

    function renderSupportThreads(threads, options = {}) {
        if (!adminSupportThreadsList) return;

        const { force = false } = options;
        const nextKey = buildSupportThreadsKey(threads);
        const hasRenderedList = Boolean(adminSupportThreadsList.querySelector('.admin-support-thread, .admin-empty'));

        if (!force && nextKey === renderedSupportThreadsKey && hasRenderedList) {
            return;
        }

        if (!threads.length) {
            adminSupportThreadsList.innerHTML = `<div class="admin-empty">${ADMIN_SUPPORT_RU.empty}</div>`;
            renderedSupportThreadsKey = nextKey;
            return;
        }

        adminSupportThreadsList.innerHTML = threads.map((thread) => {
            const active = thread.user_id === selectedSupportUserId ? ' active' : '';
            const title = thread.username || thread.email || ADMIN_SUPPORT_RU.userFallback;
            const preview = thread.last_message || '—';
            const senderLabel = thread.last_sender === 'admin'
                ? ADMIN_SUPPORT_RU.fromAdmin
                : ADMIN_SUPPORT_RU.fromUser;
            const unread = Number(thread.unread_count) > 0
                ? '<span class="admin-support-thread-unread" aria-label="Новые сообщения"></span>'
                : '';
            return `
                <button type="button" class="admin-support-thread${active}" data-support-user-id="${escapeHtml(thread.user_id)}">
                    <span class="admin-support-thread-body">
                        <span class="admin-support-thread-top">
                            <strong>${escapeHtml(title)}</strong>
                            ${unread}
                        </span>
                        <span class="admin-support-thread-email">${escapeHtml(thread.email || '—')}</span>
                        <span class="admin-support-thread-preview">${escapeHtml(senderLabel)}: ${escapeHtml(preview)}</span>
                        <span class="admin-support-thread-meta">
                            <time>${escapeHtml(formatSiteTime(thread.updated_at))}</time>
                            <span>${ADMIN_SUPPORT_RU.messages(thread.message_count || 0)}</span>
                        </span>
                    </span>
                </button>
            `;
        }).join('');
        renderedSupportThreadsKey = nextKey;
    }

    function renderSupportMessages(messages, options = {}) {
        if (!adminSupportMessages) return;

        const { force = false } = options;
        const nextKey = buildSupportMessagesKey(messages);
        const hasRenderedList = Boolean(adminSupportMessages.querySelector('.admin-support-message'));

        if (!force && nextKey === renderedSupportMessagesKey && hasRenderedList) {
            return;
        }

        const stickToBottom = force || !adminSupportMessages.querySelector('.admin-support-message') || isSupportNearBottom(adminSupportMessages);

        if (!messages?.length) {
            cachedSupportMessages = [];
            adminSupportMessages.innerHTML = supportPlaceholderHtml(ADMIN_SUPPORT_RU.selectThread);
            renderedSupportMessagesKey = nextKey;
            return;
        }

        cachedSupportMessages = messages || [];
        adminSupportMessages.innerHTML = cachedSupportMessages.map((item) => {
            const mine = item.sender === 'admin';
            return `
                <div class="admin-support-message ${mine ? 'mine' : 'user'}">
                    <div class="admin-support-bubble">${escapeHtml(item.text)}</div>
                    <time class="admin-support-time">${escapeHtml(formatSiteTime(item.at))}</time>
                </div>
            `;
        }).join('');
        renderedSupportMessagesKey = nextKey;
        if (stickToBottom) {
            adminSupportMessages.scrollTop = adminSupportMessages.scrollHeight;
        }
    }

    function setSupportReplyFormVisible(visible) {
        if (!adminSupportReplyForm) return;
        adminSupportReplyForm.hidden = !visible;
    }

    function showSupportPlaceholder() {
        selectedSupportUserId = '';
        renderedSupportMessagesKey = '';
        renderedSupportThreadsKey = '';
        if (adminSupportConversationHead) {
            adminSupportConversationHead.hidden = true;
            adminSupportConversationHead.innerHTML = '';
        }
        if (adminSupportReplyForm) setSupportReplyFormVisible(false);
        if (adminSupportReplyInput) resetAdminReplyInput();
        if (adminSupportMessages) {
            adminSupportMessages.innerHTML = supportPlaceholderHtml(ADMIN_SUPPORT_RU.selectThread);
        }
        renderSupportThreads(supportThreadsCache);
        stopSupportPolling();
    }

    function renderSupportConversationHead(thread) {
        if (!adminSupportConversationHead || !thread) return;
        const title = thread.username || thread.email || ADMIN_SUPPORT_RU.userFallback;
        adminSupportConversationHead.hidden = false;
        adminSupportConversationHead.innerHTML = `
            <div class="admin-support-conversation-user">
                <div>
                    <strong>${escapeHtml(title)}</strong>
                    <span>${escapeHtml(thread.email || '')}</span>
                </div>
            </div>
        `;
        setSupportReplyFormVisible(true);
    }

    async function loadSupportThreads(force = false) {
        if (!adminSupportThreadsList || (!force && supportLoaded)) return;

        applySupportSectionRu();
        setStatus(adminSupportStatus, '');
        if (!supportThreadsCache.length) {
            adminSupportThreadsList.innerHTML = `<div class="admin-loading">${ADMIN_SUPPORT_RU.loading}</div>`;
        }

        try {
            const response = await fetch('/api/admin/support/threads', {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify(authPayload()),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || ADMIN_SUPPORT_RU.errThreads);
            }

            supportThreadsCache = result.threads || [];
            updateSupportNavBadge(result.unread_total);
            renderSupportThreads(supportThreadsCache);
            supportLoaded = true;

            if (selectedSupportUserId) {
                await loadSupportThread(selectedSupportUserId, { silent: true });
            } else {
                setSupportReplyFormVisible(false);
            }
        } catch (error) {
            adminSupportThreadsList.innerHTML = '';
            showSupportPlaceholder();
            setStatus(adminSupportStatus, statusError(trApi(error.message)));
        }
    }

    async function loadSupportThread(userId, options = {}) {
        if (!userId || !adminSupportMessages) return;

        selectedSupportUserId = userId;
        renderSupportThreads(supportThreadsCache);

        if (!options.silent) {
            adminSupportMessages.innerHTML = `<div class="admin-loading">${ADMIN_SUPPORT_RU.loading}</div>`;
        }

        try {
            const response = await fetch('/api/admin/support/thread', {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify(authPayload({ user_id: userId })),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || ADMIN_SUPPORT_RU.errThread);
            }

            renderSupportConversationHead(result.thread);
            renderSupportMessages(result.messages || [], { force: !options.silent });
            setStatus(adminSupportStatus, '');

            supportThreadsCache = supportThreadsCache.map((thread) => (
                thread.user_id === userId
                    ? { ...thread, unread_count: 0 }
                    : thread
            ));
            updateSupportNavBadge(supportThreadsCache.reduce((sum, item) => sum + (Number(item.unread_count) || 0), 0));
            renderSupportThreads(supportThreadsCache);
            startSupportPolling();
        } catch (error) {
            showSupportPlaceholder();
            setStatus(adminSupportStatus, statusError(trApi(error.message)));
        }
    }

    async function sendSupportReply(text) {
        if (!selectedSupportUserId || !text) return;

        setStatus(adminSupportStatus, '<span class="admin-status-loading">Отправка...</span>');
        try {
            const response = await fetch('/api/admin/support/reply', {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify(authPayload({ user_id: selectedSupportUserId, text })),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || ADMIN_SUPPORT_RU.errReply);
            }

            renderSupportMessages(result.messages || [], { force: true });
            if (adminSupportReplyInput) resetAdminReplyInput();
            setStatus(adminSupportStatus, statusOk('Ответ отправлен'));
            supportLoaded = false;
            await loadSupportThreads(true);
        } catch (error) {
            setStatus(adminSupportStatus, statusError(trApi(error.message)));
        }
    }

    function startSupportPolling() {
        stopSupportPolling();
        supportPollTimer = window.setInterval(() => {
            if (getActiveSection() !== 'support' || !selectedSupportUserId) return;
            loadSupportThread(selectedSupportUserId, { silent: true });
            loadSupportThreads(true);
        }, 15000);
    }

    function stopSupportPolling() {
        if (supportPollTimer) {
            window.clearInterval(supportPollTimer);
            supportPollTimer = null;
        }
    }

    async function refreshUsersAndLogs() {
        usersLoaded = false;
        logsLoaded = false;
        await loadUsers(true);
        if (getActiveSection() === 'logs') {
            await loadLogs(true);
        }
    }

    function findUserById(userId) {
        return adminUsersCache.find((item) => String(item.id) === String(userId)) || null;
    }

    function closeManageModal() {
        closeChildModal(adminUserManageModal);
    }

    function backToManageModal() {
        closeChildModal(adminUserEditModal);
        closeChildModal(adminUserDeleteModal);
        if (selectedManageUser) openChildModal(adminUserManageModal);
    }

    function openManageModal(user) {
        if (!user || !adminUserManageModal) return;
        selectedManageUser = user;
        setStatus(adminUserManageStatus, '');

        const displayName = user.full_name || user.username || user.email || ADMIN_USERS_RU.manageUser;
        const avatarLetter = String(displayName).trim().charAt(0).toUpperCase() || 'U';

        if (adminUserManageTitle) adminUserManageTitle.textContent = displayName;
        if (adminUserManageEmail) adminUserManageEmail.textContent = user.email || '—';
        if (adminUserManageAvatar) adminUserManageAvatar.textContent = avatarLetter;

        if (adminUserManageRoleBadge) {
            if (user.is_admin) {
                adminUserManageRoleBadge.className = 'profile-role-badge';
                adminUserManageRoleBadge.innerHTML = `<i class="fas fa-shield-alt" aria-hidden="true"></i><span class="profile-role-badge-text">${ADMIN_USERS_RU.roleAdmin}</span>`;
            } else {
                adminUserManageRoleBadge.className = 'admin-role-badge member';
                adminUserManageRoleBadge.textContent = ADMIN_USERS_RU.roleMember;
            }
            adminUserManageRoleBadge.hidden = false;
        }

        if (adminUserManagePhoneBadge) {
            const phone = String(user.phone || '').trim();
            if (phone) {
                adminUserManagePhoneBadge.hidden = false;
                adminUserManagePhoneBadge.textContent = phone;
            } else {
                adminUserManagePhoneBadge.hidden = true;
                adminUserManagePhoneBadge.textContent = '';
            }
        }

        openChildModal(adminUserManageModal);
    }

    function openEditModal(field) {
        if (!selectedManageUser || !adminUserEditModal) return;
        const meta = EDIT_FIELD_META[field];
        if (!meta) return;

        activeEditField = field;
        setStatus(adminUserEditStatus, '');
        if (adminUserEditError) adminUserEditError.textContent = '';

        if (adminUserEditTitle) adminUserEditTitle.textContent = meta.title;
        if (adminUserEditSubtitle) {
            adminUserEditSubtitle.textContent = `Аккаунт: ${selectedManageUser.email || '—'}`;
        }
        if (adminUserEditLabel) adminUserEditLabel.textContent = meta.label;
        if (adminUserEditHint) adminUserEditHint.textContent = meta.hint || '';

        if (adminUserEditIcon) {
            adminUserEditIcon.className = `admin-edit-field-icon ${meta.tone || 'tone-email'}`;
            adminUserEditIcon.innerHTML = `<i class="fas ${meta.icon || 'fa-edit'}" aria-hidden="true"></i>`;
        }

        const isSelect = field === 'role';
        if (adminUserEditInput) {
            adminUserEditInput.hidden = isSelect;
            adminUserEditInput.type = meta.inputType || 'text';
            adminUserEditInput.placeholder = isSelect ? '' : (meta.placeholder || '');
            if (field === 'email') adminUserEditInput.value = selectedManageUser.email || '';
            else if (field === 'full_name') adminUserEditInput.value = selectedManageUser.full_name || '';
            else if (field === 'username') adminUserEditInput.value = selectedManageUser.username || '';
            else if (field === 'phone') adminUserEditInput.value = selectedManageUser.phone || '';
            else adminUserEditInput.value = '';
        }
        if (adminUserEditSelect) {
            adminUserEditSelect.hidden = !isSelect;
            adminUserEditSelect.value = selectedManageUser.role || 'member';
        }
        if (adminUserEditSubmit) adminUserEditSubmit.textContent = 'Сохранить';

        closeChildModal(adminUserManageModal);
        openChildModal(adminUserEditModal);
        if (!isSelect) adminUserEditInput?.focus();
    }

    function openDeleteModal() {
        if (!selectedManageUser || !adminUserDeleteModal) return;
        setStatus(adminUserDeleteStatus, '');
        if (adminUserDeleteText) {
            adminUserDeleteText.textContent = ADMIN_USERS_RU.deleteConfirm(selectedManageUser.email);
        }
        closeChildModal(adminUserManageModal);
        openChildModal(adminUserDeleteModal);
    }

    async function submitUserEdit(event) {
        event.preventDefault();
        if (!selectedManageUser || !activeEditField) return;

        const value = activeEditField === 'role'
            ? adminUserEditSelect?.value
            : adminUserEditInput?.value;

        if (adminUserEditError) adminUserEditError.textContent = '';
        setStatus(adminUserEditStatus, '');
        if (adminUserEditSubmit) {
            adminUserEditSubmit.disabled = true;
            adminUserEditSubmit.textContent = 'Сохранение...';
        }

        try {
            const response = await fetch('/api/admin/users/update', {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify(authPayload({
                    user_id: selectedManageUser.id,
                    email: selectedManageUser.email,
                    field: activeEditField,
                    value,
                })),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || ADMIN_USERS_RU.errUpdate);
            }

            setStatus(adminUsersStatus, statusOk(trApi(result.message || ADMIN_USERS_RU.saved)));
            closeChildModal(adminUserEditModal);
            selectedManageUser = result.user || selectedManageUser;
            await refreshUsersAndLogs();

            if (typeof window.CoreDevAdmin?.onRoleChanged === 'function' && activeEditField === 'role') {
                window.CoreDevAdmin.onRoleChanged(result.user);
            }
        } catch (error) {
            const message = trApi(error.message);
            if (adminUserEditError) adminUserEditError.textContent = message;
            setStatus(adminUserEditStatus, statusError(message));
        } finally {
            if (adminUserEditSubmit) {
                adminUserEditSubmit.disabled = false;
                adminUserEditSubmit.textContent = 'Сохранить';
            }
        }
    }

    async function confirmDeleteUser() {
        if (!selectedManageUser) return;

        setStatus(adminUserDeleteStatus, '');
        if (adminUserDeleteConfirm) {
            adminUserDeleteConfirm.disabled = true;
            adminUserDeleteConfirm.textContent = ADMIN_USERS_RU.saving;
        }

        try {
            const response = await fetch('/api/admin/users/delete', {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify(authPayload({
                    user_id: selectedManageUser.id,
                    email: selectedManageUser.email,
                })),
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.error || ADMIN_USERS_RU.errDelete);
            }

            setStatus(adminUsersStatus, statusOk(trApi(result.message || ADMIN_USERS_RU.deleteDone)));
            selectedManageUser = null;
            closeChildModal(adminUserDeleteModal);
            await refreshUsersAndLogs();
        } catch (error) {
            setStatus(adminUserDeleteStatus, statusError(trApi(error.message)));
        } finally {
            if (adminUserDeleteConfirm) {
                adminUserDeleteConfirm.disabled = false;
                adminUserDeleteConfirm.textContent = ADMIN_USERS_RU.deleteSubmit;
            }
        }
    }

    document.addEventListener('click', (event) => {
        if (!event.target.closest('.admin-filter-dropdown')) {
            closeAdminFilterDropdowns();
        }
    });

    adminUsersSearchInput?.addEventListener('input', applyUsersFilters);
    adminUsersRoleFilter?.addEventListener('change', applyUsersFilters);
    adminUsersVerifiedFilter?.addEventListener('change', applyUsersFilters);
    adminLogsSearchInput?.addEventListener('input', applyLogsFilters);
    adminLogsEventFilter?.addEventListener('change', applyLogsFilters);

    profileMenuAdmin?.addEventListener('click', () => {
        if (!getSession()) return;
        userProfile?.classList.remove('open');
        openModal();
        if (typeof window.closeMobileNav === 'function') {
            window.closeMobileNav();
        }
    });

    adminModal?.querySelectorAll('.admin-nav-btn').forEach((btn) => {
        btn.addEventListener('click', () => switchSection(btn.dataset.adminSection));
    });

    adminSupportThreadsList?.addEventListener('click', (event) => {
        const button = event.target.closest('[data-support-user-id]');
        if (!button) return;
        loadSupportThread(button.dataset.supportUserId);
    });

    adminSupportReplyForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const text = String(adminSupportReplyInput?.value || '').trim();
        if (!text) return;
        sendSupportReply(text);
    });

    adminSupportReplyInput?.addEventListener('input', resizeAdminReplyInput);

    adminSupportReplyInput?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            adminSupportReplyForm?.requestSubmit();
        }
    });

    adminModal?.querySelector('.admin-close')?.addEventListener('click', closeModal);
    adminModal?.addEventListener('click', (event) => {
        if (event.target === adminModal) closeModal();
    });

    adminUsersTableBody?.addEventListener('click', (event) => {
        const button = event.target.closest('.admin-user-gear-btn');
        if (!button) return;
        const user = findUserById(button.dataset.userId);
        if (user) openManageModal(user);
    });

    adminUserManageModal?.querySelector('.admin-user-manage-close')?.addEventListener('click', closeManageModal);
    document.getElementById('adminUserManageBack')?.addEventListener('click', closeManageModal);
    adminUserManageModal?.addEventListener('click', (event) => {
        if (event.target === adminUserManageModal) closeManageModal();
    });
    adminUserManageModal?.querySelectorAll('[data-admin-edit]').forEach((btn) => {
        btn.addEventListener('click', () => {
            const field = btn.dataset.adminEdit;
            if (field === 'delete') openDeleteModal();
            else openEditModal(field);
        });
    });

    adminUserEditModal?.querySelector('.admin-user-edit-close')?.addEventListener('click', backToManageModal);
    document.getElementById('adminUserEditBack')?.addEventListener('click', backToManageModal);
    adminUserEditModal?.addEventListener('click', (event) => {
        if (event.target === adminUserEditModal) backToManageModal();
    });
    adminUserEditForm?.addEventListener('submit', submitUserEdit);
    adminUserEditInput?.addEventListener('input', (event) => {
        if (activeEditField === 'phone') {
            event.target.value = String(event.target.value || '').replace(/\D/g, '').slice(0, 11);
        }
    });

    adminUserDeleteModal?.addEventListener('click', (event) => {
        if (event.target === adminUserDeleteModal) backToManageModal();
    });
    adminUserDeleteCancel?.addEventListener('click', backToManageModal);
    document.getElementById('adminUserDeleteBack')?.addEventListener('click', backToManageModal);
    adminUserDeleteConfirm?.addEventListener('click', confirmDeleteUser);

    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        closeAdminFilterDropdowns();
        if (adminUserEditModal?.classList.contains('active')) {
            backToManageModal();
            return;
        }
        if (adminUserDeleteModal?.classList.contains('active')) {
            backToManageModal();
            return;
        }
        if (adminUserManageModal?.classList.contains('active')) {
            closeManageModal();
            return;
        }
        if (adminModal?.classList.contains('active')) {
            closeModal();
        }
    });

    document.addEventListener('coredev-timezone-changed', () => {
        if (adminLogsCache.length) applyLogsFilters();
        if (supportThreadsCache.length) renderSupportThreads(supportThreadsCache, { force: true });
        if (cachedSupportMessages.length) renderSupportMessages(cachedSupportMessages, { force: true });
    });

    document.addEventListener('coredev-language-changed', () => {
        applyUsersSectionRu();
        applySupportSectionRu();
        if (adminLogsCache.length) {
            populateLogsEventFilter();
            applyLogsFilters();
        }
        if (supportThreadsCache.length) renderSupportThreads(supportThreadsCache, { force: true });
        if (cachedSupportMessages.length) renderSupportMessages(cachedSupportMessages, { force: true });
        logsLoaded = false;
        supportLoaded = false;
        if (adminModal?.classList.contains('active')) {
            const section = getActiveSection();
            if (section === 'logs') {
                loadLogs(true);
            } else if (section === 'support') {
                loadSupportThreads(true);
            } else if (!usersLoaded) {
                loadUsers(true);
            }
        }
    });

    applyUsersSectionRu();
    applySupportSectionRu();
    applyUsersFilterLabels();
    initAdminFilterSearchInputs();
    initAdminFilterDropdowns();
    if (isAdminSession()) {
        startNotificationPolling();
    }

    window.CoreDevAdmin = {
        open: openModal,
        close: closeModal,
        openSupport: () => {
            openModal();
            switchSection('support');
        },
        refresh: () => {
            usersLoaded = false;
            logsLoaded = false;
            supportLoaded = false;
            return loadActiveSection(true);
        },
        applyUsersSectionRu,
        applySupportSectionRu,
        refreshSupportBadge: () => loadSupportThreads(true),
        refreshNotifications: refreshAdminNotifications,
        onRoleChanged: (user) => {
            previousRoleChangedHook?.(user);
            if (user?.is_admin === true || user?.isAdmin === true) {
                startNotificationPolling();
            } else if (getSession()?.isAdmin !== true) {
                stopNotificationPolling();
            }
        },
    };
})();
