(function () {
    try {
        var theme = localStorage.getItem('coredevTheme') || 'dark';
        var resolved = theme;
        if (theme === 'system') {
            resolved = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
        }
        document.documentElement.setAttribute('data-theme', resolved === 'light' ? 'light' : 'dark');
    } catch (error) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();
