(function() {
    const PUBLIC_IP_API = 'https://api.ipify.org?format=json';
    const params = new URLSearchParams(window.location.search);
    const returnTo = params.get('return_to') || '/app';
    const reason = params.get('reason') || 'network';
    const statusEl = document.getElementById('connectionStatus');
    const panelEl = document.querySelector('.connection-panel');
    const retryBtn = document.getElementById('retryConnectionBtn');
    const reasonText = document.getElementById('errorReasonText');

    const BLOCKED_PAGE = '/403';

    const reasonMessages = {
        offline: 'Интернет-соединение пропало. Как только оно восстановится, мы вернём вас на сайт.',
        'api-unavailable': 'API безопасности временно недоступен или сеть нестабильна.',
        'ip-changed': 'IP-адрес изменился во время работы сайта. Возможно, включился VPN или прокси.',
        'security-blocked': 'API безопасности временно заблокировал доступ из-за высокого риска.',
        network: 'Соединение нестабильно, API безопасности недоступен или IP-адрес изменился во время работы сайта.',
    };

    if (reason === 'security-blocked') {
        window.location.replace(BLOCKED_PAGE);
        return;
    }

    if (reasonText) reasonText.textContent = reasonMessages[reason] || reasonMessages.network;

    async function getPublicIp() {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        try {
            const response = await fetch(PUBLIC_IP_API, {
                signal: controller.signal,
                cache: 'no-store',
            });
            const data = await response.json();
            if (!data.ip) throw new Error('Публичный IP не определён');
            return data.ip;
        } finally {
            clearTimeout(timeout);
        }
    }

    async function tryRestoreConnection() {
        if (!navigator.onLine) {
            setStatus('Интернет всё ещё недоступен...', false);
            return;
        }

        try {
            setStatus('Проверяем соединение и API безопасности...', false);
            const publicIp = await getPublicIp();
            const response = await fetch('/api/security-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'error-page-restore',
                    public_ip: publicIp,
                }),
            });
            const result = await response.json();

            if (!response.ok || !result.allowed) {
                if (response.status === 403) {
                    window.location.replace(BLOCKED_PAGE);
                    return;
                }
                setStatus(result.message || 'Проверка пока не пройдена...', false);
                return;
            }

            sessionStorage.setItem('coredevSecurityIp', result.public_ip || publicIp);
            setStatus('Соединение восстановлено. Возвращаем вас обратно...', true);
            setTimeout(() => window.location.replace(returnTo), 700);
        } catch {
            setStatus('Пока не удалось восстановить безопасное соединение...', false);
        }
    }

    function setStatus(text, online) {
        if (statusEl) statusEl.textContent = text;
        if (panelEl) panelEl.classList.toggle('online', Boolean(online));
    }

    retryBtn?.addEventListener('click', tryRestoreConnection);
    window.addEventListener('online', tryRestoreConnection);
    setInterval(tryRestoreConnection, 15000);
    setTimeout(tryRestoreConnection, 400);
})();
