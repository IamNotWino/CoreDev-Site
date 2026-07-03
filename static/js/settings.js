(() => {
    const SESSION_KEY = 'coredevSession';

    const SETTINGS_SECTIONS = {
        security: { title: 'Безопасность', sub: 'Сессии, входы и контакты' },
        notifications: { title: 'Уведомления', sub: 'Email и push-уведомления' },
        interface: { title: 'Интерфейс', sub: 'Тема, язык и часовой пояс' },
        privacy: { title: 'Приватность', sub: 'Видимость профиля' },
        account: { title: 'Аккаунт', sub: 'Пароль и удаление' },
    };

    function t(key, params) {
        return window.CoreDevI18n?.t(key, params) ?? key;
    }

    const settingsModal = document.getElementById('settingsModal');
    let settingsBundle = null;
    let draftSaveTimer = null;

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
        const token = getSession()?.sessionToken;
        if (token) headers.Authorization = `Bearer ${token}`;
        return headers;
    }

    function buildPayload(extra = {}) {
        return { ...extra, session_token: getSession()?.sessionToken || '' };
    }

    function openModal(modal) {
        modal?.classList.add('active');
    }

    function closeModal(modal) {
        modal?.classList.remove('active');
    }

    function formatDate(ts) {
        return window.CoreDevDateTime?.format(ts) || '—';
    }

    function syncTimezonePreference(timezone) {
        if (!timezone) return;
        window.CoreDevDateTime?.setTimezone?.(timezone, { notify: false });
    }

    function setStatus(message, ok = false) {
        const el = document.getElementById('settingsStatus');
        if (!el) return;
        if (!message) {
            el.innerHTML = '';
            return;
        }
        el.innerHTML = `<span style="color:${ok ? '#00E5A0' : '#FF9E9E'};">${message}</span>`;
    }

    function getBrowserTimezoneFallback() {
        return window.CoreDevDateTime?.getBrowserTimezone?.() || 'Europe/Moscow';
    }

    function applyTheme(theme) {
        const resolved = theme === 'system'
            ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
            : theme;
        document.documentElement.setAttribute('data-theme', resolved || 'dark');
        localStorage.setItem('coredevTheme', theme || 'dark');
        updateThemeToggleButton();
    }

    function getStoredTheme() {
        try {
            return localStorage.getItem('coredevTheme') || '';
        } catch {
            return '';
        }
    }

    function getPreferredTheme(fallback = 'dark') {
        return getStoredTheme() || fallback || 'dark';
    }

    async function persistThemePreference(theme) {
        const session = getSession();
        if (!session?.sessionToken) return;
        try {
            await fetch('/api/settings/update', {
                method: 'POST',
                headers: authHeaders(true),
                body: JSON.stringify(buildPayload({ settings: { theme } })),
            });
        } catch {
            /* ignore background theme sync */
        }
    }

    function getResolvedTheme(theme = null) {
        const stored = theme ?? (localStorage.getItem('coredevTheme') || 'dark');
        if (stored === 'system') {
            return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        return stored === 'light' ? 'light' : 'dark';
    }

    function updateThemeToggleButton() {
        const btn = document.getElementById('themeToggleBtn');
        if (!btn) return;
        const isDark = getResolvedTheme() !== 'light';
        const iconName = isDark ? 'fa-moon' : 'fa-sun';
        btn.dataset.themeIcon = isDark ? 'moon' : 'sun';
        let icon = btn.querySelector('.nav-theme-toggle-icon i');
        if (!icon) {
            btn.innerHTML = `<span class="nav-theme-toggle-icon" aria-hidden="true"><i class="fas ${iconName}"></i></span>`;
        } else {
            icon.className = `fas ${iconName}`;
        }
        const label = t(isDark ? 'nav.theme.toLight' : 'nav.theme.toDark');
        btn.setAttribute('aria-label', label);
        btn.title = label;
    }

    function toggleTheme() {
        const next = getResolvedTheme() === 'light' ? 'dark' : 'light';
        const themeSelect = document.getElementById('settingsTheme');
        if (themeSelect) themeSelect.value = next;
        applyTheme(next);
        persistThemePreference(next);
    }

    function renderVerificationStatus(verification = {}) {
        const emailEl = document.getElementById('settingsEmailStatus');
        const phoneEl = document.getElementById('settingsPhoneStatus');
        const emailVerified = verification.email_verified === true;
        const phone = String(verification.phone || '').trim();
        const phoneVerified = verification.phone_verified === true && phone.length === 11;

        if (emailEl) {
            emailEl.textContent = emailVerified ? 'Подтверждён' : 'Не подтверждён';
            emailEl.className = `settings-verify-status ${emailVerified ? 'is-confirmed' : 'is-pending'}`;
        }

        if (phoneEl) {
            if (!phone) {
                phoneEl.textContent = 'Не указан';
                phoneEl.className = 'settings-verify-status is-empty';
            } else {
                phoneEl.textContent = phoneVerified ? 'Подтверждён' : 'Не подтверждён';
                phoneEl.className = `settings-verify-status ${phoneVerified ? 'is-confirmed' : 'is-pending'}`;
            }
        }
    }

    function applySettingsNavLabels() {
        settingsModal?.querySelectorAll('.settings-nav-btn').forEach((btn) => {
            const meta = SETTINGS_SECTIONS[btn.dataset.settingsSection];
            if (!meta) return;
            const title = btn.querySelector('.settings-nav-btn-title');
            const sub = btn.querySelector('.settings-nav-btn-sub');
            if (title) title.textContent = meta.title;
            if (sub) sub.textContent = meta.sub;
        });
        applyAccountSectionRu();
    }

    function applyAccountSectionRu() {
        const cardTitle = document.getElementById('settingsAccountCardTitle');
        if (cardTitle) {
            cardTitle.innerHTML = `<i class="fas fa-user-cog"></i> ${t('settings.card.account') || 'Управление аккаунтом'}`;
        }
        const cardSub = document.getElementById('settingsAccountCardSub');
        if (cardSub) cardSub.textContent = t('settings.account.sub') || 'Безопасность входа и критичные действия с аккаунтом.';

        const passwordTitle = document.querySelector('#settingsOpenPasswordBtn .settings-account-action-title');
        const passwordHint = document.querySelector('#settingsOpenPasswordBtn .settings-account-action-hint');
        const deleteTitle = document.querySelector('#settingsOpenDeleteBtn .settings-account-action-title');
        const deleteHint = document.querySelector('#settingsOpenDeleteBtn .settings-account-action-hint');
        if (passwordTitle) passwordTitle.textContent = t('settings.changePassword') || 'Изменить пароль';
        if (passwordHint) passwordHint.textContent = t('settings.account.passwordHint') || 'Обновите пароль для защиты входа';
        if (deleteTitle) deleteTitle.textContent = t('settings.deleteAccount') || 'Удалить аккаунт';
        if (deleteHint) deleteHint.textContent = t('settings.account.deleteHint') || 'Безвозвратное удаление профиля и всех данных';
    }

    function collectSettingsFromForm() {
        const phone = document.getElementById('settingsPhoneInput')?.value.replace(/\D/g, '').slice(0, 11) || '';
        return {
            theme: document.getElementById('settingsTheme')?.value || 'dark',
            language: 'ru',
            timezone: document.getElementById('settingsTimezone')?.value || 'Europe/Moscow',
            email_notifications: {
                application_reply: Boolean(document.getElementById('settingsNotifyReply')?.checked),
                project_status: Boolean(document.getElementById('settingsNotifyStatus')?.checked),
                news: Boolean(document.getElementById('settingsNotifyNews')?.checked),
            },
            push_notifications: Boolean(document.getElementById('settingsPushEnabled')?.checked),
            notification_frequency: document.querySelector('input[name="settingsNotifyFrequency"]:checked')?.value || 'immediate',
            profile_visibility: document.getElementById('settingsProfileVisibility')?.value || 'public',
            phone,
        };
    }

    function fillSettingsForm(bundle) {
        const settings = bundle?.settings || {};
        const verification = bundle?.verification || {};
        const security = bundle?.security || {};

        const preferredTheme = getPreferredTheme(settings.theme || 'dark');

        document.getElementById('settingsTheme').value = preferredTheme;
        document.getElementById('settingsLanguage').value = 'ru';
        document.getElementById('settingsTimezone').value = settings.timezone || 'Europe/Moscow';
        document.getElementById('settingsNotifyReply').checked = settings.email_notifications?.application_reply !== false;
        document.getElementById('settingsNotifyStatus').checked = settings.email_notifications?.project_status !== false;
        document.getElementById('settingsNotifyNews').checked = Boolean(settings.email_notifications?.news);
        document.getElementById('settingsPushEnabled').checked = settings.push_notifications !== false;
        const freqValue = settings.notification_frequency || 'immediate';
        const freqInput = document.querySelector(`input[name="settingsNotifyFrequency"][value="${freqValue}"]`)
            || document.querySelector('input[name="settingsNotifyFrequency"][value="immediate"]');
        if (freqInput) freqInput.checked = true;
        document.getElementById('settingsProfileVisibility').value = settings.profile_visibility || 'public';
        document.getElementById('settingsPhoneInput').value = settings.phone || '';

        renderVerificationStatus(verification);

        const captchaText = document.getElementById('settingsCaptchaBlockText');
        const captchaCard = document.getElementById('settingsCaptchaBlockCard');
        if (security.captcha_blocked) {
            captchaCard?.classList.add('settings-card-warning');
            const minutes = Math.ceil((security.captcha_retry_after || 600) / 60);
            captchaText.textContent = t('settings.captcha.blocked', { min: minutes });
        } else {
            captchaCard?.classList.remove('settings-card-warning');
            captchaText.textContent = t('settings.captcha.ok');
        }

        renderSessions(bundle.sessions || []);
        renderLoginHistory(bundle.login_history || []);
        syncTimezonePreference(settings.timezone || getBrowserTimezoneFallback());
        applyTheme(preferredTheme);
        if (preferredTheme !== (settings.theme || 'dark')) {
            persistThemePreference(preferredTheme);
        }

        if (window.CoreDevI18n) {
            window.CoreDevI18n.setLanguage('ru');
        }
    }

    function renderSessions(sessions) {
        const list = document.getElementById('settingsSessionsList');
        if (!list) return;
        if (!sessions.length) {
            list.innerHTML = `<div class="settings-empty">${t('settings.empty.sessions')}</div>`;
            return;
        }
        list.innerHTML = sessions.map((item) => `
            <div class="settings-list-item ${item.current ? 'is-current' : ''}">
                <div>
                    <strong>${item.device_label || t('settings.device')}</strong>
                    ${item.current ? `<span class="settings-pill">${t('settings.session.current')}</span>` : ''}
                    <div class="settings-list-meta">IP: ${item.ip || '—'} · ${formatDate(item.last_seen_at || item.created_at)}</div>
                </div>
            </div>
        `).join('');
    }

    function renderLoginHistory(items) {
        const list = document.getElementById('settingsLoginHistoryList');
        if (!list) return;
        if (!items.length) {
            list.innerHTML = `<div class="settings-empty">${t('settings.empty.history')}</div>`;
            return;
        }
        list.innerHTML = items.map((item) => `
            <div class="settings-list-item">
                <div>
                    <strong>${item.device_label || t('settings.device')}</strong>
                    <span class="settings-pill ${item.success ? 'ok' : 'bad'}">${item.success ? t('settings.login.success') : t('settings.login.fail')}</span>
                    <div class="settings-list-meta">IP: ${item.ip || '—'} · ${formatDate(item.at)}</div>
                </div>
            </div>
        `).join('');
    }

    async function loadSettings() {
        const response = await fetch('/api/settings', {
            method: 'GET',
            headers: authHeaders(),
            cache: 'no-store',
        });
        const result = await response.json();
        if (!response.ok) throw new Error(trApi(result.error) || t('settings.err.load'));
        settingsBundle = result;
        fillSettingsForm(result);
        window.coredevUserSettings = result.settings || {};
        return result;
    }

    async function saveSettings() {
        const settings = collectSettingsFromForm();
        const response = await fetch('/api/settings/update', {
            method: 'POST',
            headers: authHeaders(true),
            body: JSON.stringify(buildPayload({ settings })),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(trApi(result.error) || t('settings.err.save'));
        settingsBundle = { ...(settingsBundle || {}), settings: result.settings };
        window.coredevUserSettings = result.settings;
        applyTheme(result.settings.theme);
        window.CoreDevI18n?.setLanguage('ru');
        await loadSettings();
        setStatus(t('settings.saved'), true);
    }

    function switchSection(section) {
        settingsModal?.querySelectorAll('.settings-nav-btn').forEach((btn) => {
            btn.classList.toggle('active', btn.dataset.settingsSection === section);
        });
        settingsModal?.querySelectorAll('.settings-panel').forEach((panel) => {
            panel.classList.toggle('active', panel.dataset.settingsPanel === section);
        });

        const meta = SETTINGS_SECTIONS[section] || SETTINGS_SECTIONS.security;
        const title = document.getElementById('settingsSectionTitle');
        const subtitle = document.getElementById('settingsSectionSubtitle');
        if (title) title.textContent = meta.title;
        if (subtitle) subtitle.textContent = meta.sub;
        if (section === 'account') applyAccountSectionRu();
    }

    function collectProjectDraft() {
        return {
            name: document.getElementById('projectFullName')?.value || '',
            company: document.getElementById('projectCompany')?.value || '',
            email: document.getElementById('projectEmail')?.value || '',
            phone: document.getElementById('projectPhone')?.value || '',
            position: document.getElementById('projectPosition')?.value || '',
            budget_amount: document.getElementById('projectBudgetAmount')?.value || '',
            budget_currency: document.getElementById('projectBudgetCurrency')?.value || '',
            message: document.getElementById('projectMessage')?.value || '',
        };
    }

    async function saveDraftDebounced() {
        if (!getSession()?.sessionToken) return;
        clearTimeout(draftSaveTimer);
        draftSaveTimer = setTimeout(async () => {
            const draft = collectProjectDraft();
            const hasContent = Object.values(draft).some((value) => String(value || '').trim());
            if (!hasContent) return;
            try {
                await fetch('/api/project-draft/save', {
                    method: 'POST',
                    headers: authHeaders(true),
                    body: JSON.stringify(buildPayload({ draft })),
                });
            } catch {
                /* ignore autosave errors */
            }
        }, 1200);
    }

    async function openSettings() {
        if (!getSession()?.sessionToken) {
            window.dispatchEvent(new CustomEvent('coredev-require-auth'));
            return;
        }
        openModal(settingsModal);
        setStatus(t('settings.loading'));
        try {
            await loadSettings();
            setStatus('');
            switchSection('security');
        } catch (error) {
            const message = error.message || t('settings.err.load');
            setStatus(`❌ ${message}`);
            if (/авторизац|authorization|сессия|session/i.test(message)) {
                window.dispatchEvent(new CustomEvent('coredev-require-auth'));
            }
        }
    }

    function bindEvents() {
        settingsModal?.querySelectorAll('.settings-nav-btn').forEach((btn) => {
            btn.addEventListener('click', () => switchSection(btn.dataset.settingsSection));
        });

        document.getElementById('settingsSaveBtn')?.addEventListener('click', async () => {
            try {
                await saveSettings();
            } catch (error) {
                setStatus(`❌ ${error.message}`);
            }
        });

        document.getElementById('settingsRevokeAllBtn')?.addEventListener('click', async () => {
            try {
                const response = await fetch('/api/sessions/revoke-all', {
                    method: 'POST',
                    headers: authHeaders(true),
                    body: JSON.stringify(buildPayload()),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(trApi(result.error) || t('settings.err.generic'));
                await loadSettings();
                setStatus(t('settings.sessions.revoked'), true);
            } catch (error) {
                setStatus(`❌ ${error.message}`);
            }
        });

        document.getElementById('settingsOpenPasswordBtn')?.addEventListener('click', () => {
            closeModal(settingsModal);
            openModal(document.getElementById('changePasswordModal'));
        });

        document.getElementById('settingsOpenDeleteBtn')?.addEventListener('click', () => {
            closeModal(settingsModal);
            openModal(document.getElementById('deleteAccountModal'));
        });

        settingsModal?.addEventListener('click', (e) => {
            if (e.target === settingsModal) closeModal(settingsModal);
        });

        document.getElementById('settingsTheme')?.addEventListener('change', (e) => {
            applyTheme(e.target.value);
            persistThemePreference(e.target.value);
        });

        document.getElementById('themeToggleBtn')?.addEventListener('click', toggleTheme);

        document.getElementById('settingsPhoneInput')?.addEventListener('input', (e) => {
            e.target.value = String(e.target.value || '').replace(/\D/g, '').slice(0, 11);
        });

        document.getElementById('settingsTimezone')?.addEventListener('change', (event) => {
            window.CoreDevDateTime?.setTimezone?.(event.target.value);
        });

        document.addEventListener('coredev-language-changed', () => {
            const active = settingsModal?.querySelector('.settings-nav-btn.active')?.dataset.settingsSection || 'security';
            switchSection(active);
            if (settingsBundle) {
                renderSessions(settingsBundle.sessions || []);
                renderLoginHistory(settingsBundle.login_history || []);
                const security = settingsBundle.security || {};
                const captchaText = document.getElementById('settingsCaptchaBlockText');
                const captchaCard = document.getElementById('settingsCaptchaBlockCard');
                if (security.captcha_blocked) {
                    captchaCard?.classList.add('settings-card-warning');
                    const minutes = Math.ceil((security.captcha_retry_after || 600) / 60);
                    captchaText.textContent = t('settings.captcha.blocked', { min: minutes });
                } else {
                    captchaCard?.classList.remove('settings-card-warning');
                    captchaText.textContent = t('settings.captcha.ok');
                }
                const verification = settingsBundle.verification || {};
                renderVerificationStatus(verification);
            }
            applySettingsNavLabels();
            window.CoreDevI18n?.applySettingsPanelTexts?.();
        });

        const contactForm = document.getElementById('contactForm');
        contactForm?.addEventListener('input', saveDraftDebounced);
        contactForm?.addEventListener('change', saveDraftDebounced);

        document.addEventListener('coredev-session-changed', async () => {
            const session = getSession();
            if (!session?.sessionToken) return;
            try {
                await loadSettings();
            } catch {
                /* ignore */
            }
        });

        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
            const theme = localStorage.getItem('coredevTheme') || 'dark';
            if (theme === 'system') applyTheme('system');
        });
    }

    const savedTheme = getPreferredTheme('dark');
    applyTheme(savedTheme);
    bindEvents();
    applySettingsNavLabels();

    (async function bootstrapTimezonePreference() {
        const session = getSession();
        if (!session?.sessionToken) return;
        try {
            const response = await fetch('/api/settings', {
                method: 'GET',
                headers: authHeaders(),
                cache: 'no-store',
            });
            const result = await response.json();
            if (response.ok && result.settings?.timezone) {
                syncTimezonePreference(result.settings.timezone);
            }
        } catch {
            /* ignore background timezone bootstrap */
        }
    })();

    window.CoreDevSettings = {
        open: openSettings,
        saveDraftDebounced,
        updateThemeToggle: updateThemeToggleButton,
        applySettingsNavLabels,
        applyAccountSectionRu,
        switchSection,
        renderVerificationStatus,
        getTimezone: () => window.CoreDevDateTime?.getTimezone?.() || getBrowserTimezoneFallback(),
        shouldShowToast() {
            return window.coredevUserSettings?.push_notifications !== false;
        },
    };
})();
