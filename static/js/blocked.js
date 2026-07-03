(function() {
    const PRELOADER_PAGE = '/preloader';
    const statusEl = document.getElementById('unblockStatus');
    const panelEl = document.querySelector('.connection-panel');

    sessionStorage.removeItem('coredevSecurityPassed');
    sessionStorage.removeItem('coredevSecurityIp');

    function setStatus(text, restored) {
        if (statusEl) statusEl.textContent = text;
        if (panelEl) panelEl.classList.toggle('online', Boolean(restored));
    }

    async function checkUnblockStatus() {
        try {
            const response = await fetch('/api/block-status', { cache: 'no-store' });
            if (response.ok) {
                setStatus('Доступ восстановлен. Перенаправляем на прелоадер...', true);
                setTimeout(() => window.location.replace(PRELOADER_PAGE), 500);
                return;
            }
            setStatus('Ожидаем разблокировку...', false);
        } catch {
            setStatus('Ожидаем разблокировку...', false);
        }
    }

    document.getElementById('retryUnblockBtn')?.addEventListener('click', checkUnblockStatus);
    setInterval(checkUnblockStatus, 2000);
    checkUnblockStatus();
})();
