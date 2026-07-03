    const loginModal = document.getElementById('loginModal');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const resetPasswordModal = document.getElementById('resetPasswordModal');
    const registerModal = document.getElementById('registerModal');
    const emailVerifyModal = document.getElementById('emailVerifyModal');
    const profileModal = document.getElementById('profileModal');
    const changePasswordModal = document.getElementById('changePasswordModal');
    const deleteAccountModal = document.getElementById('deleteAccountModal');
    const settingsModal = document.getElementById('settingsModal');
    const adminModal = document.getElementById('adminModal');
    const siteNavbar = document.getElementById('siteNavbar');
    const navMenuToggle = document.getElementById('navMenuToggle');
    const navPanelClose = document.getElementById('navPanelClose');
    const navOverlay = document.getElementById('navOverlay');
    const openLoginBtn = document.getElementById('openLoginBtn');
    const openRegisterBtn = document.getElementById('openRegisterBtn');
    const profileMenuAdmin = document.getElementById('profileMenuAdmin');
    const closeBtns = document.querySelectorAll('.close-modal');
    const userProfile = document.getElementById('userProfile');
    const profileTrigger = document.getElementById('profileTrigger');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileRoleBadge = document.getElementById('profileRoleBadge');
    const profileModalRoleBadge = document.getElementById('profileModalRoleBadge');
    const profileMenuProfile = document.getElementById('profileMenuProfile');
    const profileMenuSettings = document.getElementById('profileMenuSettings');
    const profileMenuLogout = document.getElementById('profileMenuLogout');
    const profileEditForm = document.getElementById('profileEditForm');
    const profileEditAvatarPreview = document.getElementById('profileEditAvatarPreview');
    const profileAvatarInput = document.getElementById('profileAvatarInput');
    const profileEditUsername = document.getElementById('profileEditUsername');
    const profileEditEmail = document.getElementById('profileEditEmail');
    const profileEditFullName = document.getElementById('profileEditFullName');
    const profileEditStatus = document.getElementById('profileEditStatus');
    const openChangePasswordBtn = document.getElementById('openChangePasswordBtn');
    const changePasswordForm = document.getElementById('changePasswordForm');
    const changeOldPassword = document.getElementById('changeOldPassword');
    const changeNewPassword = document.getElementById('changeNewPassword');
    const changeConfirmPassword = document.getElementById('changeConfirmPassword');
    const changeNewPasswordError = document.getElementById('changeNewPasswordError');
    const changeConfirmPasswordError = document.getElementById('changeConfirmPasswordError');
    const changePasswordStatus = document.getElementById('changePasswordStatus');
    const openDeleteAccountBtn = document.getElementById('openDeleteAccountBtn');
    const confirmDeleteAccountBtn = document.getElementById('confirmDeleteAccountBtn');
    const cancelDeleteAccountBtn = document.getElementById('cancelDeleteAccountBtn');
    const deleteAccountStatus = document.getElementById('deleteAccountStatus');
    const toastContainer = document.getElementById('toastContainer');
    const SESSION_KEY = 'coredevSession';
    const SECURITY_IP_KEY = 'coredevSecurityIp';
    const NETWORK_ERROR_PAGE = '/404';
    const BLOCKED_PAGE = '/403';
    const PUBLIC_IP_API = 'https://api.ipify.org?format=json';

    function setFormFieldError(input, errorEl, message) {
        if (errorEl) errorEl.textContent = message || '';
        const field = input?.closest('.form-field');
        if (field) {
            field.classList.toggle('is-invalid', Boolean(message));
            return;
        }
        if (input) input.style.borderColor = message ? '#FF9E9E' : '';
    }

    function redirectToBlockedPage() {
        sessionStorage.removeItem('coredevSecurityPassed');
        sessionStorage.removeItem(SECURITY_IP_KEY);
        if (window.location.pathname !== BLOCKED_PAGE) {
            window.location.replace(BLOCKED_PAGE);
        }
    }

    async function checkBlockedStatus() {
        try {
            const response = await fetch('/api/block-status', { cache: 'no-store' });
            if (response.status === 403) {
                redirectToBlockedPage();
            }
        } catch {}
    }

    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
        const response = await nativeFetch(input, init);
        const requestUrl = typeof input === 'string' ? input : input.url;
        if (response.status === 403 && requestUrl.includes('/api/')) {
            redirectToBlockedPage();
        }
        return response;
    };

    function redirectToNetworkError(reason = 'network') {
        const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}` || '/app';
        const url = `${NETWORK_ERROR_PAGE}?reason=${encodeURIComponent(reason)}&return_to=${encodeURIComponent(returnTo)}`;
        if (window.location.pathname !== NETWORK_ERROR_PAGE) {
            window.location.replace(url);
        }
    }

    async function verifyConnectionIntegrity() {
        if (!navigator.onLine) {
            redirectToNetworkError('offline');
            return;
        }

        try {
            const publicIp = await getPublicIp();
            const response = await fetch('/api/security-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'runtime-monitor',
                    public_ip: publicIp,
                }),
            });
            const result = await response.json();

            if (!response.ok || !result.allowed) {
                if (response.status === 403) {
                    redirectToBlockedPage();
                } else {
                    redirectToNetworkError('api-unavailable');
                }
                return;
            }

            const previousIp = sessionStorage.getItem(SECURITY_IP_KEY);
            const currentIp = result.public_ip || publicIp;
            if (previousIp && currentIp && previousIp !== currentIp) {
                redirectToNetworkError('ip-changed');
                return;
            }

            if (currentIp) {
                sessionStorage.setItem(SECURITY_IP_KEY, currentIp);
            }
        } catch {
            redirectToNetworkError('api-unavailable');
        }
    }

    async function getPublicIp() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        try {
            const response = await fetch(PUBLIC_IP_API, {
                signal: controller.signal,
                cache: 'no-store',
            });
            const data = await response.json();
            if (!data.ip) throw new Error(tr('ip.err'));
            return data.ip;
        } finally {
            clearTimeout(timeout);
        }
    }

    window.addEventListener('offline', () => redirectToNetworkError('offline'));
    window.addEventListener('online', verifyConnectionIntegrity);
    window.addEventListener('focus', () => {
        checkBlockedStatus();
        verifyConnectionIntegrity();
    });
    window.addEventListener('pageshow', () => {
        checkBlockedStatus();
        verifyConnectionIntegrity();
    });
    document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
            checkBlockedStatus();
            verifyConnectionIntegrity();
        }
    });
    setInterval(checkBlockedStatus, 2000);
    setInterval(verifyConnectionIntegrity, 15000);
    checkBlockedStatus();
    verifyConnectionIntegrity();

    function buildAuthPayload(extra = {}) {
        const session = getSession();
        return {
            ...extra,
            session_token: session?.sessionToken || '',
        };
    }

    function tr(key, params) {
        return window.CoreDevI18n?.t(key, params) ?? key;
    }

    function sessionDaysLabel(days) {
        return tr(days === 1 ? 'login.day.one' : 'login.day.many');
    }

    function statusError(msg) {
        return `<span style="color:#FF9E9E;">❌ ${msg}</span>`;
    }

    function statusOk(msg) {
        return `<span style="color:#00E5A0;">✅ ${msg}</span>`;
    }

    function statusInfo(msg) {
        return `<span style="color:#9AA4C8;">${msg}</span>`;
    }

    function statusSuccess(msg) {
        return `<span style="color:#00C48C;">✅ ${msg}</span>`;
    }

    function trApi(message) {
        return window.CoreDevI18n?.translateApiError?.(message) ?? message;
    }

    function statusApiError(msg) {
        return statusError(trApi(msg));
    }

    function showToast({ title, message = '', type = 'info', duration = 4200 } = {}) {
        if (title === undefined) title = tr('toast.notification');
        if (window.CoreDevSettings?.shouldShowToast && !window.CoreDevSettings.shouldShowToast()) return;
        if (!toastContainer) return;

        const icons = {
            success: 'fa-check',
            error: 'fa-times',
            warning: 'fa-exclamation',
            info: 'fa-bell',
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-icon"><i class="fas ${icons[type] || icons.info}"></i></div>
            <div>
                <div class="toast-title">${title}</div>
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" type="button" aria-label="${tr('aria.closeToast')}">&times;</button>
        `;

        const removeToast = () => {
            toast.classList.add('hide');
            setTimeout(() => toast.remove(), 240);
        };

        toast.querySelector('.toast-close')?.addEventListener('click', removeToast);
        toastContainer.appendChild(toast);
        setTimeout(removeToast, duration);
    }

    function saveSession(email, remember, username = '', extra = {}) {
        const days = remember ? 30 : 1;
        const expiresAt = Date.now() + days * 24 * 60 * 60 * 1000;
        localStorage.setItem(SESSION_KEY, JSON.stringify({ email, username, remember, expiresAt, ...extra }));
    }

    function updateSession(updates) {
        const session = getSession();
        if (!session) return null;

        const nextSession = { ...session, ...updates };
        localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
        return nextSession;
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

            const emailLocalPart = session.email?.split('@')[0];
            if (session.username && session.username === emailLocalPart && !session.fullName) {
                session.username = '';
            }

            if (session.role || session.roleFromServer) {
                delete session.role;
                delete session.roleFromServer;
                localStorage.setItem(SESSION_KEY, JSON.stringify(session));
            }

            return session;
        } catch {
            localStorage.removeItem(SESSION_KEY);
            return null;
        }
    }

    let adminRoleConfirmed = false;

    function resolveAdminRoleFromServer(user) {
        if (!user || typeof user !== 'object') return false;
        if (user.is_admin === true) return true;
        return String(user.role || '').trim().toLowerCase() === 'admin';
    }

    function setAdminRoleFromServer(userOrRole) {
        const isAdmin = typeof userOrRole === 'object'
            ? resolveAdminRoleFromServer(userOrRole)
            : String(userOrRole || '').trim().toLowerCase() === 'admin';
        adminRoleConfirmed = isAdmin;
        if (getSession()) {
            updateSession({ isAdmin });
        }
        renderRoleBadges(adminRoleConfirmed);
    }

    function restoreAdminRoleFromSession() {
        const session = getSession();
        adminRoleConfirmed = session?.isAdmin === true;
        renderRoleBadges(adminRoleConfirmed);
    }

    function clearAdminRole() {
        adminRoleConfirmed = false;
        renderRoleBadges(false);
    }

    function renderRoleBadges(isAdmin) {
        isAdmin = isAdmin === true;
        const label = 'Админ';

        if (profileRoleBadge) {
            profileRoleBadge.hidden = !isAdmin;
            const text = profileRoleBadge.querySelector('.profile-role-badge-text');
            if (text) text.textContent = label;
        }

        if (profileModalRoleBadge) {
            profileModalRoleBadge.hidden = !isAdmin;
            const text = profileModalRoleBadge.querySelector('.profile-modal-role-badge-text');
            if (text) text.textContent = label;
        }

        if (userProfile) {
            userProfile.classList.toggle('is-admin', isAdmin);
        }

        if (profileMenuAdmin) {
            const session = getSession();
            profileMenuAdmin.hidden = !isAdmin || !session;
        }

        if (window.CoreDevContentCMS?.updateAdminUI) {
            window.CoreDevContentCMS.updateAdminUI(isAdmin);
        }
    }

    function renderUserProfile() {
        const session = getSession();
        if (!userProfile || !openLoginBtn || !openRegisterBtn) return;

        if (!session) {
            clearAdminRole();
            if (profileMenuAdmin) profileMenuAdmin.hidden = true;
            openLoginBtn.style.display = '';
            openRegisterBtn.style.display = '';
            userProfile.classList.remove('active', 'open');
            document.dispatchEvent(new CustomEvent('coredev-session-changed'));
            return;
        }

        const username = session.username || session.email || tr('user.default');
        openLoginBtn.style.display = 'none';
        openRegisterBtn.style.display = 'none';
        userProfile.classList.add('active');
        if (profileName) profileName.textContent = username;
        renderAvatar(profileAvatar, session.avatar, username);
        renderRoleBadges(adminRoleConfirmed);
        document.dispatchEvent(new CustomEvent('coredev-session-changed'));
    }

    function renderAvatar(target, avatar, username) {
        if (!target) return;
        const letter = username?.trim().charAt(0).toUpperCase() || 'U';

        if (avatar) {
            target.innerHTML = `<img src="${avatar}" alt="${tr('avatar.alt')}">`;
            return;
        }

        target.textContent = letter;
    }

    function fillProfileForm() {
        const session = getSession();
        if (!session) return;

        const username = session.username || '';
        if (profileEditUsername) profileEditUsername.value = username;
        if (profileEditEmail) profileEditEmail.value = session.email || '';
        if (profileEditFullName) profileEditFullName.value = session.fullName || '';
        if (profileEditStatus) profileEditStatus.innerHTML = '';
        renderAvatar(profileEditAvatarPreview, session.avatar, username || session.email || tr('user.default'));
        renderRoleBadges(adminRoleConfirmed);
    }

    async function syncProfileFromServer({ silent = false } = {}) {
        const session = getSession();
        if (!session?.email) return;

        if (!silent && profileEditStatus) profileEditStatus.innerHTML = statusInfo(tr('profile.loading'));

        try {
            const response = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildAuthPayload({ email: session.email })),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || tr('profile.err.load'));
            }

            const avatar = session.avatar || '';
            updateSession({
                email: result.user.email,
                username: result.user.username,
                fullName: result.user.full_name,
                userId: result.user.id,
                avatar,
            });
            setAdminRoleFromServer(result.user);
            fillProfileForm();
            renderUserProfile();
            if (!silent && profileEditStatus) profileEditStatus.innerHTML = '';
        } catch (error) {
            restoreAdminRoleFromSession();
            renderUserProfile();
            if (!silent && profileEditStatus) profileEditStatus.innerHTML = statusApiError(error.message);
        }
    }

    async function loadProfileFromSupabase() {
        await syncProfileFromServer({ silent: false });
    }

    restoreAdminRoleFromSession();
    renderUserProfile();
    syncProfileFromServer({ silent: true });

    function closeMobileNav() {
        if (!siteNavbar || !navMenuToggle) return;
        siteNavbar.classList.remove('nav-open');
        navMenuToggle.setAttribute('aria-expanded', 'false');
        navMenuToggle.setAttribute('aria-label', tr('aria.openMenu'));
        document.body.classList.remove('nav-menu-open');
        if (navOverlay) navOverlay.hidden = true;
    }
    window.closeMobileNav = closeMobileNav;

    function openMobileNav() {
        if (!siteNavbar || !navMenuToggle) return;
        siteNavbar.classList.add('nav-open');
        navMenuToggle.setAttribute('aria-expanded', 'true');
        navMenuToggle.setAttribute('aria-label', tr('aria.closeMenu'));
        document.body.classList.add('nav-menu-open');
        if (navOverlay) navOverlay.hidden = false;
        if (userProfile?.classList.contains('active')) {
            userProfile.classList.add('open');
        }
    }

    function toggleMobileNav() {
        if (siteNavbar?.classList.contains('nav-open')) {
            closeMobileNav();
        } else {
            openMobileNav();
        }
    }

    navMenuToggle?.addEventListener('click', toggleMobileNav);
    navPanelClose?.addEventListener('click', closeMobileNav);
    if (navPanelClose) navPanelClose.setAttribute('aria-label', tr('aria.closeMenu'));
    navOverlay?.addEventListener('click', closeMobileNav);
    document.getElementById('navPanel')?.querySelectorAll('.nav-links a').forEach((link) => {
        link.addEventListener('click', closeMobileNav);
    });
    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) closeMobileNav();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') closeMobileNav();
    });

    const PENDING_REGISTRATION_KEY = 'pendingRegistrationEmail';

    function getPendingRegistrationEmail() {
        return String(sessionStorage.getItem(PENDING_REGISTRATION_KEY) || '').trim().toLowerCase();
    }

    function getVerificationEmail() {
        return getPendingRegistrationEmail()
            || String(document.getElementById('emailVerifyAddress')?.value || '').trim().toLowerCase();
    }

    function rememberPendingRegistrationEmail(email) {
        const normalizedEmail = String(email || '').trim().toLowerCase();
        if (!normalizedEmail) return;
        sessionStorage.setItem(PENDING_REGISTRATION_KEY, normalizedEmail);
    }

    function clearPendingRegistration() {
        sessionStorage.removeItem(PENDING_REGISTRATION_KEY);
    }

    (function cleanupStaleAuthStateOnLoad() {
        localStorage.removeItem(PENDING_REGISTRATION_KEY);
        const params = new URLSearchParams(window.location.search);
        const hasResetCode = Boolean(
            params.get('code') || params.get('token') || params.get('reset_token')
        );
        if (!hasResetCode) {
            sessionStorage.removeItem('pendingResetToken');
            sessionStorage.removeItem('pendingResetEmail');
        }
    })();

    function shouldUseRegistrationVerification() {
        return Boolean(getPendingRegistrationEmail());
    }

    function shouldPromptEmailVerification(user, explicitFlag) {
        if (explicitFlag === true) return true;
        return Boolean(user && user.email_verified === false);
    }

    function openEmailVerificationModal(email, warning = '', isPendingRegistration = false) {
        const addressInput = document.getElementById('emailVerifyAddress');
        const codeInput = document.getElementById('emailVerifyCode');
        const status = document.getElementById('emailVerifyStatus');
        const codeError = document.getElementById('emailVerifyCodeError');
        const normalizedEmail = String(email || '').trim().toLowerCase();

        if (isPendingRegistration && normalizedEmail) {
            rememberPendingRegistrationEmail(normalizedEmail);
        }

        if (addressInput) addressInput.value = normalizedEmail;
        if (codeInput) codeInput.value = '';
        setFormFieldError(codeInput, codeError, '');
        if (status) {
            status.innerHTML = warning
                ? statusInfo(trApi(warning) || warning)
                : statusInfo(tr('verify.sent'));
        }
        openModal(emailVerifyModal);
        codeInput?.focus();
    }

    function finalizeRegistrationAfterVerification(result) {
        saveSession(result.user.email, true, result.user.username, {
            fullName: result.user.full_name,
            userId: result.user.id,
            sessionToken: result.session_token,
            emailVerified: true,
        });
        setAdminRoleFromServer(result.user);
        renderUserProfile();
        clearPendingRegistration();
        closeModal(emailVerifyModal);
        closeModal(registerModal);
        resetRegisterForm();
        showToast({
            title: tr('reg.success.title'),
            message: tr('reg.success.msg'),
            type: 'success',
        });
    }

    function finalizeEmailVerification() {
        updateSession({ emailVerified: true });
        closeModal(emailVerifyModal);
        renderUserProfile();
        showToast({
            title: tr('verify.success.title'),
            message: tr('verify.success.msg'),
            type: 'success',
        });
    }

    function openModal(modal) { if (modal) modal.classList.add('active'); }
    function closeModal(modal) { if (modal) modal.classList.remove('active'); }
    closeBtns.forEach(btn => btn.addEventListener('click', () => {
        if (emailVerifyModal?.classList.contains('active') && !getSession()?.sessionToken) {
            clearPendingRegistration();
        }
        if (resetPasswordModal?.classList.contains('active')) {
            sessionStorage.removeItem('pendingResetToken');
            sessionStorage.removeItem('pendingResetEmail');
        }
        closeModal(loginModal); 
        closeModal(forgotPasswordModal);
        closeModal(resetPasswordModal);
        closeModal(registerModal);
        closeModal(emailVerifyModal);
        closeModal(profileModal);
        closeModal(changePasswordModal);
        closeModal(deleteAccountModal);
        closeModal(settingsModal);
        closeModal(adminModal);
        // Reset eye icons when closing register modal
        if (registerModal) {
            registerModal.querySelectorAll('.toggle-password').forEach(icon => {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                icon.setAttribute('aria-label', tr('aria.showPassword'));
            });
        }
    }));
    window.addEventListener('click', (e) => { 
        if (userProfile && !userProfile.contains(e.target)) {
            userProfile.classList.remove('open');
        }
        if (e.target === loginModal) closeModal(loginModal); 
        if (e.target === forgotPasswordModal) closeModal(forgotPasswordModal);
        if (e.target === resetPasswordModal) {
            sessionStorage.removeItem('pendingResetToken');
            sessionStorage.removeItem('pendingResetEmail');
            closeModal(resetPasswordModal);
        }
        if (e.target === emailVerifyModal) {
            if (!getSession()?.sessionToken) clearPendingRegistration();
            closeModal(emailVerifyModal);
        }
        if (e.target === profileModal) closeModal(profileModal);
        if (e.target === changePasswordModal) closeModal(changePasswordModal);
        if (e.target === deleteAccountModal) closeModal(deleteAccountModal);
        if (e.target === settingsModal) closeModal(settingsModal);
        if (e.target === adminModal) closeModal(adminModal);
        if (e.target === registerModal) {
            closeModal(registerModal);
            registerModal.querySelectorAll('.toggle-password').forEach(icon => {
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
                icon.setAttribute('aria-label', tr('aria.showPassword'));
            });
        }
    });
    window.CoreDevAdmin = window.CoreDevAdmin || {};
    window.CoreDevAdmin.onRoleChanged = (user) => {
        const session = getSession();
        if (!session || !user) return;
        if (session.email === user.email) {
            setAdminRoleFromServer(user);
            renderUserProfile();
        }
    };

    document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const loginEmail = document.getElementById('loginEmail');
        const loginPassword = document.getElementById('loginPassword');
        const loginEmailError = document.getElementById('loginEmailError');
        const loginPasswordError = document.getElementById('loginPasswordError');
        const email = loginEmail.value.trim();
        const password = loginPassword.value;
        const remember = document.getElementById('loginRemember').checked;
        const days = remember ? 30 : 1;

        setFormFieldError(loginEmail, loginEmailError, '');
        setFormFieldError(loginPassword, loginPasswordError, '');

        let hasError = false;
        if (!email || !validateEmail(email)) {
            setFormFieldError(loginEmail, loginEmailError, tr('form.err.email'));
            hasError = true;
        }
        if (!password) {
            setFormFieldError(loginPassword, loginPasswordError, tr('login.err.password'));
            hasError = true;
        }
        if (hasError) return;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, remember }),
            });
            const result = await response.json();

            if (!response.ok) {
                if (result.requires_registration_confirmation) {
                    rememberPendingRegistrationEmail(result.email || email);
                    document.getElementById('loginStatus').innerHTML = statusInfo(trApi(result.error) || result.error);
                    closeModal(loginModal);
                    openEmailVerificationModal(result.email || email, '', true);
                    return;
                }
                throw new Error(result.error || tr('login.err'));
            }

            saveSession(result.user.email, remember, result.user.username, {
                fullName: result.user.full_name,
                userId: result.user.id,
                sessionToken: result.session_token,
                emailVerified: true,
            });
            setAdminRoleFromServer(result.user);
            renderUserProfile();
            document.getElementById('loginStatus').innerHTML = statusSuccess(tr('login.success.status', { days, daysLabel: sessionDaysLabel(days) }));
            showToast({
                title: tr('login.success.title'),
                message: tr('login.success.msg', { days, daysLabel: sessionDaysLabel(days) }),
                type: 'success',
            });
            setTimeout(() => {
                closeModal(loginModal);
            }, 1500);
        } catch (error) {
            const message = trApi(error.message);
            document.getElementById('loginStatus').innerHTML = statusError(message);
            showToast({
                title: tr('login.err.title'),
                message,
                type: 'error',
            });
        }
    });

    document.getElementById('loginEmail')?.addEventListener('input', () => {
        setFormFieldError(document.getElementById('loginEmail'), document.getElementById('loginEmailError'), '');
    });
    document.getElementById('loginPassword')?.addEventListener('input', () => {
        setFormFieldError(document.getElementById('loginPassword'), document.getElementById('loginPasswordError'), '');
    });

    profileTrigger?.addEventListener('click', (e) => {
        e.stopPropagation();
        userProfile?.classList.toggle('open');
    });

    profileMenuProfile?.addEventListener('click', () => {
        userProfile?.classList.remove('open');
        closeMobileNav();
        fillProfileForm();
        openModal(profileModal);
        loadProfileFromSupabase();
    });

    profileMenuSettings?.addEventListener('click', () => {
        userProfile?.classList.remove('open');
        closeMobileNav();
        window.CoreDevSettings?.open?.();
    });

    document.addEventListener('coredev-require-auth', () => {
        requireProjectAuth();
    });

    profileMenuLogout?.addEventListener('click', async () => {
        try {
            await fetch('/api/logout', {
                method: 'POST',
                headers: getProjectRequestHeaders(true),
                body: JSON.stringify(buildAuthPayload()),
            });
        } catch {
            /* ignore */
        }
        localStorage.removeItem(SESSION_KEY);
        clearAdminRole();
        userProfile?.classList.remove('open');
        closeMobileNav();
        window.CoreDevSupportChat?.handleLoggedOut?.();
        renderUserProfile();
        showToast({
            title: tr('logout.title'),
            message: tr('logout.msg'),
            type: 'info',
        });
    });

    profileAvatarInput?.addEventListener('change', () => {
        const file = profileAvatarInput.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            if (profileEditStatus) profileEditStatus.innerHTML = statusError(tr('profile.err.image'));
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            renderAvatar(profileEditAvatarPreview, reader.result, profileEditUsername?.value || 'user');
        };
        reader.readAsDataURL(file);
    });

    profileEditForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = profileEditUsername.value.trim();
        const email = profileEditEmail.value.trim();
        const fullName = profileEditFullName.value.trim();
        const avatarImg = profileEditAvatarPreview?.querySelector('img');
        const avatar = avatarImg?.getAttribute('src') || '';

        if (!username || !email) {
            if (profileEditStatus) profileEditStatus.innerHTML = statusError(tr('profile.err.required'));
            return;
        }

        try {
            updateSession({ username, email, fullName, avatar });
            renderUserProfile();
            if (profileEditStatus) profileEditStatus.innerHTML = statusOk(tr('profile.saved.status'));
            showToast({
                title: tr('profile.saved.title'),
                message: tr('profile.saved.msg'),
                type: 'success',
            });
            setTimeout(() => closeModal(profileModal), 900);
        } catch (error) {
            if (profileEditStatus) profileEditStatus.innerHTML = statusApiError(error.message);
        }
    });

    openDeleteAccountBtn?.addEventListener('click', () => {
        if (deleteAccountStatus) deleteAccountStatus.innerHTML = '';
        const deletePasswordInput = document.getElementById('deleteAccountPassword');
        if (deletePasswordInput) deletePasswordInput.value = '';
        openModal(deleteAccountModal);
    });

    cancelDeleteAccountBtn?.addEventListener('click', () => {
        closeModal(deleteAccountModal);
    });

    confirmDeleteAccountBtn?.addEventListener('click', async () => {
        const session = getSession();
        const deletePasswordInput = document.getElementById('deleteAccountPassword');
        const password = deletePasswordInput?.value || '';

        if (!session?.email) {
            if (deleteAccountStatus) deleteAccountStatus.innerHTML = statusError(tr('delete.err.login'));
            return;
        }

        if (!password) {
            setFormFieldError(deletePasswordInput, document.getElementById('deleteAccountPasswordError'), tr('delete.err.password'));
            deletePasswordInput?.focus();
            return;
        }

        setFormFieldError(deletePasswordInput, document.getElementById('deleteAccountPasswordError'), '');

        try {
            if (deleteAccountStatus) deleteAccountStatus.innerHTML = statusInfo(tr('delete.loading'));
            const response = await fetch('/api/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildAuthPayload({ email: session.email, password })),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || tr('delete.err.failed'));
            }

            localStorage.removeItem(SESSION_KEY);
            clearAdminRole();
            closeModal(deleteAccountModal);
            closeModal(profileModal);
            renderUserProfile();
            showToast({
                title: tr('delete.success.title'),
                message: tr('delete.success.msg'),
                type: 'warning',
                duration: 5200,
            });
        } catch (error) {
            if (deleteAccountStatus) deleteAccountStatus.innerHTML = statusApiError(error.message);
        }
    });

    openChangePasswordBtn?.addEventListener('click', () => {
        if (changePasswordForm) changePasswordForm.reset();
        if (changePasswordStatus) changePasswordStatus.innerHTML = '';
        setFormFieldError(changeOldPassword, document.getElementById('changeOldPasswordError'), '');
        setFormFieldError(changeNewPassword, changeNewPasswordError, '');
        setFormFieldError(changeConfirmPassword, changeConfirmPasswordError, '');
        openModal(changePasswordModal);
    });

    changeNewPassword?.addEventListener('input', () => {
        setFormFieldError(changeNewPassword, changeNewPasswordError, '');

        if (changeConfirmPassword?.value) {
            if (changeConfirmPassword.value !== changeNewPassword.value) {
                setFormFieldError(changeConfirmPassword, changeConfirmPasswordError, tr('password.mismatch'));
            } else {
                setFormFieldError(changeConfirmPassword, changeConfirmPasswordError, '');
            }
        }
    });

    changeNewPassword?.addEventListener('blur', () => {
        const session = getSession();
        if (!changeNewPassword.value) return;

        const result = validatePassword(
            changeNewPassword.value,
            session?.username || '',
            session?.email || ''
        );

        if (!result.valid) {
            setFormFieldError(changeNewPassword, changeNewPasswordError, result.message);
        }
    });

    changeConfirmPassword?.addEventListener('input', () => {
        setFormFieldError(changeConfirmPassword, changeConfirmPasswordError, '');

        if (changeNewPassword?.value && changeConfirmPassword.value !== changeNewPassword.value) {
            setFormFieldError(changeConfirmPassword, changeConfirmPasswordError, tr('password.mismatch'));
        }
    });

    changePasswordForm?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const session = getSession();
        const oldPassword = changeOldPassword.value;
        const newPassword = changeNewPassword.value;
        const confirmPassword = changeConfirmPassword.value;
        const changeOldPasswordError = document.getElementById('changeOldPasswordError');

        setFormFieldError(changeOldPassword, changeOldPasswordError, '');
        setFormFieldError(changeNewPassword, changeNewPasswordError, '');
        setFormFieldError(changeConfirmPassword, changeConfirmPasswordError, '');

        if (!session?.email) {
            if (changePasswordStatus) changePasswordStatus.innerHTML = statusError(tr('password.err.login'));
            return;
        }

        if (!oldPassword) {
            setFormFieldError(changeOldPassword, changeOldPasswordError, tr('password.err.old'));
            changeOldPassword.focus();
            return;
        }

        const pwdResult = validatePassword(newPassword, session.username || '', session.email || '');
        if (!pwdResult.valid) {
            setFormFieldError(changeNewPassword, changeNewPasswordError, pwdResult.message);
            changeNewPassword.focus();
            return;
        }

        if (newPassword !== confirmPassword) {
            setFormFieldError(changeConfirmPassword, changeConfirmPasswordError, tr('password.mismatch'));
            changeConfirmPassword.focus();
            return;
        }

        try {
            const response = await fetch('/api/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(buildAuthPayload({
                    email: session.email,
                    old_password: oldPassword,
                    new_password: newPassword,
                })),
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || tr('password.err.failed'));
            }

            if (changePasswordStatus) changePasswordStatus.innerHTML = statusOk(tr('password.changed'));
            changePasswordForm.reset();
            setTimeout(() => closeModal(changePasswordModal), 900);
        } catch (error) {
            if (changePasswordStatus) changePasswordStatus.innerHTML = statusApiError(error.message);
        }
    });

    function setResetPasswordEmail(email) {
        const emailInput = document.getElementById('resetPasswordEmail');
        const normalizedEmail = String(email || '').trim().toLowerCase();
        if (emailInput) emailInput.value = normalizedEmail;
        if (normalizedEmail) {
            sessionStorage.setItem('pendingResetEmail', normalizedEmail);
        } else {
            sessionStorage.removeItem('pendingResetEmail');
        }
    }

    function openResetPasswordModal(token = '') {
        const tokenInput = document.getElementById('resetPasswordToken');
        const status = document.getElementById('resetPasswordStatus');
        const newPasswordInput = document.getElementById('resetNewPassword');
        const normalizedToken = normalizeResetToken(token);

        closeModal(loginModal);
        closeModal(forgotPasswordModal);
        closeModal(registerModal);
        closeModal(profileModal);

        if (status) status.innerHTML = '';
        document.getElementById('resetPasswordForm')?.reset();
        if (tokenInput) tokenInput.value = normalizedToken;
        if (normalizedToken) sessionStorage.setItem('pendingResetToken', normalizedToken);
        setResetPasswordEmail(sessionStorage.getItem('pendingResetEmail') || '');
        openModal(resetPasswordModal);
        setTimeout(() => newPasswordInput?.focus(), 120);
    }

    function normalizeResetToken(raw) {
        let token = String(raw || '').trim();
        if (!token) return '';

        try {
            while (token.includes('%')) {
                const decoded = decodeURIComponent(token);
                if (decoded === token) break;
                token = decoded;
            }
        } catch {
            return '';
        }

        // Drop legacy long tokens from old emails; new links use short ?code= values.
        if (token.includes('.') && token.length > 40) {
            return '';
        }

        return token;
    }

    function getPasswordResetTokenFromQuery() {
        const params = new URLSearchParams(window.location.search);
        const raw = (
            params.get('code')
            || params.get('token')
            || params.get('reset_token')
            || ''
        );
        return normalizeResetToken(raw);
    }

    const RESET_LINK_EXPIRED_PAGE = '/400';

    function redirectToExpiredResetLink() {
        sessionStorage.removeItem('pendingResetToken');
        sessionStorage.removeItem('pendingResetEmail');
        window.location.replace(RESET_LINK_EXPIRED_PAGE);
    }

    async function verifyPasswordResetToken(token) {
        if (!token) return { valid: false, reason: 'missing', email: '', redirect: RESET_LINK_EXPIRED_PAGE };

        try {
            const response = await fetch('/api/reset-password/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: token, token }),
                cache: 'no-store',
            });
            const result = await response.json();
            if (response.ok && result.valid === true) {
                return {
                    valid: true,
                    reason: '',
                    email: String(result.email || '').trim().toLowerCase(),
                    redirect: '',
                };
            }
            return {
                valid: false,
                reason: result.error || 'invalid',
                email: '',
                redirect: result.redirect || RESET_LINK_EXPIRED_PAGE,
            };
        } catch {
            return { valid: false, reason: 'network', email: '', redirect: RESET_LINK_EXPIRED_PAGE };
        }
    }

    async function loadResetPasswordContext(token) {
        const verification = await verifyPasswordResetToken(token);
        if (!verification.valid) {
            redirectToExpiredResetLink();
            return verification;
        }
        if (verification.email) {
            setResetPasswordEmail(verification.email);
        }
        return verification;
    }

    document.getElementById('openForgotPasswordBtn')?.addEventListener('click', () => {
        const loginEmail = document.getElementById('loginEmail');
        const forgotEmail = document.getElementById('forgotPasswordEmail');
        const forgotStatus = document.getElementById('forgotPasswordStatus');
        if (forgotEmail && loginEmail?.value) forgotEmail.value = loginEmail.value.trim();
        if (forgotStatus) forgotStatus.innerHTML = '';
        setFormFieldError(forgotEmail, document.getElementById('forgotPasswordEmailError'), '');
        closeModal(loginModal);
        openModal(forgotPasswordModal);
    });

    document.getElementById('backToLoginFromForgotBtn')?.addEventListener('click', () => {
        closeModal(forgotPasswordModal);
        openModal(loginModal);
    });

    document.getElementById('forgotPasswordForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const emailInput = document.getElementById('forgotPasswordEmail');
        const emailError = document.getElementById('forgotPasswordEmailError');
        const status = document.getElementById('forgotPasswordStatus');
        const email = emailInput?.value.trim() || '';

        setFormFieldError(emailInput, emailError, '');
        if (status) status.innerHTML = '';

        if (!email || !validateEmail(email)) {
            setFormFieldError(emailInput, emailError, tr('form.err.email'));
            emailInput?.focus();
            return;
        }

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const result = await response.json();
            if (!response.ok) {
                const details = result.details ? ` ${result.details}` : '';
                throw new Error(trApi(result.error || tr('forgot.err')) + details);
            }
            if (status) status.innerHTML = statusOk(tr('forgot.success'));
        } catch (error) {
            if (status) status.innerHTML = statusApiError(error.message);
        }
    });

    document.getElementById('resetPasswordForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const token = normalizeResetToken(
            document.getElementById('resetPasswordToken')?.value
            || sessionStorage.getItem('pendingResetToken')
            || ''
        );
        const resetEmailInput = document.getElementById('resetPasswordEmail');
        const resetEmail = String(resetEmailInput?.value || sessionStorage.getItem('pendingResetEmail') || '').trim().toLowerCase();
        const newPasswordInput = document.getElementById('resetNewPassword');
        const confirmPasswordInput = document.getElementById('resetConfirmPassword');
        const newPasswordError = document.getElementById('resetNewPasswordError');
        const confirmPasswordError = document.getElementById('resetConfirmPasswordError');
        const status = document.getElementById('resetPasswordStatus');
        const newPassword = newPasswordInput?.value || '';
        const confirmPassword = confirmPasswordInput?.value || '';

        setFormFieldError(newPasswordInput, newPasswordError, '');
        setFormFieldError(confirmPasswordInput, confirmPasswordError, '');
        if (status) status.innerHTML = '';

        if (!token) {
            if (status) status.innerHTML = statusError(tr('reset.err.token'));
            return;
        }

        if (!resetEmail || !validateEmail(resetEmail)) {
            if (status) status.innerHTML = statusError(tr('reset.err.email'));
            return;
        }

        const pwdResult = validatePassword(newPassword, '', resetEmail);
        if (!pwdResult.valid) {
            setFormFieldError(newPasswordInput, newPasswordError, pwdResult.message);
            newPasswordInput?.focus();
            return;
        }

        if (newPassword !== confirmPassword) {
            setFormFieldError(confirmPasswordInput, confirmPasswordError, tr('password.mismatch'));
            confirmPasswordInput?.focus();
            return;
        }

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    code: token,
                    email: resetEmail,
                    new_password: newPassword,
                    confirm_password: confirmPassword,
                }),
            });
            const result = await response.json();
            if (!response.ok) {
                if (result.redirect === RESET_LINK_EXPIRED_PAGE || result.error === 'Ссылка просрочена') {
                    redirectToExpiredResetLink();
                    return;
                }
                const details = result.details ? ` ${result.details}` : '';
                throw new Error(trApi(result.error || tr('reset.err')) + details);
            }
            if (status) status.innerHTML = statusOk(result.message || tr('reset.success'));
            showToast({
                title: tr('reset.success.title'),
                message: tr('reset.success.msg'),
                type: 'success',
            });
            localStorage.removeItem(SESSION_KEY);
            clearAdminRole();
            sessionStorage.removeItem('pendingResetToken');
            sessionStorage.removeItem('pendingResetEmail');
            setTimeout(() => {
                closeModal(resetPasswordModal);
                openModal(loginModal);
            }, 1200);
        } catch (error) {
            if (status) status.innerHTML = statusApiError(error.message);
        }
    });

    (async function initPasswordResetFromUrl() {
        const token = getPasswordResetTokenFromQuery();
        if (!token) return;

        const verification = await verifyPasswordResetToken(token);
        if (!verification.valid) {
            redirectToExpiredResetLink();
            return;
        }

        sessionStorage.setItem('pendingResetToken', token);
        openResetPasswordModal(token);
        await loadResetPasswordContext(token);

        const cleanUrl = `${window.location.pathname}${window.location.hash || ''}`;
        window.history.replaceState({}, document.title, cleanUrl);
    })();

    document.getElementById('resetNewPassword')?.addEventListener('input', () => {
        const input = document.getElementById('resetNewPassword');
        const error = document.getElementById('resetNewPasswordError');
        if (!input || !error) return;
        const result = validatePassword(input.value);
        setFormFieldError(input, error, result.valid ? '' : result.message);
    });

    document.getElementById('resetConfirmPassword')?.addEventListener('input', () => {
        const passwordInput = document.getElementById('resetNewPassword');
        const confirmInput = document.getElementById('resetConfirmPassword');
        const confirmError = document.getElementById('resetConfirmPasswordError');
        if (!confirmInput || !confirmError) return;
        const password = passwordInput?.value || '';
        const confirm = confirmInput.value || '';
        if (!confirm) {
            setFormFieldError(confirmInput, confirmError, '');
            return;
        }
        setFormFieldError(
            confirmInput,
            confirmError,
            password === confirm ? '' : tr('password.mismatch'),
        );
    });
    
    // Регистрация с валидацией
    const regForm = document.getElementById('registerForm');
    const fioInput = document.getElementById('regFullName');
    const fioError = document.getElementById('regFullNameError');

    const usernameInput = document.getElementById('regUsername');
    const usernameError = document.getElementById('regUsernameError');

    // === Username: жёстко запрещаем пробелы ===
    usernameInput.addEventListener('keydown', function(e) {
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
        }
    });

    usernameInput.addEventListener('input', function() {
        setFormFieldError(usernameInput, usernameError, '');
    });

    const emailInput = document.getElementById('regEmail');
    const emailError = document.getElementById('regEmailError');

    const passwordInput = document.getElementById('regPassword');
    const passwordError = document.getElementById('regPasswordError');

    const confirmInput = document.getElementById('regConfirmPassword');
    const confirmError = document.getElementById('regConfirmPasswordError');
    const agreeInput = document.getElementById('regAgree');
    const registerSubmitBtn = document.getElementById('registerSubmitBtn');

    function updateRegisterButtonState() {
        if (registerSubmitBtn && agreeInput) {
            registerSubmitBtn.disabled = !agreeInput.checked;
        }
    }

    function resetRegisterForm() {
        if (regForm) regForm.reset();
        if (agreeInput) agreeInput.checked = false;
        setFormFieldError(fioInput, fioError, '');
        setFormFieldError(emailInput, emailError, '');
        setFormFieldError(usernameInput, usernameError, '');
        setFormFieldError(passwordInput, passwordError, '');
        setFormFieldError(confirmInput, confirmError, '');
        const status = document.getElementById('regStatus');
        if (status) status.innerHTML = '';
        registerModal?.querySelectorAll('.toggle-password').forEach((icon) => {
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
            icon.setAttribute('aria-label', tr('aria.showPassword'));
        });
        updateRegisterButtonState();
    }

    openLoginBtn?.addEventListener('click', () => {
        closeMobileNav();
        openModal(loginModal);
    });
    openRegisterBtn?.addEventListener('click', () => {
        closeMobileNav();
        openModal(registerModal);
        // Сброс ошибок ФИО, Email и Username при открытии модалки
        setFormFieldError(fioInput, fioError, '');
        setFormFieldError(emailInput, emailError, '');
        setFormFieldError(usernameInput, usernameError, '');
        setFormFieldError(passwordInput, passwordError, '');
        setFormFieldError(confirmInput, confirmError, '');
        const s = document.getElementById('regStatus');
        if (s) s.innerHTML = '';
        updateRegisterButtonState();
    });

    agreeInput?.addEventListener('change', updateRegisterButtonState);
    updateRegisterButtonState();

    // Жёстко запрещаем пробелы в email (и при вводе, и при нажатии клавиши)
    emailInput.addEventListener('keydown', function(e) {
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
        }
    });

    emailInput.addEventListener('input', function() {
        setFormFieldError(emailInput, emailError, '');
    });

    // === Жёстко запрещаем пробелы в пароле и подтверждении пароля ===
    // Password field - prevent space completely
    passwordInput.addEventListener('keydown', function(e) {
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
        }
    });

    // Confirm password field - prevent space completely
    confirmInput.addEventListener('keydown', function(e) {
        if (e.key === ' ' || e.key === 'Spacebar') {
            e.preventDefault();
        }
    });

    // === Toggle password visibility (eye icon) ===
    document.querySelectorAll('.toggle-password').forEach(icon => {
        icon.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            if (!input) return;

            if (input.type === 'password') {
                input.type = 'text';
                this.classList.remove('fa-eye');
                this.classList.add('fa-eye-slash');
                this.setAttribute('aria-label', tr('aria.hidePassword'));
            } else {
                input.type = 'password';
                this.classList.remove('fa-eye-slash');
                this.classList.add('fa-eye');
                this.setAttribute('aria-label', tr('aria.showPassword'));
            }
        });
    });

    // Карта популярных доменов и разрешённых для них TLD
    // Пример: gmail только .com, mail только .ru
    const popularDomainTLDs = {
        'gmail': ['com'],
        'mail': ['ru'],
        'bk': ['ru'],
        'list': ['ru'],
        'inbox': ['ru'],
        'yandex': ['ru', 'com'],
        'ya': ['ru'],
        'rambler': ['ru'],
        'hotmail': ['com'],
        'outlook': ['com'],
        'live': ['com'],
        'yahoo': ['com'],
        'icloud': ['com'],
        'protonmail': ['com'],
        'proton': ['me']
    };

    // Функция строгой валидации ФИО по правилам
    function validateFIO(rawValue) {
        if (!rawValue) return false;

        const value = rawValue; // не trim'им сразу, чтобы проверить ведущие/хвостовые пробелы
        const trimmed = value.trim();

        // 1. Не пустое (после trim)
        if (trimmed.length === 0) return false;

        // 5. Не начинается и не заканчивается пробелом
        if (value !== trimmed) return false;

        // 2. Минимальная длина + минимум 2 пробела (3 слова)
        if (trimmed.length < 10) return false;
        if ((trimmed.match(/\s/g) || []).length < 2) return false;

        // 4. Нет двух пробелов подряд
        if (/\s{2,}/.test(trimmed)) return false;

        // 3. Только русские буквы, пробелы и дефис
        if (!/^[а-яА-ЯёЁ\s-]+$/.test(trimmed)) return false;

        // 7. Не начинается с дефиса
        if (trimmed.startsWith('-')) return false;

        // Разбиваем на части (ровно 3 слова)
        const parts = trimmed.split(/\s+/);
        if (parts.length !== 3) return false;

        // 8. Каждая часть минимум 3 символа
        for (let part of parts) {
            if (part.length < 3) return false;
            // Не начинается и не заканчивается дефисом внутри части
            if (part.startsWith('-') || part.endsWith('-')) return false;
            // Не больше одного дефиса в части
            if ((part.match(/-/g) || []).length > 1) return false;
        }

        // 9. Первая буква каждой части заглавная (можно авто-исправлять, здесь проверяем)
        // Чтобы было удобно, разрешаем и авто-исправляем при успехе ниже.
        // Для строгости можно раскомментировать:
        // for (let part of parts) {
        //     const first = part[0];
        //     if (first !== first.toUpperCase()) return false;
        // }

        return true;
    }

    // Валидация Имени пользователя:
    // - Без пробелов
    // - От 5 до 10 символов
    // - Только русские и английские буквы + дефис
    function validateUsername(raw) {
        if (!raw) return false;

        const value = raw.trim();

        // 1. Нельзя пробелы вообще
        if (value !== raw || /\s/.test(value)) return false;

        const len = value.length;
        if (len < 5 || len > 10) return false;

        // Разрешены: русские + английские буквы + дефис
        if (!/^[a-zA-Zа-яА-ЯёЁ-]+$/.test(value)) return false;

        return true;
    }

    // === Полная валидация пароля по всем правилам ===
    function validatePassword(pwd, username = '', email = '') {
        if (!pwd) {
            return { valid: false, message: tr('pwd.required') };
        }

        if (/\s/.test(pwd)) {
            return { valid: false, message: tr('pwd.noSpaces') };
        }

        const len = pwd.length;

        if (len < 8) {
            return { valid: false, message: tr('pwd.min') };
        }

        if (len > 20) {
            return { valid: false, message: tr('pwd.max') };
        }

        if (!/[A-Z]/.test(pwd)) {
            return { valid: false, message: tr('pwd.upper') };
        }

        if (!/[a-z]/.test(pwd)) {
            return { valid: false, message: tr('pwd.lower') };
        }

        if (!/[0-9]/.test(pwd)) {
            return { valid: false, message: tr('pwd.digit') };
        }

        const specialChars = /[!@#$%^&*()\-_=+\[\]{};:\,\.?\/`~]/;
        if (!specialChars.test(pwd)) {
            return { valid: false, message: tr('pwd.special') };
        }

        if (/(.)\1{2,}/.test(pwd)) {
            return { valid: false, message: tr('pwd.repeat') };
        }

        if (username && pwd.toLowerCase() === username.toLowerCase()) {
            return { valid: false, message: tr('pwd.sameUsername') };
        }

        if (email) {
            const emailLower = email.toLowerCase();
            const localPart = emailLower.split('@')[0] || '';
            const pwdLower = pwd.toLowerCase();

            if (pwdLower === emailLower || pwdLower === localPart || localPart.includes(pwdLower) || pwdLower.includes(localPart)) {
                return { valid: false, message: tr('pwd.sameEmail') };
            }
        }

        return { valid: true, message: '' };
    }

    // Строгая валидация Email по всем указанным правилам + проверка популярных доменов
    function validateEmail(raw) {
        if (!raw) return false;

        const value = raw.trim();

        // Нет пробелов вообще (и ведущих/хвостовых тоже)
        if (value !== raw || /\s/.test(value)) return false;

        // Ровно один символ @
        const atCount = (value.match(/@/g) || []).length;
        if (atCount !== 1) return false;

        const atIndex = value.indexOf('@');
        const local = value.substring(0, atIndex);
        const domain = value.substring(atIndex + 1);

        if (!local || !domain) return false;

        // 2. До @ хотя бы 7 символов
        if (local.length < 7) return false;

        // 11. Нет точек в начале или конце локальной части
        if (local.startsWith('.') || local.endsWith('.')) return false;

        // 10. Разрешённые символы в локальной части (буквы, цифры, . - _ +)
        // Запрещены спецсимволы * & ^ % # $ ! = ? и т.д.
        if (!/^[a-zA-Z0-9.\-_+]+$/.test(local)) return false;

        // 3. После @ есть хотя бы один символ
        if (domain.length < 1) return false;

        // 4. После @ есть точка
        if (!domain.includes('.')) return false;

        // 5. Точка не сразу после @
        if (domain.startsWith('.')) return false;

        // 8. Нет двух точек подряд (везде)
        if (/\.\./.test(value)) return false;

        const lowerDomain = domain.toLowerCase();

        // Дополнительно: после последней точки в домене минимум 2 символа
        const lastDot = lowerDomain.lastIndexOf('.');
        if (lastDot === -1 || lowerDomain.length - lastDot - 1 < 2) return false;

        // === Проверка популярных доменов с правильными TLD ===
        // Берём base (например "gmail" из "gmail.com")
        const base = lowerDomain.substring(0, lastDot);
        const tld = lowerDomain.substring(lastDot + 1); // без точки, например "com"

        if (popularDomainTLDs.hasOwnProperty(base)) {
            // Для известного домена — строго проверяем разрешённые окончания
            const allowedForDomain = popularDomainTLDs[base];
            if (!allowedForDomain.includes(tld)) {
                return false;
            }
        } else {
            // Для всех остальных — общий список разрешённых TLD
            const allowedGeneralTLD = ['ru', 'com', 'net', 'org', 'kz', 'info'];
            if (!allowedGeneralTLD.includes(tld)) {
                return false;
            }
        }

        return true;
    }

    fioInput.addEventListener('input', () => {
        setFormFieldError(fioInput, fioError, '');
    });

    // Показываем ошибку сразу при уходе с поля (blur), если невалидно
    fioInput.addEventListener('blur', () => {
        const val = fioInput.value;
        if (val.trim() !== '' && !validateFIO(val)) {
            setFormFieldError(fioInput, fioError, tr('form.err.fio'));
        }
    });

    // Email: проверка при уходе с поля (blur) — оставляем только для показа ошибки
    // (реальное удаление пробелов и очистка ошибок уже выше)
    emailInput.addEventListener('blur', () => {
        const val = emailInput.value;
        if (val.trim() !== '' && !validateEmail(val)) {
            setFormFieldError(emailInput, emailError, tr('form.err.email'));
        }
    });

    // Username: показ ошибки при уходе с поля
    usernameInput.addEventListener('blur', () => {
        const val = usernameInput.value;
        if (val.trim() !== '' && !validateUsername(val)) {
            setFormFieldError(usernameInput, usernameError, tr('reg.err.username'));
        }
    });

    // === Password live checks ===
    // Очистка ошибки при вводе в пароль
    passwordInput.addEventListener('input', () => {
        setFormFieldError(passwordInput, passwordError, '');

        // Если confirm уже заполнен — обновляем его статус совпадения
        if (confirmInput.value) {
            if (confirmInput.value === passwordInput.value) {
                setFormFieldError(confirmInput, confirmError, '');
            } else {
                setFormFieldError(confirmInput, confirmError, tr('password.mismatch'));
            }
        }
    });

    // Показываем проблемы пароля при уходе с поля (включая отсутствие спецзнака)
    passwordInput.addEventListener('blur', () => {
        const val = passwordInput.value;
        if (val) {
            const result = validatePassword(val, usernameInput.value, emailInput.value);
            if (!result.valid) {
                setFormFieldError(passwordInput, passwordError, result.message);
            }
        }
    });

    // === Confirm password live mismatch ===
    confirmInput.addEventListener('input', () => {
        setFormFieldError(confirmInput, confirmError, '');

        if (passwordInput.value && confirmInput.value !== passwordInput.value) {
            setFormFieldError(confirmInput, confirmError, tr('password.mismatch'));
        }
    });

    confirmInput.addEventListener('blur', () => {
        if (passwordInput.value && confirmInput.value && confirmInput.value !== passwordInput.value) {
            setFormFieldError(confirmInput, confirmError, tr('password.mismatch'));
        }
    });

    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const fullNameRaw = fioInput.value;
        const statusDiv = document.getElementById('regStatus');

        // Сброс предыдущих ошибок
        setFormFieldError(fioInput, fioError, '');
        setFormFieldError(emailInput, emailError, '');
        setFormFieldError(usernameInput, usernameError, '');
        setFormFieldError(passwordInput, passwordError, '');
        setFormFieldError(confirmInput, confirmError, '');
        statusDiv.innerHTML = '';

        // === Валидация ФИО (строгая) ===
        // Пустое поле тоже считается "Некорректное ФИО"
        if (!validateFIO(fullNameRaw)) {
            if (fioError) {
                setFormFieldError(fioInput, fioError, tr('form.err.fio'));
            } else {
                statusDiv.innerHTML = statusError(tr('form.err.fio'));
            }
            fioInput.focus();
            return;
        }

        // === Валидация Email (строгая по всем правилам) ===
        // Пустое или невалидное — показываем ошибку именно под полем Email
        const emailRaw = emailInput.value;
        if (!validateEmail(emailRaw)) {
            if (emailError) {
                setFormFieldError(emailInput, emailError, tr('form.err.email'));
            } else {
                statusDiv.innerHTML = statusError(tr('form.err.email'));
            }
            emailInput.focus();
            return;
        }

        // === Валидация Имени пользователя ===
        const usernameRaw = usernameInput.value;
        if (!validateUsername(usernameRaw)) {
            if (usernameError) {
                setFormFieldError(usernameInput, usernameError, tr('reg.err.username'));
            } else {
                statusDiv.innerHTML = statusError(tr('reg.err.username'));
            }
            usernameInput.focus();
            return;
        }

        // === Полная валидация пароля ===
        const password = passwordInput.value;
        const confirm = confirmInput.value;
        const agree = document.getElementById('regAgree').checked;

        const pwdResult = validatePassword(password, usernameRaw, emailRaw);
        if (!pwdResult.valid) {
            if (passwordError) {
                setFormFieldError(passwordInput, passwordError, pwdResult.message);
            } else {
                statusDiv.innerHTML = statusError(pwdResult.message);
            }
            passwordInput.focus();
            return;
        }

        // Проверка совпадения паролей (поле подтверждения)
        if (!confirm) {
            setFormFieldError(confirmInput, confirmError, tr('password.confirmRequired'));
            confirmInput.focus();
            return;
        }
        if (password !== confirm) {
            setFormFieldError(confirmInput, confirmError, tr('password.mismatch'));
            confirmInput.focus();
            return;
        }

        if (!agree) {
            statusDiv.innerHTML = statusError(tr('reg.err.policy'));
            return;
        }

        statusDiv.innerHTML = statusInfo(tr('reg.loading'));
        if (registerSubmitBtn) registerSubmitBtn.disabled = true;

        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: fullNameRaw.trim(),
                    username: usernameRaw.trim(),
                    email: emailRaw.trim(),
                    password,
                    agree,
                }),
            });

            const result = await response.json();
            if (!response.ok) {
                const message = trApi(result.error) || tr('reg.err.failed');
                const field = result.field;

                if (field === 'email') {
                    setFormFieldError(emailInput, emailError, message);
                    emailInput.focus();
                } else if (field === 'username') {
                    setFormFieldError(usernameInput, usernameError, message);
                    usernameInput.focus();
                } else if (field === 'full_name') {
                    setFormFieldError(fioInput, fioError, message);
                    fioInput.focus();
                } else {
                    const details = result.details ? ` ${result.details}` : '';
                    statusDiv.innerHTML = statusError(message + details);
                }
                return;
            }

            rememberPendingRegistrationEmail(result.email || emailRaw.trim().toLowerCase());
            closeModal(registerModal);
            resetRegisterForm();
            showToast({
                title: tr('reg.success.title'),
                message: tr('reg.success.pending'),
                type: 'success',
            });
            openEmailVerificationModal(
                result.email || emailRaw.trim().toLowerCase(),
                result.email_delivery_warning || '',
                true,
            );
        } catch (error) {
            statusDiv.innerHTML = statusApiError(error.message);
        } finally {
            if (registerSubmitBtn) registerSubmitBtn.disabled = !agreeInput?.checked;
        }
    });

    document.getElementById('emailVerifyCode')?.addEventListener('input', (event) => {
        const input = event.target;
        input.value = String(input.value || '').replace(/\D/g, '').slice(0, 6);
        setFormFieldError(input, document.getElementById('emailVerifyCodeError'), '');
    });

    document.getElementById('emailVerifyForm')?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const codeInput = document.getElementById('emailVerifyCode');
        const codeError = document.getElementById('emailVerifyCodeError');
        const status = document.getElementById('emailVerifyStatus');
        const submitBtn = document.getElementById('emailVerifySubmitBtn');
        const code = String(codeInput?.value || '').trim();

        setFormFieldError(codeInput, codeError, '');
        if (status) status.innerHTML = '';

        if (!/^\d{6}$/.test(code)) {
            setFormFieldError(codeInput, codeError, tr('verify.err.code'));
            codeInput?.focus();
            return;
        }

        if (submitBtn) submitBtn.disabled = true;
        try {
            const pendingEmail = getVerificationEmail();
            const useRegistrationFlow = shouldUseRegistrationVerification() && pendingEmail;
            let response;
            let result;

            if (useRegistrationFlow) {
                rememberPendingRegistrationEmail(pendingEmail);
                response = await fetch('/api/register/confirm', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: pendingEmail, code }),
                });
                result = await response.json();
                if (!response.ok) {
                    throw new Error(trApi(result.error || tr('verify.err')));
                }
                if (status) status.innerHTML = statusOk(result.message || tr('verify.success.status'));
                finalizeRegistrationAfterVerification(result);
                return;
            }

            response = await fetch('/api/verify-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getProjectRequestHeaders(),
                },
                body: JSON.stringify(buildAuthPayload({ code })),
            });
            result = await response.json();
            if (!response.ok) {
                throw new Error(trApi(result.error || tr('verify.err')));
            }
            if (status) status.innerHTML = statusOk(result.message || tr('verify.success.status'));
            finalizeEmailVerification();
        } catch (error) {
            if (status) status.innerHTML = statusApiError(error.message);
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

    document.getElementById('resendEmailVerifyBtn')?.addEventListener('click', async () => {
        const status = document.getElementById('emailVerifyStatus');
        const resendBtn = document.getElementById('resendEmailVerifyBtn');
        const pendingEmail = getVerificationEmail();
        const useRegistrationFlow = shouldUseRegistrationVerification() && pendingEmail;
        if (resendBtn) resendBtn.disabled = true;
        try {
            const response = useRegistrationFlow
                ? await fetch('/api/register/resend', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: pendingEmail }),
                })
                : await fetch('/api/verify-email/resend', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...getProjectRequestHeaders(),
                    },
                    body: JSON.stringify(buildAuthPayload()),
                });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(trApi(result.error || tr('verify.resend.err')) + (result.details ? ` ${result.details}` : ''));
            }
            if (status) status.innerHTML = statusOk(result.message || tr('verify.resend.success'));
        } catch (error) {
            if (status) status.innerHTML = statusApiError(error.message);
        } finally {
            if (resendBtn) resendBtn.disabled = false;
        }
    });

    // Политика (демо-уведомление)
    document.getElementById('policyLink').addEventListener('click', (e) => {
        e.preventDefault();
        showToast({
            title: tr('policy.title'),
            message: tr('policy.msg'),
            type: 'info',
            duration: 6200,
        });
    });

    document.getElementById('footerPolicyLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        showToast({
            title: tr('policy.title'),
            message: tr('policy.msg'),
            type: 'info',
            duration: 6200,
        });
    });
    
    // Контактная форма «Старт вашего проекта»
    const contactForm = document.getElementById('contactForm');
    const feedbackDiv = document.getElementById('formFeedback');
    const projectFullNameInput = document.getElementById('projectFullName');
    const projectCompanyInput = document.getElementById('projectCompany');
    const projectEmailInput = document.getElementById('projectEmail');
    const projectPhoneInput = document.getElementById('projectPhone');
    const projectPositionInput = document.getElementById('projectPosition');
    const projectBudgetAmountInput = document.getElementById('projectBudgetAmount');
    const projectBudgetCurrencyInput = document.getElementById('projectBudgetCurrency');
    const projectMessageInput = document.getElementById('projectMessage');
    const projectFullNameError = document.getElementById('projectFullNameError');
    const projectCompanyError = document.getElementById('projectCompanyError');
    const projectEmailError = document.getElementById('projectEmailError');
    const projectPhoneError = document.getElementById('projectPhoneError');
    const projectPositionError = document.getElementById('projectPositionError');
    const projectBudgetError = document.getElementById('projectBudgetError');
    const projectMessageError = document.getElementById('projectMessageError');
    const projectMessageCounter = document.getElementById('projectMessageCounter');
    const projectCaptchaModal = document.getElementById('projectCaptchaModal');
    const projectCaptchaQuestion = document.getElementById('projectCaptchaQuestion');
    const projectCaptchaAnswer = document.getElementById('projectCaptchaAnswer');
    const projectCaptchaRefresh = document.getElementById('projectCaptchaRefresh');
    const projectCaptchaConfirm = document.getElementById('projectCaptchaConfirm');
    const projectCaptchaClose = document.getElementById('projectCaptchaClose');
    const projectCaptchaError = document.getElementById('projectCaptchaError');
    const projectCaptchaModalStatus = document.getElementById('projectCaptchaModalStatus');
    const PROJECT_MESSAGE_MIN = 100;
    const PROJECT_MESSAGE_MAX = 10000;
    const PROJECT_CAPTCHA_BLOCK_KEY = 'projectCaptchaBlockedUntil';

    function getProjectSubmitBtnHtml() {
        return `<i class="fas fa-paper-plane"></i> ${tr('form.submit')}`;
    }

    const projectSubmitBtn = document.getElementById('projectSubmitBtn');
    let projectCaptchaId = '';
    let projectCaptchaLoading = false;
    let projectRequestSending = false;
    let projectCaptchaBlockTimer = null;

    function setProjectFieldError(input, errorEl, message) {
        setFormFieldError(input, errorEl, message);
    }

    function validateProjectPhone(raw) {
        const value = String(raw || '').trim();
        if (!/^\d{11}$/.test(value)) return false;
        return /^[78][3-9]\d{9}$/.test(value);
    }

    function normalizeProjectPhoneInput() {
        if (!projectPhoneInput) return;
        projectPhoneInput.value = projectPhoneInput.value.replace(/\D/g, '').slice(0, 11);
    }

    function validateProjectCompany(raw) {
        const value = String(raw || '').trim();
        if (!value) return true;
        return value.length >= 2 && value.length <= 120 && !containsInjectionLikeText(value);
    }

    function validateProjectMessage(raw) {
        const value = String(raw || '').trim();
        if (value.length < PROJECT_MESSAGE_MIN || value.length > PROJECT_MESSAGE_MAX) return false;
        return !containsInjectionLikeText(value);
    }

    function updateProjectMessageCounter() {
        const length = projectMessageInput?.value.length || 0;
        if (!projectMessageCounter) return;
        projectMessageCounter.textContent = tr('form.counter', {
            min: PROJECT_MESSAGE_MIN,
            current: length,
            max: PROJECT_MESSAGE_MAX,
        });
        projectMessageCounter.style.color = length >= PROJECT_MESSAGE_MIN ? '#9AA4C8' : '#FF9E9E';
    }

    function containsInjectionLikeText(value) {
        return /(;|--|\/\*|\*\/|(\b)(union|select|insert|update|delete|drop)(\b))/i.test(value);
    }

    function validateBudgetAmount(raw) {
        const value = String(raw || '').trim();
        if (!/^\d+$/.test(value)) return false;
        const amount = Number(value);
        return amount > 0 && value.length <= 12;
    }

    function validateBudgetCurrency(raw) {
        return ['RUB', 'USD', 'KZT'].includes(String(raw || '').trim().toUpperCase());
    }

    function resetProjectFormErrors() {
        setProjectFieldError(projectFullNameInput, projectFullNameError, '');
        setProjectFieldError(projectCompanyInput, projectCompanyError, '');
        setProjectFieldError(projectEmailInput, projectEmailError, '');
        setProjectFieldError(projectPhoneInput, projectPhoneError, '');
        setProjectFieldError(projectPositionInput, projectPositionError, '');
        setProjectFieldError(projectBudgetAmountInput, projectBudgetError, '');
        setProjectFieldError(projectMessageInput, projectMessageError, '');
        setProjectFieldError(projectCaptchaAnswer, projectCaptchaError, '');
    }

    function getProjectCaptchaBlockStorageKey() {
        const email = getSession()?.email || '';
        return email ? `${PROJECT_CAPTCHA_BLOCK_KEY}:${email}` : PROJECT_CAPTCHA_BLOCK_KEY;
    }

    function getProjectRequestHeaders(includeJson = false) {
        const headers = {};
        if (includeJson) headers['Content-Type'] = 'application/json';
        const session = getSession();
        if (session?.sessionToken) {
            headers.Authorization = `Bearer ${session.sessionToken}`;
        }
        return headers;
    }

    function isProjectUserLoggedIn() {
        const session = getSession();
        return Boolean(session?.sessionToken && session?.email);
    }

    function requireProjectAuth() {
        if (isProjectUserLoggedIn()) return true;
        showToast({
            title: tr('auth.required.title'),
            message: tr('auth.required.msg'),
            type: 'warning',
            duration: 7000,
        });
        return false;
    }

    function handleProjectAuthRequired() {
        closeProjectCaptchaModal();
        requireProjectAuth();
    }

    function fillProjectFormFromSession() {
        const session = getSession();
        if (!isProjectUserLoggedIn()) return;

        if (projectEmailInput && session.email) {
            projectEmailInput.value = session.email;
        }
        if (projectFullNameInput && session.fullName) {
            projectFullNameInput.value = session.fullName;
        }
    }

    function syncProjectSubmitButtonState() {
        if (!projectSubmitBtn) return;

        if (!isProjectUserLoggedIn()) {
            if (projectCaptchaBlockTimer) {
                clearInterval(projectCaptchaBlockTimer);
                projectCaptchaBlockTimer = null;
            }
            projectSubmitBtn.disabled = false;
            projectSubmitBtn.innerHTML = getProjectSubmitBtnHtml();
            return;
        }

        syncProjectCaptchaBlockUI();
    }

    function getProjectCaptchaBlockedUntil() {
        const value = Number(localStorage.getItem(getProjectCaptchaBlockStorageKey()) || 0);
        return value > Date.now() ? value : 0;
    }

    function isProjectCaptchaBlocked() {
        return getProjectCaptchaBlockedUntil() > Date.now();
    }

    function setProjectCaptchaBlocked(retryAfterSeconds) {
        const until = Date.now() + Number(retryAfterSeconds || 600) * 1000;
        localStorage.setItem(getProjectCaptchaBlockStorageKey(), String(until));
        syncProjectCaptchaBlockUI();
    }

    function syncProjectCaptchaBlockUI() {
        if (projectCaptchaBlockTimer) {
            clearInterval(projectCaptchaBlockTimer);
            projectCaptchaBlockTimer = null;
        }

        if (!projectSubmitBtn) return;

        const blockedUntil = getProjectCaptchaBlockedUntil();
        const remaining = blockedUntil - Date.now();

        if (remaining <= 0) {
            localStorage.removeItem(getProjectCaptchaBlockStorageKey());
            projectSubmitBtn.disabled = false;
            projectSubmitBtn.innerHTML = getProjectSubmitBtnHtml();
            return;
        }

        projectSubmitBtn.disabled = true;

        const updateLabel = () => {
            const left = blockedUntil - Date.now();
            if (left <= 0) {
                syncProjectCaptchaBlockUI();
                return;
            }

            const minutes = Math.floor(left / 60000);
            const seconds = Math.ceil((left % 60000) / 1000);
            projectSubmitBtn.innerHTML = minutes > 0
                ? `<i class="fas fa-clock"></i> ${tr('captcha.wait.min', { min: minutes })}`
                : `<i class="fas fa-clock"></i> ${tr('captcha.wait.sec', { sec: seconds })}`;
        };

        updateLabel();
        projectCaptchaBlockTimer = setInterval(updateLabel, 1000);
    }

    function notifyProjectCaptchaBlocked() {
        showToast({
            title: tr('captcha.security.title'),
            message: tr('captcha.block.msg'),
            type: 'warning',
            duration: 8000,
        });
    }

    function handleProjectCaptchaBlocked(result) {
        const retryAfter = Number(result?.retry_after || 600);
        closeProjectCaptchaModal();
        setProjectCaptchaBlocked(retryAfter);
        notifyProjectCaptchaBlocked();
    }

    function setProjectCaptchaModalStatus(message, type = '') {
        if (!projectCaptchaModalStatus) return;
        if (!message) {
            projectCaptchaModalStatus.style.display = 'none';
            projectCaptchaModalStatus.textContent = '';
            projectCaptchaModalStatus.className = 'form-status';
            return;
        }
        projectCaptchaModalStatus.style.display = 'block';
        projectCaptchaModalStatus.textContent = message;
        projectCaptchaModalStatus.className = type ? `form-status ${type}` : 'form-status';
    }

    function closeProjectCaptchaModal() {
        closeModal(projectCaptchaModal);
        setProjectFieldError(projectCaptchaAnswer, projectCaptchaError, '');
        setProjectCaptchaModalStatus('');
        if (projectCaptchaAnswer) projectCaptchaAnswer.value = '';
        projectCaptchaId = '';
    }

    async function loadProjectCaptcha() {
        if (!projectCaptchaQuestion) return false;

        projectCaptchaLoading = true;
        if (projectCaptchaConfirm) projectCaptchaConfirm.disabled = true;
        if (projectCaptchaRefresh) projectCaptchaRefresh.disabled = true;

        try {
            projectCaptchaQuestion.textContent = tr('captcha.loading');
            const response = await fetch('/api/captcha', {
                cache: 'no-store',
                headers: getProjectRequestHeaders(),
            });
            const result = await response.json();
            if (response.status === 401) {
                handleProjectAuthRequired();
                return false;
            }
            if (response.status === 429 && result.captcha_blocked) {
                handleProjectCaptchaBlocked(result);
                return false;
            }
            if (!response.ok) {
                throw new Error(result.error || tr('form.err.captcha.load'));
            }

            projectCaptchaId = result.captcha_id || '';
            projectCaptchaQuestion.textContent = result.question || '';
            if (projectCaptchaAnswer) {
                projectCaptchaAnswer.value = '';
                projectCaptchaAnswer.focus();
            }
            setProjectFieldError(projectCaptchaAnswer, projectCaptchaError, '');
            setProjectCaptchaModalStatus('');
            return true;
        } catch (error) {
            projectCaptchaId = '';
            projectCaptchaQuestion.textContent = tr('form.err.captcha.load');
            setProjectFieldError(projectCaptchaAnswer, projectCaptchaError, trApi(error.message) || tr('form.err.load'));
            return false;
        } finally {
            projectCaptchaLoading = false;
            if (projectCaptchaRefresh) projectCaptchaRefresh.disabled = false;
            if (projectCaptchaConfirm) projectCaptchaConfirm.disabled = projectRequestSending;
        }
    }

    async function openProjectCaptchaModal() {
        if (!projectCaptchaModal) return;
        if (!requireProjectAuth()) return;
        if (isProjectCaptchaBlocked()) {
            notifyProjectCaptchaBlocked();
            return;
        }
        openModal(projectCaptchaModal);
        await loadProjectCaptcha();
    }

    function validateProjectFormFields() {
        resetProjectFormErrors();

        const fullName = projectFullNameInput?.value || '';
        const company = projectCompanyInput?.value || '';
        const email = projectEmailInput?.value || '';
        const phone = projectPhoneInput?.value || '';
        const position = projectPositionInput?.value || '';
        const budgetAmount = projectBudgetAmountInput?.value || '';
        const budgetCurrency = projectBudgetCurrencyInput?.value || '';
        const message = projectMessageInput?.value || '';
        let isValid = true;

        if (!validateFIO(fullName)) {
            setProjectFieldError(projectFullNameInput, projectFullNameError, tr('form.err.fio'));
            isValid = false;
        }

        if (!validateProjectCompany(company)) {
            setProjectFieldError(projectCompanyInput, projectCompanyError, tr('form.err.company'));
            isValid = false;
        }

        if (!validateEmail(email)) {
            setProjectFieldError(projectEmailInput, projectEmailError, tr('form.err.email'));
            isValid = false;
        }

        if (!validateProjectPhone(phone)) {
            setProjectFieldError(projectPhoneInput, projectPhoneError, tr('form.err.phone'));
            isValid = false;
        }

        if (!position) {
            setProjectFieldError(projectPositionInput, projectPositionError, tr('form.err.position'));
            isValid = false;
        }

        if (!validateBudgetAmount(budgetAmount) || !validateBudgetCurrency(budgetCurrency)) {
            setProjectFieldError(projectBudgetAmountInput, projectBudgetError, tr('form.err.budget'));
            isValid = false;
        }

        if (!validateProjectMessage(message)) {
            setProjectFieldError(projectMessageInput, projectMessageError, tr('form.err.message', { min: PROJECT_MESSAGE_MIN, max: PROJECT_MESSAGE_MAX }));
            isValid = false;
        }

        return isValid;
    }

    function buildProjectRequestPayload(captchaAnswer) {
        return {
            name: projectFullNameInput.value.trim(),
            company: projectCompanyInput.value.trim(),
            email: projectEmailInput.value.trim(),
            phone: projectPhoneInput.value.trim(),
            position: projectPositionInput.value,
            budget_amount: projectBudgetAmountInput.value.trim(),
            budget_currency: projectBudgetCurrencyInput.value,
            message: projectMessageInput.value.trim(),
            captcha_id: projectCaptchaId,
            captcha_answer: captchaAnswer,
        };
    }

    async function submitProjectRequest() {
        if (projectRequestSending || projectCaptchaLoading) return;

        if (!requireProjectAuth()) {
            closeProjectCaptchaModal();
            return;
        }

        if (isProjectCaptchaBlocked()) {
            notifyProjectCaptchaBlocked();
            closeProjectCaptchaModal();
            return;
        }

        const captchaAnswer = projectCaptchaAnswer?.value.trim() || '';
        setProjectFieldError(projectCaptchaAnswer, projectCaptchaError, '');
        setProjectCaptchaModalStatus('');

        if (!projectCaptchaId) {
            setProjectFieldError(projectCaptchaAnswer, projectCaptchaError, tr('form.err.captcha.notloaded'));
            return;
        }

        if (!captchaAnswer) {
            setProjectFieldError(projectCaptchaAnswer, projectCaptchaError, tr('form.err.captcha.answer'));
            projectCaptchaAnswer?.focus();
            return;
        }

        projectRequestSending = true;
        if (projectCaptchaConfirm) projectCaptchaConfirm.disabled = true;
        setProjectCaptchaModalStatus(tr('form.sending.request'));

        try {
            const response = await fetch('/api/project-request', {
                method: 'POST',
                headers: getProjectRequestHeaders(true),
                body: JSON.stringify(buildAuthPayload(buildProjectRequestPayload(captchaAnswer))),
            });
            const result = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    handleProjectAuthRequired();
                    return;
                }
                if (response.status === 429 && result.captcha_blocked) {
                    handleProjectCaptchaBlocked(result);
                    return;
                }
                if (response.status === 400 && /капч|captcha/i.test(result.error || '')) {
                    setProjectFieldError(projectCaptchaAnswer, projectCaptchaError, trApi(result.error) || tr('form.err.captcha.wrong'));
                    await loadProjectCaptcha();
                }
                throw new Error(trApi(result.error) || tr('form.err.save'));
            }

            localStorage.removeItem(getProjectCaptchaBlockStorageKey());
            syncProjectCaptchaBlockUI();

            closeProjectCaptchaModal();
            feedbackDiv.style.display = 'block';
            feedbackDiv.innerHTML = `✅ ${tr('form.success')}`;
            feedbackDiv.className = 'form-status success-status';
            showToast({
                title: tr('toast.sent.title'),
                message: tr('toast.sent.msg'),
                type: 'success',
            });
            contactForm.reset();
            resetProjectFormErrors();
            updateProjectMessageCounter();
            setTimeout(() => feedbackDiv.style.display = 'none', 5000);
        } catch (error) {
            if (!/капч|captcha/i.test(error.message || '')) {
                setProjectCaptchaModalStatus(trApi(error.message), 'error-status');
            }
        } finally {
            projectRequestSending = false;
            if (projectCaptchaConfirm) projectCaptchaConfirm.disabled = projectCaptchaLoading;
        }
    }

    projectEmailInput?.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Spacebar') e.preventDefault();
    });

    projectEmailInput?.addEventListener('input', () => {
        setProjectFieldError(projectEmailInput, projectEmailError, '');
    });

    projectFullNameInput?.addEventListener('input', () => {
        setProjectFieldError(projectFullNameInput, projectFullNameError, '');
    });

    projectFullNameInput?.addEventListener('blur', () => {
        const value = projectFullNameInput.value;
        if (value.trim() && !validateFIO(value)) {
            setProjectFieldError(projectFullNameInput, projectFullNameError, tr('form.err.fio'));
        }
    });

    projectCompanyInput?.addEventListener('input', () => {
        setProjectFieldError(projectCompanyInput, projectCompanyError, '');
    });

    projectPhoneInput?.addEventListener('keydown', (e) => {
        const allowedKeys = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (allowedKeys.includes(e.key)) return;
        if (!/^\d$/.test(e.key)) e.preventDefault();
    });

    projectPhoneInput?.addEventListener('input', () => {
        normalizeProjectPhoneInput();
        setProjectFieldError(projectPhoneInput, projectPhoneError, '');
    });

    projectPhoneInput?.addEventListener('blur', () => {
        const value = projectPhoneInput.value;
        if (value && !validateProjectPhone(value)) {
            setProjectFieldError(projectPhoneInput, projectPhoneError, tr('form.err.phone'));
        }
    });

    projectPositionInput?.addEventListener('change', () => {
        setProjectFieldError(projectPositionInput, projectPositionError, '');
    });

    projectBudgetAmountInput?.addEventListener('input', () => {
        projectBudgetAmountInput.value = projectBudgetAmountInput.value.replace(/\D/g, '');
        setProjectFieldError(projectBudgetAmountInput, projectBudgetError, '');
    });

    projectBudgetCurrencyInput?.addEventListener('change', () => {
        setProjectFieldError(projectBudgetAmountInput, projectBudgetError, '');
    });

    projectMessageInput?.addEventListener('input', () => {
        if (projectMessageInput.value.length > PROJECT_MESSAGE_MAX) {
            projectMessageInput.value = projectMessageInput.value.slice(0, PROJECT_MESSAGE_MAX);
        }
        updateProjectMessageCounter();
        setProjectFieldError(projectMessageInput, projectMessageError, '');
    });

    projectMessageInput?.addEventListener('blur', () => {
        const value = projectMessageInput.value.trim();
        if (value && !validateProjectMessage(value)) {
            setProjectFieldError(
                projectMessageInput,
                projectMessageError,
                tr('form.err.message', { min: PROJECT_MESSAGE_MIN, max: PROJECT_MESSAGE_MAX })
            );
        }
    });

    updateProjectMessageCounter();

    document.addEventListener('coredev-language-changed', () => {
        updateProjectMessageCounter();
        syncProjectCaptchaBlockUI();
        if (projectSubmitBtn && !projectSubmitBtn.disabled) {
            projectSubmitBtn.innerHTML = getProjectSubmitBtnHtml();
        }
        refreshVisibleValidationMessages();
    });

    function refreshVisibleValidationMessages() {
        if (fioError?.textContent && fioInput?.value.trim()) {
            fioError.textContent = validateFIO(fioInput.value) ? '' : tr('form.err.fio');
        }
        if (emailError?.textContent && emailInput?.value.trim()) {
            emailError.textContent = validateEmail(emailInput.value) ? '' : tr('form.err.email');
        }
        if (usernameError?.textContent && usernameInput?.value.trim()) {
            usernameError.textContent = validateUsername(usernameInput.value) ? '' : tr('reg.err.username');
        }
        if (passwordError?.textContent && passwordInput?.value) {
            const pwdResult = validatePassword(passwordInput.value, usernameInput?.value || '', emailInput?.value || '');
            passwordError.textContent = pwdResult.valid ? '' : pwdResult.message;
        }
        if (confirmError?.textContent) {
            if (!confirmInput?.value) confirmError.textContent = tr('password.confirmRequired');
            else if (passwordInput?.value !== confirmInput.value) confirmError.textContent = tr('password.mismatch');
            else confirmError.textContent = '';
        }
        if (changeNewPasswordError?.textContent && changeNewPassword?.value) {
            const session = getSession();
            const pwdResult = validatePassword(changeNewPassword.value, session?.username || '', session?.email || '');
            changeNewPasswordError.textContent = pwdResult.valid ? '' : pwdResult.message;
        }
        if (changeConfirmPasswordError?.textContent && changeConfirmPassword?.value) {
            changeConfirmPasswordError.textContent = changeNewPassword?.value === changeConfirmPassword.value
                ? ''
                : tr('password.mismatch');
        }
        if (projectFullNameError?.textContent && projectFullNameInput?.value.trim()) {
            setProjectFieldError(projectFullNameInput, projectFullNameError, validateFIO(projectFullNameInput.value) ? '' : tr('form.err.fio'));
        }
        if (projectEmailError?.textContent && projectEmailInput?.value.trim()) {
            setProjectFieldError(projectEmailInput, projectEmailError, validateEmail(projectEmailInput.value) ? '' : tr('form.err.email'));
        }
        if (projectPhoneError?.textContent && projectPhoneInput?.value) {
            setProjectFieldError(projectPhoneInput, projectPhoneError, validateProjectPhone(projectPhoneInput.value) ? '' : tr('form.err.phone'));
        }
        if (projectMessageError?.textContent && projectMessageInput?.value.trim()) {
            setProjectFieldError(
                projectMessageInput,
                projectMessageError,
                validateProjectMessage(projectMessageInput.value) ? '' : tr('form.err.message', { min: PROJECT_MESSAGE_MIN, max: PROJECT_MESSAGE_MAX })
            );
        }
    }

    projectEmailInput?.addEventListener('blur', () => {
        const value = projectEmailInput.value;
        if (value.trim() && !validateEmail(value)) {
            setProjectFieldError(projectEmailInput, projectEmailError, tr('form.err.email'));
        }
    });

    projectCaptchaAnswer?.addEventListener('input', () => {
        setProjectFieldError(projectCaptchaAnswer, projectCaptchaError, '');
        setProjectCaptchaModalStatus('');
    });

    projectCaptchaAnswer?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            submitProjectRequest();
        }
    });

    projectCaptchaRefresh?.addEventListener('click', () => {
        loadProjectCaptcha();
    });

    projectCaptchaConfirm?.addEventListener('click', () => {
        submitProjectRequest();
    });

    projectCaptchaClose?.addEventListener('click', () => {
        closeProjectCaptchaModal();
    });

    projectCaptchaModal?.addEventListener('click', (e) => {
        if (e.target === projectCaptchaModal) closeProjectCaptchaModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && projectCaptchaModal?.classList.contains('active')) {
            closeProjectCaptchaModal();
        }
    });

    document.addEventListener('coredev-session-changed', () => {
        fillProjectFormFromSession();
        syncProjectSubmitButtonState();
    });

    contactForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!requireProjectAuth()) return;
        if (isProjectCaptchaBlocked()) {
            notifyProjectCaptchaBlocked();
            return;
        }
        if (!validateProjectFormFields()) {
            feedbackDiv.style.display = 'block';
            feedbackDiv.innerHTML = `❌ ${tr('form.check')}`;
            feedbackDiv.className = 'form-status error-status';
            const firstInvalid = contactForm?.querySelector('.form-field.is-invalid input, .form-field.is-invalid select, .form-field.is-invalid textarea');
            firstInvalid?.focus();
            firstInvalid?.closest('.form-field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        feedbackDiv.style.display = 'none';
        await openProjectCaptchaModal();
    });

    fillProjectFormFromSession();
    syncProjectSubmitButtonState();
    
    // Плавный скролл
    document.querySelectorAll('.nav-links a, .btn-primary[href="#skills"], .btn-outline[href="#about"]').forEach(anchor=>{ anchor.addEventListener('click',function(e){ const hash=this.getAttribute('href'); if(hash&&hash.startsWith('#')){ e.preventDefault(); const target=document.getElementById(hash.substring(1)); if(target) target.scrollIntoView({behavior:'smooth', block:'start'}); } }); });
    document.getElementById('moreAboutBtn')?.addEventListener('click', () => {
        showToast({
            title: 'CoreDev',
            message: tr('about.toast.msg'),
            type: 'info',
            duration: 6200,
        });
    });