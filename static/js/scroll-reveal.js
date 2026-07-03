(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const REVEAL_OFFSET = 44;

    const SCROLL_TARGETS = [
        'section:not(#home) .section-title',
        'section:not(#home) .section-sub',
        '#about .container > div > p',
        '.about-details-grid > *',
        '.about-more-btn',
        '.skills-grid > *',
        '#projectsGrid > *',
        '#teamGrid > *',
        '.form-fullwidth',
        'footer .footer-brand',
        'footer .footer-col',
        'footer .footer-bottom',
    ].join(', ');

    const HERO_TARGETS = '#home .hero-content, #home .hero-graphic';

    let ticking = false;
    let scrollTargets = [];
    let heroTargets = [];

    function easeOut(progress) {
        return 1 - (1 - progress) ** 2.2;
    }

    function getScrollProgress(rect, viewportHeight) {
        const start = viewportHeight * 0.97;
        const end = viewportHeight * 0.62;
        const range = start - end;

        if (range <= 0) return rect.top <= end ? 1 : 0;
        if (rect.top >= start) return 0;
        if (rect.top <= end) return 1;

        return (start - rect.top) / range;
    }

    function applyProgress(element, progress) {
        if (progress >= 0.999) {
            element.classList.add('reveal-done');
            element.style.removeProperty('opacity');
            element.style.removeProperty('transform');
            return;
        }

        element.classList.remove('reveal-done');
        const eased = easeOut(progress);
        element.style.opacity = String(eased);
        element.style.transform = `translateY(${REVEAL_OFFSET * (1 - eased)}px)`;
    }

    function updateScrollReveal() {
        const viewportHeight = window.innerHeight;

        scrollTargets.forEach((element) => {
            if (element.classList.contains('reveal-done')) return;
            const rect = element.getBoundingClientRect();
            if (rect.bottom < 0) {
                applyProgress(element, 1);
                return;
            }
            applyProgress(element, getScrollProgress(rect, viewportHeight));
        });

        ticking = false;
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(updateScrollReveal);
    }

    function animateHeroEntrance() {
        const duration = 1000;
        const start = performance.now();

        function tick(now) {
            const raw = Math.min((now - start) / duration, 1);
            const progress = easeOut(raw);

            heroTargets.forEach((element) => {
                element.style.opacity = String(progress);
                element.style.transform = `translateY(${REVEAL_OFFSET * (1 - progress)}px)`;
            });

            if (raw < 1) {
                requestAnimationFrame(tick);
                return;
            }

            heroTargets.forEach((element) => {
                element.classList.add('reveal-done');
                element.style.removeProperty('opacity');
                element.style.removeProperty('transform');
            });
        }

        requestAnimationFrame(tick);
    }

    function initScrollReveal() {
        scrollTargets = [...document.querySelectorAll(SCROLL_TARGETS)];
        heroTargets = [...document.querySelectorAll(HERO_TARGETS)];

        if (!scrollTargets.length && !heroTargets.length) return;

        const allTargets = [...scrollTargets, ...heroTargets];

        if (reducedMotion) {
            allTargets.forEach((element) => {
                element.classList.add('reveal-on-scroll', 'reveal-done');
            });
            return;
        }

        allTargets.forEach((element) => {
            element.classList.add('reveal-on-scroll');
        });

        requestAnimationFrame(() => {
            updateScrollReveal();
            animateHeroEntrance();
        });

        window.addEventListener('scroll', requestUpdate, { passive: true });
        window.addEventListener('resize', requestUpdate, { passive: true });
    }

    function refreshScrollReveal() {
        scrollTargets = [...document.querySelectorAll(SCROLL_TARGETS)];
        if (reducedMotion) {
            scrollTargets.forEach((element) => {
                element.classList.add('reveal-on-scroll', 'reveal-done');
            });
            return;
        }
        scrollTargets.forEach((element) => {
            if (!element.classList.contains('reveal-on-scroll')) {
                element.classList.add('reveal-on-scroll');
            }
        });
        requestUpdate();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initScrollReveal);
    } else {
        initScrollReveal();
    }

    window.CoreDevScrollReveal = { refresh: refreshScrollReveal };
})();
