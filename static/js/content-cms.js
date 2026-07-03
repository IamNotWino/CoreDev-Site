(() => {
    const TEAM_IMAGE_SIZE = { width: 600, height: 450 };
    const PROJECT_IMAGE_SIZE = { width: 600, height: 400 };

    let teamItems = [];
    let projectItems = [];
    let teamTagSuggestions = [];
    let projectTagSuggestions = [];
    let teamTags = [];
    let projectTags = [];
    let teamImageData = '';
    let projectImageData = '';
    let adminMode = false;

    const teamGrid = document.getElementById('teamGrid');
    const projectsGrid = document.getElementById('projectsGrid');
    const addTeamMemberBtn = document.getElementById('addTeamMemberBtn');
    const addProjectBtn = document.getElementById('addProjectBtn');

    function getSession() {
        try {
            return JSON.parse(localStorage.getItem('coredevSession') || 'null');
        } catch {
            return null;
        }
    }

    function authHeaders() {
        const session = getSession();
        const headers = { 'Content-Type': 'application/json' };
        if (session?.sessionToken) headers.Authorization = `Bearer ${session.sessionToken}`;
        return headers;
    }

    function authPayload(body) {
        const session = getSession();
        const payload = { ...body };
        if (session?.email) payload.email = session.email;
        if (session?.sessionToken) payload.session_token = session.sessionToken;
        return payload;
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    const WORD_PREVIEW_LIMIT = 20;

    function truncateWords(text, limit = WORD_PREVIEW_LIMIT) {
        const words = String(text || '').trim().split(/\s+/).filter(Boolean);
        if (!words.length) return { text: '', truncated: false };
        if (words.length <= limit) return { text: words.join(' '), truncated: false };
        return { text: `${words.slice(0, limit).join(' ')}…`, truncated: true };
    }

    function openContentViewModal({ title, subtitle, description, imageUrl, imageAlt, tags, extra }) {
        const modal = document.getElementById('contentViewModal');
        const titleEl = document.getElementById('contentViewTitle');
        const imageEl = document.getElementById('contentViewImage');
        const subtitleEl = document.getElementById('contentViewSubtitle');
        const descriptionEl = document.getElementById('contentViewDescription');
        const tagsEl = document.getElementById('contentViewTags');
        const extraEl = document.getElementById('contentViewExtra');

        if (titleEl) titleEl.textContent = title || '';
        if (subtitleEl) {
            subtitleEl.textContent = subtitle || '';
            subtitleEl.hidden = !subtitle;
        }
        if (descriptionEl) descriptionEl.textContent = description || '';
        if (imageEl) {
            if (imageUrl) {
                imageEl.src = imageUrl;
                imageEl.alt = imageAlt || title || '';
                imageEl.hidden = false;
            } else {
                imageEl.hidden = true;
                imageEl.removeAttribute('src');
            }
        }
        if (tagsEl) {
            tagsEl.innerHTML = (tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('');
            tagsEl.hidden = !(tags || []).length;
        }
        if (extraEl) {
            extraEl.textContent = extra || '';
            extraEl.hidden = !extra;
        }

        openModal(modal);
    }

    function bindCardOpen(card, handler) {
        card.classList.add('content-cms-card-clickable');
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');

        const open = (event) => {
            if (event.target.closest('.content-cms-delete-btn')) return;
            handler();
        };

        card.addEventListener('click', open);
        card.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                open(event);
            }
        });
    }

    function setStatus(element, message, isError = false) {
        if (!element) return;
        element.textContent = message || '';
        element.classList.toggle('is-error', Boolean(isError));
        element.classList.toggle('is-success', Boolean(message) && !isError);
    }

    async function apiGet(url) {
        const response = await fetch(url, {
            headers: authHeaders(),
            cache: 'no-store',
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Ошибка запроса');
        return result;
    }

    async function apiPost(url, body) {
        const response = await fetch(url, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify(authPayload(body)),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Ошибка запроса');
        return result;
    }

    function cropImageFile(file, width, height) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(new Error('Не удалось прочитать файл'));
            reader.onload = () => {
                const image = new Image();
                image.onerror = () => reject(new Error('Некорректное изображение'));
                image.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    const scale = Math.max(width / image.width, height / image.height);
                    const sourceWidth = width / scale;
                    const sourceHeight = height / scale;
                    const sourceX = (image.width - sourceWidth) / 2;
                    const sourceY = (image.height - sourceHeight) / 2;
                    ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.9));
                };
                image.src = reader.result;
            };
            reader.readAsDataURL(file);
        });
    }

    function bindImagePicker({ input, button, preview, placeholder, size, onReady }) {
        button?.addEventListener('click', () => input?.click());
        input?.addEventListener('change', async () => {
            const file = input.files?.[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                alert('Выберите изображение');
                input.value = '';
                return;
            }
            try {
                const dataUrl = await cropImageFile(file, size.width, size.height);
                if (preview) {
                    preview.src = dataUrl;
                    preview.hidden = false;
                }
                if (placeholder) placeholder.hidden = true;
                onReady(dataUrl);
            } catch (error) {
                alert(error.message || 'Не удалось обработать изображение');
            } finally {
                input.value = '';
            }
        });
    }

    function renderTagChips(container, tags, onRemove) {
        if (!container) return;
        container.innerHTML = tags.map((tag, index) => `
            <span class="tag-input-chip">
                ${escapeHtml(tag)}
                <button type="button" aria-label="Удалить тег" data-index="${index}">&times;</button>
            </span>
        `).join('');
        container.querySelectorAll('button[data-index]').forEach((button) => {
            button.addEventListener('click', () => {
                const index = Number(button.getAttribute('data-index'));
                onRemove(index);
            });
        });
    }

    function setupTagInput({ inputEl, addBtnEl, getTags, setTags, render }) {
        function addTag(raw) {
            const value = String(raw || '').trim();
            if (!value) return;
            const tags = getTags();
            if (tags.includes(value) || tags.length >= 12) return;
            setTags([...tags, value]);
            render();
            if (inputEl) inputEl.value = '';
        }

        addBtnEl?.addEventListener('click', () => addTag(inputEl?.value));
        inputEl?.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                addTag(inputEl.value);
            }
        });
    }

    function fillSuggestions(datalist, items) {
        if (!datalist) return;
        datalist.innerHTML = items.map((item) => `<option value="${escapeHtml(item)}"></option>`).join('');
    }

    function renderTeam() {
        if (!teamGrid) return;
        teamGrid.innerHTML = teamItems.map((item) => {
            const preview = truncateWords(item.bio);
            return `
            <div class="team-card content-cms-card-clickable" data-id="${escapeHtml(item.id)}" data-open-team="${escapeHtml(item.id)}">
                ${adminMode ? `<button type="button" class="content-cms-delete-btn" data-delete-team="${escapeHtml(item.id)}" aria-label="Удалить"><i class="fas fa-trash-alt"></i></button>` : ''}
                <img class="team-image" src="${escapeHtml(item.image_url || '')}" alt="${escapeHtml(item.name)}">
                <div class="team-content">
                    <div class="team-name">${escapeHtml(item.name)}</div>
                    <div class="team-role">${escapeHtml(item.role)}</div>
                    <div class="team-bio">${escapeHtml(preview.text)}</div>
                    <div class="team-tags">${(item.tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
                    <span class="btn-small content-cms-more-hint">Подробнее →</span>
                </div>
            </div>
        `;
        }).join('');

        teamGrid.querySelectorAll('[data-open-team]').forEach((card) => {
            bindCardOpen(card, () => {
                const id = card.getAttribute('data-open-team');
                const item = teamItems.find((entry) => entry.id === id);
                if (!item) return;
                openContentViewModal({
                    title: item.name,
                    subtitle: item.role,
                    description: item.bio,
                    imageUrl: item.image_url,
                    imageAlt: item.name,
                    tags: item.tags,
                    extra: item.detail_text,
                });
            });
        });

        teamGrid.querySelectorAll('[data-delete-team]').forEach((button) => {
            button.addEventListener('click', async (event) => {
                event.stopPropagation();
                const id = button.getAttribute('data-delete-team');
                if (!id || !confirm('Удалить этого сотрудника?')) return;
                try {
                    await apiPost('/api/admin/content/team/delete', { id });
                    await loadContent();
                } catch (error) {
                    alert(error.message);
                }
            });
        });

        notifyContentRendered();
    }

    function renderProjects() {
        if (!projectsGrid) return;
        projectsGrid.innerHTML = projectItems.map((item) => {
            const preview = truncateWords(item.description);
            return `
            <div class="project-card content-cms-card-clickable" data-id="${escapeHtml(item.id)}" data-open-project="${escapeHtml(item.id)}">
                ${adminMode ? `<button type="button" class="content-cms-delete-btn" data-delete-project="${escapeHtml(item.id)}" aria-label="Удалить"><i class="fas fa-trash-alt"></i></button>` : ''}
                <img class="project-image" src="${escapeHtml(item.image_url || '')}" alt="${escapeHtml(item.title)}">
                <div class="project-content">
                    <div class="project-title">${escapeHtml(item.title)}</div>
                    <div class="project-desc">${escapeHtml(preview.text)}</div>
                    <div class="project-stack">${(item.stack || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join('')}</div>
                    <span class="project-link content-cms-project-link content-cms-more-hint">Детали кейса →</span>
                </div>
            </div>
        `;
        }).join('');

        projectsGrid.querySelectorAll('[data-open-project]').forEach((card) => {
            bindCardOpen(card, () => {
                const id = card.getAttribute('data-open-project');
                const item = projectItems.find((entry) => entry.id === id);
                if (!item) return;
                openContentViewModal({
                    title: item.title,
                    subtitle: 'Реализованный проект',
                    description: item.description,
                    imageUrl: item.image_url,
                    imageAlt: item.title,
                    tags: item.stack,
                    extra: item.detail_text,
                });
            });
        });

        projectsGrid.querySelectorAll('[data-delete-project]').forEach((button) => {
            button.addEventListener('click', async (event) => {
                event.stopPropagation();
                const id = button.getAttribute('data-delete-project');
                if (!id || !confirm('Удалить этот проект?')) return;
                try {
                    await apiPost('/api/admin/content/projects/delete', { id });
                    await loadContent();
                } catch (error) {
                    alert(error.message);
                }
            });
        });

        notifyContentRendered();
    }

    function notifyContentRendered() {
        document.dispatchEvent(new CustomEvent('coredev:content-rendered'));
        if (window.CoreDevScrollReveal?.refresh) {
            window.CoreDevScrollReveal.refresh();
        }
    }

    function updateAdminUI(isAdmin) {
        adminMode = isAdmin === true;
        if (addTeamMemberBtn) addTeamMemberBtn.hidden = !adminMode;
        if (addProjectBtn) addProjectBtn.hidden = !adminMode;
        renderTeam();
        renderProjects();
        if (adminMode) {
            loadMeta().catch(() => {});
        }
    }

    async function loadMeta() {
        const result = await apiGet('/api/admin/content/meta');
        teamTagSuggestions = result.team_tags || [];
        projectTagSuggestions = result.project_stack || [];
        fillSuggestions(document.getElementById('teamTagSuggestions'), teamTagSuggestions);
        fillSuggestions(document.getElementById('projectTagSuggestions'), projectTagSuggestions);
    }

    async function loadContent() {
        const [teamResult, projectsResult] = await Promise.all([
            apiGet('/api/content/team'),
            apiGet('/api/content/projects'),
        ]);
        teamItems = teamResult.items || [];
        projectItems = projectsResult.items || [];
        renderTeam();
        renderProjects();
    }

    function openModal(modal) {
        if (!modal) return;
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        if (!modal) return;
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    let renderTeamTags = () => {};
    let renderProjectTags = () => {};

    function resetTeamForm() {
        teamTags = [];
        teamImageData = '';
        document.getElementById('teamMemberForm')?.reset();
        const preview = document.getElementById('teamImagePreview');
        const placeholder = document.getElementById('teamImagePlaceholder');
        if (preview) {
            preview.hidden = true;
            preview.removeAttribute('src');
        }
        if (placeholder) placeholder.hidden = false;
        renderTeamTags();
        setStatus(document.getElementById('teamMemberStatus'), '');
    }

    function resetProjectForm() {
        projectTags = [];
        projectImageData = '';
        document.getElementById('projectForm')?.reset();
        const preview = document.getElementById('projectImagePreview');
        const placeholder = document.getElementById('projectImagePlaceholder');
        if (preview) {
            preview.hidden = true;
            preview.removeAttribute('src');
        }
        if (placeholder) placeholder.hidden = false;
        renderProjectTags();
        setStatus(document.getElementById('projectStatus'), '');
    }

    function initModals() {
        document.querySelectorAll('[data-close-modal]').forEach((button) => {
            button.addEventListener('click', () => {
                closeModal(document.getElementById(button.getAttribute('data-close-modal')));
            });
        });

        document.querySelectorAll('.content-cms-modal').forEach((modal) => {
            modal.addEventListener('click', (event) => {
                if (event.target === modal) closeModal(modal);
            });
        });

        addTeamMemberBtn?.addEventListener('click', () => {
            resetTeamForm();
            openModal(document.getElementById('teamMemberModal'));
        });

        addProjectBtn?.addEventListener('click', () => {
            resetProjectForm();
            openModal(document.getElementById('projectModal'));
        });
    }

    function initTagInputs() {
        renderTeamTags = () => {
            renderTagChips(document.getElementById('teamTagsChips'), teamTags, (index) => {
                teamTags.splice(index, 1);
                renderTeamTags();
            });
        };
        renderProjectTags = () => {
            renderTagChips(document.getElementById('projectTagsChips'), projectTags, (index) => {
                projectTags.splice(index, 1);
                renderProjectTags();
            });
        };

        setupTagInput({
            inputEl: document.getElementById('teamTagInput'),
            addBtnEl: document.getElementById('teamTagAddBtn'),
            getTags: () => teamTags,
            setTags: (tags) => { teamTags = tags; },
            render: () => renderTeamTags(),
        });

        setupTagInput({
            inputEl: document.getElementById('projectTagInput'),
            addBtnEl: document.getElementById('projectTagAddBtn'),
            getTags: () => projectTags,
            setTags: (tags) => { projectTags = tags; },
            render: () => renderProjectTags(),
        });

        renderTeamTags();
        renderProjectTags();
    }

    function initForms() {
        bindImagePicker({
            input: document.getElementById('teamImageInput'),
            button: document.getElementById('teamImagePickBtn'),
            preview: document.getElementById('teamImagePreview'),
            placeholder: document.getElementById('teamImagePlaceholder'),
            size: TEAM_IMAGE_SIZE,
            onReady: (dataUrl) => { teamImageData = dataUrl; },
        });

        bindImagePicker({
            input: document.getElementById('projectImageInput'),
            button: document.getElementById('projectImagePickBtn'),
            preview: document.getElementById('projectImagePreview'),
            placeholder: document.getElementById('projectImagePlaceholder'),
            size: PROJECT_IMAGE_SIZE,
            onReady: (dataUrl) => { projectImageData = dataUrl; },
        });

        document.getElementById('teamMemberForm')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const statusEl = document.getElementById('teamMemberStatus');
            const submitBtn = document.getElementById('teamMemberSubmitBtn');
            const name = document.getElementById('teamMemberName')?.value.trim();
            const role = document.getElementById('teamMemberRole')?.value.trim();
            const bio = document.getElementById('teamMemberBio')?.value.trim();
            const detailText = document.getElementById('teamMemberDetail')?.value.trim();

            if (!name || !role || !bio) {
                setStatus(statusEl, 'Заполните обязательные поля', true);
                return;
            }

            submitBtn.disabled = true;
            setStatus(statusEl, 'Сохранение...');
            try {
                await apiPost('/api/admin/content/team', {
                    name,
                    role,
                    bio,
                    detail_text: detailText,
                    tags: teamTags,
                    image_data: teamImageData || undefined,
                });
                closeModal(document.getElementById('teamMemberModal'));
                await loadContent();
                if (adminMode) await loadMeta();
            } catch (error) {
                setStatus(statusEl, error.message, true);
            } finally {
                submitBtn.disabled = false;
            }
        });

        document.getElementById('projectForm')?.addEventListener('submit', async (event) => {
            event.preventDefault();
            const statusEl = document.getElementById('projectStatus');
            const submitBtn = document.getElementById('projectSubmitBtn');
            const title = document.getElementById('projectTitle')?.value.trim();
            const description = document.getElementById('projectDescription')?.value.trim();
            const detailText = document.getElementById('projectDetail')?.value.trim();

            if (!title || !description) {
                setStatus(statusEl, 'Заполните обязательные поля', true);
                return;
            }

            submitBtn.disabled = true;
            setStatus(statusEl, 'Сохранение...');
            try {
                await apiPost('/api/admin/content/projects', {
                    title,
                    description,
                    detail_text: detailText,
                    stack: projectTags,
                    image_data: projectImageData || undefined,
                });
                closeModal(document.getElementById('projectModal'));
                await loadContent();
                if (adminMode) await loadMeta();
            } catch (error) {
                setStatus(statusEl, error.message, true);
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    function init() {
        if (!teamGrid || !projectsGrid) return;
        initModals();
        initTagInputs();
        initForms();
        updateAdminUI(getSession()?.isAdmin === true);
        loadContent().catch(() => {
            if (teamGrid) teamGrid.innerHTML = '<p class="content-cms-empty">Не удалось загрузить сотрудников</p>';
            if (projectsGrid) projectsGrid.innerHTML = '<p class="content-cms-empty">Не удалось загрузить проекты</p>';
        });
    }

    window.CoreDevContentCMS = {
        updateAdminUI,
        reload: loadContent,
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
