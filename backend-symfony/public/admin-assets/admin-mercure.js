(function () {
    'use strict';

    if (window.__mercureAdminInitialized) {
        return;
    }
    window.__mercureAdminInitialized = true;

    let eventSource = null;
    let refreshTimeout = null;

    function getOrCreateContainer() {
        let container = document.getElementById('mercure-admin-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'mercure-admin-toast-container';
            document.body.appendChild(container);
        }
        return container;
    }

    function getOrCreateStatusBadge() {
        let badge = document.getElementById('mercure-admin-status-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.id = 'mercure-admin-status-badge';
            badge.className = 'mercure-status-connecting';
            badge.innerHTML = '<span class="mercure-status-dot"></span><span class="mercure-status-text">Mercure Live</span>';
            badge.title = 'Real-time Mercure SSE updates active';
            document.body.appendChild(badge);
        }
        return badge;
    }

    function setStatus(state, text) {
        const badge = getOrCreateStatusBadge();
        badge.className = 'mercure-status-' + state;
        const textSpan = badge.querySelector('.mercure-status-text');
        if (textSpan) {
            textSpan.textContent = text;
        }
    }

    function showToast(title, message, type) {
        const container = getOrCreateContainer();
        const toast = document.createElement('div');
        toast.className = 'mercure-admin-toast ' + (type || 'info');

        const body = document.createElement('div');
        const strong = document.createElement('strong');
        strong.style.display = 'block';
        strong.style.marginBottom = '4px';
        strong.textContent = title;
        body.appendChild(strong);

        const span = document.createElement('span');
        span.textContent = message;
        body.appendChild(span);
        toast.appendChild(body);

        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.textContent = '×';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.color = '#94a3b8';
        closeBtn.style.fontSize = '18px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.marginLeft = '12px';
        closeBtn.onclick = function () {
            toast.remove();
        };
        toast.appendChild(closeBtn);

        container.appendChild(toast);
        setTimeout(function () {
            if (toast.parentElement) {
                toast.classList.add('fade-out');
                setTimeout(function () {
                    if (toast.parentElement) {
                        toast.remove();
                    }
                }, 300);
            }
        }, 6000);
    }

    function updateStatusBadge(td, status) {
        if (!td) return;
        const badge = td.querySelector('.badge');
        if (badge) {
            badge.textContent = status;
            badge.className = 'badge badge-' + getStatusBadgeClass(status);
        } else {
            td.textContent = status;
        }
    }

    function getStatusBadgeClass(status) {
        switch ((status || '').toLowerCase()) {
            case 'completed':
            case 'applied':
            case 'offer':
                return 'success';
            case 'processing':
            case 'interviewing':
            case 'interview':
                return 'primary';
            case 'failed':
            case 'rejected':
                return 'danger';
            case 'pending':
            case 'not_contacted':
            case 'queued':
                return 'secondary';
            default:
                return 'info';
        }
    }

    function updateRowInPlace(entityId, payload) {
        if (!entityId) return;
        const row = document.querySelector('tr[data-id="' + entityId + '"]');
        if (!row) return;

        if (payload.action === 'deleted') {
            row.classList.add('mercure-row-deleted');
            setTimeout(function () {
                if (row.parentElement) {
                    row.remove();
                }
            }, 400);
            return;
        }

        if (payload.status) {
            const statusTd = row.querySelector('td[data-column="status"]');
            if (statusTd) {
                updateStatusBadge(statusTd, payload.status);
            }
        }

        if (payload.stage) {
            const stageTd = row.querySelector('td[data-column="stage"]');
            if (stageTd) {
                stageTd.textContent = payload.stage;
            }
        }

        if (typeof payload.attempts !== 'undefined') {
            const attemptsTd = row.querySelector('td[data-column="attempts"]');
            if (attemptsTd) {
                attemptsTd.textContent = String(payload.attempts);
            }
        }

        if (payload.title) {
            const titleTd = row.querySelector('td[data-column="title"]');
            if (titleTd) {
                const link = titleTd.querySelector('a');
                if (link) {
                    link.textContent = payload.title;
                } else {
                    titleTd.textContent = payload.title;
                }
            }
        }

        row.classList.remove('mercure-row-highlight');
        // Force reflow
        void row.offsetWidth;
        row.classList.add('mercure-row-highlight');
        setTimeout(function () {
            row.classList.remove('mercure-row-highlight');
        }, 2500);
    }

    function debouncedRefreshTable(highlightId) {
        if (refreshTimeout) {
            clearTimeout(refreshTimeout);
        }

        refreshTimeout = setTimeout(function () {
            // Skip refreshing if user is currently editing a form or input
            const activeElem = document.activeElement;
            const activeTag = activeElem ? activeElem.tagName.toLowerCase() : '';
            if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
                return;
            }

            const currentDatagrid = document.querySelector('.datagrid-scroll') || document.querySelector('table.datagrid');
            if (!currentDatagrid) {
                return;
            }

            fetch(window.location.href, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            })
            .then(function (res) {
                if (!res.ok) throw new Error('HTTP ' + res.status);
                return res.text();
            })
            .then(function (html) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const newDatagrid = doc.querySelector('.datagrid-scroll') || doc.querySelector('table.datagrid');
                const liveDatagrid = document.querySelector('.datagrid-scroll') || document.querySelector('table.datagrid');

                if (newDatagrid && liveDatagrid) {
                    liveDatagrid.replaceWith(newDatagrid);

                    if (highlightId) {
                        const targetRow = document.querySelector('tr[data-id="' + highlightId + '"]');
                        if (targetRow) {
                            targetRow.classList.add('mercure-row-highlight');
                            setTimeout(function () {
                                targetRow.classList.remove('mercure-row-highlight');
                            }, 2500);
                        }
                    }
                }

                // Update pagination counters if present
                const newPagination = doc.querySelector('.list-pagination');
                const livePagination = document.querySelector('.list-pagination');
                if (newPagination && livePagination) {
                    livePagination.replaceWith(newPagination);
                }
            })
            .catch(function (err) {
                console.warn('[Mercure Admin] Live table refresh failed:', err);
            });
        }, 350);
    }

    function handleMercureMessage(event) {
        try {
            const data = JSON.parse(event.data);
            const type = data.type || '';
            const payload = data.data || {};
            const entityId = payload.id || payload.vacancy_id;

            // Update visible row in place immediately
            updateRowInPlace(entityId, payload);

            // Vacancy events
            if (type === 'vacancy_created') {
                const title = payload.title || ('ID ' + (payload.id || ''));
                showToast('Mercure: Вакансия создана', title, 'success');
                debouncedRefreshTable(payload.id);
            } else if (type === 'vacancy_updated') {
                const title = payload.title || ('ID ' + (payload.id || ''));
                const status = payload.status ? ' [' + payload.status + ']' : '';
                showToast('Mercure: Вакансия обновлена', title + status, 'info');
                debouncedRefreshTable(payload.id);
            } else if (type === 'vacancy_deleted') {
                showToast('Mercure: Вакансия удалена', '#' + (payload.id || ''), 'warning');
                debouncedRefreshTable(null);
            }

            // Queue events
            else if (type === 'queue_created') {
                const taskId = payload.task_id || ('ID ' + (payload.id || ''));
                showToast('Mercure: Задача в очереди', taskId + ' (добавлена)', 'info');
                debouncedRefreshTable(payload.id);
            } else if (type === 'queue_updated') {
                const taskId = payload.task_id || ('ID ' + (payload.id || ''));
                const st = payload.status || 'обновлено';
                const stage = payload.stage ? ' (' + payload.stage + ')' : '';
                const toastType = st === 'completed' ? 'success' : 'info';
                showToast('Mercure: Очередь задач', taskId + ' -> ' + st + stage, toastType);
                debouncedRefreshTable(payload.id);
            } else if (type === 'task_failed') {
                const taskId = payload.task_id || ('ID ' + (payload.id || ''));
                const err = payload.error ? ': ' + payload.error : '';
                showToast('Mercure: Сбой задачи', taskId + err, 'error');
                debouncedRefreshTable(payload.id);
            } else if (type === 'queue_deleted') {
                showToast('Mercure: Очередь очищена', payload.task_id ? ('Задача: ' + payload.task_id) : 'Задачи удалены', 'warning');
                debouncedRefreshTable(null);
            }

            // LLM Token Usage events
            else if (type === 'token_usage_created' || type === 'token_usage_updated') {
                const provider = payload.provider || 'LLM';
                const model = payload.model ? ' (' + payload.model + ')' : '';
                const tokens = payload.total_tokens ? ' ' + payload.total_tokens + ' токенов' : '';
                showToast('Mercure: Токены LLM', provider + model + tokens, 'info');
                debouncedRefreshTable(payload.id);
            } else if (type === 'token_usage_deleted') {
                showToast('Mercure: Запись токенов удалена', '#' + (payload.id || ''), 'warning');
                debouncedRefreshTable(null);
            }

            // API Key events
            else if (type === 'api_key_created' || type === 'api_key_deleted') {
                const keyName = payload.name || ('ID ' + (payload.id || ''));
                const action = type === 'api_key_created' ? 'создан' : 'удален';
                showToast('Mercure: API Key ' + action, keyName, type === 'api_key_created' ? 'success' : 'warning');
                debouncedRefreshTable(payload.id);
            }
        } catch (err) {
            console.error('[Mercure Admin] JSON parse error', err);
        }
    }

    function initMercure() {
        try {
            if (eventSource) {
                eventSource.close();
            }

            const url = new URL('/.well-known/mercure', window.location.origin);
            url.searchParams.append('topic', 'admin:events');

            eventSource = new EventSource(url.toString(), { withCredentials: true });

            eventSource.onopen = function () {
                setStatus('connected', 'Mercure Live');
            };

            eventSource.onmessage = handleMercureMessage;

            eventSource.onerror = function () {
                setStatus('reconnecting', 'Mercure Reconnecting...');
            };
        } catch (e) {
            console.error('[Mercure Admin] Init failed', e);
            setStatus('error', 'Mercure Offline');
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMercure);
    } else {
        initMercure();
    }
})();
