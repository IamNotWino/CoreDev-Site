(() => {
    const RU_MONTHS = [
        'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
        'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
    ];

    const TZ_LABELS_RU = {
        'Europe/Moscow': 'Москва',
        'Europe/Kaliningrad': 'Калининград',
        'Asia/Yekaterinburg': 'Екатеринбург',
        'Asia/Almaty': 'Алматы',
        'Asia/Vladivostok': 'Владивосток',
        UTC: 'UTC',
    };

    const TZ_LABELS_EN = {
        'Europe/Moscow': 'Moscow',
        'Europe/Kaliningrad': 'Kaliningrad',
        'Asia/Yekaterinburg': 'Yekaterinburg',
        'Asia/Almaty': 'Almaty',
        'Asia/Vladivostok': 'Vladivostok',
        UTC: 'UTC',
    };

    let preferredTimezone = '';

    function getLanguage() {
        return window.CoreDevI18n?.getLanguage?.()
            || document.documentElement.lang
            || 'ru';
    }

    function isRussian() {
        return String(getLanguage()).toLowerCase().startsWith('ru');
    }

    function getBrowserTimezone() {
        try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Moscow';
        } catch {
            return 'Europe/Moscow';
        }
    }

    function normalizeTimestamp(ts) {
        if (ts == null || ts === '') return null;
        const value = Number(ts);
        if (!Number.isFinite(value) || value <= 0) return null;
        return value < 1e12 ? value * 1000 : value;
    }

    function getTimezone() {
        if (preferredTimezone) return preferredTimezone;
        try {
            const cached = localStorage.getItem('coredevTimezone');
            if (cached) return cached;
        } catch {
            /* ignore */
        }
        return getBrowserTimezone();
    }

    function setTimezone(timezone, options = {}) {
        const next = String(timezone || '').trim();
        const previous = getTimezone();
        preferredTimezone = next;
        try {
            if (next) localStorage.setItem('coredevTimezone', next);
            else localStorage.removeItem('coredevTimezone');
        } catch {
            /* ignore */
        }
        if (options.notify !== false && next !== previous) {
            document.dispatchEvent(new CustomEvent('coredev-timezone-changed', {
                detail: { timezone: getTimezone() },
            }));
        }
    }

    function getTimezoneLabel(timezone = getTimezone()) {
        const labels = isRussian() ? TZ_LABELS_RU : TZ_LABELS_EN;
        if (labels[timezone]) return labels[timezone];
        try {
            const parts = new Intl.DateTimeFormat(isRussian() ? 'ru-RU' : 'en-GB', {
                timeZone: timezone,
                timeZoneName: 'long',
            }).formatToParts(new Date());
            return parts.find((part) => part.type === 'timeZoneName')?.value || timezone;
        } catch {
            return timezone.split('/').pop().replace(/_/g, ' ');
        }
    }

    function padTimePart(value) {
        return String(value || '0').padStart(2, '0');
    }

    function formatWithParts(date, timezone) {
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: timezone,
            day: 'numeric',
            month: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).formatToParts(date);

        const read = (type) => parts.find((part) => part.type === type)?.value || '';
        return {
            day: read('day'),
            month: Number(read('month')),
            year: read('year'),
            hour: padTimePart(read('hour')),
            minute: padTimePart(read('minute')),
        };
    }

    function formatRussian(date, timezone) {
        const { day, month, year, hour, minute } = formatWithParts(date, timezone);
        const monthName = RU_MONTHS[month - 1] || '';
        return `${day} ${monthName} ${year} г ${hour}:${minute}`;
    }

    function formatEnglish(date, timezone) {
        const parts = new Intl.DateTimeFormat('en-GB', {
            timeZone: timezone,
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).formatToParts(date);

        const read = (type) => parts.find((part) => part.type === type)?.value || '';
        return `${read('day')} ${read('month')} ${read('year')}, ${padTimePart(read('hour'))}:${padTimePart(read('minute'))}`;
    }

    function format(ts, options = {}) {
        const ms = normalizeTimestamp(ts);
        if (!ms) return options.fallback ?? '—';

        const timezone = options.timezone || getTimezone();
        const date = new Date(ms);
        return isRussian() ? formatRussian(date, timezone) : formatEnglish(date, timezone);
    }

    window.CoreDevDateTime = {
        format,
        getTimezone,
        setTimezone,
        getTimezoneLabel,
        getBrowserTimezone,
        normalizeTimestamp,
    };
})();
