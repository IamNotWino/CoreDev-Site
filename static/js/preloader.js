(function() {
        const SECURITY_STORAGE_KEY = 'coredevSecurityPassed';
        const SECURITY_IP_KEY = 'coredevSecurityIp';
        const BLOCKED_PAGE = '/403';
        const NETWORK_ERROR_PAGE = '/404';
        const RESET_LINK_EXPIRED_PAGE = '/400';
        const PUBLIC_IP_API = 'https://api.ipify.org?format=json';
        let progress = 0;
        const percentSpan = document.getElementById('percentDisplay');
        const progressFill = document.getElementById('progressLine');
        const statusSpan = document.getElementById('statusMessage');
        const dynamicMsgSpan = document.getElementById('dynamicMsg');
        let securityResult = null;

        if (isSecurityPassedInSession()) {
            resolveAppRedirectUrl().then((url) => window.location.replace(url));
            return;
        }

        async function resolveAppRedirectUrl() {
            const params = new URLSearchParams(window.location.search);
            const resetCode = params.get('code') || params.get('token') || params.get('reset_token');
            if (!resetCode) {
                return '/app';
            }

            try {
                const response = await fetch('/api/reset-password/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: resetCode, token: resetCode }),
                    cache: 'no-store',
                });
                const result = await response.json();
                if (!response.ok || !result.valid) {
                    return RESET_LINK_EXPIRED_PAGE;
                }
            } catch {
                return RESET_LINK_EXPIRED_PAGE;
            }

            sessionStorage.setItem('pendingResetToken', resetCode);
            return `/reset-password?code=${encodeURIComponent(resetCode)}`;
        }

        checkBlockedImmediately();
        
        const statusStages = [
            { min: 0, max: 12, text: "Запуск движка CoreDev" },
            { min: 12, max: 25, text: "Загрузка модулей безопасности" },
            { min: 25, max: 38, text: "Проверка безопасного входа" },
            { min: 38, max: 50, text: "Анализ сигнатур запроса" },
            { min: 50, max: 62, text: "Подключение к защищённому API" },
            { min: 62, max: 75, text: "Компиляция высоконагруженных компонентов" },
            { min: 75, max: 88, text: "Оптимизация рендеринга" },
            { min: 88, max: 98, text: "Финальная проверка и тесты" },
            { min: 98, max: 100, text: "Готовность. Запуск..." }
        ];
        
        const creativeMessages = [
            "🌀 Анализ архитектуры проекта",
            "🔗 Установка защищённого канала связи",
            "🧠 Загрузка LLM-моделей",
            "⚡ Разгон GPU-кластера",
            "🎯 Оптимизация маршрутизации запросов",
            "💎 Интеграция AI-ассистента",
            "🌐 Синхронизация с глобальными серверами",
            "📡 Активация дашбордов аналитики",
            "🎨 Настройка визуальных эффектов",
            "🔒 Проверка цифровых сертификатов",
            "🚀 Подготовка к запуску",
            "✨ Генерация динамических частиц"
        ];
        
        let msgInterval = null;
        const securityCheckPromise = performSecurityCheck();
        setInterval(checkBlockedImmediately, 10000);

        function isSecurityPassedInSession() {
            return sessionStorage.getItem(SECURITY_STORAGE_KEY) === 'true';
        }

        function redirectToBlockedPage() {
            sessionStorage.removeItem(SECURITY_STORAGE_KEY);
            sessionStorage.removeItem(SECURITY_IP_KEY);
            window.location.replace(BLOCKED_PAGE);
        }

        function checkBlockedImmediately() {
            fetch('/api/block-status', { cache: 'no-store' })
                .then((response) => {
                    if (response.status === 403) {
                        redirectToBlockedPage();
                    }
                })
                .catch(() => {});
        }

        function redirectToNetworkError(reason = 'api-unavailable') {
            window.location.replace(`${NETWORK_ERROR_PAGE}?reason=${encodeURIComponent(reason)}`);
        }

        async function performSecurityCheck() {
            try {
                if (dynamicMsgSpan) dynamicMsgSpan.innerText = '🛡️ Проверка безопасного входа через API';
                const response = await fetch('/api/security-check', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        source: 'preloader',
                        screen: `${window.screen.width}x${window.screen.height}`,
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
                        language: navigator.language || 'unknown',
                    }),
                });
                const result = await response.json();
                securityResult = result;

                if (!response.ok || !result.allowed) {
                    if (response.status === 403) {
                        redirectToBlockedPage();
                        return { allowed: false, blocked: true };
                    }
                    throw new Error(result.message || 'Доступ заблокирован API безопасности');
                }

                try {
                    const publicIp = await getPublicIp();
                    result.public_ip = publicIp;
                    securityResult = result;
                } catch {}

                return result;
            } catch (error) {
                securityResult = {
                    allowed: false,
                    message: error.message || 'Проверка безопасности не пройдена',
                };
                return securityResult;
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
                if (!data.ip) throw new Error('Публичный IP не определён');
                return data.ip;
            } finally {
                clearTimeout(timeout);
            }
        }
        
        function updateProgressUI() {
            percentSpan.innerText = progress + '%';
            if (progressFill) progressFill.style.width = progress + '%';
            
            let currentStatus = statusStages.find(stage => progress >= stage.min && progress <= stage.max);
            if (currentStatus && currentStatus.text !== statusSpan.innerText) {
                statusSpan.style.opacity = '0';
                setTimeout(() => {
                    statusSpan.innerText = currentStatus.text;
                    statusSpan.style.opacity = '1';
                }, 80);
            }
            
            if (progress < 99 && Math.random() < 0.12) {
                const randMsg = creativeMessages[Math.floor(Math.random() * creativeMessages.length)];
                if (dynamicMsgSpan && randMsg) {
                    dynamicMsgSpan.style.opacity = '0';
                    setTimeout(() => {
                        dynamicMsgSpan.innerText = randMsg;
                        const iconElem = document.querySelector('#messageBox i');
                        if (iconElem) {
                            iconElem.className = 'fas fa-microchip fa-fw';
                        }
                        dynamicMsgSpan.style.opacity = '1';
                    }, 100);
                }
            }
        }
        
        function simulateLoading() {
            if (progress < 100) {
                let increment;
                if (progress < 30) increment = Math.floor(Math.random() * 5) + 2;
                else if (progress < 65) increment = Math.floor(Math.random() * 4) + 2;
                else if (progress < 88) increment = Math.floor(Math.random() * 3) + 1;
                else increment = Math.floor(Math.random() * 2) + 1;
                
                let newProgress = Math.min(progress + increment, 100);
                progress = newProgress;
                updateProgressUI();
                
                let delay = (progress > 85) ? 140 : (progress > 50 ? 170 : 200);
                setTimeout(simulateLoading, delay);
            } else {
                finalizePreloader();
            }
        }
        
        function startMessageRotation() {
            msgInterval = setInterval(() => {
                if (progress >= 99) {
                    if (msgInterval) clearInterval(msgInterval);
                    return;
                }
                const newMsg = creativeMessages[Math.floor(Math.random() * creativeMessages.length)];
                if (dynamicMsgSpan && newMsg) {
                    dynamicMsgSpan.style.opacity = '0';
                    setTimeout(() => {
                        dynamicMsgSpan.innerText = newMsg;
                        const icon = document.querySelector('#messageBox i');
                        if (icon) icon.className = 'fas fa-cogs fa-fw';
                        dynamicMsgSpan.style.opacity = '1';
                    }, 100);
                }
            }, 2200);
        }
        
        function generateParticles() {
            const container = document.getElementById('orbitalContainer');
            if (!container) return;
            const particleCount = 60;
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.classList.add('orb');
                const size = Math.random() * 12 + 3;
                particle.style.width = size + 'px';
                particle.style.height = size + 'px';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                const duration = Math.random() * 18 + 8;
                particle.style.animation = `floatOrb ${duration}s infinite alternate ease-in-out`;
                particle.style.animationDelay = Math.random() * -10 + 's';
                particle.style.opacity = Math.random() * 0.4 + 0.1;
                particle.style.background = `radial-gradient(circle, #2D68FF, #8BAAFF)`;
                particle.style.filter = 'blur(4px)';
                container.appendChild(particle);
            }
        }
        
        async function finalizePreloader() {
            if (percentSpan) percentSpan.innerText = '100%';
            if (progressFill) progressFill.style.width = '100%';
            if (statusSpan) statusSpan.innerText = 'Финальная проверка безопасности';
            
            if (dynamicMsgSpan) {
                dynamicMsgSpan.innerText = 'Ожидание ответа Security API';
                const msgIcon = document.querySelector('#messageBox i');
                if (msgIcon) msgIcon.className = 'fas fa-shield-alt fa-fw';
            }
            
            const middleRing = document.querySelector('.ring-middle');
            const innerRing = document.querySelector('.ring-inner');
            if (middleRing) middleRing.style.animation = 'none';
            if (innerRing) innerRing.style.animation = 'none';
            
            const result = securityResult || await securityCheckPromise;
            if (!result.allowed) {
                if (result.blocked) return;
                redirectToNetworkError('api-unavailable');
                return;
            }

            if (dynamicMsgSpan) {
                dynamicMsgSpan.innerText = '✅ Проверка пройдена. Запуск сайта...';
                const msgIcon = document.querySelector('#messageBox i');
                if (msgIcon) msgIcon.className = 'fas fa-check-circle fa-fw';
                document.getElementById('messageBox').style.borderColor = '#00C48C';
                document.getElementById('messageBox').style.backgroundColor = 'rgba(0,196,140,0.1)';
            }

            sessionStorage.setItem(SECURITY_STORAGE_KEY, 'true');
            if (result.public_ip) {
                sessionStorage.setItem(SECURITY_IP_KEY, result.public_ip);
            }

            setTimeout(async () => {
                document.body.style.transition = 'opacity 0.45s ease';
                document.body.style.opacity = '0';
                const redirectUrl = await resolveAppRedirectUrl();
                setTimeout(() => window.location.replace(redirectUrl), 450);
            }, 900);
        }

        
        generateParticles();
        startMessageRotation();
        setTimeout(() => {
            simulateLoading();
        }, 180);
        
        setTimeout(() => {
            if (progress < 100) {
                progress = 100;
                updateProgressUI();
                finalizePreloader();
                if (msgInterval) clearInterval(msgInterval);
            }
        }, 8500);
    })();
